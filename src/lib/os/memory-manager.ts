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
    skillGraph: {},
    learningGraph: [],
    weaknessGraph: [],
    interviewGraph: {},
    careerGraph: [],
    knowledgeGraph: {},
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
    const parsed = JSON.parse(raw);
    return {
      ...defaultMemory(),
      ...parsed,
      skillGraph: parsed.skillGraph || {},
      learningGraph: parsed.learningGraph || [],
      weaknessGraph: parsed.weaknessGraph || [],
      interviewGraph: parsed.interviewGraph || {},
      careerGraph: parsed.careerGraph || [],
      knowledgeGraph: parsed.knowledgeGraph || {},
    };
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
    memory.learningGraph = [...memory.learningGraph, topic].slice(0, 50);
  }

  // Initialize skill score if not present
  if (memory.skillGraph[topic] === undefined) {
    memory.skillGraph[topic] = 50;
  }

  // Populate dynamic knowledge graph relationships
  if (!memory.knowledgeGraph[topic]) {
    memory.knowledgeGraph[topic] = [
      'Core Mechanics',
      'Advanced Architecture',
      'Production Testing'
    ];
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

  // Handle quiz scores and skill upgrades
  if (quizScore !== undefined) {
    memory.completedQuizzes = [topic, ...memory.completedQuizzes].slice(0, 50);
    const scorePercentage = Math.round(quizScore * 20); // assuming score is 0-5 scaled to 0-100
    memory.skillGraph[topic] = scorePercentage;

    if (scorePercentage >= 80) {
      if (!memory.strongConcepts.includes(topic)) {
        memory.strongConcepts = [...memory.strongConcepts, topic];
      }
      memory.weakConcepts = memory.weakConcepts.filter(t => t !== topic);
      memory.weaknessGraph = memory.weaknessGraph.filter(t => t !== topic);
    } else {
      if (!memory.weakConcepts.includes(topic)) {
        memory.weakConcepts = [...memory.weakConcepts, topic];
      }
      if (!memory.weaknessGraph.includes(topic)) {
        memory.weaknessGraph = [...memory.weaknessGraph, topic];
      }
      memory.strongConcepts = memory.strongConcepts.filter(t => t !== topic);
    }

    // Career matching heuristics
    const lowerTopic = topic.toLowerCase();
    if (lowerTopic.includes('google') || lowerTopic.includes('interview') || lowerTopic.includes('sde')) {
      memory.interviewGraph[topic] = scorePercentage;
      if (!memory.careerGraph.includes('Software Engineer')) {
        memory.careerGraph.push('Software Engineer');
      }
    }
    if (lowerTopic.includes('react') || lowerTopic.includes('frontend') || lowerTopic.includes('next.js')) {
      if (!memory.careerGraph.includes('Frontend Developer')) {
        memory.careerGraph.push('Frontend Developer');
      }
    }
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
