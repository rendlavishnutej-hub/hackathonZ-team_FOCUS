// ============================================================
// Memory Agent
// ============================================================
// Builds a compact conversation context window for LLM calls.
// Prevents context overflow by keeping only the most relevant
// Q&A history + knowledge graph summary + candidate profile.
// ============================================================

import type { InterviewHistoryItem, CandidateProfile, KnowledgeGraph } from '@/lib/interview/types';
import { buildKnowledgeGraphSummary } from './knowledge-graph';

// ─── Configuration ───────────────────────────────────────────
const MAX_HISTORY_ITEMS = 4;       // keep last N Q&A pairs
const MAX_ANSWER_LENGTH = 300;     // truncate long answers
const MAX_CONTEXT_CHARS = 2000;    // hard cap on total context string

/**
 * Builds the conversation context window for the next LLM call.
 * Includes: recent Q&A history + knowledge graph summary + candidate profile.
 *
 * This is the "memory" that makes the interviewer remember
 * previous answers and ask intelligent follow-ups.
 */
export function buildConversationContext(
  history: InterviewHistoryItem[],
  knowledgeGraph?: KnowledgeGraph,
  candidateProfile?: CandidateProfile
): string {
  const parts: string[] = [];

  // 1. Recent Q&A History (most recent first, then reverse for chronological)
  const recentHistory = history.slice(-MAX_HISTORY_ITEMS);
  if (recentHistory.length > 0) {
    parts.push('=== Recent Conversation ===');
    for (const item of recentHistory) {
      const truncatedAnswer = item.answer.length > MAX_ANSWER_LENGTH
        ? item.answer.slice(0, MAX_ANSWER_LENGTH) + '...'
        : item.answer;
      const scoreNote = item.evaluation
        ? ` [Score: ${item.evaluation.score}/100]`
        : '';
      parts.push(`Q${item.questionIndex + 1}: ${item.question}`);
      parts.push(`A${item.questionIndex + 1}: ${truncatedAnswer}${scoreNote}`);
    }
  }

  // 2. Knowledge Graph Summary
  if (knowledgeGraph && Object.keys(knowledgeGraph).length > 0) {
    parts.push('=== Candidate Knowledge Map ===');
    parts.push(buildKnowledgeGraphSummary(knowledgeGraph));
  }

  // 3. Candidate Profile Summary
  if (candidateProfile) {
    parts.push('=== Candidate Profile ===');
    if (candidateProfile.strongTopics.length > 0) {
      parts.push(`Strengths: ${candidateProfile.strongTopics.slice(0, 5).join(', ')}`);
    }
    if (candidateProfile.weakTopics.length > 0) {
      parts.push(`Gaps: ${candidateProfile.weakTopics.slice(0, 5).join(', ')}`);
    }
    if (candidateProfile.resumeProfile) {
      parts.push(`Background: ${candidateProfile.resumeProfile.summary}`);
    }
    if (candidateProfile.confidenceTrend.length > 0) {
      const avg = Math.round(
        candidateProfile.confidenceTrend.reduce((a, b) => a + b, 0) /
        candidateProfile.confidenceTrend.length
      );
      parts.push(`Avg confidence: ${avg}/100`);
    }
  }

  // 4. Enforce hard cap
  let context = parts.join('\n');
  if (context.length > MAX_CONTEXT_CHARS) {
    context = context.slice(0, MAX_CONTEXT_CHARS) + '\n[...context truncated]';
  }

  return context;
}

/**
 * Extracts all questions asked so far (for dedup / hash checking).
 */
export function getAskedQuestions(history: InterviewHistoryItem[]): string[] {
  return history.map((item) => item.question);
}

/**
 * Computes a simple hash of a question string for dedup.
 * Not cryptographic — just avoids asking the exact same question twice.
 */
export function hashQuestion(question: string): string {
  const normalized = question.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  // Simple FNV-1a-like hash
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(36);
}
