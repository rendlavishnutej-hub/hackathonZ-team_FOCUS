'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, Code, Award, CheckCircle, HelpCircle, 
  ArrowLeft, Copy, Check, RefreshCw, Sparkles, Loader2
} from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

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
  secondaryContainer: '#fcdf46',
  inverseSurface: '#32302c',
};

interface CourseClientProps {
  courseId: string;
}

export default function CourseClient({ courseId }: CourseClientProps) {
  const router = useRouter();
  const [course, setCourse] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('focus_courses');
      if (stored) {
        const list = JSON.parse(stored);
        const match = list.find((c: any) => c.id === courseId) || null;
        setCourse(match);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  const [activeTab, setActiveTab] = useState<'lesson-1' | 'lesson-2' | 'lesson-3' | 'quiz'>('lesson-1');
  const [copied, setCopied] = useState<string | null>(null);

  // Quiz state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizPassed, setQuizPassed] = useState<boolean | null>(null);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-24 animate-pulse">
        <div className="h-12 w-12 rounded-2xl bg-zinc-100 border animate-spin mx-auto flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-black animate-spin" />
        </div>
        <p className="text-xs text-zinc-500 font-mono">Loading dynamic study notes workspace...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-16">
        <div
          className="h-14 w-14 rounded-3xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: C.surfaceContainerLowest, border: `1px solid ${C.surfaceVariant}`, color: '#dc2626' }}
        >
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold" style={{ color: C.primary }}>Course Workspace Not Found</h2>
          <p className="text-xs" style={{ color: C.outline }}>
            The requested course session key is either invalid or expired on this client.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors hover:opacity-80"
          style={{ backgroundColor: C.surfaceContainerLowest, border: `1px solid ${C.surfaceVariant}`, color: C.onSurface }}
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
          className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-70"
          style={{ color: C.outline }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {course.completed && (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669' }}
          >
            <Sparkles className="h-3 w-3 animate-pulse" />
            Graduated Syllabus Workspace
          </div>
        )}
      </div>

      {/* Main Course Title */}
      <div className="space-y-2 pb-6" style={{ borderBottom: `1px solid ${C.surfaceVariant}` }}>
        <h1 className="font-display text-3xl sm:text-5xl tracking-wide uppercase leading-none" style={{ color: C.primary }}>
          {course.title}
        </h1>
        <p className="text-sm font-body max-w-2xl leading-relaxed" style={{ color: C.onSurfaceVariant }}>
          {course.description}
        </p>
      </div>

      {/* Tabs Selector */}
      <div
        className="flex p-[2px] rounded-xl max-w-md"
        style={{ backgroundColor: C.surfaceContainerLow, border: `1px solid ${C.surfaceVariant}` }}
      >
        {['lesson-1', 'lesson-2', 'lesson-3', 'quiz'].map((tab) => {
          const isActive = activeTab === tab;
          let label = `Lesson ${tab.split('-')[1]}`;
          if (tab === 'quiz') label = 'Final Quiz';

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className="flex-1 text-center py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
              style={
                isActive
                  ? { backgroundColor: C.surfaceContainerLowest, color: '#5a6ba8', border: `1px solid ${C.surfaceVariant}` }
                  : { color: C.outline, backgroundColor: 'transparent', border: '1px solid transparent' }
              }
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
              <h2 className="font-display text-xl sm:text-2xl tracking-wide uppercase" style={{ color: C.primary }}>
                {activeContent.lesson.title}
              </h2>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: C.onSurfaceVariant }}>
                {activeContent.lesson.description}
              </p>
              <div
                className="text-sm font-body leading-relaxed space-y-4 pt-2"
                style={{ borderTop: `1px solid ${C.surfaceVariant}`, color: C.onSurface }}
              >
                {activeContent.theory}
              </div>
            </div>

            {/* Code Exercises half */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-widest block" style={{ color: C.outline }}>
                Code exercise &amp; syntax
              </span>
              <div
                className="rounded-2xl overflow-hidden shadow-lg"
                style={{ backgroundColor: C.surfaceContainerHigh, border: `1px solid ${C.surfaceVariant}` }}
              >
                {/* Editor Header */}
                <div
                  className="px-4 py-2 flex justify-between items-center text-[10px] font-mono"
                  style={{ backgroundColor: C.surfaceContainerHigh, borderBottom: `1px solid ${C.surfaceVariant}`, color: C.outline }}
                >
                  <span>workspace.{activeContent.language}</span>
                  <button
                    onClick={() => handleCopyCode(activeContent.code, activeTab)}
                    className="flex items-center gap-1 transition-colors hover:opacity-70"
                    style={{ color: C.onSurfaceVariant }}
                  >
                    {copied === activeTab ? (
                      <>
                        <Check className="h-3 w-3" style={{ color: '#059669' }} />
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
                <pre
                  className="p-4 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-[300px]"
                  style={{ backgroundColor: C.inverseSurface, color: '#e8e6e1' }}
                >
                  <code>{activeContent.code}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="max-w-2xl space-y-6">
            <div className="space-y-1.5">
              <h2 className="font-display text-xl sm:text-2xl tracking-wide uppercase" style={{ color: C.primary }}>
                Graduation Challenge
              </h2>
              <p className="text-xs font-body" style={{ color: C.onSurfaceVariant }}>
                Answer all 3 questions correctly to complete the syllabus and earn your course graduation badge.
              </p>
            </div>

            {/* Success Card */}
            {quizSubmitted && quizPassed && (
              <div
                className="p-6 rounded-2xl space-y-3 text-center"
                style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}
              >
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center mx-auto"
                  style={{ backgroundColor: '#d1fae5', border: '1px solid #a7f3d0', color: '#059669' }}
                >
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold" style={{ color: C.primary }}>Syllabus Graduation Unlocked!</h3>
                  <p className="text-xs" style={{ color: C.onSurfaceVariant }}>
                    Perfect score! You completed all lessons and successfully verified your curriculum metrics.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="mt-2 px-4 py-2 font-bold text-xs rounded-xl shadow-md"
                  style={{ backgroundColor: C.primary, color: C.onPrimary }}
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
                    className="p-6 rounded-2xl space-y-4"
                    style={{ backgroundColor: C.surfaceContainerLowest, border: `1px solid ${C.surfaceVariant}` }}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-xs mt-0.5" style={{ color: C.outline }}>{qIdx + 1}.</span>
                      <p className="text-sm font-semibold leading-relaxed" style={{ color: C.primary }}>{q.question}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 pl-6">
                      {q.options.map((opt: string, optIdx: number) => {
                        const isSelected = selectedOpt === optIdx;
                        let optStyle: React.CSSProperties = {
                          border: `1px solid ${C.surfaceVariant}`,
                          backgroundColor: C.surfaceContainerLow,
                          color: C.onSurfaceVariant,
                        };

                        if (isSelected) {
                          optStyle = {
                            border: `1px solid ${C.accentBlue}`,
                            backgroundColor: '#eef1f8',
                            color: C.primary,
                            fontWeight: 600,
                          };
                        }

                        if (quizSubmitted) {
                          if (optIdx === q.answerIdx) {
                            optStyle = {
                              border: '1px solid #a7f3d0',
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              fontWeight: 600,
                            };
                          } else if (isSelected && !isCorrect) {
                            optStyle = {
                              border: '1px solid #fecaca',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                            };
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            disabled={quizSubmitted}
                            className="text-left p-3.5 rounded-xl text-xs transition-all flex items-center justify-between"
                            style={optStyle}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && optIdx === q.answerIdx && (
                              <span style={{ color: '#059669', fontWeight: 'bold' }}>✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanatory feedback if wrong */}
                    {quizSubmitted && !isCorrect && (
                      <div
                        className="p-3.5 rounded-xl text-[11px] pl-6 leading-relaxed"
                        style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: C.onSurfaceVariant }}
                      >
                        <span style={{ color: '#dc2626', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Explanatory Note:</span>
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
                  className="px-6 py-2.5 font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
                  style={{ backgroundColor: C.primary, color: C.onPrimary }}
                >
                  Submit Challenge
                </button>
              ) : (
                !quizPassed && (
                  <button
                    onClick={handleRetryQuiz}
                    className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold rounded-xl transition-all hover:opacity-80"
                    style={{ backgroundColor: C.surfaceContainerLowest, border: `1px solid ${C.surfaceVariant}`, color: C.onSurface }}
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
