'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic, Upload, Play, BarChart3, Clock, Star, Target,
  ChevronRight, CheckCircle, Sparkles, BookOpen, Zap,
  Brain, Code, Users, Settings, TrendingUp, Award,
  FileText, X, AlertCircle
} from 'lucide-react';

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  cream:    '#fef9f2',
  primary:  '#000000',
  onPrimary:'#ffffff',
  surfaceLowest: '#ffffff',
  surfaceLow:    '#f8f3ec',
  surface:       '#f2ede6',
  surfaceHigh:   '#ece7e1',
  surfaceVariant:'#e6e2db',
  onSurface:     '#1d1c18',
  onSurfaceVar:  '#45464d',
  outline:       '#76777d',
  outlineVar:    '#c6c6cd',
  accentBlue:    '#bec6e0',
  accentPurple:  '#d3579a',
  accentGreen:   '#86efac',
  accentYellow:  '#ffe24c',
};

// ─── Data ─────────────────────────────────────────────────────────────────────
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
  { id: 'Beginner', label: 'Intern / Beginner',  color: '#86efac', bg: 'rgba(134,239,172,0.12)' },
  { id: 'Medium',   label: 'Mid-Level',           color: '#ffe24c', bg: 'rgba(255,226,76,0.12)' },
  { id: 'Senior',   label: 'Senior / Staff',      color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  { id: 'Expert',   label: 'Principal / Expert',  color: '#d3579a', bg: 'rgba(211,87,154,0.12)' },
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

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      {/* ── HERO BANNER ─────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
          style={{ backgroundColor: 'rgba(211,87,154,0.08)', borderColor: 'rgba(211,87,154,0.25)', color: C.accentPurple }}
        >
          <Mic className="h-3 w-3" />
          Enterprise AI Mock Interview Platform
        </div>
        <h1
          className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight"
          style={{ color: C.primary, fontFamily: 'var(--font-jakarta), sans-serif' }}
        >
          Interview Like You're at{' '}
          <span style={{ color: '#5a6ba8' }}>FAANG</span>
        </h1>
        <p className="text-sm max-w-lg" style={{ color: C.onSurfaceVar }}>
          Voice-first, multi-agent orchestrated mock interviews that simulate real hiring bars at Google, Meta, Amazon, and beyond.
        </p>
      </div>

      {/* ── STATS ROW ────────────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Interviews Done',   value: history.length,  icon: Mic,       color: C.accentPurple },
            { label: 'Avg Overall Score', value: `${avgScore}/100`, icon: TrendingUp, color: '#5a6ba8' },
            { label: 'Latest Company',    value: history[0]?.company || '—', icon: Award, color: '#f97316' },
            { label: 'Best Performance',  value: `${Math.max(...history.map(h => h.overallScore))}%`, icon: Star, color: C.accentGreen.replace('#', '#16a3') },
          ].map(stat => (
            <div
              key={stat.label}
              className="p-5 rounded-2xl border flex items-center gap-4"
              style={{ backgroundColor: C.surfaceLowest, borderColor: C.surfaceVariant, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${stat.color}18` }}
              >
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-lg font-extrabold leading-tight" style={{ color: C.primary }}>{stat.value}</p>
                <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: C.outline }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CONFIGURATION GRID ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Role, Company, Difficulty, Type */}
        <div className="lg:col-span-2 space-y-6">

          {/* ROLE SELECTION */}
          <Section title="Choose Role" icon={<Users className="h-4 w-4" style={{ color: C.accentPurple }} />}>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border hover:scale-[1.01]"
                  style={selectedRole === role
                    ? { backgroundColor: C.primary, color: C.onPrimary, borderColor: C.primary }
                    : { backgroundColor: C.surfaceLow, borderColor: C.outlineVar, color: C.onSurfaceVar }
                  }
                >
                  {role}
                </button>
              ))}
            </div>
          </Section>

          {/* INTERVIEW TYPE */}
          <Section title="Interview Type" icon={<Brain className="h-4 w-4" style={{ color: '#5a6ba8' }} />}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {INTERVIEW_TYPES.map(t => {
                const Icon = t.icon;
                const active = selectedType === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedType(t.id)}
                    className="p-3.5 rounded-2xl border text-left transition-all hover:shadow-md"
                    style={active
                      ? { backgroundColor: '#0a0a0f', borderColor: C.accentPurple, color: '#f0f0f5', boxShadow: `0 0 20px rgba(211,87,154,0.2)` }
                      : { backgroundColor: C.surfaceLowest, borderColor: C.surfaceVariant, color: C.onSurfaceVar }
                    }
                  >
                    <Icon className="h-4 w-4 mb-2" style={{ color: active ? C.accentPurple : C.outline }} />
                    <p className="text-xs font-bold">{t.label}</p>
                    <p className="text-[10px] mt-0.5 leading-tight opacity-70">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* DIFFICULTY */}
          <Section title="Difficulty Level" icon={<Target className="h-4 w-4" style={{ color: '#f97316' }} />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDifficulty(d.id)}
                  className="p-3 rounded-xl border text-center text-xs font-bold transition-all"
                  style={selectedDifficulty === d.id
                    ? { backgroundColor: d.bg, borderColor: d.color, color: d.color }
                    : { backgroundColor: C.surfaceLow, borderColor: C.outlineVar, color: C.onSurfaceVar }
                  }
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* RIGHT: Company + Resume */}
        <div className="space-y-6">

          {/* COMPANY */}
          <Section title="Target Company" icon={<Award className="h-4 w-4" style={{ color: '#f97316' }} />}>
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {COMPANIES.map(co => (
                <button
                  key={co.name}
                  onClick={() => setSelectedCompany(co.name)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all text-sm font-semibold"
                  style={selectedCompany === co.name
                    ? { backgroundColor: C.primary, borderColor: C.primary, color: C.onPrimary }
                    : { backgroundColor: C.surfaceLow, borderColor: C.outlineVar, color: C.onSurface }
                  }
                >
                  <span className="text-base">{co.emoji}</span>
                  {co.name}
                </button>
              ))}
            </div>
            {/* Company style preview */}
            <div
              className="mt-3 p-3 rounded-xl border text-[11px] leading-relaxed"
              style={{ backgroundColor: 'rgba(211,87,154,0.06)', borderColor: 'rgba(211,87,154,0.2)', color: C.onSurfaceVar }}
            >
              <span className="font-bold block mb-1" style={{ color: C.accentPurple }}>Interview Style</span>
              {companyInfo.style}
            </div>
          </Section>

          {/* RESUME UPLOAD */}
          <Section title="Upload Resume" icon={<FileText className="h-4 w-4" style={{ color: C.accentBlue.replace('#', '#5a6b') }} />}>
            {resumeFileName ? (
              <div
                className="p-3 rounded-xl border flex items-center justify-between"
                style={{ backgroundColor: 'rgba(134,239,172,0.08)', borderColor: 'rgba(134,239,172,0.3)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle className="h-4 w-4 shrink-0" style={{ color: '#16a34a' }} />
                  <span className="text-xs font-semibold truncate" style={{ color: '#166534' }}>{resumeFileName}</span>
                </div>
                <button
                  onClick={() => { setResumeText(''); setResumeFileName(''); }}
                  className="shrink-0 ml-2"
                >
                  <X className="h-4 w-4" style={{ color: C.outline }} />
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className="p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all space-y-2"
                style={{
                  borderColor: isDragging ? C.accentPurple : C.outlineVar,
                  backgroundColor: isDragging ? 'rgba(211,87,154,0.04)' : C.surfaceLow
                }}
              >
                <Upload className="h-5 w-5 mx-auto" style={{ color: C.outline }} />
                <p className="text-xs font-semibold" style={{ color: C.onSurfaceVar }}>Drag .txt resume here</p>
                <p className="text-[10px]" style={{ color: C.outline }}>or click to browse</p>
                <input ref={fileInputRef} type="file" accept=".txt,.md" className="hidden" onChange={handleFileChange} />
              </div>
            )}
            <p className="text-[10px] mt-2 leading-relaxed" style={{ color: C.outline }}>
              Optional. Paste or upload your resume text so the AI can tailor questions to your background.
            </p>
          </Section>
        </div>
      </div>

      {/* ── START BUTTON ─────────────────────────────────────────────────────── */}
      <div
        className="p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ backgroundColor: C.surfaceLowest, borderColor: C.surfaceVariant, boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}
      >
        <div className="space-y-1">
          <p className="font-extrabold text-base" style={{ color: C.primary }}>
            Ready to interview at <span style={{ color: '#5a6ba8' }}>{selectedCompany}</span>?
          </p>
          <p className="text-xs" style={{ color: C.onSurfaceVar }}>
            {selectedRole} · {selectedType} · {selectedDifficulty} difficulty
          </p>
          <div className="flex items-center gap-1.5 mt-1" style={{ color: C.outline }}>
            <AlertCircle className="h-3 w-3" />
            <span className="text-[10px]">Allow microphone access when prompted. Use Chrome or Edge for best voice support.</span>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={isStarting}
          className="flex items-center gap-2 px-8 py-3.5 font-bold text-sm rounded-2xl transition-all hover:scale-[1.02] hover:shadow-xl shrink-0 disabled:opacity-60"
          style={{ backgroundColor: C.primary, color: C.onPrimary, boxShadow: '0 6px 24px rgba(0,0,0,0.15)' }}
        >
          {isStarting ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          {isStarting ? 'Launching Interview…' : 'Start Interview'}
          {!isStarting && <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* ── HISTORY TABLE ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold tracking-tight" style={{ color: C.primary }}>
          Interview History ({history.length})
        </h2>
        {history.length === 0 ? (
          <div
            className="p-12 rounded-3xl border border-dashed text-center space-y-3"
            style={{ borderColor: C.outlineVar, backgroundColor: C.surfaceLow }}
          >
            <Mic className="h-10 w-10 mx-auto opacity-20" style={{ color: C.primary }} />
            <p className="text-sm font-semibold" style={{ color: C.onSurfaceVar }}>No interviews yet</p>
            <p className="text-xs" style={{ color: C.outline }}>Configure a session above and hit Start Interview to begin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-2xl border hover:shadow-md transition-all"
                style={{ backgroundColor: C.surfaceLowest, borderColor: C.surfaceVariant }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center font-extrabold text-sm"
                    style={{
                      backgroundColor: item.overallScore >= 80 ? 'rgba(134,239,172,0.15)' : 'rgba(255,226,76,0.15)',
                      color: item.overallScore >= 80 ? '#16a34a' : '#b45309'
                    }}
                  >
                    {item.overallScore}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: C.primary }}>{item.role} @ {item.company}</p>
                    <p className="text-[10px]" style={{ color: C.outline }}>{item.type} · {item.difficulty} · {item.date}</p>
                  </div>
                </div>
                <div
                  className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border"
                  style={item.status === 'completed'
                    ? { backgroundColor: 'rgba(134,239,172,0.12)', borderColor: 'rgba(134,239,172,0.3)', color: '#16a34a' }
                    : { backgroundColor: 'rgba(255,226,76,0.12)', borderColor: 'rgba(255,226,76,0.3)', color: '#b45309' }
                  }
                >
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// ─── Reusable section wrapper ──────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="p-6 rounded-2xl border space-y-4"
      style={{ backgroundColor: C.surfaceLowest, borderColor: C.surfaceVariant, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.outline }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
