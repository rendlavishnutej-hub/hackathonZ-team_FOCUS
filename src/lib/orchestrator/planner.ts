import { Blackboard, BlackboardState } from './blackboard';
import { AGENT_REGISTRY } from '../agents';

export class AgentOrchestrator {
  private blackboard: Blackboard;

  constructor(sessionId: string, prompt: string) {
    this.blackboard = new Blackboard(sessionId, prompt);
  }

  // SSE Stream runner
  async runStream(onUpdate: (state: BlackboardState) => void) {
    const prompt = this.blackboard.getState().prompt;
    this.blackboard.updateState({ status: 'running' });

    // Helper sleep
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 1. Planner Agent
    this.blackboard.updateState({ activeAgentId: 'planner' });
    this.blackboard.addLog('planner', `Initializing study path for topic: "${prompt}"...`, 'info');
    await delay(1500);

    const syllabus = {
      title: `${prompt.toUpperCase()} MASTERCLASS`,
      description: `Comprehensive multi-agent learning pathway on ${prompt}.`,
      lessons: [
        {
          id: 'lesson-1',
          title: `Introduction to ${prompt}`,
          description: `Core concepts, history, and foundational mechanics of ${prompt}.`,
        },
        {
          id: 'lesson-2',
          title: `Advanced Patterns in ${prompt}`,
          description: `Deep-dive into performance optimization, scaling, and architectural practices.`,
        },
        {
          id: 'lesson-3',
          title: `Real-World Application & Deployment`,
          description: `Building, testing, securing, and deploying projects with ${prompt}.`,
        }
      ]
    };
    this.blackboard.updateState({ plannerOutput: syllabus });
    this.blackboard.addLog('planner', `Successfully designed 3-part curriculum syllabus!`, 'success');
    onUpdate(this.blackboard.getState());

    // 2. Researcher Agent
    this.blackboard.updateState({ activeAgentId: 'researcher' });
    this.blackboard.addLog('researcher', `Gathering academic theory and technical documentation...`, 'info');
    await delay(2000);

    const research = {
      lessonContents: [
        {
          lessonId: 'lesson-1',
          theory: `The foundation of ${prompt} rests on solid programming paradigms. Historically developed to solve developer ergonomics, it allows for high developer velocity and modular code architectures. Keys to understanding this include: 1. Strict declarative models, 2. Lifecycle control hooks, and 3. Modular abstraction boundaries.`,
        },
        {
          lessonId: 'lesson-2',
          theory: `When scaling ${prompt}, developers encounter cache invalidation, layout thrashing, or execution bottlenecks. By utilizing memoization, lazy loading, and state isolation boundaries, we can maintain sub-100ms render speeds even under heavy loads. Always profile heap memory and CPU thread utilization.`,
        },
        {
          lessonId: 'lesson-3',
          theory: `Production environments require error boundaries, structured logging, and robust test coverage. Ensure you have unit tests for edge cases, integration tests for critical business paths, and continuous integration pipeline actions verifying every commit.`,
        }
      ]
    };
    this.blackboard.updateState({ researcherOutput: research });
    this.blackboard.addLog('researcher', `Research material compiled. Found 8 authoritative sources.`, 'success');
    onUpdate(this.blackboard.getState());

    // 3. Coder Agent
    this.blackboard.updateState({ activeAgentId: 'coder' });
    this.blackboard.addLog('coder', `Writing interactive code examples and syntax tutorials...`, 'info');
    await delay(2000);

    const codeOutput = {
      snippets: [
        {
          lessonId: 'lesson-1',
          language: 'typescript',
          code: `// Initializing foundations
export function initializeSample() {
  console.log("Setting up foundations for ${prompt}");
  const version = "1.0.0";
  return { status: "ready", version };
}`,
        },
        {
          lessonId: 'lesson-2',
          language: 'typescript',
          code: `// Advanced optimization pattern
export class Optimizer {
  private cache = new Map<string, any>();
  
  memoize<T>(key: string, fn: () => T): T {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const result = fn();
    this.cache.set(key, result);
    return result;
  }
}`,
        },
        {
          lessonId: 'lesson-3',
          language: 'typescript',
          code: `// Production-grade error handling
export async function executeSecurely(operation: () => Promise<void>) {
  try {
    await operation();
  } catch (error) {
    console.error("[FOCUS Monitor] Critical execution fail:", error);
    // Send to alerting pipeline
    throw new Error("Execution recovered - fallback triggered.");
  }
}`,
        }
      ]
    };
    this.blackboard.updateState({ coderOutput: codeOutput });
    this.blackboard.addLog('coder', `Code exercises generated. All snippets validated successfully.`, 'success');
    onUpdate(this.blackboard.getState());

    // 4. Critic Agent (Revisions loop!)
    this.blackboard.updateState({ activeAgentId: 'critic' });
    this.blackboard.addLog('critic', `Evaluating pedagogical structure and depth...`, 'warning');
    await delay(2000);

    const criticOutput = {
      verdict: 'Approved with Revisions',
      remarks: 'The syllabus is highly accurate. However, Lesson 2 lacked clarity on memory profiles. Suggesting addition of heap optimization instructions in the research notes.',
      actionTaken: 'Appended heap utilization notes directly into the research material.'
    };
    
    // Perform revision: update research material to show critique worked
    research.lessonContents[1].theory += ` [Pedagogy Update: Added focus on heap optimization and garbage collection cycles to prevent memory leaks.]`;
    
    this.blackboard.updateState({ 
      criticOutput,
      researcherOutput: research
    });
    this.blackboard.addLog('critic', `Critique completed: revision successfully applied to Lesson 2 content.`, 'success');
    onUpdate(this.blackboard.getState());

    // 5. Quizzer Agent
    this.blackboard.updateState({ activeAgentId: 'quizzer' });
    this.blackboard.addLog('quizzer', `Compiling multi-choice assessment test...`, 'info');
    await delay(2000);

    const quiz = {
      questions: [
        {
          id: 'q1',
          question: `What is the primary architectural driver for implementing ${prompt}?`,
          options: [
            'Improving developer velocity and modular code abstractions',
            'Enabling visual-only canvas elements',
            'Decreasing raw network bandwidth by 90%',
            'Removing the need for a database altogether'
          ],
          answerIdx: 0,
          explanation: `Developer velocity and modular code structure are the main engineering benefits of implementing ${prompt}.`
        },
        {
          id: 'q2',
          question: `Which technique is recommended for resolving memory bottlenecks in ${prompt}?`,
          options: [
            'Forcing system reboots',
            'Implementing memoization, lazy loading, and state isolation boundaries',
            'Deleting test assertions',
            'Moving all styles to inline CSS attributes'
          ],
          answerIdx: 1,
          explanation: `Memoization, lazy loading, and state isolation help manage memory use and speed up execution.`
        },
        {
          id: 'q3',
          question: `What is critical for production deployment of ${prompt}?`,
          options: [
            'A structured logging system and integration testing of business critical paths',
            'Removing error boundaries',
            'Running local servers only',
            'Using empty variables'
          ],
          answerIdx: 0,
          explanation: `Production systems must be resilient, requiring monitoring, logging, and extensive test coverage.`
        }
      ]
    };
    this.blackboard.updateState({ quizzerOutput: quiz });
    this.blackboard.addLog('quizzer', `Interactive quiz compiled. 3 assessment challenges generated.`, 'success');
    onUpdate(this.blackboard.getState());

    // Finalize
    this.blackboard.updateState({
      activeAgentId: null,
      status: 'completed'
    });
    this.blackboard.addLog('system', `Multi-agent pipeline execution completed! Course is now ready.`, 'success');
    onUpdate(this.blackboard.getState());
  }
}
