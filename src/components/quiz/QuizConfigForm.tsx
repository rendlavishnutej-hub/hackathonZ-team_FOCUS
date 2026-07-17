'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Loader2, Timer, Zap, FileText, Upload,
  CheckCircle2, AlertCircle, ChevronRight, RefreshCw
} from 'lucide-react';
import type { Difficulty, QuizFile } from '@/lib/quiz/types';

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

interface QuizConfigFormProps {
  userId: string;
}

const difficulties: { value: Difficulty; label: string; color: string; desc: string }[] = [
  { value: 'easy', label: 'Easy', color: '#047857', desc: '2 pts / -0.5' },
  { value: 'medium', label: 'Medium', color: '#d97706', desc: '3 pts / -0.75' },
  { value: 'hard', label: 'Hard', color: '#ea580c', desc: '4 pts / -1' },
];

const ACCEPTED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'text/plain': 'txt',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ ext }: { ext: string }) {
  const colors: Record<string, string> = { pdf: '#ea580c', docx: '#3B82F6', doc: '#3B82F6', pptx: '#ffe24c', ppt: '#ffe24c', txt: '#76777d' };
  return (
    <div 
      className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border" 
      style={{ backgroundColor: `${colors[ext] || '#76777d'}12`, borderColor: `${colors[ext] || '#76777d'}25` }}
    >
      <FileText className="h-4 w-4" style={{ color: colors[ext] || '#76777d' }} />
    </div>
  );
}

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'text/plain') {
    return await file.text();
  }
  return `[Binary document: ${file.name}. Content will be analyzed by AI directly from the raw file data.]`;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function QuizConfigForm({ userId }: QuizConfigFormProps) {
  const router = useRouter();
  const dropRef = useRef<HTMLDivElement>(null);

  const [existingFiles, setExistingFiles] = useState<QuizFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<QuizFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [forceRegenerate, setForceRegenerate] = useState(false);

  useEffect(() => {
    fetch('/api/quiz/files')
      .then(r => r.json())
      .then(data => setExistingFiles(data.files || []))
      .catch(() => {});
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!dropRef.current?.contains(e.relatedTarget as Node)) setIsDragging(false);
  }, []);

  const processFile = useCallback(async (rawFile: File) => {
    setUploadError('');
    if (!ACCEPTED_TYPES[rawFile.type]) {
      setUploadError('Unsupported file type. Please upload PDF, DOCX, PPTX, or TXT.');
      return;
    }
    if (rawFile.size > 20 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 20 MB.');
      return;
    }

    setUploading(true);
    try {
      const [content, rawContent] = await Promise.all([
        extractTextFromFile(rawFile),
        fileToBase64(rawFile),
      ]);

      const res = await fetch('/api/quiz/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rawFile.name,
          type: rawFile.type,
          size: rawFile.size,
          content,
          rawContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setExistingFiles(prev => [data.file, ...prev]);
      setSelectedFile(data.file);
      setForceRegenerate(false);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleStart = async () => {
    if (!selectedFile || generating) return;
    setGenerating(true);

    try {
      const genRes = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: selectedFile.id,
          difficulty,
          questionCount,
          forceRegenerate,
        }),
      });

      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || 'Generation failed');

      const config = {
        subjectId: 'generated',
        subjectName: selectedFile.name.replace(/\.[^/.]+$/, ''),
        topicId: 'generated',
        topicName: 'Document Quiz',
        fileId: selectedFile.id,
        difficulty,
        questionCount,
        timerEnabled,
        timerDuration: timerEnabled ? timerMinutes * 60 : 0,
      };

      sessionStorage.setItem('focus_quiz_config', JSON.stringify(config));
      sessionStorage.setItem('focus_quiz_questions', JSON.stringify(genData.questions));

      router.push('/quiz/take');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to generate quiz. Please try again.');
      setGenerating(false);
    }
  };

  const fileExt = (f: QuizFile) => ACCEPTED_TYPES[f.type] || f.name.split('.').pop() || 'file';

  return (
    <div className="max-w-2xl space-y-5 font-sans" style={{ color: C.onSurface }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-[2rem] border bg-white shadow-sm space-y-7"
        style={{ borderColor: C.surfaceVariant }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-50 border flex items-center justify-center shadow-inner">
            <Zap className="h-5 w-5 text-[#d3579a]" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-black">Generate Quiz from Document</h2>
            <p className="text-xs text-zinc-500">Upload a study file and AI will create a personalised quiz</p>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          ref={dropRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center gap-4 px-6 py-10 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
            isDragging
              ? 'border-[#d3579a] bg-[#d3579a]/5'
              : 'border-zinc-350 bg-white hover:bg-[#fcfaf5] hover:border-zinc-550'
          }`}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
            className="hidden"
            onChange={handleFileInput}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                <Loader2 className="h-7 w-7 text-[#d3579a] animate-spin" />
              </div>
              <p className="text-xs text-zinc-650 font-bold">Reading document...</p>
            </div>
          ) : (
            <>
              <motion.div
                animate={{ y: isDragging ? -4 : 0 }}
                className="h-14 w-14 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shadow-inner"
              >
                <Upload className={`h-7 w-7 transition-colors ${isDragging ? 'text-[#d3579a]' : 'text-zinc-400'}`} />
              </motion.div>
              <div className="text-center space-y-1">
                <p className="text-xs font-extrabold text-zinc-700">
                  {isDragging ? 'Drop your file here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-[10px] text-zinc-500 font-semibold">PDF, DOCX, PPTX, TXT — up to 20 MB</p>
              </div>
            </>
          )}
        </div>

        {/* Upload Error */}
        <AnimatePresence>
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-650"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {uploadError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Previously Uploaded Files */}
        {existingFiles.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#76777d]">Your Documents</p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {existingFiles.map(f => {
                const ext = fileExt(f);
                const isSelected = selectedFile?.id === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => { setSelectedFile(isSelected ? null : f); setForceRegenerate(false); setUploadError(''); }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200"
                    style={
                      isSelected
                        ? { backgroundColor: `${C.accentPurple}10`, borderColor: C.accentPurple }
                        : { backgroundColor: '#ffffff', borderColor: C.surfaceVariant }
                    }
                  >
                    <FileTypeIcon ext={ext} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-black' : 'text-zinc-800'}`}>{f.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold">
                        {formatFileSize(f.size)} · {new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="h-5 w-5 text-[#d3579a] shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected file info + regenerate toggle */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div 
                className="flex items-center justify-between py-2.5 px-4 rounded-xl border"
                style={{ backgroundColor: `${C.accentPurple}08`, borderColor: `${C.accentPurple}30` }}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#d3579a]" />
                  <span className="text-xs font-semibold text-black truncate max-w-[240px]">{selectedFile.name}</span>
                </div>
                <button
                  onClick={() => setForceRegenerate(v => !v)}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors"
                  style={{ color: forceRegenerate ? C.accentPurple : '#76777d' }}
                >
                  <RefreshCw className={`h-3 w-3 ${forceRegenerate ? 'animate-spin' : ''}`} />
                  {forceRegenerate ? 'Regenerating' : 'Regenerate'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Difficulty */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-[#76777d]">Difficulty</label>
          <div className="flex gap-2">
            {difficulties.map(d => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border"
                style={
                  difficulty === d.value
                    ? { backgroundColor: `${d.color}15`, borderColor: d.color, color: d.color }
                    : { backgroundColor: '#ffffff', borderColor: C.surfaceVariant, color: C.onSurfaceVariant }
                }
              >
                <span className="block">{d.label}</span>
                <span className="text-[9px] font-normal opacity-85 mt-0.5 block">{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-[#76777d]">
            Questions: <span className="text-black font-extrabold">{questionCount}</span>
          </label>
          <input
            type="range" min={5} max={30} step={1} value={questionCount}
            onChange={e => setQuestionCount(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-zinc-200 accent-[#d3579a] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#71717a] font-mono font-bold">
            <span>5 questions</span><span>30 questions</span>
          </div>
        </div>

        {/* Timer Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-bold tracking-widest text-[#76777d] flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5" /> Timer
            </label>
            <button
              onClick={() => setTimerEnabled(!timerEnabled)}
              className="relative w-11 h-6 rounded-full transition-colors duration-200"
              style={{ backgroundColor: timerEnabled ? C.accentPurple : C.surfaceVariant }}
            >
              <motion.div
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                animate={{ x: timerEnabled ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          <AnimatePresence>
            {timerEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 pt-1"
              >
                <input
                  type="number" min={1} max={120} value={timerMinutes}
                  onChange={e => setTimerMinutes(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                  className="w-20 px-3 py-2 bg-white border rounded-xl text-black text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#d3579a] transition-all"
                  style={{ borderColor: C.surfaceVariant }}
                />
                <span className="text-xs text-zinc-500 font-semibold">minutes</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Start Button */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStart}
          disabled={!selectedFile || generating || uploading}
          className="w-full py-3.5 font-bold text-sm rounded-2xl hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: C.accentPurple, color: '#ffffff' }}
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {forceRegenerate ? 'Regenerating quiz with AI...' : 'Generating quiz with AI...'}
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-white text-white" />
              {selectedFile ? 'Generate & Start Quiz' : 'Select or upload a document first'}
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
