/**
 * Career Guidance Service
 * Connects the Career Guidance frontend to the backend Gemini API endpoint.
 */

export interface CareerMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface CourseContext {
  id: string;
  title: string;
}

/**
 * Returns a career-guidance response for the given user message by hitting the /api/career-guidance endpoint.
 *
 * @param message  The user's chat message
 * @param courses  Optional array of courses the student is studying
 * @param history  Optional chat message history for conversation context
 * @returns        A CareerMessage from the "assistant"
 */
export async function getCareerSuggestions(
  message: string,
  courses: CourseContext[] = [],
  history: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<CareerMessage> {
  const res = await fetch('/api/career-guidance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      courses,
      history: history.map(h => ({ role: h.role, content: h.content })),
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to generate career suggestions');
  }

  const data = await res.json();

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: data.reply,
    timestamp: Date.now(),
  };
}
