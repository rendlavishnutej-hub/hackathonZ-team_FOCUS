// ============================================================
// Evaluation Agent
// ============================================================
// Scores every candidate answer across 10 dimensions using
// the Gemini LLM. Returns structured EvaluationResult with
// per-dimension scores, feedback, and topic extraction.
// ============================================================

import { generateJSON } from '@/lib/gemini';
import type { EvaluationResult, CompanyProfile } from '@/lib/interview/types';

// ─── Fallback Evaluation ─────────────────────────────────────
function buildFallbackEvaluation(answer: string): EvaluationResult {
  const len = answer.trim().length;
  const base = len > 200 ? 65 : len > 100 ? 55 : 45;
  return {
    score: base,
    communication: base + 5,
    technicalAccuracy: base - 5,
    confidence: base,
    grammar: base + 10,
    problemSolving: base - 5,
    depth: base - 10,
    clarity: base + 5,
    professionalism: base + 5,
    leadershipSignals: 30,
    feedback: 'Evaluation could not be completed by AI. Score based on response length heuristics.',
    topicsCovered: [],
    suggestedFollowUp: undefined,
  };
}

// ─── Main Evaluation Function ────────────────────────────────

/**
 * Evaluates a candidate's answer to an interview question.
 * Uses the company profile to weight evaluation criteria.
 */
export async function evaluateAnswer(
  question: string,
  answer: string,
  role: string,
  difficulty: string,
  companyProfile?: CompanyProfile,
  conversationContext?: string
): Promise<EvaluationResult> {
  const fallback = buildFallbackEvaluation(answer);

  if (!answer || answer.trim().length < 10) {
    return {
      ...fallback,
      score: 10,
      feedback: 'The candidate provided an extremely brief or empty response.',
      topicsCovered: [],
    };
  }

  const isGeminiAvailable = !!process.env.GEMINI_API_KEY;
  if (!isGeminiAvailable) return fallback;

  const companyContext = companyProfile
    ? `Company: ${companyProfile.name}. Interview Style: ${companyProfile.interviewStyle}. Evaluation Weights: Technical=${companyProfile.evaluationWeights.technical}%, Behavioral=${companyProfile.evaluationWeights.behavioral}%, Communication=${companyProfile.evaluationWeights.communication}%, Leadership=${companyProfile.evaluationWeights.leadership}%, Problem Solving=${companyProfile.evaluationWeights.problemSolving}%.`
    : 'General interview context.';

  const historyNote = conversationContext
    ? `\nPrevious conversation context:\n${conversationContext}`
    : '';

  const prompt = `You are the Evaluation Agent for a production-grade AI interview system.

CONTEXT:
- Role: ${role}
- Difficulty: ${difficulty}
- ${companyContext}${historyNote}

QUESTION ASKED:
"${question}"

CANDIDATE'S ANSWER:
"${answer}"

TASK: Evaluate this answer and return a JSON object with EXACTLY this structure:
{
  "score": <number 0-100, overall weighted score>,
  "communication": <number 0-100>,
  "technicalAccuracy": <number 0-100>,
  "confidence": <number 0-100, inferred from tone and assertiveness>,
  "grammar": <number 0-100>,
  "problemSolving": <number 0-100>,
  "depth": <number 0-100, how deeply did they explore the topic>,
  "clarity": <number 0-100, how clearly was the answer structured>,
  "professionalism": <number 0-100>,
  "leadershipSignals": <number 0-100, did they mention leading, owning, mentoring, influencing>,
  "feedback": "<2-3 sentences of constructive feedback. Be specific about what was good and what was missing. Reference the ${companyProfile?.name || 'company'} evaluation bar.>",
  "topicsCovered": ["topic1", "topic2", ...],
  "suggestedFollowUp": "<optional: a probing follow-up question if the answer was shallow or interesting>"
}

SCORING RULES:
- 90-100: Exceptional. Would impress a Staff+ engineer.
- 75-89: Strong. Clear hire signal.
- 60-74: Adequate. Mixed signals, some gaps.
- 40-59: Below bar. Significant gaps in expected knowledge.
- 0-39: Poor. Fundamental misunderstanding or off-topic.

- For ${difficulty} difficulty, calibrate expectations accordingly.
  - Beginner: basic understanding is sufficient for 70+
  - Medium: expects working knowledge and some depth
  - Senior: expects deep expertise, trade-off analysis, and real-world experience
  - Expert: expects Staff/Principal-level insight, architecture vision, mentoring signals

- topicsCovered: extract 2-5 technical topics mentioned in the answer (lowercase).
- feedback: be direct but constructive. Reference specific parts of the answer.`;

  const result = await generateJSON<EvaluationResult>(prompt, fallback);

  // Clamp all scores to valid range
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v || 0)));

  return {
    score: clamp(result.score),
    communication: clamp(result.communication),
    technicalAccuracy: clamp(result.technicalAccuracy),
    confidence: clamp(result.confidence),
    grammar: clamp(result.grammar),
    problemSolving: clamp(result.problemSolving),
    depth: clamp(result.depth),
    clarity: clamp(result.clarity),
    professionalism: clamp(result.professionalism),
    leadershipSignals: clamp(result.leadershipSignals),
    feedback: result.feedback || fallback.feedback,
    topicsCovered: Array.isArray(result.topicsCovered)
      ? result.topicsCovered.map((t: string) => String(t).toLowerCase().trim()).filter(Boolean)
      : [],
    suggestedFollowUp: result.suggestedFollowUp || undefined,
  };
}
