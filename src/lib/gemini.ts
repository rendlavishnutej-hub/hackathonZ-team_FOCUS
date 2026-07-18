import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[FOCUS] GEMINI_API_KEY is not set. Orchestrator will use fallback mock mode.');
}

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export function getModel(modelName = 'gemini-1.5-flash') {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: modelName });
}

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const errText = String(err?.message || err || '');
    const isRateLimit = err?.status === 429 || errText.includes('429') || errText.toLowerCase().includes('too many requests');
    if (isRateLimit && retries > 0) {
      console.warn(`[FOCUS Gemini] 429 Rate Limit hit. Retrying in ${delayMs / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return retryWithBackoff(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

const MODELS_TO_TRY = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro'
];

export async function generateJSON<T>(prompt: string, fallback: T): Promise<T> {
  if (!genAI) return fallback;

  let lastError: any = null;
  for (const modelName of MODELS_TO_TRY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const fn = async () => {
        const result = await model.generateContent(
          `You are a JSON-only response agent. Return ONLY valid JSON, no markdown, no code fences, no commentary.\n\n${prompt}`
        );
        const text = result.response.text().trim();
        // Strip markdown code fences if model adds them despite instruction
        const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
        return JSON.parse(cleaned) as T;
      };
      return await retryWithBackoff(fn);
    } catch (err) {
      console.warn(`[FOCUS Gemini] generateJSON failed with model ${modelName}, trying next...`, err);
      lastError = err;
    }
  }

  console.error('[FOCUS Gemini] All model attempts in generateJSON failed:', lastError);
  return fallback;
}

export async function generateText(prompt: string, fallback: string): Promise<string> {
  if (!genAI) return fallback;

  let lastError: any = null;
  for (const modelName of MODELS_TO_TRY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const fn = async () => {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
      };
      return await retryWithBackoff(fn);
    } catch (err) {
      console.warn(`[FOCUS Gemini] generateText failed with model ${modelName}, trying next...`, err);
      lastError = err;
    }
  }

  console.error('[FOCUS Gemini] All model attempts in generateText failed:', lastError);
  return fallback;
}

