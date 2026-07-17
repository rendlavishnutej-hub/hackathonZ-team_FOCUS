// ============================================================
// Knowledge Graph Agent
// ============================================================
// Maintains a per-session topic mastery map. After each
// evaluation, we update which topics the candidate knows,
// their confidence level, and any mistakes made.
// ============================================================

import type { KnowledgeGraph, TopicNode, EvaluationResult } from '@/lib/interview/types';

/**
 * Creates an empty knowledge graph.
 */
export function createKnowledgeGraph(): KnowledgeGraph {
  return {};
}

/**
 * Updates the knowledge graph after a question has been evaluated.
 * Merges new topic data with existing nodes.
 */
export function updateKnowledgeGraph(
  graph: KnowledgeGraph,
  evaluation: EvaluationResult,
  questionIndex: number
): KnowledgeGraph {
  const updated = { ...graph };

  for (const topic of evaluation.topicsCovered) {
    const key = topic.toLowerCase().trim();
    const existing = updated[key];

    if (existing) {
      // Merge with existing node
      const newConfidence = Math.round(
        (existing.confidence * existing.timesAsked + evaluation.score) /
        (existing.timesAsked + 1)
      );
      updated[key] = {
        ...existing,
        known: newConfidence >= 60,
        confidence: newConfidence,
        timesAsked: existing.timesAsked + 1,
        lastSeenAt: questionIndex,
        mistakesMade: evaluation.score < 60
          ? [...existing.mistakesMade, evaluation.feedback.slice(0, 120)]
          : existing.mistakesMade,
      };
    } else {
      // Create new node
      updated[key] = {
        topic: key,
        known: evaluation.score >= 60,
        confidence: evaluation.score,
        timesAsked: 1,
        mistakesMade: evaluation.score < 60
          ? [evaluation.feedback.slice(0, 120)]
          : [],
        lastSeenAt: questionIndex,
      };
    }
  }

  return updated;
}

/**
 * Returns topics the candidate is strong in (confidence ≥ 75).
 */
export function getStrongTopics(graph: KnowledgeGraph): string[] {
  return Object.values(graph)
    .filter((n: TopicNode) => n.confidence >= 75)
    .sort((a: TopicNode, b: TopicNode) => b.confidence - a.confidence)
    .map((n: TopicNode) => n.topic);
}

/**
 * Returns topics the candidate is weak in (confidence < 60).
 */
export function getWeakTopics(graph: KnowledgeGraph): string[] {
  return Object.values(graph)
    .filter((n: TopicNode) => n.confidence < 60)
    .sort((a: TopicNode, b: TopicNode) => a.confidence - b.confidence)
    .map((n: TopicNode) => n.topic);
}

/**
 * Returns topics that haven't been asked about yet (for question diversity).
 */
export function getUnexploredTopics(
  graph: KnowledgeGraph,
  allPriorityTopics: string[]
): string[] {
  const exploredKeys = new Set(Object.keys(graph));
  return allPriorityTopics.filter(
    (t) => !exploredKeys.has(t.toLowerCase().trim())
  );
}

/**
 * Builds a concise summary of the knowledge graph for LLM context injection.
 * Keeps output under 200 words to preserve context window budget.
 */
export function buildKnowledgeGraphSummary(graph: KnowledgeGraph): string {
  const nodes = Object.values(graph);
  if (nodes.length === 0) return 'No topics explored yet.';

  const strong = getStrongTopics(graph);
  const weak = getWeakTopics(graph);

  const parts: string[] = [];
  if (strong.length > 0) {
    parts.push(`Strong: ${strong.slice(0, 5).join(', ')}`);
  }
  if (weak.length > 0) {
    parts.push(`Weak: ${weak.slice(0, 5).join(', ')}`);
  }
  parts.push(`Topics explored: ${nodes.length}`);

  return parts.join(' | ');
}
