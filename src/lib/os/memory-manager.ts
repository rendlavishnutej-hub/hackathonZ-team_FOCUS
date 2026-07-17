import type { UserMemory } from './types';

const MEMORY_KEY = 'focus_os_user_memory';

function defaultMemory(): UserMemory {
  return {
    learningHistory: [],
    weakConcepts: [],
    strongConcepts: [],
    preferredStyle: 'mixed',
    completedQuizzes: [],
    interviewHistory: [],
    previousPrompts: [],
    totalHours: 0,
    currentStreak: 0,
    lastActive: new Date().toISOString(),
  };
}

// ─── Server-safe memory manager ───────────────────────────────────────────────
// NOTE: localStorage is only available on the client side.
// These functions are designed to be called from client components.

export function loadMemory(): UserMemory {
  if (typeof window === 'undefined') return defaultMemory();
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return defaultMemory();
    return { ...defaultMemory(), ...JSON.parse(raw) };
  } catch {
    return defaultMemory();
  }
}

export function saveMemory(memory: UserMemory): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch {
    console.warn('[FOCUS OS] Failed to save user memory');
  }
}

export function recordMission(prompt: string, topic: string, quizScore?: number): void {
  const memory = loadMemory();

  // Update history (cap at 50 entries)
  memory.previousPrompts = [prompt, ...memory.previousPrompts].slice(0, 50);
  if (!memory.learningHistory.includes(topic)) {
    memory.learningHistory = [topic, ...memory.learningHistory].slice(0, 100);
  }

  // Update hours (rough estimate: 30min per mission)
  memory.totalHours = Math.round((memory.totalHours + 0.5) * 10) / 10;

  // Update streak
  const today = new Date().toDateString();
  const lastActive = memory.lastActive ? new Date(memory.lastActive).toDateString() : null;
  if (lastActive !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    memory.currentStreak = lastActive === yesterday.toDateString() ? memory.currentStreak + 1 : 1;
  }

  memory.lastActive = new Date().toISOString();

  if (quizScore !== undefined) {
    memory.completedQuizzes = [topic, ...memory.completedQuizzes].slice(0, 50);
  }

  saveMemory(memory);
}

export function serializeMemoryForPrompt(memory: UserMemory): string {
  return `User has previously studied: ${memory.learningHistory.slice(0, 5).join(', ') || 'nothing yet'}.
Strong areas: ${memory.strongConcepts.slice(0, 3).join(', ') || 'not assessed yet'}.
Weak areas: ${memory.weakConcepts.slice(0, 3).join(', ') || 'not assessed yet'}.
Learning style: ${memory.preferredStyle}.
Total learning hours: ${memory.totalHours}.`;
}
