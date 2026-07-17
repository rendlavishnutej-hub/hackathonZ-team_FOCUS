'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Terminal, Mic, Paperclip, Play, 
  HelpCircle, Shield, GraduationCap, X, FileText, CheckCircle2 
} from 'lucide-react';

interface OSCommandCenterProps {
  onSubmit: (prompt: string, attachment?: string) => void;
  loading: boolean;
}

export default function OSCommandCenter({ onSubmit, loading }: OSCommandCenterProps) {
  const [prompt, setPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestions = [
    'Next.js 15 Server Actions & PPR',
    'Explain Rust lifetimes & memory safety',
    'Prepare me for a Google Front-End Engineer interview',
    'Build a microservice project in NestJS',
    'Test my knowledge on PostgreSQL query planner & index options',
  ];

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    onSubmit(prompt.trim(), attachment || undefined);
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file.name);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleSpeech = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setPrompt(prev => prev ? prev + ' ' + text : text);
      };

      rec.onerror = (e: any) => {
        console.error(e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.start();
    } else {
      // Mock voice input
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setPrompt("Explain Kubernetes Pod scheduling internals");
      }, 2500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 sm:p-10 rounded-3xl border shadow-xl relative overflow-hidden group backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderColor: 'rgba(0, 0, 0, 0.06)',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)',
      }}
    >
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-200/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-pink-200/10 transition-colors duration-1000" />
      
      <form onSubmit={handleStartSession} className="space-y-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#d3579a] animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#5a6ba8]">
              Multi-Agent Collaboration Engine
            </span>
          </div>
          <h2 className="text-xl font-bold text-neutral-800">
            What are we mastering today?
          </h2>
        </div>

        <div className="relative border rounded-2xl p-1 bg-white/80 shadow-sm focus-within:ring-2 focus-within:ring-[#5a6ba8]/40 focus-within:border-[#5a6ba8] transition-all flex flex-col gap-2">
          <div className="flex items-center gap-2 px-3 pt-2">
            <Terminal className="h-5 w-5 text-neutral-400 shrink-0" />
            <input
              type="text"
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Deploy a learning grid e.g., Next.js streaming, Rust lifetimes..."
              disabled={loading}
              className="w-full text-sm text-neutral-800 focus:outline-none bg-transparent"
            />
          </div>

          <div className="flex items-center justify-between border-t border-neutral-100 pt-2 px-2 pb-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAttachmentClick}
                disabled={loading}
                className="p-2 rounded-xl text-neutral-500 hover:text-black hover:bg-neutral-100 transition-all relative"
                title="Attach PDF or Resume"
              >
                <Paperclip className="h-4 w-4" />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.doc,.docx"
                  className="hidden"
                />
              </button>

              <button
                type="button"
                onClick={toggleSpeech}
                disabled={loading}
                className={`p-2 rounded-xl transition-all relative ${isRecording ? 'text-rose-500 bg-rose-50' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'}`}
                title="Voice Input"
              >
                <Mic className={`h-4 w-4 ${isRecording ? 'animate-bounce' : ''}`} />
                {isRecording && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </button>

              <AnimatePresence>
                {attachment && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#5a6ba8]/10 text-[#5a6ba8] rounded-xl text-xs font-semibold"
                  >
                    <FileText className="h-3 w-3 shrink-0" />
                    <span className="max-w-[120px] truncate">{attachment}</span>
                    <button type="button" onClick={handleRemoveAttachment} className="hover:text-rose-500 ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-5 py-2.5 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
              style={{
                backgroundColor: '#000',
                color: '#fff',
              }}
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Orchestrating...
                </span>
              ) : (
                <>
                  Deploy Loop
                  <Play className="h-3 w-3 fill-white" />
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Suggestion tags */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
            Suggested Core Paths:
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((item, idx) => (
              <motion.button
                key={idx}
                type="button"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPrompt(item)}
                disabled={loading}
                className="px-3.5 py-1.5 border rounded-xl text-xs font-medium text-neutral-500 bg-white hover:text-black hover:border-neutral-300 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
              >
                {item}
              </motion.button>
            ))}
          </div>
        </div>
      </form>
    </motion.div>
  );
}
