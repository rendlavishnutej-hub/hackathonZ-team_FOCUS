import { NextResponse } from 'next/server';
import { runInterviewTurn } from '@/lib/interview/orchestrator';
import type { InterviewState } from '@/lib/interview/types';

export const dynamic = 'force-dynamic';

// Timeout wrapper — prevents runaway LLM calls from blocking indefinitely
const TIMEOUT_MS = 55_000; // 55 seconds (Vercel limit is 60s)

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

export async function POST(request: Request) {
  try {
    const { state, answer } = await request.json();

    if (!state) {
      return NextResponse.json(
        { error: 'Interview state is required' },
        { status: 400 }
      );
    }

    // Run the orchestrator turn with timeout protection
    const updatedState = await withTimeout(
      runInterviewTurn(state as InterviewState, answer || ''),
      TIMEOUT_MS
    );

    return NextResponse.json(updatedState);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred during interview turn';
    console.error('Interview orchestrator route error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
