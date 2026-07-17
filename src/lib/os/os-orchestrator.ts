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
        const startedAt = status === 'running' ? Date.now() : agent.startedAt || Date.now();
        const completedAt = status === 'completed' || status === 'failed' || status === 'skipped' ? Date.now() : agent.completedAt;
        const executionTimeMs = completedAt && startedAt ? (completedAt - startedAt) : undefined;
        
        // Dynamic thinking messages per agent
        const thinkingMessages: Record<AgentId, string> = {
          intent: 'Parsing user prompt semantics and target domain...',
          planner: 'Mapping dependency trees and sequential execution blocks...',
          memory: 'Retrieving historical streaks, weak concepts, and profiles...',
          profile: 'Updating knowledge charts and career placement metrics...',
          research: 'Searching authoritative document sites and specifications...',
          curriculum: 'Structuring course milestones, paths, and study schedules...',
          teacher: 'Synthesizing analogies, details, and progressive descriptions...',
          code: 'Writing clean, commenting, and compilable code snippets...',
          quiz: 'Generating multiple-choice evaluation questions and feedbacks...',
          project: 'Designing milestone-driven capstone project architecture...',
          interview: 'Drafting dynamic voice question threads for assessment...',
          evaluation: 'Assessing score values on leadership, code, and vocabulary...',
          career: 'Benchmarking salaries, positions, and skill matches...',
          motivation: 'Crafting motivational summary and recommended milestones...',
          report: 'Synthesizing final layout details into responsive report cards...',
          diagram: 'Drawing concept relationships and connection nodes...',
          resource: 'Assembling books, papers, and markdown document links...',
          flashcard: 'Constructing active recall question-answer flashcard decks...',
          roadmap: 'Calculating timeline checkpoints and skill-up steps...',
          resume: 'Auditing profile structure and formatting suggestion blocks...',
          summary: 'Compiling executive brief for learning workspace...',
        };

        // Static dependencies mapping
        const dependencyMap: Record<AgentId, AgentId[]> = {
          intent: [],
          planner: ['intent'],
          memory: ['planner'],
          profile: ['memory'],
          research: ['planner'],
          curriculum: ['planner'],
          teacher: ['research', 'curriculum'],
          code: ['curriculum'],
          quiz: ['research'],
          project: ['curriculum'],
          interview: ['curriculum'],
          evaluation: ['interview'],
          career: ['profile'],
          report: ['curriculum', 'evaluation'],
          diagram: ['curriculum'],
          resource: ['research'],
          flashcard: ['curriculum'],
          roadmap: ['curriculum'],
          resume: ['memory'],
          motivation: ['report'],
          summary: ['report'],
        };

        const thinking = status === 'running' ? thinkingMessages[agentId] : undefined;
        const confidence = status === 'completed' 
          ? Math.round((0.94 + Math.random() * 0.05) * 100) / 100 
          : undefined;

        return {
          ...agent,
          status,
          startedAt,
          completedAt,
          executionTimeMs,
          thinking,
          confidence,
          dependencies: dependencyMap[agentId],
          input: status === 'running' ? { domain: this.state.intent?.domain } : agent.input,
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
          { 
            id: 'intent', 
            label: 'Intent Analyzer', 
            icon: '🧠', 
            status: 'running', 
            startedAt: Date.now(),
            dependencies: [],
            thinking: 'Parsing user prompt semantics and target domain...'
          }
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
          { 
            id: 'planner', 
            label: 'Task Planner', 
            icon: '📋', 
            status: 'running', 
            startedAt: Date.now(),
            dependencies: ['intent'],
            thinking: 'Mapping dependency trees and execution blocks...'
          }
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
          ...this.state.agents.map(a => a.id === 'planner' ? { ...a, status: 'completed' as const } : a),
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
