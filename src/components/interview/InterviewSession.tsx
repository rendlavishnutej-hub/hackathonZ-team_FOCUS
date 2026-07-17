'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic, MicOff, Volume2, VolumeX, Brain, Loader2,
  ChevronRight, LogOut, Type, Send, Sparkles, AlertCircle
} from 'lucide-react';
import type { InterviewState } from '@/lib/interview/types';
import InterviewReport from './InterviewReport';

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

interface Props {
  sessionId: string;
  role: string;
  company: string;
  difficulty: string;
  interviewType: string;
  userEmail: string;
}

type InterviewMode = 'initializing' | 'speaking' | 'listening' | 'thinking' | 'completed' | 'error';

// ─── Waveform bars component ─────────────────────────────────────────────────
function Waveform({ mode }: { mode: InterviewMode }) {
  const bars = 24;
  return (
    <div className="flex items-center justify-center gap-[3px] h-12">
      {Array.from({ length: bars }).map((_, i) => {
        const isActive = mode === 'speaking' || mode === 'listening';
        const delay = `${(i * 0.06).toFixed(2)}s`;
        const hue = mode === 'speaking' ? '#d3579a' : mode === 'listening' ? '#5a6ba8' : '#76777d';
        return (
          <div
            key={i}
            className="rounded-full transition-all"
            style={{
              width: 3,
              backgroundColor: hue,
              height: isActive ? `${12 + Math.sin(i * 0.8) * 20}px` : '4px',
              animationName: isActive ? 'waveBar' : 'none',
              animationDuration: `${0.6 + (i % 5) * 0.08}s`,
              animationDelay: delay,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              opacity: isActive ? 0.9 : 0.25,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Floating AI Avatar ───────────────────────────────────────────────────────
function AIAvatar({ mode }: { mode: InterviewMode }) {
  const pulseColor =
    mode === 'speaking'  ? 'rgba(211,87,154,0.2)' :
    mode === 'listening' ? 'rgba(90,107,168,0.2)' :
    mode === 'thinking'  ? 'rgba(255,226,76,0.15)' :
    'rgba(80,80,100,0.1)';

  const glowColor =
    mode === 'speaking'  ? '#d3579a' :
    mode === 'listening' ? '#5a6ba8' :
    mode === 'thinking'  ? '#ffe24c' : '#76777d';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      {/* Outer pulse ring */}
      {(mode === 'speaking' || mode === 'listening') && (
        <div
          className="absolute rounded-full animate-ping"
          style={{ width: 140, height: 140, backgroundColor: pulseColor, animationDuration: '1.4s' }}
        />
      )}
      {/* Mid ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: 110,
          height: 110,
          border: `2px solid ${glowColor}40`,
          boxShadow: `0 2px 20px ${glowColor}15`,
          transition: 'all 0.5s ease',
        }}
      />
      {/* Core avatar */}
      <div
        className="relative z-10 rounded-full flex items-center justify-center font-extrabold text-3xl bg-white border"
        style={{
          width: 80,
          height: 80,
          borderColor: C.surfaceVariant,
          boxShadow: `0 4px 15px ${glowColor}25`,
          transition: 'all 0.4s ease',
        }}
      >
        {mode === 'thinking' ? (
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: glowColor }} />
        ) : mode === 'listening' ? (
          <Mic className="h-8 w-8" style={{ color: glowColor }} />
        ) : (
          <Brain className="h-8 w-8" style={{ color: glowColor }} />
        )}
      </div>
    </div>
  );
}

export default function InterviewSessionClient({ sessionId, role, company, difficulty, interviewType, userEmail }: Props) {
  const router = useRouter();

  const [mode,        setMode]        = useState<InterviewMode>('initializing');
  const [state,       setState]       = useState<InterviewState | null>(null);
  const [transcript,  setTranscript]  = useState('');
  const [liveText,    setLiveText]    = useState('');
  const [textInput,   setTextInput]   = useState('');
  const [showTextBox, setShowTextBox] = useState(false);
  const [agentLog,    setAgentLog]    = useState<Array<{ agentId: string; message: string; status: string; timestamp: string }>>([]);
  const [error,       setError]       = useState('');
  const [muted,       setMuted]       = useState(false);

  const recognitionRef   = useRef<SpeechRecognition | null>(null);
  const synthRef         = useRef<SpeechSynthesisUtterance | null>(null);
  const isListeningRef   = useRef(false);
  const isSpeakingRef    = useRef(false);
  const logEndRef        = useRef<HTMLDivElement>(null);

  // ── Scroll agent log to bottom
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [agentLog]);

  // ── Initialize first turn on mount
  useEffect(() => {
    const resumeText = sessionStorage.getItem(`focus_resume_${sessionId}`) || '';
    const initialState: InterviewState = {
      sessionId,
      role,
      company,
      difficulty,
      interviewType,
      resumeText,
      history: [],
      currentQuestionIndex: 0,
      maxQuestions: 8,
      followUpCount: 0,
      hintsGiven: 0,
      questionHashes: [],
      activeAgentId: null,
      status: 'idle',
      logs: [],
    };
    runTurn(initialState, undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync agent log display when state changes
  useEffect(() => {
    if (state?.logs) setAgentLog([...state.logs]);
    if (state?.status === 'completed') {
      setMode('completed');
      stopListening();
      window.speechSynthesis?.cancel();
    }
  }, [state]);

  // ── API call to orchestrator
  const runTurn = useCallback(async (currentState: InterviewState, answer?: string) => {
    setMode('thinking');
    try {
      const res = await fetch('/api/interview/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: currentState, answer }),
      });
      if (!res.ok) throw new Error('Failed to reach interview orchestrator');
      const newState: InterviewState = await res.json();
      setState(newState);
      // Speak the next question
      if (newState.spokenPrompt && newState.status !== 'completed') {
        speakText(newState.spokenPrompt, newState);
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
      setMode('error');
    }
  }, []);

  // ── Text-to-Speech
  const speakText = useCallback((text: string, currentState: InterviewState) => {
    if (muted) {
      setMode('listening');
      startListening(currentState);
      return;
    }
    window.speechSynthesis?.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate  = 0.92;
    utterance.pitch = 1.0;

    // Prefer a natural voice
    const voices = window.speechSynthesis?.getVoices() || [];
    const preferred = voices.find(v =>
      v.name.includes('Google') || v.name.includes('Neural') || v.name.includes('Samantha')
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => { setMode('speaking'); isSpeakingRef.current = true; };
    utterance.onend   = () => {
      isSpeakingRef.current = false;
      setMode('listening');
      startListening(currentState);
    };
    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setMode('listening');
      startListening(currentState);
    };

    synthRef.current = utterance;
    setMode('speaking');
    window.speechSynthesis?.speak(utterance);
  }, [muted]);

  // ── Speech-to-Text — start
  const startListening = useCallback((currentState: InterviewState) => {
    if (isListeningRef.current) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setShowTextBox(true);
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous   = true;
    recog.interimResults = true;
    recog.lang         = 'en-US';

    recog.onstart = () => { isListeningRef.current = true; setMode('listening'); };

    recog.onresult = (event: Event) => {
      const ev = event as SpeechRecognitionEvent;
      let interim = '';
      let final   = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) final   += res[0].transcript;
        else              interim += res[0].transcript;
      }
      setLiveText(interim || final);
      if (final) setTranscript(prev => prev + ' ' + final);
    };

    recog.onspeechend = () => {
      recog.stop();
    };

    recog.onend = () => {
      isListeningRef.current = false;
      // Submit collected transcript
      const collected = transcript.trim();
      if (collected.length > 3) {
        setLiveText('');
        setTranscript('');
        submitAnswer(collected, currentState);
      }
    };

    recog.onerror = (e: Event) => {
      const err = e as SpeechRecognitionErrorEvent;
      isListeningRef.current = false;
      if (err.error !== 'no-speech') {
        setShowTextBox(true);
      }
    };

    recognitionRef.current = recog;
    recog.start();
  }, [transcript]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    isListeningRef.current = false;
  };

  // ── Submit answer (voice or typed)
  const submitAnswer = useCallback((answer: string, currentState?: InterviewState) => {
    const cs = currentState || state;
    if (!cs) return;
    stopListening();
    window.speechSynthesis?.cancel();
    setLiveText('');
    setTextInput('');
    setTranscript('');
    runTurn(cs, answer);
  }, [state, runTurn]);

  // ── Text fallback submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    submitAnswer(textInput.trim());
  };

  // ── Mute toggle
  const toggleMute = () => {
    setMuted(prev => {
      if (!prev) window.speechSynthesis?.cancel();
      return !prev;
    });
  };

  // ── Interrupt: user speaks while AI is talking
  const handleInterrupt = () => {
    if (isSpeakingRef.current) {
      window.speechSynthesis?.cancel();
      isSpeakingRef.current = false;
      if (state) startListening(state);
    }
  };

  // ── End interview early
  const handleEndInterview = () => {
    stopListening();
    window.speechSynthesis?.cancel();
    if (!state || state.history.length === 0) {
      router.push('/interview');
      return;
    }
    // Force completion on current state
    const finalState: InterviewState = { ...state, status: 'completed' };
    setState(finalState);
    setMode('completed');
  };

  // ── Save completed interview to history
  useEffect(() => {
    if (state?.status === 'completed' && state.finalReport) {
      try {
        const stored = localStorage.getItem('focus_interview_history');
        const list = stored ? JSON.parse(stored) : [];
        const record = {
          id: sessionId,
          role,
          company,
          type: interviewType,
          difficulty,
          date: new Date().toLocaleDateString(),
          overallScore: state.finalReport.overallScore,
          status: 'completed',
        };
        if (!list.some((r: any) => r.id === sessionId)) {
          list.unshift(record);
          localStorage.setItem('focus_interview_history', JSON.stringify(list));
        }
      } catch { /* ignore */ }
    }
  }, [state?.status, state?.finalReport]);

  // ── STATUS label helper
  const statusLabel: Record<InterviewMode, string> = {
    initializing: 'INITIALIZING',
    speaking:     'AI SPEAKING',
    listening:    'LISTENING',
    thinking:     'THINKING',
    completed:    'COMPLETED',
    error:        'ERROR',
  };
  const statusColor: Record<InterviewMode, string> = {
    initializing: '#76777d',
    speaking:     '#d3579a',
    listening:    '#5a6ba8',
    thinking:     '#ffe24c',
    completed:    '#047857',
    error:        '#dc2626',
  };

  // ─── COMPLETED → show report ──────────────────────────────────────────────
  if (mode === 'completed' && state?.finalReport) {
    return (
      <div className="h-full overflow-y-auto p-6 md:p-10" style={{ backgroundColor: C.cream }}>
        <InterviewReport
          report={state.finalReport}
          history={state.history}
          role={role}
          company={company}
          difficulty={difficulty}
          interviewType={interviewType}
        />
      </div>
    );
  }

  // ─── MAIN INTERVIEW UI ───────────────────────────────────────────────────
  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: C.cream, color: '#000000', fontFamily: 'var(--font-jakarta), sans-serif' }}
    >
      {/* Decorative background gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ backgroundColor: 'rgba(211,87,154,0.02)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px]" style={{ backgroundColor: 'rgba(90,107,168,0.03)' }} />
      </div>

      {/* ── TOP BAR ───────────────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex items-center justify-between px-6 py-4 border-b shrink-0 bg-white"
        style={{ borderColor: C.surfaceVariant }}
      >
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: statusColor[mode] }} />
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: statusColor[mode] }}>
            {statusLabel[mode]}
          </span>
          <span className="text-[10px] text-zinc-550 hidden sm:block">
            · {company} · {role} · {difficulty}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg border transition-all hover:bg-zinc-50 bg-white"
            style={{ borderColor: C.surfaceVariant }}
            title={muted ? 'Unmute AI Voice' : 'Mute AI Voice'}
          >
            {muted ? <VolumeX className="h-4 w-4 text-zinc-650" /> : <Volume2 className="h-4 w-4 text-zinc-650" />}
          </button>
          <button
            onClick={() => setShowTextBox(v => !v)}
            className="p-2 rounded-lg border transition-all hover:bg-zinc-50 bg-white"
            style={{ borderColor: C.surfaceVariant }}
            title="Type your answer instead"
          >
            <Type className="h-4 w-4 text-zinc-650" />
          </button>
          <button
            onClick={handleEndInterview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:bg-red-50 bg-white"
            style={{ borderColor: '#fca5a5', color: '#dc2626' }}
          >
            <LogOut className="h-3.5 w-3.5" />
            End
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 px-6 overflow-hidden py-6">

        {/* AI AVATAR */}
        <div className="flex flex-col items-center gap-4">
          <div onClick={handleInterrupt} className="cursor-pointer" title="Click to interrupt">
            <AIAvatar mode={mode} />
          </div>
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-550">
            {mode === 'speaking' ? 'Tap avatar to interrupt' :
             mode === 'listening' ? 'Speak your answer now' :
             mode === 'thinking' ? 'Agents processing…' :
             mode === 'initializing' ? 'Preparing interview…' :
             'Interview complete'}
          </p>
        </div>

        {/* WAVEFORM */}
        <Waveform mode={mode} />

        {/* CURRENT QUESTION */}
        {state?.nextQuestion && (
          <div
            className="max-w-2xl w-full p-5 rounded-2xl border bg-white shadow-sm"
            style={{ borderColor: C.surfaceVariant }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#5a6ba8' }}>
              Question {Math.min(state.currentQuestionIndex, state.maxQuestions)} of {state.maxQuestions}
            </p>
            <p className="text-sm font-semibold leading-relaxed text-black">{state.nextQuestion}</p>
          </div>
        )}

        {/* LIVE TRANSCRIPT */}
        {(liveText || transcript) && mode === 'listening' && (
          <div
            className="max-w-2xl w-full p-4 rounded-xl border bg-white"
            style={{ borderColor: `${C.accentBlue}50` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#5a6ba8' }}>Your answer (live)</p>
            <p className="text-sm text-zinc-800 leading-relaxed font-medium">
              {transcript} <span className="text-zinc-400">{liveText}</span>
            </p>
          </div>
        )}

        {/* TEXT FALLBACK INPUT */}
        {showTextBox && (
          <form onSubmit={handleTextSubmit} className="max-w-2xl w-full flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Type your answer here…"
              className="flex-1 px-4 py-3 rounded-xl border text-sm bg-white text-black placeholder-zinc-455 focus:outline-none focus:ring-1 focus:ring-purple-250"
              style={{ borderColor: C.surfaceVariant }}
              disabled={mode === 'thinking'}
            />
            <button
              type="submit"
              disabled={!textInput.trim() || mode === 'thinking'}
              className="px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-all disabled:opacity-50 text-white shadow"
              style={{ backgroundColor: '#d3579a' }}
            >
              <Send className="h-4 w-4" />
              Submit
            </button>
          </form>
        )}

        {/* ERROR STATE */}
        {mode === 'error' && (
          <div
            className="max-w-lg w-full p-4 rounded-xl border flex items-center gap-3 bg-red-50"
            style={{ borderColor: '#fca5a5' }}
          >
            <AlertCircle className="h-5 w-5 shrink-0" style={{ color: '#dc2626' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>Connection Error</p>
              <p className="text-xs text-zinc-550 mt-0.5">{error || 'Failed to reach the interview AI. Check your API key or network.'}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── AGENT ACTIVITY PANEL ──────────────────────────────────────────── */}
      <div
        className="relative z-10 border-t shrink-0 bg-white"
        style={{ borderColor: C.surfaceVariant }}
      >
        <div className="px-6 py-2 flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-zinc-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#76777d]">Agent Activity</span>
        </div>
        <div
          className="px-6 pb-4 overflow-y-auto max-h-[110px] space-y-1 font-mono text-[10px]"
          style={{ scrollbarWidth: 'none' }}
        >
          {agentLog.map((log, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-zinc-400 shrink-0">[{log.timestamp}]</span>
              <span
                className="shrink-0 px-1 rounded uppercase font-bold"
                style={{
                  backgroundColor: 'rgba(211,87,154,0.1)',
                  color: '#d3579a',
                }}
              >
                {log.agentId}
              </span>
              <span style={{
                color: log.status === 'success' ? '#047857' :
                       log.status === 'warning' ? '#ea580c' :
                       log.status === 'error'   ? '#dc2626' : '#76777d'
              }}>
                {log.message}
              </span>
            </div>
          ))}
          {mode === 'thinking' && (
            <div className="flex items-center gap-2 text-zinc-400 animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin text-purple-650" />
              Agents collaborating…
            </div>
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Waveform keyframe animation in a style tag */}
      <style>{`
        @keyframes waveBar {
          0%   { transform: scaleY(0.3); }
          100% { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  );
}
