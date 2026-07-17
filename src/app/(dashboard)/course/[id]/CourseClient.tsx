'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, Code, Award, CheckCircle, HelpCircle, 
  ArrowLeft, Copy, Check, RefreshCw, Sparkles 
} from 'lucide-react';

interface CourseClientProps {
  courseId: string;
}

export default function CourseClient({ courseId }: CourseClientProps) {
  const router = useRouter();
  const [course, setCourse] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'lesson-1' | 'lesson-2' | 'lesson-3' | 'quiz'>('lesson-1');
  const [copied, setCopied] = useState<string | null>(null);

  // Quiz state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizPassed, setQuizPassed] = useState<boolean | null>(null);

  // Load course from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('focus_courses');
      if (stored) {
        const list = JSON.parse(stored);
        const found = list.find((c: any) => c.id === courseId);
        if (found) {
          setCourse(found);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [courseId]);

  if (!course) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-16">
        <div className="h-14 w-14 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto text-red-400">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Course Workspace Not Found</h2>
          <p className="text-xs text-zinc-500">
            The requested course session key is either invalid or expired on this client.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    if (quizSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmitQuiz = () => {
    const questions = course.quiz.questions;
    let score = 0;
    
    questions.forEach((q: any) => {
      if (answers[q.id] === q.answerIdx) {
        score += 1;
      }
    });

    setQuizScore(score);
    const passed = score === questions.length; // 100% required
    setQuizPassed(passed);
    setQuizSubmitted(true);

    if (passed) {
      // Mark course as completed in localStorage
      try {
        const stored = localStorage.getItem('focus_courses');
        if (stored) {
          const list = JSON.parse(stored);
          const updated = list.map((c: any) => 
            c.id === courseId ? { ...c, completed: true } : c
          );
          localStorage.setItem('focus_courses', JSON.stringify(updated));
          // Update local state course reference
          setCourse({ ...course, completed: true });
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRetryQuiz = () => {
    setAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizPassed(null);
  };

  // Find active lesson contents
  const getActiveLessonContent = () => {
    const idx = activeTab === 'lesson-1' ? 0 : activeTab === 'lesson-2' ? 1 : 2;
    const lesson = course.syllabus.lessons[idx];
    const research = course.research.lessonContents.find((l: any) => l.lessonId === lesson.id);
    const codeSnippet = course.code.snippets.find((c: any) => c.lessonId === lesson.id);
    
    return {
      lesson,
      theory: research?.theory || 'No content research found.',
      code: codeSnippet?.code || '',
      language: codeSnippet?.language || 'typescript',
    };
  };

  const activeContent = activeTab !== 'quiz' ? getActiveLessonContent() : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 flex flex-col h-full">
      {/* Top breadcrumb & Status banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {course.completed && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#3DD68C]/10 border border-[#3DD68C]/20 rounded-full text-[#3DD68C] text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="h-3 w-3 animate-pulse" />
            Graduated Syllabus Workspace
          </div>
        )}
      </div>

      {/* Main Course Title */}
      <div className="space-y-2 border-b border-zinc-900 pb-6">
        <h1 className="font-display text-3xl sm:text-5xl tracking-wide uppercase text-white leading-none">
          {course.title}
        </h1>
        <p className="text-sm text-zinc-400 font-body max-w-2xl leading-relaxed">
          {course.description}
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-zinc-900 p-[2px] bg-zinc-950/60 rounded-xl max-w-md">
        {['lesson-1', 'lesson-2', 'lesson-3', 'quiz'].map((tab) => {
          const isActive = activeTab === tab;
          let label = `Lesson ${tab.split('-')[1]}`;
          if (tab === 'quiz') label = 'Final Quiz';

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 text-center py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-zinc-900 text-[#22D3D0] border border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div className="flex-1 space-y-6">
        {activeTab !== 'quiz' && activeContent && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Theory half */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="font-display text-xl sm:text-2xl tracking-wide uppercase text-white">
                {activeContent.lesson.title}
              </h2>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
                {activeContent.lesson.description}
              </p>
              <div className="text-sm text-zinc-300 font-body leading-relaxed space-y-4 pt-2 border-t border-zinc-900">
                {activeContent.theory}
              </div>
            </div>

            {/* Code Exercises half */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">
                Code exercise & syntax
              </span>
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-lg">
                {/* Editor Header */}
                <div className="bg-zinc-900/60 px-4 py-2 border-b border-zinc-900 flex justify-between items-center text-[10px] font-mono text-zinc-500">
                  <span>workspace.{activeContent.language}</span>
                  <button
                    onClick={() => handleCopyCode(activeContent.code, activeTab)}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {copied === activeTab ? (
                      <>
                        <Check className="h-3 w-3 text-[#3DD68C]" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                {/* Code Area */}
                <pre className="p-4 font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed max-h-[300px]">
                  <code>{activeContent.code}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="max-w-2xl space-y-6">
            <div className="space-y-1.5">
              <h2 className="font-display text-xl sm:text-2xl tracking-wide uppercase text-white">
                Graduation Challenge
              </h2>
              <p className="text-xs text-zinc-400 font-body">
                Answer all 3 questions correctly to complete the syllabus and earn your course graduation badge.
              </p>
            </div>

            {/* Success Card */}
            {quizSubmitted && quizPassed && (
              <div className="glass-panel p-6 rounded-2xl border border-[#3DD68C]/30 bg-[#3DD68C]/5 space-y-3 text-center">
                <div className="h-12 w-12 bg-[#3DD68C]/15 border border-[#3DD68C]/20 rounded-full flex items-center justify-center mx-auto text-[#3DD68C]">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Syllabus Graduation Unlocked!</h3>
                  <p className="text-xs text-zinc-400">
                    Perfect score! You completed all lessons and successfully verified your curriculum metrics.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="mt-2 px-4 py-2 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] text-zinc-950 font-bold text-xs rounded-xl shadow-md"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

            {/* Questions list */}
            <div className="space-y-6">
              {course.quiz.questions.map((q: any, qIdx: number) => {
                const selectedOpt = answers[q.id];
                const isCorrect = selectedOpt === q.answerIdx;
                
                return (
                  <div 
                    key={q.id}
                    className="bg-zinc-950/40 border border-zinc-900 p-6 rounded-2xl space-y-4"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-zinc-600 font-mono text-xs mt-0.5">{qIdx + 1}.</span>
                      <p className="text-sm font-semibold text-white leading-relaxed">{q.question}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 pl-6">
                      {q.options.map((opt: string, optIdx: number) => {
                        const isSelected = selectedOpt === optIdx;
                        let optBorder = 'border-zinc-900 bg-zinc-950/20';
                        let optText = 'text-zinc-400';

                        if (isSelected) {
                          optBorder = 'border-[#7C5CFF] bg-[#7C5CFF]/5';
                          optText = 'text-white font-semibold';
                        }

                        if (quizSubmitted) {
                          if (optIdx === q.answerIdx) {
                            optBorder = 'border-[#3DD68C] bg-[#3DD68C]/5';
                            optText = 'text-[#3DD68C] font-semibold';
                          } else if (isSelected && !isCorrect) {
                            optBorder = 'border-[#F1583D] bg-[#F1583D]/5';
                            optText = 'text-[#F1583D]';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            disabled={quizSubmitted}
                            className={`text-left p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between ${optBorder} ${optText}`}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && optIdx === q.answerIdx && (
                              <span className="text-[#3DD68C] font-bold">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanatory feedback if wrong */}
                    {quizSubmitted && !isCorrect && (
                      <div className="bg-[#F1583D]/5 border border-[#F1583D]/20 p-3.5 rounded-xl text-[11px] text-zinc-400 pl-6 leading-relaxed">
                        <span className="text-[#F1583D] font-bold uppercase block mb-1">Explanatory Note:</span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Action buttons */}
            <div className="flex justify-end pt-4">
              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(answers).length !== course.quiz.questions.length}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] text-zinc-950 font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  Submit Challenge
                </button>
              ) : (
                !quizPassed && (
                  <button
                    onClick={handleRetryQuiz}
                    className="flex items-center gap-1.5 px-6 py-2.5 border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all"
                  >
                    <RefreshCw className="h-4 w-4 animate-spin-slow" />
                    Retry Quiz
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// Import AlertTriangle manually
import { AlertTriangle } from 'lucide-react';
