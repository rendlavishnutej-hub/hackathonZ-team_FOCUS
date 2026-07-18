'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Loader2, Timer, Zap, FileText, Upload,
  CheckCircle2, AlertCircle, ChevronRight, RefreshCw, X
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
  accentYellow: '#ffe24c',
  accentBlue: '#bec6e0',
  accentPink: '#ffafd3',
  accentGreen: '#86efac',
  accentPurple: '#d3579a',
};

interface QuizConfigFormProps {
  userId: string;
}

const difficulties: { value: Difficulty; label: string; color: string; desc: string }[] = [
  { value: 'easy', label: 'EASY', color: '#86efac', desc: '2 PTS / -0.5' },
  { value: 'medium', label: 'MEDIUM', color: '#ffe24c', desc: '3 PTS / -0.75' },
  { value: 'hard', label: 'HARD', color: '#ffafd3', desc: '4 PTS / -1' },
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
  return (
    <div className="h-12 w-12 border-4 border-black bg-[#bec6e0] flex items-center justify-center shrink-0">
      <FileText className="h-6 w-6 text-black" strokeWidth={3} />
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
      setUploadError('UNSUPPORTED FORMAT! PDF, DOCX, PPTX, OR TXT ONLY.');
      return;
    }
    if (rawFile.size > 20 * 1024 * 1024) {
      setUploadError('FILE TOO LARGE! MAX 20MB.');
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
      if (!res.ok) throw new Error(data.error || 'UPLOAD FAILED');

      setExistingFiles(prev => [data.file, ...prev]);
      setSelectedFile(data.file);
      setForceRegenerate(false);
    } catch (err: any) {
      setUploadError(err.message || 'UPLOAD FAILED. TRY AGAIN.');
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
      if (!genRes.ok) throw new Error(genData.error || 'GENERATION FAILED');

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
      setUploadError(err.message || 'GENERATION FAILED. TRY AGAIN.');
      setGenerating(false);
    }
  };

  const fileExt = (f: QuizFile) => ACCEPTED_TYPES[f.type] || f.name.split('.').pop() || 'file';

  return (
    <div className="max-w-3xl space-y-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 sm:p-10 border-8 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-10"
      >
        {/* Header */}
        <div className="flex items-center gap-4 border-b-8 border-black pb-6">
          <div className="h-16 w-16 border-4 border-black bg-[#d3579a] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Zap className="h-8 w-8 text-white" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-4xl sm:text-5xl font-display text-black uppercase leading-none mt-2">NEW ARENA</h2>
            <p className="text-xl font-bold uppercase tracking-widest text-zinc-600">UPLOAD TO INITIATE</p>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          ref={dropRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center gap-6 px-6 py-16 border-4 border-dashed border-black transition-all duration-300 cursor-pointer ${
            isDragging
              ? 'bg-[#86efac]'
              : 'bg-white hover:bg-[#fef9f2]'
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
            <div className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 border-4 border-black bg-white flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <Loader2 className="h-10 w-10 text-black animate-spin" strokeWidth={3} />
              </div>
              <p className="text-2xl font-display uppercase tracking-widest text-black mt-2">PROCESSING...</p>
            </div>
          ) : (
            <>
              <motion.div
                animate={{ y: isDragging ? -10 : 0 }}
                className="h-20 w-20 border-4 border-black bg-[#ffe24c] flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <Upload className="h-10 w-10 text-black" strokeWidth={3} />
              </motion.div>
              <div className="text-center space-y-2 mt-2">
                <p className="text-3xl font-display uppercase tracking-widest text-black">
                  {isDragging ? 'DROP IT HERE' : 'CLICK OR DRAG FILE'}
                </p>
                <p className="text-lg font-bold uppercase tracking-wider text-zinc-600 bg-white border-2 border-black inline-block px-3 py-1">
                  PDF, DOCX, PPTX, TXT / MAX 20MB
                </p>
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
              className="flex items-center gap-4 px-6 py-4 bg-[#ffafd3] border-4 border-black text-2xl font-display uppercase tracking-widest text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <AlertCircle className="h-8 w-8 shrink-0" strokeWidth={3} />
              {uploadError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Previously Uploaded Files */}
        {existingFiles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-display uppercase tracking-widest text-black underline decoration-4 underline-offset-4">VAULT</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {existingFiles.map(f => {
                const ext = fileExt(f);
                const isSelected = selectedFile?.id === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => { setSelectedFile(isSelected ? null : f); setForceRegenerate(false); setUploadError(''); }}
                    className={`w-full flex items-center gap-4 p-4 border-4 border-black text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#86efac] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1 -translate-x-1'
                        : 'bg-white hover:bg-[#f8f3ec]'
                    }`}
                  >
                    <FileTypeIcon ext={ext} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-bold uppercase tracking-wider truncate text-black">{f.name}</p>
                      <p className="text-sm font-bold uppercase tracking-widest text-zinc-700 mt-1">
                        {formatFileSize(f.size)} // {new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="h-8 w-8 text-black shrink-0" strokeWidth={3} />
                    ) : (
                      <ChevronRight className="h-8 w-8 text-black shrink-0" strokeWidth={3} />
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
              className="space-y-4 pt-4 border-t-8 border-black"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-4 border-black bg-black text-white">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-[#86efac]" strokeWidth={3} />
                  <span className="text-xl font-bold uppercase tracking-wider truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</span>
                </div>
                <button
                  onClick={() => setForceRegenerate(v => !v)}
                  className={`flex items-center justify-center gap-2 px-4 py-2 border-2 border-white font-display text-xl uppercase tracking-widest transition-colors ${
                    forceRegenerate ? 'bg-[#ffafd3] text-black border-black' : 'hover:bg-white hover:text-black'
                  }`}
                >
                  <RefreshCw className={`h-5 w-5 ${forceRegenerate ? 'animate-spin' : ''}`} strokeWidth={3} />
                  {forceRegenerate ? 'REBOOTING' : 'FORCE REBOOT'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Configurations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          
          {/* Difficulty */}
          <div className="space-y-4">
            <label className="text-2xl font-display uppercase tracking-widest text-black block bg-[#ffe24c] px-3 py-1 border-4 border-black w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">DIFFICULTY</label>
            <div className="flex flex-col gap-3">
              {difficulties.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`flex items-center justify-between p-4 border-4 border-black text-left transition-all duration-200 ${
                    difficulty === d.value
                      ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1 -translate-x-1'
                      : 'bg-white hover:bg-zinc-100'
                  }`}
                  style={{ backgroundColor: difficulty === d.value ? d.color : '#ffffff' }}
                >
                  <span className="text-2xl font-display text-black">{d.label}</span>
                  <span className="text-sm font-bold text-black uppercase tracking-widest bg-white border-2 border-black px-2 py-0.5">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {/* Question Count */}
            <div className="space-y-4">
              <label className="text-2xl font-display uppercase tracking-widest text-black flex items-center gap-3 bg-[#bec6e0] px-3 py-1 border-4 border-black w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                TARGETS: <span className="bg-white px-2 py-0.5 border-2 border-black">{questionCount}</span>
              </label>
              <div className="pt-2">
                <input
                  type="range" min={5} max={30} step={1} value={questionCount}
                  onChange={e => setQuestionCount(parseInt(e.target.value))}
                  className="w-full h-4 rounded-none appearance-none bg-black cursor-pointer border-2 border-black"
                />
                <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-black mt-2">
                  <span>MIN 5</span><span>MAX 30</span>
                </div>
              </div>
            </div>

            {/* Timer Toggle */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <label className="text-2xl font-display uppercase tracking-widest text-black flex items-center gap-2">
                  <Timer className="h-6 w-6" strokeWidth={3} /> COUNTDOWN
                </label>
                <button
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={`relative w-16 h-8 border-4 border-black transition-colors duration-200 ${timerEnabled ? 'bg-[#86efac]' : 'bg-zinc-300'}`}
                >
                  <motion.div
                    className="absolute top-0 left-0 w-7 h-7 bg-white border-r-4 border-black"
                    animate={{ x: timerEnabled ? 32 : 0 }}
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
                    className="flex items-center gap-4 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <input
                      type="number" min={1} max={120} value={timerMinutes}
                      onChange={e => setTimerMinutes(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                      className="w-24 px-4 py-2 bg-zinc-100 border-4 border-black text-black text-2xl font-display text-center focus:outline-none focus:bg-[#ffe24c] transition-colors"
                    />
                    <span className="text-xl font-bold uppercase tracking-widest text-black">MINUTES</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <motion.button
          whileHover={{ scale: 1.01, y: -2, x: -2 }}
          whileTap={{ scale: 0.99, y: 0, x: 0 }}
          onClick={handleStart}
          disabled={!selectedFile || generating || uploading}
          className="w-full py-6 font-display text-3xl sm:text-4xl tracking-widest rounded-none border-8 border-black flex items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-[#86efac] transition-colors bg-[#86efac] text-black uppercase"
        >
          {generating ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin" strokeWidth={3} />
              {forceRegenerate ? 'REBOOTING ARENA...' : 'CONSTRUCTING ARENA...'}
            </>
          ) : (
            <>
              <Play className="h-10 w-10 fill-current" strokeWidth={3} />
              {selectedFile ? 'ENTER ARENA' : 'UPLOAD TO UNLOCK'}
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
