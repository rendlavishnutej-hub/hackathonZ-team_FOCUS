import { NextResponse } from 'next/server';
import { OSOrchestrator } from '@/lib/os/os-orchestrator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { sessionId, prompt } = await request.json();

    if (!sessionId || !prompt) {
      return NextResponse.json({ error: 'Session ID and prompt are required' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = (state: any) => {
          try {
            const dataStr = `data: ${JSON.stringify(state)}\n\n`;
            controller.enqueue(encoder.encode(dataStr));
          } catch (e) {
            console.error('Error writing to stream controller:', e);
          }
        };

        const orchestrator = new OSOrchestrator(sessionId, prompt, (state) => {
          sendUpdate(state);
        });

        try {
          await orchestrator.execute();
        } catch (error: any) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error.message || 'Stream failed' })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('OS route error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
