// ============================================================
// Voice Formatter Agent
// ============================================================
// Converts raw question text into a TTS-optimized spoken
// prompt. Adds natural interviewer transitions, keeps under
// 45 words, removes any markdown formatting.
// ============================================================

import { generateText } from '@/lib/gemini';

// ─── Transition Phrases ──────────────────────────────────────
const TRANSITIONS_FIRST = [
  "Let's get started.",
  "Alright, let's begin.",
  "Great. Let's jump right in.",
  "Welcome. Let me start with your first question.",
];

const TRANSITIONS_FOLLOW_UP = [
  "Interesting. Let me follow up on that.",
  "I'd like to dig deeper into that.",
  "Let me probe a bit further.",
  "Tell me more about that.",
  "Okay, building on what you said.",
];

const TRANSITIONS_NEW_TOPIC = [
  "Good. Let's switch gears.",
  "Alright, moving on.",
  "Great. Let's talk about something different.",
  "Okay, next topic.",
  "Nice. Let me ask you about something else.",
  "Good answer. Let's move to the next area.",
];

const TRANSITIONS_ENCOURAGING = [
  "That was a solid answer.",
  "Good thinking.",
  "I like your approach.",
  "Well explained.",
  "That's a strong answer.",
];

const TRANSITIONS_CHALLENGING = [
  "Let's see how you handle this one.",
  "This one's a bit tougher.",
  "Here's a more challenging scenario.",
  "Let me push you a bit harder.",
];

// ─── Helpers ─────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')        // code blocks
    .replace(/`([^`]+)`/g, '$1')           // inline code
    .replace(/\*\*([^*]+)\*\*/g, '$1')     // bold
    .replace(/\*([^*]+)\*/g, '$1')         // italic
    .replace(/#{1,6}\s+/g, '')              // headings
    .replace(/[-*+]\s+/g, '')               // bullet points
    .replace(/\n{2,}/g, '. ')               // multi newlines
    .replace(/\n/g, ' ')                    // single newlines
    .replace(/\s{2,}/g, ' ')               // extra spaces
    .trim();
}

// ─── Main Function ───────────────────────────────────────────

/**
 * Formats a question into a natural, TTS-ready spoken prompt.
 *
 * @param question - The raw question text
 * @param questionIndex - 0-based question number
 * @param isFollowUp - Whether this is a follow-up to the previous answer
 * @param lastScore - Score of the candidate's last answer (if available)
 * @param hintText - If difficulty was adjusted, optional hint to prepend
 * @param companyStyle - Optional company name for persona-aware formatting
 */
export async function formatForVoice(
  question: string,
  questionIndex: number,
  isFollowUp: boolean,
  lastScore?: number,
  hintText?: string,
  companyStyle?: string
): Promise<string> {
  // Clean the question of any markdown artifacts
  const cleanQuestion = stripMarkdown(question);

  // If question is already short and natural, just add a transition
  if (cleanQuestion.split(/\s+/).length <= 40 && !process.env.GEMINI_API_KEY) {
    return buildSpokenPrompt(cleanQuestion, questionIndex, isFollowUp, lastScore, hintText);
  }

  // Try to use Gemini for natural reformulation
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are a voice formatter for an AI interview system.${companyStyle ? ` The interviewer is from ${companyStyle}.` : ''}

Convert this interview question into a natural, spoken sentence that sounds like a real person talking. 

Rules:
- Maximum 40 words
- No markdown, no bullets, no special characters
- No "Question:" prefix
- Sound conversational, not scripted
- Do NOT add transitions or greetings — I handle those separately
- Preserve the core question's intent exactly

Original: "${cleanQuestion}"

Return ONLY the reformulated spoken question, nothing else.`;

      const result = await generateText(prompt, cleanQuestion);
      const formatted = stripMarkdown(result || cleanQuestion);
      return buildSpokenPrompt(formatted, questionIndex, isFollowUp, lastScore, hintText);
    } catch {
      // Fallback to rule-based formatting
    }
  }

  return buildSpokenPrompt(cleanQuestion, questionIndex, isFollowUp, lastScore, hintText);
}

/**
 * Builds the final spoken prompt with transition + question.
 */
function buildSpokenPrompt(
  question: string,
  questionIndex: number,
  isFollowUp: boolean,
  lastScore?: number,
  hintText?: string
): string {
  let transition: string;

  if (hintText) {
    // Difficulty was adjusted — use the hint as transition
    transition = hintText;
  } else if (questionIndex === 0) {
    transition = pick(TRANSITIONS_FIRST);
  } else if (isFollowUp) {
    transition = pick(TRANSITIONS_FOLLOW_UP);
  } else if (lastScore !== undefined && lastScore >= 80) {
    transition = pick(TRANSITIONS_ENCOURAGING);
  } else if (lastScore !== undefined && lastScore < 45) {
    transition = pick(TRANSITIONS_CHALLENGING);
  } else {
    transition = pick(TRANSITIONS_NEW_TOPIC);
  }

  // Ensure question ends with a question mark or period
  let finalQuestion = question.trim();
  if (!finalQuestion.endsWith('?') && !finalQuestion.endsWith('.')) {
    finalQuestion += '?';
  }

  return `${transition} ${finalQuestion}`;
}
