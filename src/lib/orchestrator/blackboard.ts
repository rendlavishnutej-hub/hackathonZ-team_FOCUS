export interface AgentLog {
  agentId: string;
  timestamp: string;
  message: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface BlackboardState {
  sessionId: string;
  prompt: string;
  activeAgentId: string | null;
  logs: AgentLog[];
  plannerOutput: any | null;
  researcherOutput: any | null;
  coderOutput: any | null;
  criticOutput: any | null;
  notetakerOutput: any | null;
  quizzerOutput: any | null;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export class Blackboard {
  private state: BlackboardState;
  private listeners: Set<(state: BlackboardState) => void> = new Set();

  constructor(sessionId: string, prompt: string) {
    this.state = {
      sessionId,
      prompt,
      activeAgentId: null,
      logs: [],
      plannerOutput: null,
      researcherOutput: null,
      coderOutput: null,
      criticOutput: null,
      notetakerOutput: null,
      quizzerOutput: null,
      status: 'idle',
    };
  }

  getState(): BlackboardState {
    return { ...this.state };
  }

  updateState(update: Partial<BlackboardState>) {
    this.state = { ...this.state, ...update };
    this.notify();
  }

  addLog(agentId: string, message: string, status: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const newLog: AgentLog = {
      agentId,
      message,
      status,
      timestamp: new Date().toLocaleTimeString(),
    };
    this.state.logs = [...this.state.logs, newLog];
    this.notify();
  }

  subscribe(listener: (state: BlackboardState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.getState()));
  }
}
