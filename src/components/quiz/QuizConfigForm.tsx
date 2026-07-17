'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Loader2, Timer, Zap, FileText, Upload,
  File, X, RefreshCw, CheckCircle2, Clock, AlertCircle,
  FileType, ChevronRight
} from 'lucide-react';
import type { Difficulty, QuizFile } from '@/lib/quiz/types';

interface QuizConfigFormProps {
  userId: string;
}

const difficulties: { value: Difficulty; label: string; color: string; desc: string }[] = [
  { value: 'easy', label: 'Easy', color: '#3DD68C', desc: '2 pts / -0.5' },
  { value: 'medium', label: 'Medium', color: '#F5B942', desc: '3 pts / -0.75' },
  { value: 'hard', label: 'Hard', color: '#F1583D', desc: '4 pts / -1' },
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
  const colors: Record<string, string> = { pdf: '#F1583D', docx: '#3B82F6', doc: '#3B82F6', pptx: '#F5B942', ppt: '#F5B942', txt: '#9C9CA8' };
  return (
    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${colors[ext] || '#9C9CA8'}20`, border: `1px solid ${colors[ext] || '#9C9CA8'}30` }}>
      <FileText className="h-4 w-4" style={{ color: colors[ext] || '#9C9CA8' }} />
    </div>
  );
}

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'text/plain') {
    return await file.text();
  }
  // For PDF/DOCX/PPTX — we pass rawContent (base64) to Gemini and return minimal placeholder text
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

  // Upload & file state
  const [existingFiles, setExistingFiles] = useState<QuizFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<QuizFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Quiz config state
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [forceRegenerate, setForceRegenerate] = useState(false);

  // Fetch previously uploaded files
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
      // Generate (or use cached) questions for the selected file
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

      // Store the pre-fetched questions + config in session storage
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
    <div className="max-w-2xl space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-3xl border border-white/5 bg-[#13131A]/60 shadow-xl shadow-[#7C5CFF]/5 space-y-7"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#7C5CFF] to-[#22D3D0] p-[1px]">
            <div className="h-full w-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
              <Zap className="h-5 w-5 text-[#22D3D0]" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Generate Quiz from Document</h2>
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
              ? 'border-[#7C5CFF] bg-[#7C5CFF]/5'
              : 'border-zinc-700 hover:border-zinc-600 bg-zinc-950/30 hover:bg-zinc-950/50'
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
              <div className="h-14 w-14 rounded-2xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 flex items-center justify-center">
                <Loader2 className="h-7 w-7 text-[#7C5CFF] animate-spin" />
              </div>
              <p className="text-sm text-zinc-300 font-medium">Reading document...</p>
            </div>
          ) : (
            <>
              <motion.div
                animate={{ y: isDragging ? -4 : 0 }}
                className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center"
              >
                <Upload className={`h-7 w-7 transition-colors ${isDragging ? 'text-[#7C5CFF]' : 'text-zinc-500'}`} />
              </motion.div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-zinc-300">
                  {isDragging ? 'Drop your file here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-zinc-600">PDF, DOCX, PPTX, TXT — up to 20 MB</p>
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
              className="flex items-center gap-2 px-4 py-3 bg-[#F1583D]/10 border border-[#F1583D]/20 rounded-xl text-xs text-[#F1583D]"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {uploadError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Previously Uploaded Files */}
        {existingFiles.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Your Documents</p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {existingFiles.map(f => {
                const ext = fileExt(f);
                const isSelected = selectedFile?.id === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => { setSelectedFile(isSelected ? null : f); setForceRegenerate(false); setUploadError(''); }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-[#7C5CFF]/40 bg-[#7C5CFF]/8'
                        : 'border-zinc-800/70 hover:border-zinc-700 bg-zinc-950/20 hover:bg-zinc-950/40'
                    }`}
                  >
                    <FileTypeIcon ext={ext} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{f.name}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {formatFileSize(f.size)} · {new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="h-5 w-5 text-[#7C5CFF] shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0" />
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
              <div className="flex items-center justify-between py-2.5 px-4 bg-[#7C5CFF]/8 border border-[#7C5CFF]/20 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#7C5CFF]" />
                  <span className="text-xs font-semibold text-white truncate max-w-[240px]">{selectedFile.name}</span>
                </div>
                <button
                  onClick={() => setForceRegenerate(v => !v)}
                  className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${forceRegenerate ? 'text-[#22D3D0]' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  <RefreshCw className={`h-3 w-3 ${forceRegenerate ? 'text-[#22D3D0]' : ''}`} />
                  {forceRegenerate ? 'Regenerating' : 'Regenerate'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Difficulty */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Difficulty</label>
          <div className="flex gap-2">
            {difficulties.map(d => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                  difficulty === d.value
                    ? 'border-transparent text-zinc-950'
                    : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 bg-zinc-950/40'
                }`}
                style={difficulty === d.value ? { backgroundColor: d.color } : {}}
              >
                <span className="block">{d.label}</span>
                <span className={`text-[9px] font-normal ${difficulty === d.value ? 'text-zinc-900/70' : 'text-zinc-600'}`}>{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
            Questions: <span className="text-[#22D3D0]">{questionCount}</span>
          </label>
          <input
            type="range" min={5} max={30} step={1} value={questionCount}
            onChange={e => setQuestionCount(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-zinc-800 accent-[#7C5CFF] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>5</span><span>30</span>
          </div>
        </div>

        {/* Timer Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 flex items-center gap-1.5">
              <Timer className="h-3 w-3" /> Timer
            </label>
            <button
              onClick={() => setTimerEnabled(!timerEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${timerEnabled ? 'bg-[#7C5CFF]' : 'bg-zinc-800'}`}
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
                className="flex items-center gap-3"
              >
                <input
                  type="number" min={1} max={120} value={timerMinutes}
                  onChange={e => setTimerMinutes(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                  className="w-20 px-3 py-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-white text-sm text-center focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all"
                />
                <span className="text-xs text-zinc-500">minutes</span>
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
          className="w-full py-3.5 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] text-zinc-950 font-bold text-sm rounded-2xl hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C5CFF]/15 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {forceRegenerate ? 'Regenerating quiz with AI...' : 'Generating quiz with AI...'}
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-zinc-950" />
              {selectedFile ? 'Generate & Start Quiz' : 'Select or upload a document first'}
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
