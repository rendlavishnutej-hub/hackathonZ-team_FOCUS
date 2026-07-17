'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Play, Loader2, Timer, Zap, BookOpen, Target } from 'lucide-react';
import type { Subject, Topic, Difficulty } from '@/lib/quiz/types';

interface QuizConfigFormProps {
  userId: string;
}

const difficulties: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: '#3DD68C' },
  { value: 'medium', label: 'Medium', color: '#F5B942' },
  { value: 'hard', label: 'Hard', color: '#F1583D' },
];

export default function QuizConfigForm({ userId }: QuizConfigFormProps) {
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [fetchingSubjects, setFetchingSubjects] = useState(true);

  // Fetch subjects on mount
  useEffect(() => {
    fetch('/api/quiz/subjects')
      .then(r => r.json())
      .then(data => {
        setSubjects(data.subjects || []);
        setFetchingSubjects(false);
      })
      .catch(() => setFetchingSubjects(false));
  }, []);

  // Fetch topics when subject changes
  useEffect(() => {
    if (!selectedSubject) {
      setTopics([]);
      setSelectedTopic('');
      return;
    }
    fetch(`/api/quiz/topics?subjectId=${selectedSubject}`)
      .then(r => r.json())
      .then(data => {
        setTopics(data.topics || []);
        setSelectedTopic('');
      })
      .catch(() => setTopics([]));
  }, [selectedSubject]);

  const isValid = selectedSubject && selectedTopic && difficulty && questionCount >= 5 && questionCount <= 50;

  const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name || '';
  const selectedTopicName = topics.find(t => t.id === selectedTopic)?.name || '';

  const handleStart = async () => {
    if (!isValid) return;
    setLoading(true);

    const config = {
      subjectId: selectedSubject,
      subjectName: selectedSubjectName,
      topicId: selectedTopic,
      topicName: selectedTopicName,
      difficulty,
      questionCount,
      timerEnabled,
      timerDuration: timerEnabled ? timerMinutes * 60 : 0,
    };

    // Store config in sessionStorage for the take page to pick up
    sessionStorage.setItem('focus_quiz_config', JSON.stringify(config));
    router.push('/quiz/take');
  };

  return (
    <div className="max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-3xl border border-white/5 bg-[#13131A]/60 shadow-xl shadow-[#7C5CFF]/5 space-y-7"
      >
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#7C5CFF] to-[#22D3D0] p-[1px]">
            <div className="h-full w-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
              <Zap className="h-5 w-5 text-[#22D3D0]" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Configure Your Quiz</h2>
            <p className="text-xs text-zinc-500">Select subject, topic, and preferences below</p>
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 flex items-center gap-1.5">
            <BookOpen className="h-3 w-3" /> Subject
          </label>
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            disabled={fetchingSubjects}
            className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all appearance-none cursor-pointer"
          >
            <option value="">— Select subject —</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Topic */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 flex items-center gap-1.5">
            <Target className="h-3 w-3" /> Topic
          </label>
          <select
            value={selectedTopic}
            onChange={e => setSelectedTopic(e.target.value)}
            disabled={!selectedSubject || topics.length === 0}
            className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all appearance-none cursor-pointer disabled:opacity-40"
          >
            <option value="">— Select topic —</option>
            {topics.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
            Difficulty
          </label>
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
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
            Number of Questions: <span className="text-[#22D3D0]">{questionCount}</span>
          </label>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={questionCount}
            onChange={e => setQuestionCount(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-zinc-800 accent-[#7C5CFF] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>5</span>
            <span>30</span>
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
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                timerEnabled ? 'bg-[#7C5CFF]' : 'bg-zinc-800'
              }`}
            >
              <motion.div
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                animate={{ x: timerEnabled ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {timerEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3"
            >
              <input
                type="number"
                min={1}
                max={120}
                value={timerMinutes}
                onChange={e => setTimerMinutes(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                className="w-20 px-3 py-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-white text-sm text-center focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all"
              />
              <span className="text-xs text-zinc-500">minutes</span>
            </motion.div>
          )}
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!isValid || loading}
          className="w-full py-3.5 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] text-zinc-950 font-bold text-sm rounded-2xl hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C5CFF]/15 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Play className="h-4 w-4 fill-zinc-950" />
              Start Quiz
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
