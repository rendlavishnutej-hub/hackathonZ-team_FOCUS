import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[FOCUS] GEMINI_API_KEY is not set in environment variables.');
}

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
export const ai = genAI;

export interface CareerMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

export interface CourseContextInput {
  id: string;
  title: string;
}

/**
 * Calls Gemini to generate career guidance based on user message, conversation history, and course context.
 */
export async function generateCareerGuidance(
  message: string,
  history: CareerMessageInput[] = [],
  courses: CourseContextInput[] = []
): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API is not initialized. Please set GEMINI_API_KEY.');
  }

  const systemInstruction = `You are a professional and friendly Career AI Advisor for a student planner application called FOCUS.
Your goal is to provide insightful, realistic, and encouraging career suggestions, guidance, and actionable next steps based on the student's questions, skills, and current courses.

Formatting Guidelines:
- Use bold text for key career titles or section highlights.
- Use bullet points or numbered lists where appropriate to make recommendations easy to read.
- Keep the tone encouraging, structured, and informative.
- If the student provides courses they are currently studying, try to connect your suggestions to how those courses help or how they can leverage them.`;

  // Build the contents array for the request including history and the new message
  const contents: any[] = [];
  
  // Add history to contents if any
  for (const h of history) {
    contents.push({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    });
  }

  // Build context prompt for the current message
  let currentPrompt = '';
  if (courses.length > 0) {
    const courseTitles = courses.map(c => c.title).join(', ');
    currentPrompt += `[Student's Current Courses: ${courseTitles}]\n\n`;
  }
  currentPrompt += `Student Question: ${message}`;

  contents.push({
    role: 'user',
    parts: [{ text: currentPrompt }],
  });

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction,
    });

    const response = await model.generateContent({
      contents,
      generationConfig: {
        temperature: 0.7,
      },
    });

    const reply = response.response.text();
    if (!reply) {
      throw new Error('Received empty response from Gemini.');
    }
    return reply;
  } catch (error) {
    console.error('[FOCUS Gemini Service] Error generating content:', error);
    throw error;
  }
}

