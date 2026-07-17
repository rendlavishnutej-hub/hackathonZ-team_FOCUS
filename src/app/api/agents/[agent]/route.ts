import { NextResponse } from 'next/server';
import { AGENT_REGISTRY } from '@/lib/agents';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ agent: string }> }
) {
  const { agent } = await params;
  const agentDef = AGENT_REGISTRY[agent.toLowerCase()];

  if (!agentDef) {
    return NextResponse.json({ error: `Agent "${agent}" not found` }, { status: 404 });
  }

  return NextResponse.json(agentDef);
}
