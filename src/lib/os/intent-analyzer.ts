import { generateJSON } from '../gemini';
import type { IntentAnalysis, IntentType } from './types';

// ─── Fallback intent when Gemini is unavailable ──────────────────────────────
function inferIntentFromKeywords(prompt: string): IntentAnalysis {
  const p = prompt.toLowerCase();

  let intent: IntentType = 'learn';
  if (p.includes('interview') || p.includes('google') || p.includes('faang') || p.includes('prepare me'))
    intent = 'interview_prep';
  else if (p.includes('project') || p.includes('build') || p.includes('create an app'))
    intent = 'project';
  else if (p.includes('career') || p.includes('job') || p.includes('salary') || p.includes('resume'))
    intent = 'career';
  else if (p.includes('quiz') || p.includes('test me') || p.includes('question'))
    intent = 'quiz';
  else if (p.includes('code') || p.includes('implement') || p.includes('write a function'))
    intent = 'code';
  else if (p.includes('research') || p.includes('explain') || p.includes('what is'))
    intent = 'research';

  const complexity =
    p.includes('advanced') || p.includes('expert') || p.includes('deep dive') ? 'advanced'
    : p.includes('intermediate') || p.includes('familiar') ? 'intermediate'
    : 'beginner';

  const urgency =
    p.includes('urgent') || p.includes('asap') || p.includes('tomorrow') ? 'high'
    : p.includes('prepare') || p.includes('master') ? 'medium'
    : 'low';

  // Extract domain from prompt (first noun phrase heuristic)
  const domain = extractDomain(prompt);

  return {
    intent,
    domain,
    urgency,
    complexity,
    primaryGoal: `${intent === 'learn' ? 'Learn' : intent === 'interview_prep' ? 'Interview prep for' : 'Work on'} ${domain}`,
  };
}

function extractDomain(prompt: string): string {
  // Remove common filler words and return the meaningful subject
  const stripped = prompt
    .replace(/teach me|learn|i want to|prepare me for|help me with|understand|master|study|build|create/gi, '')
    .trim();
  return stripped.length > 2 ? stripped : prompt;
}

// ─── Main Intent Analyzer ────────────────────────────────────────────────────
export async function analyzeIntent(prompt: string): Promise<IntentAnalysis> {
  const fallback = inferIntentFromKeywords(prompt);

  return generateJSON<IntentAnalysis>(
    `You are an expert AI intent classifier for an AI Learning Operating System called FOCUS.

Analyze this user prompt: "${prompt}"

Classify the intent and return ONLY this JSON:
{
  "intent": "<one of: learn | interview_prep | project | career | quiz | code | research | general>",
  "domain": "<specific topic, e.g. 'React Hooks', 'System Design', 'Python Data Science'>",
  "urgency": "<one of: low | medium | high>",
  "complexity": "<one of: beginner | intermediate | advanced>",
  "primaryGoal": "<one clear sentence describing what the user wants to achieve>"
}

Rules:
- "learn" = user wants to understand or master a topic
- "interview_prep" = user is preparing for technical interviews at specific companies
- "project" = user wants to build something specific
- "career" = user wants career advice, resume help, or job search help
- "quiz" = user wants to test their knowledge
- "code" = user wants working code written for them
- "research" = user wants deep information/explanation about something
- "general" = anything else
- domain must be specific, not generic
- complexity: beginner if they say "from scratch", advanced if they say "deep dive" or "expert"`,
    fallback
  );
}
