// ============================================================
// Question Generator Agent (+ Follow-Up Engine)
// ============================================================
// Generates interview questions with full context awareness:
// role, company profile, knowledge graph, memory window,
// difficulty level. Decides between follow-up and new topic.
// ============================================================

import { generateJSON, generateText } from '@/lib/gemini';
import type { CompanyProfile, EvaluationResult, InterviewHistoryItem } from '@/lib/interview/types';
import { getDifficultyDescriptor } from './adaptive-difficulty';

// ─── Follow-Up Decision ──────────────────────────────────────

interface FollowUpDecision {
  shouldFollowUp: boolean;
  reason: string;
}

/**
 * Determines if the next question should be a follow-up based on
 * the candidate's last answer quality and topic depth.
 */
function decideFollowUp(
  lastEvaluation: EvaluationResult | undefined,
  followUpCount: number,
  maxFollowUps: number
): FollowUpDecision {
  // Don't follow up if we've already followed up too much
  if (followUpCount >= maxFollowUps) {
    return { shouldFollowUp: false, reason: 'max follow-ups reached' };
  }

  if (!lastEvaluation) {
    return { shouldFollowUp: false, reason: 'no evaluation available' };
  }

  // Follow up if the answer was shallow (depth < 55) but not terrible
  if (lastEvaluation.depth < 55 && lastEvaluation.score >= 35) {
    return { shouldFollowUp: true, reason: 'shallow answer, needs probing' };
  }

  // Follow up if there's a specific follow-up suggestion from evaluation
  if (lastEvaluation.suggestedFollowUp) {
    return { shouldFollowUp: true, reason: 'evaluator suggested follow-up' };
  }

  // Follow up if score is mid-range (interesting to probe further)
  if (lastEvaluation.score >= 55 && lastEvaluation.score <= 78) {
    return { shouldFollowUp: true, reason: 'mid-range score, interesting to explore deeper' };
  }

  return { shouldFollowUp: false, reason: 'answer was clear enough' };
}

// ─── Question Generation ─────────────────────────────────────

interface GeneratedQuestion {
  question: string;
  isFollowUp: boolean;
  targetTopic: string;
}

/**
 * Generates the next interview question using full context.
 * Decides between a follow-up and a new topic question.
 */
export async function generateQuestion(
  role: string,
  interviewType: string,
  difficulty: string,
  companyProfile: CompanyProfile | undefined,
  conversationContext: string,
  lastEvaluation: EvaluationResult | undefined,
  followUpCount: number,
  questionIndex: number,
  questionHashes: string[],
  knowledgeGraphSummary: string,
  hintText?: string
): Promise<GeneratedQuestion> {
  const isGeminiAvailable = !!process.env.GEMINI_API_KEY;

  // Determine follow-up
  const maxFollowUps = Math.min(3, Math.floor(questionIndex / 2)); // allow more follow-ups as interview progresses
  const followUpDecision = decideFollowUp(lastEvaluation, followUpCount, maxFollowUps);

  const companyName = companyProfile?.name || 'the company';
  const companyInstruction = companyProfile?.systemInstruction || '';
  const difficultyGuide = getDifficultyDescriptor(difficulty);
  const priorities = companyProfile?.questionPriorities?.join(', ') || 'general technical topics';

  // Fallback if no Gemini
  if (!isGeminiAvailable) {
    return buildFallbackQuestion(role, interviewType, questionIndex, followUpDecision.shouldFollowUp);
  }

  // Build prompt
  const promptType = followUpDecision.shouldFollowUp ? 'FOLLOW-UP' : 'NEW';
  const followUpContext = followUpDecision.shouldFollowUp && lastEvaluation
    ? `\nThe candidate's last answer scored ${lastEvaluation.score}/100. Depth was ${lastEvaluation.depth}/100.
Topics they covered: ${lastEvaluation.topicsCovered.join(', ')}.
${lastEvaluation.suggestedFollowUp ? `Suggested follow-up: ${lastEvaluation.suggestedFollowUp}` : ''}
Generate a probing follow-up that digs deeper into what they said. Challenge assumptions or ask for trade-offs.`
    : '';

  const hintContext = hintText
    ? `\nIMPORTANT: The difficulty was just reduced. Be encouraging. Start with: "${hintText}"`
    : '';

  const prompt = `${companyInstruction}

You are the Question Generator Agent for a ${companyName} interview.

INTERVIEW CONTEXT:
- Role: ${role}
- Type: ${interviewType}
- Current Difficulty: ${difficulty}
- Question Number: ${questionIndex + 1}
- Question Mode: ${promptType}
- Priority Topics: ${priorities}
- ${difficultyGuide}

CANDIDATE CONTEXT:
${conversationContext}

KNOWLEDGE MAP:
${knowledgeGraphSummary}
${followUpContext}${hintContext}

TASK: Generate a ${promptType} interview question.

Return a JSON object:
{
  "question": "<the interview question text>",
  "isFollowUp": ${followUpDecision.shouldFollowUp},
  "targetTopic": "<the primary topic this question tests>"
}

RULES:
- Ask ONE clear question. No multi-part questions.
- For follow-ups: reference their previous answer specifically.
- For new questions: pick an UNEXPLORED topic from the priority list.
- Do NOT repeat any previously asked question.
- Match the difficulty level: ${difficulty}.
- Keep the question under 60 words.
- Sound like a real interviewer, not an exam paper.
- For behavioral questions: demand a specific real example (STAR format for Amazon).`;

  const fallback = buildFallbackQuestion(role, interviewType, questionIndex, followUpDecision.shouldFollowUp);

  const result = await generateJSON<GeneratedQuestion>(prompt, fallback);

  return {
    question: result.question || fallback.question,
    isFollowUp: followUpDecision.shouldFollowUp,
    targetTopic: result.targetTopic || fallback.targetTopic,
  };
}

/**
 * Generates the opening question for the interview (Turn 0).
 */
export async function generateOpeningQuestion(
  role: string,
  interviewType: string,
  difficulty: string,
  companyProfile: CompanyProfile | undefined,
  resumeContext: string
): Promise<GeneratedQuestion> {
  const isGeminiAvailable = !!process.env.GEMINI_API_KEY;

  if (!isGeminiAvailable) {
    return buildFallbackQuestion(role, interviewType, 0, false);
  }

  const companyName = companyProfile?.name || 'the company';
  const companyInstruction = companyProfile?.systemInstruction || '';

  const prompt = `${companyInstruction}

You are opening a ${companyName} interview for a ${role} candidate.

Interview type: ${interviewType}
Difficulty: ${difficulty}
${resumeContext ? `Candidate background: ${resumeContext}` : ''}

Generate the FIRST interview question. This sets the tone for the entire interview.

Return a JSON object:
{
  "question": "<the opening question>",
  "isFollowUp": false,
  "targetTopic": "<primary topic>"
}

RULES:
- For technical interviews: start with a moderate-difficulty problem to calibrate.
- For behavioral interviews: start with "Tell me about a time when..." style.
- For system design: start with a scoping question ("Design a system for...").
- Keep under 50 words. Sound natural, not scripted.
- If resume context exists, optionally reference a project or skill they mentioned.`;

  const fallback = buildFallbackQuestion(role, interviewType, 0, false);
  const result = await generateJSON<GeneratedQuestion>(prompt, fallback);

  return {
    question: result.question || fallback.question,
    isFollowUp: false,
    targetTopic: result.targetTopic || fallback.targetTopic,
  };
}

// ─── Fallback Questions ──────────────────────────────────────

function buildFallbackQuestion(
  role: string,
  interviewType: string,
  questionIndex: number,
  isFollowUp: boolean
): GeneratedQuestion {
  const technicalQuestions = [
    `Tell me about a complex ${role} project you've worked on. What technical challenges did you face?`,
    `How would you design a scalable system for handling millions of concurrent users?`,
    `What's the difference between SQL and NoSQL databases? When would you choose one over the other?`,
    `Explain the concept of microservices. What are the trade-offs compared to a monolith?`,
    `Walk me through how you would debug a production performance issue.`,
    `What design patterns do you use most frequently in your work? Give me a concrete example.`,
    `How do you ensure code quality in a fast-moving team?`,
    `Explain eventual consistency and when it's acceptable.`,
  ];

  const behavioralQuestions = [
    `Tell me about a time you disagreed with a team member on a technical decision. How did you resolve it?`,
    `Describe a situation where you had to deliver under a very tight deadline.`,
    `Tell me about a time you failed at something and what you learned from it.`,
    `How do you prioritize when you have multiple urgent tasks?`,
    `Describe a time you mentored someone or helped a teammate grow.`,
    `Tell me about a project where requirements changed significantly mid-way.`,
  ];

  const isBehavioral = interviewType.toLowerCase().includes('behavioral') || interviewType.toLowerCase().includes('hr');
  const pool = isBehavioral ? behavioralQuestions : technicalQuestions;
  const idx = questionIndex % pool.length;

  return {
    question: pool[idx],
    isFollowUp,
    targetTopic: isBehavioral ? 'Behavioral' : 'Technical Fundamentals',
  };
}
