import type { OSState, OSStatus, AgentCard, AgentId, IntentAnalysis, AgentPlan } from './types';
import { analyzeIntent } from './intent-analyzer';
import { buildAgentPlan, getAllAgentsInPlan } from './task-planner';
import { buildInitialAgentCards, executePlan } from './parallel-executor';
import { composeWorkspaceResult } from './result-composer';

type StateUpdateListener = (state: OSState) => void;

export class OSOrchestrator {
  private state: OSState;
  private onUpdate: StateUpdateListener;

  constructor(sessionId: string, prompt: string, onUpdate: StateUpdateListener) {
    this.state = {
      sessionId,
      prompt,
      status: 'idle',
      phase: 'Ready',
      agents: [],
      startedAt: Date.now(),
    };
    this.onUpdate = onUpdate;
  }

  getState(): OSState {
    return { ...this.state };
  }

  private updateState(update: Partial<OSState>) {
    this.state = { ...this.state, ...update };
    this.onUpdate(this.getState());
  }

  private updateAgentStatus(agentId: AgentId, status: AgentCard['status'], output?: any, error?: string) {
    const updatedAgents = this.state.agents.map(agent => {
      if (agent.id === agentId) {
        const startedAt = status === 'running' ? Date.now() : agent.startedAt;
        const completedAt = status === 'completed' || status === 'failed' || status === 'skipped' ? Date.now() : agent.completedAt;
        return {
          ...agent,
          status,
          startedAt,
          completedAt,
          output: output !== undefined ? output : agent.output,
          error: error || agent.error,
        };
      }
      return agent;
    });
    this.updateState({ agents: updatedAgents });
  }

  async execute() {
    try {
      // ── 1. INTENT ANALYSIS ──────────────────────────────────────────────────
      this.updateState({
        status: 'analyzing',
        phase: 'Analyzing prompt intent and domain context...',
        agents: [
          { id: 'intent', label: 'Intent Analyzer', icon: '🧠', status: 'running', startedAt: Date.now() }
        ]
      });

      const intent = await analyzeIntent(this.state.prompt);
      this.updateAgentStatus('intent', 'completed', intent);
      this.updateState({ intent });

      // ── 2. TASK PLANNING ────────────────────────────────────────────────────
      this.updateState({
        status: 'planning',
        phase: 'Creating modular multi-agent execution roadmap...',
        agents: [
          ...this.state.agents,
          { id: 'planner', label: 'Task Planner', icon: '📋', status: 'running', startedAt: Date.now() }
        ]
      });

      // Artificial small delay to make the UX feel premium and deliberate
      await new Promise(resolve => setTimeout(resolve, 800));

      const plan = buildAgentPlan(intent);
      this.updateAgentStatus('planner', 'completed', plan);
      
      const initialCards = buildInitialAgentCards(plan);
      this.updateState({
        plan,
        agents: [
          ...this.state.agents,
          ...initialCards
        ]
      });

      // ── 3. EXECUTION ────────────────────────────────────────────────────────
      this.updateState({
        status: 'executing',
        phase: 'Orchestrating agent collaboration grid...',
      });

      const agentOutputs = await executePlan(plan, (agentId, status, output) => {
        this.updateAgentStatus(agentId, status, output);
      });

      // ── 4. COMPOSITION ──────────────────────────────────────────────────────
      this.updateState({
        status: 'composing',
        phase: 'Synthesizing knowledge graph and learning resources...',
      });

      await new Promise(resolve => setTimeout(resolve, 600));

      const result = composeWorkspaceResult(
        this.state.sessionId,
        this.state.prompt,
        intent,
        agentOutputs
      );

      // ── 5. COMPLETE ─────────────────────────────────────────────────────────
      this.updateState({
        status: 'completed',
        phase: 'Workspace successfully assembled!',
        result,
      });

    } catch (err: any) {
      console.error('[FOCUS OS Orchestrator] Execution failed:', err);
      const errMsg = err?.message || String(err);
      this.updateState({
        status: 'failed',
        phase: 'Execution failed',
        error: errMsg,
      });
    }
  }
}
