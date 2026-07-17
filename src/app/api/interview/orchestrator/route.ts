import { NextResponse } from 'next/server';
import { runInterviewTurn, InterviewState } from '@/lib/agents/interview/orchestrator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { state, answer } = await request.json();

    if (!state) {
      return NextResponse.json({ error: 'Interview state is required' }, { status: 400 });
    }

    // Run the orchestrator turn
    const updatedState = await runInterviewTurn(state as InterviewState, answer);

    return NextResponse.json(updatedState);
  } catch (error: any) {
    console.error('Interview orchestrator route error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during interview turn' }, { status: 500 });
  }
}
