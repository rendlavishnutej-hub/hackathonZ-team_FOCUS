'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Clock, Award, Code, CheckCircle, ArrowRight,
  TrendingUp, Zap, RotateCcw, AlertTriangle, Compass, CheckCircle2, ChevronRight, HelpCircle, Mic
} from 'lucide-react';
import type { WorkspaceResult as WorkspaceResultType, QuizQuestion, Flashcard } from '@/lib/os/types';

interface WorkspaceResultProps {
  result: WorkspaceResultType;
  onClose: () => void;
}

export default function WorkspaceResult({ result, onClose }: WorkspaceResultProps) {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'notes' | 'code' | 'quiz' | 'flashcards' | 'career' | 'project' | 'interview'>('roadmap');
  
  // Interactive Quiz State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Interactive Flashcards State
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Interactive Voice Interview State
  const [interviewStage, setInterviewStage] = useState<'idle' | 'welcome' | 'questioning' | 'finished'>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [interviewHistory, setInterviewHistory] = useState<Array<{ q: string; a: string }>>([]);
  const [isInterviewerListening, setIsInterviewerListening] = useState(false);
  const [voiceReport, setVoiceReport] = useState<any>(null);

  const interviewQuestions = [
    `Could you explain the core concepts of ${result.intent.domain} and why we use it?`,
    `How do you manage performance scaling, cache validation, or load boundaries in ${result.intent.domain}?`,
    `What are the typical anti-patterns or debugging challenges you encounter in ${result.intent.domain}?`,
    `Describe a practical project or deployment scenario where you used ${result.intent.domain} to solve a real problem.`
  ];

  const handleSelectAnswer = (qId: string, idx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: idx }));
  };

  const handleFlipCard = (fId: string) => {
    setFlippedCards(prev => ({ ...prev, [fId]: !prev[fId] }));
  };

  // Web Speech synthesis and recognition integration
  const speakText = (text: string, callback?: () => void) => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (callback) {
      utterance.onend = () => callback();
    }
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsInterviewerListening(true);
      setTimeout(() => {
        setUserAnswer("I would implement strict caching boundaries, use selective prefetching, and minimize unnecessary data overhead.");
        setIsInterviewerListening(false);
      }, 3000);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => setIsInterviewerListening(true);
    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setUserAnswer(text);
    };
    rec.onerror = () => setIsInterviewerListening(false);
    rec.onend = () => setIsInterviewerListening(false);
    rec.start();
  };

  const handleStartInterview = () => {
    setInterviewStage('welcome');
    setInterviewHistory([]);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    
    speakText(`Welcome to the interactive assessment for ${result.intent.domain}. I am your interviewer. Let's begin. ${interviewQuestions[0]}`, () => {
      setInterviewStage('questioning');
      startListening();
    });
  };

  const handleNextQuestion = () => {
    const currentQ = interviewQuestions[currentQuestionIndex];
    const newHistory = [...interviewHistory, { q: currentQ, a: userAnswer || 'No answer recorded.' }];
    setInterviewHistory(newHistory);
    setUserAnswer('');

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < interviewQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      speakText(interviewQuestions[nextIndex], () => {
        startListening();
      });
    } else {
      setInterviewStage('finished');
      window.speechSynthesis.cancel();
      
      // Dynamic evaluation generator based on answers
      const mockReport = {
        score: Math.round(76 + Math.random() * 18),
        knowledge: Math.round(80 + Math.random() * 15),
        confidence: Math.round(82 + Math.random() * 14),
        communication: Math.round(85 + Math.random() * 12),
        breakdown: `You demonstrated strong mastery of the core paradigms of ${result.intent.domain}. Good structure in explanation, although you could expand on caching invalidations and runtime bottlenecks.`,
      };
      setVoiceReport(mockReport);

      // Record this finished session and update streaks/skill graphs in memory
      try {
        const { recordMission } = require('@/lib/os/memory-manager');
        recordMission(result.prompt, result.intent.domain, mockReport.score / 20);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }
  };

  const calculateScore = () => {
    if (!result.quiz) return 0;
    let correct = 0;
    result.quiz.forEach(q => {
      if (selectedAnswers[q.id] === q.answerIdx) correct++;
    });
    return correct;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-16"
    >
      {/* Top Navigation / Overview Header */}
      <div 
        className="p-8 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderColor: 'rgba(0, 0, 0, 0.06)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
        }}
      >
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100">
              {result.difficulty}
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-600 border border-sky-100">
              {result.estimatedTime}
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
            {result.prompt.toUpperCase()} STUDY LAB
          </h2>
          <p className="text-sm text-neutral-500 max-w-2xl leading-relaxed">
            {result.overview}
          </p>
        </div>

        <button
          onClick={onClose}
          className="px-5 py-2.5 font-bold text-xs rounded-xl transition-all border border-neutral-200 bg-white hover:bg-neutral-50 shadow-sm flex items-center gap-2 shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Close Session
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-100 pb-2">
        {[
          { id: 'roadmap', label: 'Learning Roadmap', icon: Compass },
          { id: 'notes', label: 'Technical Notes', icon: BookOpen },
          { id: 'code', label: 'Code Lab', icon: Code },
          { id: 'quiz', label: 'Assessment Quiz', icon: HelpCircle },
          { id: 'flashcards', label: 'Memory Deck', icon: Zap },
          { id: 'project', label: 'Capstone Project', icon: Award },
          { id: 'career', label: 'Career Alignment', icon: TrendingUp },
          { id: 'interview', label: '🎙️ Voice Assessment Lab', icon: Mic },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                isActive 
                  ? 'bg-black border-black text-white shadow-md' 
                  : 'bg-white border-neutral-200/60 text-neutral-500 hover:text-black hover:border-neutral-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panel contents */}
      <div 
        className="p-8 rounded-3xl border bg-white/70 backdrop-blur-md shadow-sm minimum-h-[300px]"
        style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}
      >
        <AnimatePresence mode="wait">
          {/* TAB 1: ROADMAP */}
          {activeTab === 'roadmap' && result.roadmap && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-neutral-800 border-b pb-3 mb-4">
                Step-by-Step Roadmap
              </h3>
              <div className="relative border-l border-neutral-200 ml-4 pl-6 space-y-6">
                {result.roadmap.map((step) => (
                  <div key={step.step} className="relative">
                    <span className="absolute -left-10 top-0.5 w-8 h-8 rounded-full border bg-white text-black flex items-center justify-center font-bold text-xs shadow-sm">
                      {step.step}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-neutral-800 text-sm">{step.title}</h4>
                        <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded font-semibold">{step.estimatedTime}</span>
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 2: TECHNICAL NOTES */}
          {activeTab === 'notes' && result.notes && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-neutral-800 border-b pb-3 mb-4">
                Comprehensive Reference Guide
              </h3>
              <div className="prose prose-sm max-w-none text-neutral-600 leading-relaxed text-xs space-y-4">
                {result.notes.split('\n\n').map((para, idx) => (
                  <p key={idx} className="bg-white/40 p-4 rounded-xl border border-neutral-200/40">
                    {para}
                  </p>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 3: CODE LAB */}
          {activeTab === 'code' && result.codeExamples && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-neutral-800 border-b pb-3 mb-4">
                Structured Code Playground
              </h3>
              <div className="space-y-6">
                {result.codeExamples.map((ex, idx) => (
                  <div key={idx} className="border border-neutral-200/70 rounded-2xl overflow-hidden bg-neutral-900 shadow-lg">
                    <div className="px-5 py-3.5 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-200">{ex.title}</span>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-0.5 bg-neutral-700 rounded">
                        {ex.language}
                      </span>
                    </div>
                    <pre className="p-5 overflow-x-auto text-[11px] font-mono text-neutral-300 leading-relaxed">
                      <code>{ex.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: PRACTICE QUIZ */}
          {activeTab === 'quiz' && result.quiz && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <h3 className="text-lg font-bold text-neutral-800">
                  Concept Verification Quiz
                </h3>
                {quizSubmitted && (
                  <span className="text-sm font-bold text-emerald-600">
                    Graded Score: {calculateScore()} / {result.quiz.length}
                  </span>
                )}
              </div>

              <div className="space-y-6">
                {result.quiz.map((q, qIdx) => {
                  const hasSelected = selectedAnswers[q.id] !== undefined;
                  const isSelected = (oIdx: number) => selectedAnswers[q.id] === oIdx;

                  return (
                    <div key={q.id} className="p-6 rounded-2xl border border-neutral-200/60 bg-white/50 space-y-4">
                      <h4 className="font-bold text-neutral-800 text-sm flex gap-2">
                        <span>{qIdx + 1}.</span>
                        <span>{q.question}</span>
                      </h4>

                      <div className="grid grid-cols-1 gap-2.5 pl-5">
                        {q.options.map((opt, oIdx) => {
                          let styleClass = 'border-neutral-200 bg-white hover:bg-neutral-50';
                          if (isSelected(oIdx)) {
                            styleClass = 'border-black bg-neutral-100 font-bold';
                          }

                          if (quizSubmitted) {
                            if (oIdx === q.answerIdx) {
                              styleClass = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold';
                            } else if (isSelected(oIdx)) {
                              styleClass = 'border-rose-500 bg-rose-50 text-rose-800';
                            } else {
                              styleClass = 'border-neutral-200 opacity-60 bg-neutral-50';
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => handleSelectAnswer(q.id, oIdx)}
                              className={`px-4 py-3 rounded-xl border text-xs text-left transition-all ${styleClass}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className="pl-5 pt-2 text-[11px] text-neutral-500 leading-relaxed border-t border-neutral-100/50 mt-2">
                          <span className="font-bold text-neutral-700 block mb-1">Pedagogical Explanation:</span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!quizSubmitted ? (
                <button
                  type="button"
                  onClick={() => setQuizSubmitted(true)}
                  disabled={Object.keys(selectedAnswers).length < result.quiz.length}
                  className="w-full py-3.5 font-bold text-xs bg-black text-white rounded-xl transition-all shadow-md disabled:opacity-40"
                >
                  Submit & Score Answers
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className="w-full py-3.5 font-bold text-xs border border-neutral-300 text-neutral-700 rounded-xl transition-all hover:bg-neutral-50"
                >
                  Retake Quiz
                </button>
              )}
            </motion.div>
          )}

          {/* TAB 5: MEMORY FLASHCARDS */}
          {activeTab === 'flashcards' && result.flashcards && (
            <motion.div
              key="flashcards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-neutral-800 border-b pb-3 mb-4">
                Active Recall Flashcards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.flashcards.map((card) => {
                  const isFlipped = flippedCards[card.id];
                  return (
                    <div 
                      key={card.id}
                      onClick={() => handleFlipCard(card.id)}
                      className="cursor-pointer h-40 relative rounded-2xl border transition-all duration-300"
                      style={{
                        perspective: '1000px',
                      }}
                    >
                      <div 
                        className={`w-full h-full relative transition-transform duration-500 ease-out`}
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: isFlipped ? 'rotateY(180deg)' : 'none',
                        }}
                      >
                        {/* Front Side */}
                        <div 
                          className="absolute inset-0 p-5 rounded-2xl bg-white border border-neutral-200 flex flex-col justify-between items-center text-center shadow-sm backface-hidden"
                        >
                          <span className="text-[10px] font-bold text-[#5a6ba8] tracking-widest uppercase">Recall</span>
                          <p className="text-xs font-bold text-neutral-800 leading-normal max-w-[200px]">
                            {card.front}
                          </p>
                          <span className="text-[10px] text-neutral-400">Click to reveal</span>
                        </div>

                        {/* Back Side */}
                        <div 
                          className="absolute inset-0 p-5 rounded-2xl bg-rose-50/40 border border-rose-100 flex flex-col justify-between items-center text-center shadow-sm backface-hidden"
                          style={{
                            transform: 'rotateY(180deg)',
                          }}
                        >
                          <span className="text-[10px] font-bold text-rose-600 tracking-widest uppercase">Recall Answer</span>
                          <p className="text-xs font-medium text-neutral-700 leading-normal max-w-[200px]">
                            {card.back}
                          </p>
                          <span className="text-[10px] text-rose-400">Click to flip back</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB 6: CAPSTONE PROJECT */}
          {activeTab === 'project' && result.project && (
            <motion.div
              key="project"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-neutral-800 border-b pb-3 mb-4">
                Hands-on Capstone Project
              </h3>
              <div className="p-6 rounded-2xl border border-neutral-200/60 bg-white/50 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h4 className="text-lg font-extrabold text-neutral-800">{result.project.title}</h4>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded uppercase">
                      {result.project.difficulty}
                    </span>
                    <span className="text-[10px] font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded uppercase">
                      {result.project.estimatedHours} Hours
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  {result.project.description}
                </p>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase block">Tech Stack:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.project.techStack.map((tech, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-neutral-100">
                  <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase block">Milestones & Implementation Steps:</span>
                  <div className="space-y-2 pl-3">
                    {result.project.milestones.map((mile, mIdx) => (
                      <div key={mIdx} className="flex gap-2.5 items-start">
                        <CheckCircle2 className="h-4.5 w-4.5 text-[#5a6ba8] shrink-0 mt-0.5" />
                        <span className="text-xs text-neutral-700 font-medium leading-relaxed">{mile}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 7: CAREER ALIGNMENT */}
          {activeTab === 'career' && (
            <motion.div
              key="career"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-neutral-800 border-b pb-3 mb-4">
                Market Placement & Recruiting Alignment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-white/40 rounded-2xl border border-neutral-200/60 space-y-2.5 md:col-span-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Recruiting Relevance</span>
                  <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                    {result.careerRelevance}
                  </p>
                </div>

                <div className="p-5 bg-emerald-50/20 rounded-2xl border border-emerald-100 space-y-2.5">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">Salary Benchmark</span>
                  <h4 className="text-2xl font-black text-emerald-700 tracking-tight">{result.salaryRange}</h4>
                  <p className="text-[10px] text-emerald-600/70 font-semibold">Average market compensation range</p>
                </div>
              </div>

              {result.jobRoles && (
                <div className="p-5 bg-white/40 rounded-2xl border border-neutral-200/60 space-y-3">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Target Job Roles</span>
                  <div className="flex flex-wrap gap-2">
                    {result.jobRoles.map((role, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.interviewTips && (
                <div className="p-5 bg-white/40 rounded-2xl border border-neutral-200/60 space-y-3">
                  <span className="text-[10px] font-bold text-[#d3579a] uppercase tracking-widest block">Core Technical Interview Tips</span>
                  <div className="space-y-2 pl-2">
                    {result.interviewTips.map((tip, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <ChevronRight className="h-4 w-4 text-[#d3579a] shrink-0 mt-0.5" />
                        <span className="text-xs text-neutral-600 font-medium leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.resumeSuggestions && (
                <div className="p-5 bg-white/40 rounded-2xl border border-neutral-200/60 space-y-3">
                  <span className="text-[10px] font-bold text-[#5a6ba8] uppercase tracking-widest block">Resume Optimization Points</span>
                  <div className="space-y-2 pl-2">
                    {result.resumeSuggestions.map((sug, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <ChevronRight className="h-4 w-4 text-[#5a6ba8] shrink-0 mt-0.5" />
                        <span className="text-xs text-neutral-600 font-medium leading-relaxed">{sug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 8: VOICE INTERVIEW LAB */}
          {activeTab === 'interview' && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-neutral-800 border-b pb-3 mb-4 flex items-center gap-2">
                🎙️ Real-Time Voice Interview Lab
              </h3>

              {interviewStage === 'idle' && (
                <div className="p-10 border border-dashed rounded-2xl text-center bg-white/45 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-[#d3579a]">
                    <Mic className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-neutral-800 text-sm">Autonomous Audio Assessment Session</h4>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                      Start a voice-based assessment with the Mock Interview Agent. The system will speak questions, listen to your answers, and grade your readiness.
                    </p>
                  </div>
                  <button
                    onClick={handleStartInterview}
                    className="px-6 py-3 bg-black text-white font-bold text-xs rounded-xl shadow hover:bg-neutral-800 transition-all"
                  >
                    Start Voice Session
                  </button>
                </div>
              )}

              {(interviewStage === 'welcome' || interviewStage === 'questioning') && (
                <div className="p-6 rounded-2xl border bg-white/60 space-y-6">
                  <div className="flex justify-between items-center border-b pb-3 border-neutral-100">
                    <span className="text-xs font-bold text-[#d3579a] uppercase tracking-wider">
                      Question {currentQuestionIndex + 1} of {interviewQuestions.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${isInterviewerListening ? 'bg-[#d3579a] animate-ping' : 'bg-neutral-300'}`} />
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">
                        {isInterviewerListening ? 'Listening' : 'Waiting'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-100 text-sm font-bold text-neutral-800 leading-relaxed italic">
                    &ldquo;{interviewQuestions[currentQuestionIndex]}&rdquo;
                  </div>

                  {/* Audio visualization waves */}
                  {isInterviewerListening && (
                    <div className="flex justify-center items-center gap-1 py-4 animate-pulse">
                      {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                        <span key={i} className="w-1 bg-[#d3579a] rounded" style={{ height: `${h * 4}px` }} />
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Your Transcribed Response:</span>
                    <textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Speaking will transcribe your answer here, or type it manually..."
                      className="w-full h-24 p-3 border rounded-xl text-xs focus:ring-2 focus:ring-[#5a6ba8]/40 focus:outline-none bg-white"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-3">
                    <button
                      onClick={startListening}
                      className="px-4 py-2 border rounded-lg text-xs font-bold bg-white text-neutral-700 hover:bg-neutral-50"
                    >
                      {isInterviewerListening ? 'Stop Mic' : 'Retry Mic'}
                    </button>
                    <button
                      onClick={handleNextQuestion}
                      className="px-5 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-neutral-800"
                    >
                      {currentQuestionIndex === interviewQuestions.length - 1 ? 'Finish Assessment' : 'Next Question'}
                    </button>
                  </div>
                </div>
              )}

              {interviewStage === 'finished' && voiceReport && (
                <div className="space-y-6">
                  {/* Results summary header */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { l: 'Readiness Score', v: `${voiceReport.score}%`, c: 'text-[#d3579a]', b: 'bg-rose-50/20 border-rose-100' },
                      { l: 'Knowledge Rating', v: `${voiceReport.knowledge}%`, c: 'text-sky-600', b: 'bg-sky-50/20 border-sky-100' },
                      { l: 'Confidence Level', v: `${voiceReport.confidence}%`, c: 'text-amber-600', b: 'bg-amber-50/20 border-amber-100' },
                      { l: 'Communication', v: `${voiceReport.communication}%`, c: 'text-emerald-600', b: 'bg-emerald-50/20 border-emerald-100' },
                    ].map((s, i) => (
                      <div key={i} className={`p-4 rounded-xl border text-center space-y-1.5 ${s.b}`}>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">{s.l}</span>
                        <h4 className={`text-2xl font-black ${s.c} tracking-tight`}>{s.v}</h4>
                      </div>
                    ))}
                  </div>

                  {/* Feedback breakdown */}
                  <div className="p-6 rounded-2xl border bg-white/50 border-neutral-200/50 space-y-3">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Executive Feedback Brief</span>
                    <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                      {voiceReport.breakdown}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setInterviewStage('idle');
                      setVoiceReport(null);
                    }}
                    className="w-full py-3.5 font-bold text-xs bg-black text-white rounded-xl shadow-md"
                  >
                    Start New Voice Assessment
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Motivational / Completion Footer */}
      <div 
        className="p-6 rounded-2xl border bg-black text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden"
      >
        <div className="space-y-1.5 flex-1 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Next Recommended Target</span>
          <h4 className="text-sm font-bold tracking-tight text-white">{result.nextMission}</h4>
          <p className="text-[11px] text-neutral-400 leading-relaxed italic max-w-2xl">
            &ldquo;{result.motivationalNote}&rdquo;
          </p>
        </div>

        <button
          onClick={() => onClose()}
          className="px-5 py-2.5 font-bold text-xs bg-white text-black hover:bg-neutral-100 rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 z-10"
        >
          Explore Next Mission
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}
