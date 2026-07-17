'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Upload, Play, BarChart3, Clock, Star, Target,
  ChevronRight, CheckCircle, Sparkles, BookOpen, Zap,
  Brain, Code, Users, Settings, TrendingUp, Award,
  FileText, X, AlertCircle
} from 'lucide-react';

const C = {
  cream: '#fef9f2',
  primary: '#000000',
  onPrimary: '#ffffff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f8f3ec',
  surfaceContainer: '#f2ede6',
  surfaceContainerHigh: '#ece7e1',
  surfaceVariant: '#e6e2db',
  onSurface: '#1d1c18',
  onSurfaceVariant: '#45464d',
  outline: '#76777d',
  outlineVariant: '#c6c6cd',
  inverseOnSurface: '#f5f0e9',
  inverseSurface: '#32302c',
  accentYellow: '#ffe24c',
  accentBlue: '#bec6e0',
  accentPink: '#ffafd3',
  accentGreen: '#86efac',
  accentPurple: '#d3579a',
  secondaryContainer: '#fcdf46',
};

const ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Engineer', 'AI Engineer', 'ML Engineer', 'Data Scientist',
  'Cloud Engineer', 'DevOps Engineer', 'Cyber Security Engineer',
  'Product Manager', 'UI/UX Designer',
];

const COMPANIES = [
  { name: 'Google',    emoji: '🔵', style: 'Algorithm-heavy, Googleyness, structured 45-min rounds' },
  { name: 'Microsoft', emoji: '🟦', style: 'Growth mindset, inclusive design, cloud architecture focus' },
  { name: 'Amazon',    emoji: '🟠', style: '14 Leadership Principles, bar-raiser model, STAR format' },
  { name: 'Meta',      emoji: '🔷', style: 'Move fast, systems design, behavioral + coding loops' },
  { name: 'Apple',     emoji: '⬛', style: 'Deep craft, attention to detail, product quality thinking' },
  { name: 'Netflix',   emoji: '🔴', style: 'Freedom & Responsibility, senior judgment, culture fit' },
  { name: 'Adobe',     emoji: '🟥', style: 'Creative engineering, accessibility, ecosystem thinking' },
  { name: 'OpenAI',    emoji: '⬜', style: 'AI/ML depth, safety focus, research background valued' },
  { name: 'Tesla',     emoji: '🔲', style: 'Hands-on engineering, fast iteration, first-principles thinking' },
  { name: 'NVIDIA',    emoji: '🟩', style: 'GPU architecture, parallel computing, CUDA/AI pipeline' },
  { name: 'Custom',    emoji: '✨', style: 'Balanced general interview across all domains' },
];

const INTERVIEW_TYPES = [
  { id: 'Technical Interview', label: 'Technical', icon: Code,    desc: 'DS&A, systems, and engineering depth' },
  { id: 'Behavioral Interview', label: 'Behavioral', icon: Users, desc: 'STAR format, leadership, culture fit' },
  { id: 'System Design',       label: 'System Design', icon: Zap,    desc: 'Distributed systems & architecture' },
  { id: 'HR Interview',        label: 'HR Round',  icon: Star,   desc: 'Motivation, background, and culture' },
  { id: 'Coding Interview',    label: 'Coding',    icon: Brain,  desc: 'Live algorithms, time complexity' },
  { id: 'Product Management',  label: 'Product',   icon: Target, desc: 'PRD, roadmap, metrics thinking' },
  { id: 'Aptitude',            label: 'Aptitude',  icon: BarChart3, desc: 'Quantitative & logical reasoning' },
  { id: 'Custom Interview',    label: 'Custom',    icon: Settings, desc: 'Define your own scenario' },
];

const DIFFICULTIES = [
  { id: 'Beginner', label: 'Intern / Beginner',  color: '#86efac', bg: 'rgba(134,239,172,0.15)' },
  { id: 'Medium',   label: 'Mid-Level',           color: '#d3579a', bg: 'rgba(211,87,154,0.1)' },
  { id: 'Senior',   label: 'Senior / Staff',      color: '#ffe24c', bg: 'rgba(255,226,76,0.15)' },
  { id: 'Expert',   label: 'Principal / Expert',  color: '#e66012', bg: 'rgba(230,96,18,0.1)' },
];

interface StoredInterview {
  id: string;
  role: string;
  company: string;
  type: string;
  difficulty: string;
  date: string;
  overallScore: number;
  status: 'completed' | 'abandoned';
}

interface Props { userEmail: string }

export default function InterviewDashboardClient({ userEmail }: Props) {
  const router = useRouter();

  // ── Config state
  const [selectedRole,       setSelectedRole]       = useState('Software Engineer');
  const [selectedCompany,    setSelectedCompany]    = useState('Google');
  const [selectedType,       setSelectedType]       = useState('Technical Interview');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [resumeText,         setResumeText]         = useState('');
  const [resumeFileName,     setResumeFileName]     = useState('');
  const [isDragging,         setIsDragging]         = useState(false);
  const [isStarting,         setIsStarting]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── History from localStorage
  const [history] = useState<StoredInterview[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('focus_interview_history');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  // ── File drag-and-drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  const readFile = (file: File) => {
    setResumeFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setResumeText(e.target?.result as string || '');
    reader.readAsText(file);
  };

  // ── Start interview
  const handleStart = () => {
    setIsStarting(true);
    const sessionId = crypto.randomUUID();
    // Persist resume to session storage for the session page to retrieve
    if (resumeText) sessionStorage.setItem(`focus_resume_${sessionId}`, resumeText);
    router.push(
      `/interview/session/${sessionId}?role=${encodeURIComponent(selectedRole)}&company=${encodeURIComponent(selectedCompany)}&difficulty=${encodeURIComponent(selectedDifficulty)}&type=${encodeURIComponent(selectedType)}`
    );
  };

  const companyInfo = COMPANIES.find(c => c.name === selectedCompany)!;
  const avgScore = history.length > 0
    ? Math.round(history.reduce((s, h) => s + (h.overallScore || 0), 0) / history.length)
    : null;

  // Animation variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-10 relative z-10"
    >

      {/* ── HERO BANNER ─────────────────────────────────────────────────────── */}
      <motion.div variants={itemVars} className="space-y-4">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[#d3579a]/30 bg-[#d3579a]/10 text-[#d3579a] shadow-sm ml-1"
        >
          <Sparkles className="h-3 w-3" />
          Enterprise AI Mock Interview Platform
        </div>
        <h1
          className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-black"
        >
          Interview Like You're at{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d3579a] to-[#5a6ba8]">FAANG</span>
        </h1>
        <p className="text-sm max-w-xl" style={{ color: C.onSurfaceVariant }}>
          Voice-first, multi-agent orchestrated mock interviews that simulate real hiring bars at Google, Meta, Amazon, and beyond.
        </p>
      </motion.div>

      {/* ── STATS ROW ────────────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <motion.div variants={itemVars} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Interviews Done',   value: history.length,  icon: Mic,       color: C.accentPurple },
            { label: 'Avg Overall Score', value: `${avgScore}/100`, icon: TrendingUp, color: C.outline },
            { label: 'Latest Company',    value: history[0]?.company || '—', icon: Award, color: C.accentYellow },
            { label: 'Best Performance',  value: `${Math.max(...history.map(h => h.overallScore))}%`, icon: Star, color: C.accentGreen },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -5, scale: 1.02 }}
              className="p-5 rounded-2xl border flex items-center gap-4 group transition-all"
              style={{ backgroundColor: C.surfaceContainerLowest, borderColor: C.surfaceVariant, boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}
            >
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3"
                style={{ backgroundColor: `${stat.color}15`, border: `1px solid ${stat.color}30` }}
              >
                <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xl font-extrabold leading-tight text-black">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── CONFIGURATION GRID ───────────────────────────────────────────────── */}
      <motion.div variants={itemVars} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Role, Company, Difficulty, Type */}
        <div className="lg:col-span-2 space-y-6">

          {/* ROLE SELECTION */}
          <Section title="Choose Role" icon={<Users className="h-4 w-4 text-[#d3579a]" />}>
            <div className="flex flex-wrap gap-2.5">
              {ROLES.map(role => {
                const active = selectedRole === role;
                return (
                  <motion.button
                    key={role}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedRole(role)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all border"
                    style={
                      active
                        ? { backgroundColor: `${C.accentPurple}15`, borderColor: C.accentPurple, color: C.accentPurple }
                        : { backgroundColor: C.surfaceContainerLowest, borderColor: C.surfaceVariant, color: C.onSurfaceVariant }
                    }
                  >
                    {role}
                  </motion.button>
                );
              })}
            </div>
          </Section>

          {/* INTERVIEW TYPE */}
          <Section title="Interview Type" icon={<Brain className="h-4 w-4 text-[#86efac]" />}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {INTERVIEW_TYPES.map(t => {
                const Icon = t.icon;
                const active = selectedType === t.id;
                return (
                  <motion.button
                    key={t.id}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType(t.id)}
                    className="p-4 rounded-2xl border text-left transition-all relative overflow-hidden group bg-white"
                    style={{ borderColor: active ? C.accentPurple : C.surfaceVariant }}
                  >
                    {active && (
                      <motion.div 
                        layoutId="activeTypeBg" 
                        className="absolute inset-0 pointer-events-none" 
                        style={{ background: `linear-gradient(135deg, ${C.accentPurple}10, transparent)` }}
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className={`h-5 w-5 mb-3 transition-colors ${active ? 'text-[#d3579a]' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                    <p className={`text-sm font-bold transition-colors ${active ? 'text-black' : 'text-zinc-800'}`}>{t.label}</p>
                    <p className="text-[10px] mt-1 leading-tight text-zinc-500">{t.desc}</p>
                  </motion.button>
                );
              })}
            </div>
          </Section>

          {/* DIFFICULTY */}
          <Section title="Difficulty Level" icon={<Target className="h-4 w-4 text-[#d3579a]" />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DIFFICULTIES.map(d => {
                const active = selectedDifficulty === d.id;
                return (
                  <motion.button
                    key={d.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDifficulty(d.id)}
                    className="p-3.5 rounded-xl border text-center text-xs font-bold transition-all relative overflow-hidden"
                    style={active
                      ? { backgroundColor: d.bg, borderColor: d.color, color: d.color, boxShadow: `0 2px 8px ${d.bg}` }
                      : { backgroundColor: C.surfaceContainerLowest, borderColor: C.surfaceVariant, color: C.onSurfaceVariant }
                    }
                  >
                    {active && <div className="absolute inset-0 bg-black/5" />}
                    {d.label}
                  </motion.button>
                );
              })}
            </div>
          </Section>
        </div>

        {/* RIGHT: Company + Resume */}
        <div className="space-y-6">

          {/* COMPANY */}
          <Section title="Target Company" icon={<Award className="h-4 w-4 text-[#d3579a]" />}>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {COMPANIES.map(co => {
                const active = selectedCompany === co.name;
                return (
                  <motion.button
                    key={co.name}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCompany(co.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all text-sm font-semibold relative overflow-hidden"
                    style={
                      active
                        ? { backgroundColor: `${C.accentPink}15`, borderColor: C.accentPink, color: C.primary }
                        : { backgroundColor: C.surfaceContainerLowest, borderColor: C.surfaceVariant, color: C.onSurfaceVariant }
                    }
                  >
                    {active && (
                      <motion.div 
                        layoutId="activeCompanyBg" 
                        className="absolute left-0 top-0 bottom-0 w-1 bg-[#d3579a]" 
                      />
                    )}
                    <span className="text-lg drop-shadow-sm">{co.emoji}</span>
                    {co.name}
                  </motion.button>
                );
              })}
            </div>
            {/* Company style preview */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCompany}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-4 p-4 rounded-xl border text-xs leading-relaxed"
                style={{ backgroundColor: C.surfaceContainerLow, borderColor: C.surfaceVariant, color: C.onSurfaceVariant }}
              >
                <span className="font-bold flex items-center gap-1.5 mb-1.5 text-[#d3579a]">
                  <Sparkles className="h-3 w-3" /> Interview Style
                </span>
                {companyInfo.style}
              </motion.div>
            </AnimatePresence>
          </Section>

          {/* RESUME UPLOAD */}
          <Section title="Context / Resume" icon={<FileText className="h-4 w-4 text-[#86efac]" />}>
            <AnimatePresence mode="wait">
              {resumeFileName ? (
                <motion.div
                  key="uploaded"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-xl border flex items-center justify-between"
                  style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-semibold truncate">{resumeFileName}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setResumeText(''); setResumeFileName(''); }}
                    className="shrink-0 ml-2 p-1 rounded-full hover:bg-emerald-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="upload-zone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all space-y-3 relative overflow-hidden group ${
                    isDragging 
                      ? 'border-[#d3579a] bg-[#d3579a]/5' 
                      : 'border-zinc-350 bg-white hover:border-zinc-550 hover:bg-[#fcfaf5]'
                  }`}
                >
                  <motion.div 
                    animate={isDragging ? { y: -5, scale: 1.1 } : { y: 0, scale: 1 }}
                    className="h-12 w-12 rounded-full bg-zinc-50 mx-auto flex items-center justify-center border border-zinc-200 shadow-inner"
                  >
                    <Upload className={`h-5 w-5 transition-colors ${isDragging ? 'text-[#d3579a]' : 'text-zinc-400 group-hover:text-black'}`} />
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-700">Drag .txt resume here</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">or click to browse</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".txt,.md" className="hidden" onChange={handleFileChange} />
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-[10px] mt-3 leading-relaxed text-zinc-550 flex items-start gap-1.5">
              <Sparkles className="h-3 w-3 shrink-0 mt-0.5" />
              Optional. Upload your resume text so the AI can tailor behavioral and technical questions to your specific background.
            </p>
          </Section>
        </div>
      </motion.div>

      {/* ── START BUTTON ─────────────────────────────────────────────────────── */}
      <motion.div variants={itemVars}>
        <div
          className="p-6 md:p-8 rounded-[2rem] border flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
          style={{ backgroundColor: C.surfaceContainerLow, borderColor: C.surfaceVariant, boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}
        >
          {/* Subtle glow behind button section */}
          <div className="absolute top-1/2 right-10 w-32 h-32 bg-[#d3579a]/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
          
          <div className="space-y-1.5 text-center md:text-left z-10">
            <p className="font-extrabold text-xl md:text-2xl text-black drop-shadow-sm">
              Ready to interview at <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d3579a] to-[#5a6ba8]">{selectedCompany}</span>?
            </p>
            <p className="text-sm font-medium" style={{ color: C.onSurfaceVariant }}>
              {selectedRole} <span className="text-zinc-400 mx-1">•</span> {selectedType} <span className="text-zinc-400 mx-1">•</span> {selectedDifficulty}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-3 text-zinc-500">
              <AlertCircle className="h-3.5 w-3.5 text-[#5a6ba8]" />
              <span className="text-xs">Allow microphone access when prompted. Use Chrome/Edge for best voice support.</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            disabled={isStarting}
            className="group relative flex items-center gap-3 px-10 py-5 font-bold text-base rounded-2xl transition-all disabled:opacity-60 z-10 overflow-hidden w-full md:w-auto justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#d3579a] to-[#5a6ba8] group-hover:opacity-90 transition-opacity" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity" />
            
            {isStarting ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
            ) : (
              <Mic className="h-5 w-5 text-white relative z-10 group-hover:animate-pulse" />
            )}
            <span className="text-white relative z-10">{isStarting ? 'Launching Simulation…' : 'Start Simulation'}</span>
            {!isStarting && <ChevronRight className="h-5 w-5 text-white relative z-10 group-hover:translate-x-1 transition-transform" />}
          </motion.button>
        </div>
      </motion.div>

      {/* ── HISTORY TABLE ─────────────────────────────────────────────────────── */}
      <motion.div variants={itemVars} className="space-y-5">
        <h2 className="text-2xl font-extrabold tracking-tight text-black flex items-center gap-3">
          <Clock className="h-6 w-6 text-[#d3579a]" />
          Simulation History 
          <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700">{history.length}</span>
        </h2>
        
        {history.length === 0 ? (
          <div
            className="p-12 rounded-3xl border border-dashed text-center space-y-4 bg-white"
            style={{ borderColor: C.surfaceVariant }}
          >
            <div className="h-16 w-16 mx-auto rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-200">
              <Mic className="h-8 w-8 text-zinc-400" />
            </div>
            <div>
              <p className="text-base font-bold text-zinc-800">No simulations run yet</p>
              <p className="text-xs text-zinc-500 mt-1">Configure your target scenario above and hit Start Simulation to begin training.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={item.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border hover:border-zinc-400 transition-all bg-white gap-4"
                style={{ borderColor: C.surfaceVariant }}
              >
                <div className="flex items-center gap-4 sm:gap-5">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center font-extrabold text-base relative overflow-hidden"
                    style={{
                      backgroundColor: item.overallScore >= 80 ? 'rgba(134,239,172,0.15)' : 'rgba(255,226,76,0.15)',
                      color: item.overallScore >= 80 ? '#047857' : '#d97706',
                      border: `1px solid ${item.overallScore >= 80 ? 'rgba(134,239,172,0.3)' : 'rgba(255,226,76,0.3)'}`
                    }}
                  >
                    {item.overallScore}
                  </div>
                  <div>
                    <p className="text-base font-bold text-black group-hover:text-[#d3579a] transition-colors">{item.role} @ {item.company}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.type} <span className="mx-1">•</span> {item.difficulty} <span className="mx-1">•</span> {item.date}</p>
                  </div>
                </div>
                <div
                  className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border self-start sm:self-auto"
                  style={item.status === 'completed'
                    ? { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }
                    : { backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#d97706' }
                  }
                >
                  {item.status}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

    </motion.div>
  );
}

// ─── Reusable section wrapper ──────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="p-6 rounded-[1.25rem] border space-y-5 bg-white relative overflow-hidden"
      style={{ borderColor: C.surfaceVariant, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-100 to-transparent" />
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-100">
          {icon}
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-700">{title}</span>
      </div>
      {children}
    </div>
  );
}
