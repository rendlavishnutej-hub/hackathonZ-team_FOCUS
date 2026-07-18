import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

function makeFallbackStandaloneNotes(prompt: string) {
  return {
    title: `${prompt.toUpperCase()} Quick Notes`,
    notes: [
      {
        lessonId: 'mod-1',
        bullets: [
          `Foundational principles of ${prompt} revolve around its primary use-case in the industry.`,
          `It is widely adopted due to its strong community and robust tooling ecosystem.`,
          `Getting started requires understanding the core architecture and basic syntax.`
        ]
      },
      {
        lessonId: 'mod-2',
        bullets: [
          `Advanced implementation involves managing state, data flow, and side-effects.`,
          `Performance can be optimized through caching, memoization, and lazy loading.`,
          `Security best practices dictate strict input validation and access controls.`
        ]
      },
      {
        lessonId: 'mod-3',
        bullets: [
          `Deploying ${prompt} in production requires automated CI/CD pipelines.`,
          `Monitoring and error tracking are essential for maintaining uptime.`,
          `Scaling horizontally is the preferred method for handling increased traffic.`
        ]
      }
    ]
  };
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const notesOutput = await generateJSON(
      `You are an expert study guide creator called Notetaker Agent.
The user has requested standalone, quick study notes for the topic: "${prompt}".

Create concise, high-yield bullet point study notes broken down into 3 logical modules (e.g., Fundamentals, Advanced Concepts, Real-World Application).

Return a JSON object with EXACTLY this shape:
{
  "title": "A short catchy title for these notes",
  "notes": [
    {
      "lessonId": "mod-1",
      "bullets": ["Point 1", "Point 2", "Point 3"]
    },
    {
      "lessonId": "mod-2",
      "bullets": ["Point 1", "Point 2", "Point 3"]
    },
    {
      "lessonId": "mod-3",
      "bullets": ["Point 1", "Point 2", "Point 3"]
    }
  ]
}

Keep each bullet point under 2 sentences. Focus on concepts, facts, and architectural principles.`,
      makeFallbackStandaloneNotes(prompt)
    );

    return NextResponse.json(notesOutput);
  } catch (error: any) {
    console.error('Error generating standalone notes:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate notes' }, { status: 500 });
  }
}
