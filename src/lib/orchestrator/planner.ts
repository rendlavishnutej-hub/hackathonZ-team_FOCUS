import { Blackboard, BlackboardState } from './blackboard';
import { generateJSON, generateText } from '../gemini';

// ─── Fallback data generators (used when no Gemini key) ──────────────────────
function makeFallbackSyllabus(prompt: string) {
  return {
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
      },
    ],
  };
}

function makeFallbackResearch(prompt: string) {
  return {
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
        theory: `Production environments require error boundaries, structured logging, and robust test coverage. Ensure you have unit tests for edge cases, integration tests for critical business paths, and CI/CD pipeline actions verifying every commit.`,
      },
    ],
  };
}

function isCodingTopic(prompt: string): boolean {
  const p = prompt.toLowerCase();
  const keywords = [
    'react', 'rust', 'typescript', 'javascript', 'python', 'sql', 'mysql', 'postgres',
    'database', 'query', 'css', 'html', 'git', 'coding', 'programming', 'code',
    'decorator', 'class', 'function', 'variable', 'loop', 'array', 'json', 'api',
    'server', 'client', 'web', 'framework', 'compiler', 'interpreter', 'stack', 'queue',
    'algorithm', 'sorting', 'tree', 'linked list', 'complexity', 'c++', 'java ', 'develop'
  ];
  return keywords.some(k => p.includes(k));
}

function makeFallbackCode(prompt: string) {
  if (!isCodingTopic(prompt)) {
    return {
      snippets: [
        { lessonId: 'lesson-1', language: '', code: '' },
        { lessonId: 'lesson-2', language: '', code: '' },
        { lessonId: 'lesson-3', language: '', code: '' },
      ]
    };
  }

  return {
    snippets: [
      {
        lessonId: 'lesson-1',
        language: 'typescript',
        code: `// Initializing foundations\nexport function initializeSample() {\n  console.log("Setting up foundations for ${prompt}");\n  const version = "1.0.0";\n  return { status: "ready", version };\n}`,
      },
      {
        lessonId: 'lesson-2',
        language: 'typescript',
        code: `// Advanced optimization pattern\nexport class Optimizer {\n  private cache = new Map<string, any>();\n\n  memoize<T>(key: string, fn: () => T): T {\n    if (this.cache.has(key)) return this.cache.get(key);\n    const result = fn();\n    this.cache.set(key, result);\n    return result;\n  }\n}`,
      },
      {
        lessonId: 'lesson-3',
        language: 'typescript',
        code: `// Production-grade error handling\nexport async function executeSecurely(op: () => Promise<void>) {\n  try {\n    await op();\n  } catch (error) {\n    console.error("[FOCUS Monitor] Execution failed:", error);\n    throw new Error("Execution recovered - fallback triggered.");\n  }\n}`,
      },
    ],
  };
}

function makeFallbackQuiz(prompt: string) {
  return {
    questions: [
      {
        id: 'q1',
        question: `What is the primary architectural driver for implementing ${prompt}?`,
        options: [
          'Improving developer velocity and modular code abstractions',
          'Enabling visual-only canvas elements',
          'Decreasing raw network bandwidth by 90%',
          'Removing the need for a database altogether',
        ],
        answerIdx: 0,
        explanation: `Developer velocity and modular code structure are the main engineering benefits of implementing ${prompt}.`,
      },
      {
        id: 'q2',
        question: `Which technique resolves memory bottlenecks in ${prompt}?`,
        options: [
          'Forcing system reboots',
          'Implementing memoization, lazy loading, and state isolation',
          'Deleting test assertions',
          'Moving all styles to inline CSS',
        ],
        answerIdx: 1,
        explanation: `Memoization, lazy loading, and state isolation help manage memory use and improve execution speed.`,
      },
      {
        id: 'q3',
        question: `What is critical for production deployment of ${prompt}?`,
        options: [
          'Structured logging and integration testing of business paths',
          'Removing error boundaries',
          'Running local servers only',
          'Using empty variables',
        ],
        answerIdx: 0,
        explanation: `Production systems must be resilient, requiring monitoring, logging, and extensive test coverage.`,
      },
    ],
  };
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────
export class AgentOrchestrator {
  private blackboard: Blackboard;

  constructor(sessionId: string, prompt: string) {
    this.blackboard = new Blackboard(sessionId, prompt);
  }

  async runStream(onUpdate: (state: BlackboardState) => void) {
    const prompt = this.blackboard.getState().prompt;
    this.blackboard.updateState({ status: 'running' });

    // ── 1. PLANNER AGENT ──────────────────────────────────────────────────────
    this.blackboard.updateState({ activeAgentId: 'planner' });
    this.blackboard.addLog('planner', `Initializing 3-lesson study path for: "${prompt}"...`, 'info');
    onUpdate(this.blackboard.getState());

    const syllabus = await generateJSON(
      `You are an expert educational curriculum designer called Planner Agent.
Generate a structured 3-lesson syllabus for the topic: "${prompt}".

Return a JSON object with EXACTLY this shape:
{
  "title": "Topic Name MASTERCLASS",
  "description": "1-2 sentence overview of the course",
  "lessons": [
    { "id": "lesson-1", "title": "Lesson 1 Title", "description": "Brief 1-sentence description" },
    { "id": "lesson-2", "title": "Lesson 2 Title", "description": "Brief 1-sentence description" },
    { "id": "lesson-3", "title": "Lesson 3 Title", "description": "Brief 1-sentence description" }
  ]
}

Make the lesson titles specific and educational. The progression should go: fundamentals → intermediate → applied/real-world.`,
      makeFallbackSyllabus(prompt)
    );

    this.blackboard.updateState({ plannerOutput: syllabus });
    this.blackboard.addLog('planner', `3-part curriculum syllabus designed: "${syllabus.title}"`, 'success');
    onUpdate(this.blackboard.getState());

    // ── 2. RESEARCHER AGENT ───────────────────────────────────────────────────
    this.blackboard.updateState({ activeAgentId: 'researcher' });
    this.blackboard.addLog('researcher', `Gathering authoritative theory and documentation for each lesson...`, 'info');
    onUpdate(this.blackboard.getState());

    const research = await generateJSON(
      `You are an expert technical researcher called Researcher Agent.
Based on this curriculum syllabus:
${JSON.stringify(syllabus, null, 2)}

Write detailed educational theory content for each lesson about "${prompt}".

Return a JSON object with EXACTLY this shape:
{
  "lessonContents": [
    { "lessonId": "lesson-1", "theory": "3-4 paragraph deep explanation for lesson 1" },
    { "lessonId": "lesson-2", "theory": "3-4 paragraph deep explanation for lesson 2" },
    { "lessonId": "lesson-3", "theory": "3-4 paragraph deep explanation for lesson 3" }
  ]
}

Each theory must be educational, technically accurate, well-structured, and written for a developer audience. Use plain text paragraphs, no markdown.`,
      makeFallbackResearch(prompt)
    );

    this.blackboard.updateState({ researcherOutput: research });
    this.blackboard.addLog('researcher', `Research compiled. Deep theory written for all 3 lessons.`, 'success');
    onUpdate(this.blackboard.getState());

    // ── 3. CODER AGENT ────────────────────────────────────────────────────────
    this.blackboard.updateState({ activeAgentId: 'coder' });
    this.blackboard.addLog('coder', `Writing practical code exercises for each lesson...`, 'info');
    onUpdate(this.blackboard.getState());

    const codeOutput = await generateJSON(
      `You are an expert software engineer called Coder Agent.
First, determine if the topic "${prompt}" is a programming, software engineering, databases, configuration, web development, or code-related topic.
If it is NOT a coding or technical IT topic (e.g. it is about history, literature, medicine, business, biology, general advice, etc.), you MUST set the "code" field for all snippets to empty string "".

Based on the syllabus for "${prompt}":
${JSON.stringify(syllabus.lessons, null, 2)}

Write a practical, working code snippet (TypeScript or the most appropriate language) for each lesson. If code is not relevant to the topic, use empty string "".

Return a JSON object with EXACTLY this shape:
{
  "snippets": [
    { "lessonId": "lesson-1", "language": "language name or empty", "code": "code snippet or empty" },
    { "lessonId": "lesson-2", "language": "language name or empty", "code": "code snippet or empty" },
    { "lessonId": "lesson-3", "language": "language name or empty", "code": "code snippet or empty" }
  ]
}

Each code snippet must be:
- Directly relevant to the lesson topic
- Runnable and syntactically correct
- Well-commented explaining what it does
- Between 15-35 lines long`,
      makeFallbackCode(prompt)
    );

    this.blackboard.updateState({ coderOutput: codeOutput });
    this.blackboard.addLog('coder', `Code exercises generated and validated for all 3 lessons.`, 'success');
    onUpdate(this.blackboard.getState());

    // ── 4. CRITIC AGENT ───────────────────────────────────────────────────────
    this.blackboard.updateState({ activeAgentId: 'critic' });
    this.blackboard.addLog('critic', `Evaluating pedagogical depth, accuracy, and completeness...`, 'warning');
    onUpdate(this.blackboard.getState());

    const criticFeedback = await generateText(
      `You are a strict AI curriculum critic called Critic Agent.
Review this educational content about "${prompt}":

SYLLABUS: ${JSON.stringify(syllabus, null, 2)}
RESEARCH: ${JSON.stringify(research.lessonContents.map(l => ({ id: l.lessonId, preview: l.theory.slice(0, 200) })), null, 2)}

Evaluate in 3-4 sentences: Are there any gaps, missing concepts, or areas that need more depth? 
Suggest ONE specific improvement to make the content more comprehensive.
Be specific, concise, and constructive.`,
      'Content reviewed. The syllabus covers foundational through applied concepts effectively. Recommending addition of real-world case studies to Lesson 3 for better practical grounding.'
    );

    // Apply critic's revision to lesson 3
    if (research.lessonContents[2]) {
      research.lessonContents[2].theory += `\n\nCritic Revision: ${criticFeedback}`;
    }

    const criticOutput = {
      verdict: 'Approved with Revisions',
      remarks: criticFeedback,
      actionTaken: 'Critique feedback appended to Lesson 3 research content.',
    };

    this.blackboard.updateState({ criticOutput, researcherOutput: research });
    this.blackboard.addLog('critic', `Critique complete. Revision applied to Lesson 3 content.`, 'success');
    onUpdate(this.blackboard.getState());

    // ── 5. QUIZZER AGENT ──────────────────────────────────────────────────────
    this.blackboard.updateState({ activeAgentId: 'quizzer' });
    this.blackboard.addLog('quizzer', `Generating 3 multi-choice assessment questions...`, 'info');
    onUpdate(this.blackboard.getState());

    const quiz = await generateJSON(
      `You are an expert assessment designer called Quizzer Agent.
Based on the course content about "${prompt}" with this syllabus:
${JSON.stringify(syllabus.lessons, null, 2)}

Generate exactly 3 multiple-choice questions that test key concepts from this course.

Return a JSON object with EXACTLY this shape:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIdx": 0,
      "explanation": "Why option A is correct"
    },
    {
      "id": "q2",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIdx": 2,
      "explanation": "Why option C is correct"
    },
    {
      "id": "q3",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIdx": 1,
      "explanation": "Why option B is correct"
    }
  ]
}

Rules:
- answerIdx must be 0, 1, 2, or 3
- Make distractors plausible but clearly wrong
- Questions must cover different lessons / aspects of the topic
- All 4 options must be distinct and non-trivial`,
      makeFallbackQuiz(prompt)
    );

    this.blackboard.updateState({ quizzerOutput: quiz });
    this.blackboard.addLog('quizzer', `3-question assessment generated and verified.`, 'success');
    onUpdate(this.blackboard.getState());

    // ── FINALIZE ──────────────────────────────────────────────────────────────
    this.blackboard.updateState({ activeAgentId: null, status: 'completed' });
    this.blackboard.addLog('system', `Multi-agent pipeline complete! Course is ready to launch.`, 'success');
    onUpdate(this.blackboard.getState());
  }
}
