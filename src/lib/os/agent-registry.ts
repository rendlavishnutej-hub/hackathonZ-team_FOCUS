import { generateJSON, generateText } from '../gemini';
import type {
  AgentId, IntentAnalysis, UserMemory,
  RoadmapStep, QuizQuestion, Flashcard, ProjectIdea, LearningResource, ConceptNode,
} from './types';

// ─── Agent metadata (UI labels and icons) ────────────────────────────────────
export const AGENT_META: Record<AgentId, { label: string; icon: string }> = {
  intent:     { label: 'Intent Analyzer',   icon: '🧠' },
  planner:    { label: 'Task Planner',      icon: '📋' },
  research:   { label: 'Research Agent',    icon: '🔬' },
  teacher:    { label: 'Teacher Agent',     icon: '👨‍🏫' },
  curriculum: { label: 'Curriculum Agent',  icon: '📚' },
  diagram:    { label: 'Diagram Agent',     icon: '🗺️' },
  quiz:       { label: 'Quiz Agent',        icon: '❓' },
  code:       { label: 'Code Agent',        icon: '💻' },
  project:    { label: 'Project Agent',     icon: '🚀' },
  memory:     { label: 'Memory Agent',      icon: '💾' },
  profile:    { label: 'Profile Agent',     icon: '👤' },
  interview:  { label: 'Interview Agent',   icon: '🎙️' },
  career:     { label: 'Career Agent',      icon: '💼' },
  evaluation: { label: 'Evaluation Agent',  icon: '📊' },
  motivation: { label: 'Motivation Agent',  icon: '⚡' },
  resource:   { label: 'Resource Agent',    icon: '📖' },
  flashcard:  { label: 'Flashcard Agent',   icon: '🃏' },
  roadmap:    { label: 'Roadmap Agent',     icon: '🗺️' },
  report:     { label: 'Report Agent',      icon: '📑' },
  resume:     { label: 'Resume Agent',      icon: '📄' },
  summary:    { label: 'Summary Agent',     icon: '✅' },
};

// ─── Agent Executor Functions ─────────────────────────────────────────────────

// ── RESEARCH AGENT ──────────────────────────────────────────────────────────
export async function runResearchAgent(intent: IntentAnalysis): Promise<{ notes: string }> {
  const notes = await generateText(
    `You are a world-class Research Agent inside an AI Learning Operating System.
Your audience: a ${intent.complexity}-level developer who wants to deeply master "${intent.domain}".
Goal: "${intent.primaryGoal}"

Write exhaustive, expert-level technical notes structured EXACTLY in these sections:

## Overview
Explain what ${intent.domain} is, why it exists, and what problem it solves. Cover the historical context and why it matters in modern engineering. (3-4 paragraphs)

## Core Concepts & Mental Models
Explain the fundamental ideas, abstractions, and mental models that make ${intent.domain} work. Define the key terms with precision. (3-5 paragraphs)

## How It Works Internally
Describe the internal mechanics: data flow, lifecycle, processing model, algorithms, or runtime behavior. Be specific and technical. (3-4 paragraphs)

## Architecture & Design Patterns
Explain the common design patterns, architectural decisions, and compositional approaches used with ${intent.domain}. Include named patterns (e.g., Factory, Observer, MVC, etc.) where relevant. (3-4 paragraphs)

## Best Practices & Production Guidelines
List real-world engineering guidelines used at companies like Google, Meta, and Netflix when working with ${intent.domain}. Cover performance, security, scalability, and maintainability. (4-5 paragraphs)

## Common Pitfalls & Anti-Patterns
Describe the most frequent mistakes developers make with ${intent.domain}. Explain why each is problematic and what to do instead. (3-4 paragraphs)

## Advanced Topics
Cover advanced or nuanced aspects of ${intent.domain} that separate intermediate developers from seniors: edge cases, optimization techniques, internal trade-offs. (2-3 paragraphs)

Write in plain English. No markdown symbols. No code blocks. Be comprehensive, specific, and avoid generic filler content.`,
    `${intent.domain} is a fundamental building block of modern software engineering.\n\nCore Concepts: ${intent.domain} operates on the principle of abstracting complexity behind clean interfaces. It provides deterministic behaviour when given well-formed inputs and encourages separation of concerns at module boundaries.\n\nHow It Works: At runtime, the ${intent.domain} engine processes instructions sequentially through an event loop or execution context, resolving dependencies lazily where possible. State is typically isolated per execution context to prevent side effects.\n\nArchitecture Patterns: The most prevalent pattern when working with ${intent.domain} is the separation of data and logic layers. Engineers often adopt CQRS (Command Query Responsibility Segregation) combined with event sourcing to ensure full auditability and predictable state transitions.\n\nBest Practices: Always validate inputs at system boundaries. Write pure functions wherever possible to maximise testability. Prefer immutability over mutation. Use dependency injection to decouple components and make them testable in isolation. Profile before optimising — measure, then fix.\n\nCommon Pitfalls: The most common mistake is premature optimisation — spending engineering effort on performance before correctness is established. Another is over-engineering abstractions early when simpler solutions suffice. Also avoid implicit state dependencies between modules as they create brittle, order-dependent systems.\n\nAdvanced Topics: At scale, ${intent.domain} requires careful attention to memory pressure, GC pauses, and thread safety. Senior engineers instrument their systems with distributed tracing, structured logs, and custom metrics dashboards to detect anomalies before they impact users.`
  );
  return { notes };
}

// ── CURRICULUM AGENT ────────────────────────────────────────────────────────
export async function runCurriculumAgent(intent: IntentAnalysis): Promise<{ overview: string; estimatedTime: string; difficulty: string }> {
  return generateJSON(
    `You are a Senior Curriculum Designer at a top-tier engineering bootcamp.
Topic: "${intent.domain}" | Complexity: ${intent.complexity} | Goal: "${intent.primaryGoal}"

Design a compelling curriculum overview for this learning experience. Return ONLY valid JSON:
{
  "overview": "A 3-4 sentence compelling overview that describes EXACTLY what the learner will build, master, and be able to do after completing this curriculum. Be specific about skills, tools, and real-world applications.",
  "estimatedTime": "A realistic time estimate like '6-10 hours across 3 sessions'",
  "difficulty": "One of: Beginner, Intermediate, Advanced, Expert"
}`,
    {
      overview: `In this comprehensive learning experience, you will master the complete lifecycle of ${intent.domain} — from foundational principles through production-grade implementation. You'll understand the internals, learn battle-tested design patterns used at top technology companies, and implement a real-world project that demonstrates full command of the subject. By the end, you will be able to architect, build, debug, and optimize ${intent.domain} solutions confidently in a team environment.`,
      estimatedTime: '6-10 hours across 3 sessions',
      difficulty: intent.complexity.charAt(0).toUpperCase() + intent.complexity.slice(1),
    }
  );
}

// ── DIAGRAM / CONCEPT MAP AGENT ─────────────────────────────────────────────
export async function runDiagramAgent(intent: IntentAnalysis): Promise<{ conceptMap: ConceptNode[] }> {
  return generateJSON(
    `You are a Knowledge Graph Architect specializing in educational concept maps.
Topic: "${intent.domain}"

Create a detailed hierarchical concept map. Return ONLY valid JSON:
{
  "conceptMap": [
    { "concept": "Main Topic Name", "children": ["Core Pillar 1", "Core Pillar 2", "Core Pillar 3", "Core Pillar 4"] },
    { "concept": "Core Pillar 1", "children": ["Sub-concept A", "Sub-concept B", "Sub-concept C"] },
    { "concept": "Core Pillar 2", "children": ["Sub-concept D", "Sub-concept E"] },
    { "concept": "Core Pillar 3", "children": ["Sub-concept F", "Sub-concept G", "Sub-concept H"] },
    { "concept": "Core Pillar 4", "children": ["Sub-concept I", "Sub-concept J"] }
  ]
}

Rules:
- First node is ALWAYS the main topic
- Create 8-12 total nodes
- Use domain-specific, real technical terms (not generic labels like "Sub-concept A")
- Each non-leaf node should have 2-4 specific children`,
    {
      conceptMap: [
        { concept: intent.domain, children: ['Foundations', 'Core Architecture', 'Patterns & Best Practices', 'Advanced Topics'] },
        { concept: 'Foundations', children: ['Mental Models', 'Key Terminology', 'Setup & Tooling'] },
        { concept: 'Core Architecture', children: ['Data Flow', 'State Management', 'Lifecycle Events'] },
        { concept: 'Patterns & Best Practices', children: ['Design Patterns', 'Performance Optimization', 'Error Handling'] },
        { concept: 'Advanced Topics', children: ['Scaling', 'Testing Strategies', 'Production Deployment'] },
      ],
    }
  );
}

// ── QUIZ AGENT ──────────────────────────────────────────────────────────────
// Accepts a randomSeed to generate different question sets on retake
export async function runQuizAgent(intent: IntentAnalysis, notes?: string, randomSeed?: number): Promise<{ quiz: QuizQuestion[] }> {
  const seed = randomSeed ?? Date.now();
  const questionFocus = [
    'conceptual understanding and definitions',
    'practical application and real-world scenarios',
    'debugging, anti-patterns and common mistakes',
    'architecture decisions and design trade-offs',
    'performance, optimization, and scaling considerations',
  ];
  // Rotate focus area based on seed to ensure different questions each run
  const focusArea = questionFocus[seed % questionFocus.length];

  return generateJSON(
    `You are a Senior Technical Interviewer at a FAANG company creating a rigorous assessment.
Topic: "${intent.domain}" | Level: ${intent.complexity}
Question focus for this session (seed ${seed}): ${focusArea}
${notes ? `Reference material:\n${notes.slice(0, 2000)}` : ''}

Generate EXACTLY 10 unique, high-quality multiple-choice questions focused specifically on: ${focusArea}

Return ONLY this JSON structure:
{
  "quiz": [
    {
      "id": "q1",
      "question": "Specific, clear question text that tests genuine understanding?",
      "options": ["Correct answer", "Plausible wrong answer B", "Plausible wrong answer C", "Plausible wrong answer D"],
      "answerIdx": 0,
      "explanation": "2-3 sentence explanation of why this is correct and why others are wrong"
    }
  ]
}

CRITICAL RULES:
- answerIdx is 0-3 (index of the correct answer in options array)
- Randomize which position (0-3) the correct answer appears — do NOT always put correct answer first
- Each question MUST be different and cover a distinct aspect
- Make wrong options (distractors) highly plausible — not obviously wrong
- Questions should range from easy to difficult within the set
- Use real-world scenarios, not abstract "what is X" questions
- Minimum 2 sentences per question for depth
- Cover: definitions, application, debugging, edge cases, architecture`,
    {
      quiz: [
        { id: 'q1', question: `What is the primary architectural principle that makes ${intent.domain} effective for large-scale applications?`, options: ['Separation of concerns with clearly defined module boundaries', 'Using global state for maximum performance', 'Avoiding abstraction layers to reduce overhead', 'Keeping all logic in a single file for simplicity'], answerIdx: 0, explanation: `${intent.domain} achieves scalability through separation of concerns — dividing the application into focused modules with clear responsibilities. This reduces coupling, improves testability, and allows teams to work independently.` },
        { id: 'q2', question: `A production application built with ${intent.domain} is experiencing memory leaks in long-running sessions. Which debugging approach is most effective?`, options: ['Restart the application on a schedule', 'Profile memory allocation over time using browser DevTools or node --inspect, then trace retained object references', 'Add more RAM to the server', 'Reduce the number of active users'], answerIdx: 1, explanation: `Memory profiling is the systematic approach: take heap snapshots at intervals, compare retainers, and identify objects that grow without being garbage collected. Restarting or adding RAM only masks the underlying issue.` },
        { id: 'q3', question: `Which pattern best describes ${intent.domain}'s approach to handling asynchronous operations at scale?`, options: ['Blocking synchronous execution on every I/O call', 'Event-driven non-blocking I/O with a callback/promise chain', 'Spawning a new thread per request', 'Polling at fixed intervals until data is available'], answerIdx: 1, explanation: `Event-driven non-blocking I/O allows ${intent.domain} to handle thousands of concurrent operations without waiting — the runtime processes other work while I/O resolves, dramatically improving throughput.` },
        { id: 'q4', question: `When should you choose composition over inheritance in a ${intent.domain} codebase?`, options: ['Never — inheritance is always superior', 'Always prefer inheritance for code reuse', 'When you need to combine behaviours from multiple sources without locking into a class hierarchy', 'Only when using TypeScript or strongly typed languages'], answerIdx: 2, explanation: `Composition ("has-a") is favoured when behaviours need to be mixed or swapped at runtime, or when extending via inheritance would create fragile deep hierarchies. It promotes flexibility and avoids the Fragile Base Class problem.` },
        { id: 'q5', question: `A team is debating whether to add caching to a ${intent.domain} API endpoint. What must be true BEFORE adding caching?`, options: ['Cache everything by default for maximum performance', 'Measure the actual performance bottleneck with profiling data — only cache if the endpoint is proven slow', 'Caching is only for databases, not API layers', 'Cache invalidation is trivial and can be handled later'], answerIdx: 1, explanation: `Premature optimisation is a root cause of unnecessary complexity. Profiling data must prove the bottleneck before adding cache, because caching introduces consistency problems, stale data risks, and operational overhead.` },
        { id: 'q6', question: `What is the most important reason to write unit tests for ${intent.domain} modules before shipping to production?`, options: ['Tests are required by government regulation', 'To document behaviour as executable specifications, catch regressions, and enable safe refactoring', 'So the QA team does not need to do any testing', 'Tests make the application run faster in production'], answerIdx: 1, explanation: `Unit tests serve as living documentation, executable contracts, and regression guards. They give engineers confidence to refactor — without tests, any change could silently break existing behaviour.` },
        { id: 'q7', question: `Which of these is the CORRECT way to handle errors in an async ${intent.domain} function to prevent unhandled promise rejections?`, options: ['Ignore errors — they will be caught by the global handler', 'Wrap async operations in try/catch blocks and propagate meaningful error objects', 'Use console.log(err) and return null', 'Call process.exit() on any error'], answerIdx: 1, explanation: `Proper error handling requires try/catch in async functions, throwing Error objects with descriptive messages, and propagating errors up the call stack to be handled at the appropriate boundary (typically the API layer or UI).` },
        { id: 'q8', question: `A ${intent.domain} service is experiencing high latency under load. After profiling, the bottleneck is a synchronous database query called on every request. What is the BEST solution?`, options: ['Scale horizontally immediately', 'Make the query async, add an index to the queried column, and introduce a read cache for frequently accessed data', 'Remove the database and use in-memory storage', 'Increase database connection pool size only'], answerIdx: 1, explanation: `The correct approach is layered: make the I/O non-blocking (async), ensure the database has proper indexes, and cache hot reads. Connection pool size is a secondary concern — unindexed queries will still be slow regardless.` },
        { id: 'q9', question: `What does "idempotency" mean in the context of ${intent.domain} API design, and why does it matter?`, options: ['An API that returns HTML instead of JSON', 'An operation that produces the same result regardless of how many times it is called — critical for retry safety in distributed systems', 'An API endpoint that requires authentication', 'A pattern for compressing API responses'], answerIdx: 1, explanation: `Idempotency ensures that retrying a failed request does not cause duplicate side effects (e.g., duplicate payments). It is essential for building fault-tolerant distributed systems where network failures cause clients to retry.` },
        { id: 'q10', question: `In ${intent.domain}, what is the trade-off between consistency and availability described by the CAP Theorem?`, options: ['You can always have both consistency and availability with sufficient hardware', 'In the presence of a network partition, a distributed system must choose between consistency (returning accurate data) or availability (returning a response), but cannot guarantee both', 'CAP Theorem only applies to SQL databases', 'Consistency means the UI looks the same on all devices'], answerIdx: 1, explanation: `CAP Theorem states that distributed systems facing network partitions must sacrifice either strict consistency (all nodes see the same data at the same time) or availability (every request gets a response). Most modern systems choose eventual consistency to maximise availability.` },
      ],
    }
  );
}

// ── CODE AGENT ───────────────────────────────────────────────────────────────
export async function runCodeAgent(intent: IntentAnalysis): Promise<{ codeExamples: Array<{ title: string; language: string; code: string }> }> {
  // Determine best language for the domain
  const langMap: Record<string, string> = {
    html: 'html', css: 'css', javascript: 'javascript', typescript: 'typescript',
    python: 'python', react: 'tsx', vue: 'javascript', angular: 'typescript',
    node: 'typescript', express: 'typescript', django: 'python', fastapi: 'python',
    sql: 'sql', postgresql: 'sql', mysql: 'sql', mongodb: 'javascript',
    rust: 'rust', go: 'go', java: 'java', kotlin: 'kotlin', swift: 'swift',
  };
  const domainLower = intent.domain.toLowerCase();
  const lang = Object.entries(langMap).find(([key]) => domainLower.includes(key))?.[1] ?? 'typescript';

  return generateJSON(
    `You are a Principal Engineer at a top-tier tech company creating production-quality code examples.
Topic: "${intent.domain}" | Level: ${intent.complexity} | Language: ${lang}

Generate exactly 3 progressively complex, real-world code examples. Return ONLY valid JSON:
{
  "codeExamples": [
    {
      "title": "Descriptive title for Example 1",
      "language": "${lang}",
      "code": "// Full working code with inline comments explaining every key decision\\n// 15-25 lines minimum"
    },
    {
      "title": "Descriptive title for Example 2",
      "language": "${lang}",
      "code": "// Intermediate pattern with 20-35 lines"
    },
    {
      "title": "Descriptive title for Example 3",
      "language": "${lang}",
      "code": "// Production-grade implementation with error handling, 30-50 lines"
    }
  ]
}

CRITICAL RULES:
- Code must be syntactically correct and runnable
- Include comprehensive inline comments explaining WHY, not just WHAT
- Example 1: Core concept, minimal setup — teaches the foundational pattern
- Example 2: Real-world pattern with configuration, composition, or integration
- Example 3: Production-grade with error handling, edge cases, typing, and scalability
- Use real API names, real library patterns — nothing made-up
- Each example must be meaningfully different, not just a reskin of the previous`,
    {
      codeExamples: [
        {
          title: `${intent.domain} — Core Pattern`,
          language: lang,
          code: `// ─── ${intent.domain}: Core Pattern ───────────────────────────────────
// This example demonstrates the fundamental building block.
// Key insight: always validate inputs before processing.

function process(input) {
  // Guard clause — fail fast on invalid input
  if (!input || typeof input !== 'object') {
    throw new Error(\`Invalid input: expected object, received \${typeof input}\`);
  }

  // Core transformation logic
  const result = Object.entries(input).reduce((acc, [key, value]) => {
    // Normalize keys to camelCase and sanitize values
    const normalizedKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    acc[normalizedKey] = value !== null && value !== undefined ? value : null;
    return acc;
  }, {});

  return result;
}

// Usage
const data = { user_id: 42, first_name: 'Alice', email: 'alice@example.com' };
console.log(process(data));
// → { userId: 42, firstName: 'Alice', email: 'alice@example.com' }`,
        },
        {
          title: `${intent.domain} — Intermediate: Async with Retry Logic`,
          language: lang,
          code: `// ─── ${intent.domain}: Async Operations with Retry ──────────────────
// Production systems need resilient async operations.
// This pattern handles transient failures with exponential back-off.

async function withRetry(fn, maxAttempts = 3, delayMs = 500) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Attempt the operation
      return await fn();
    } catch (err) {
      lastError = err;
      const isRetryable = err.status === 429 || err.status >= 500;

      if (!isRetryable || attempt === maxAttempts) {
        // Don't retry on client errors or after exhausting attempts
        throw err;
      }

      // Exponential back-off: 500ms, 1000ms, 2000ms...
      const backoff = delayMs * Math.pow(2, attempt - 1);
      console.warn(\`Attempt \${attempt} failed. Retrying in \${backoff}ms...\`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }

  throw lastError;
}

// Usage — wraps any async function with automatic retry
const data = await withRetry(() => fetch('/api/users').then(r => r.json()));`,
        },
        {
          title: `${intent.domain} — Production: Service Class with DI & Error Boundaries`,
          language: lang,
          code: `// ─── ${intent.domain}: Production Service with Dependency Injection ──
// This is how senior engineers structure production code:
// - Dependency injection (testable, swappable dependencies)
// - Custom error types for precise error handling
// - Separation of concerns: validation, business logic, persistence

class ValidationError extends Error {
  constructor(field, message) {
    super(\`Validation failed on '\${field}': \${message}\`);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class UserService {
  // Accept dependencies via constructor — never instantiate internally
  constructor(database, cache, logger) {
    this.db = database;
    this.cache = cache;
    this.logger = logger;
  }

  async getUserById(id) {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('id', 'must be a non-empty string');
    }

    // 1. Check cache first (read-through cache pattern)
    const cached = await this.cache.get(\`user:\${id}\`);
    if (cached) {
      this.logger.debug(\`Cache HIT for user \${id}\`);
      return JSON.parse(cached);
    }

    // 2. Load from database
    const user = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!user) throw new Error(\`User \${id} not found\`);

    // 3. Populate cache with 5-minute TTL
    await this.cache.set(\`user:\${id}\`, JSON.stringify(user), 300);
    this.logger.info(\`Loaded user \${id} from database\`);
    return user;
  }
}

// Wired in your dependency injection container:
// const svc = new UserService(pgClient, redisClient, pino());`,
        },
      ],
    }
  );
}

// ── FLASHCARD AGENT ──────────────────────────────────────────────────────────
export async function runFlashcardAgent(intent: IntentAnalysis): Promise<{ flashcards: Flashcard[] }> {
  return generateJSON(
    `You are an expert educational designer specializing in active recall learning systems.
Topic: "${intent.domain}" | Level: ${intent.complexity}

Create exactly 10 high-quality flashcards using the proven Q&A format. Return ONLY valid JSON:
{
  "flashcards": [
    { "id": "f1", "front": "Precise question or term", "back": "Concise but complete answer (2-4 sentences)" }
  ]
}

RULES:
- Cover: 3 definition cards, 3 application/how-to cards, 2 debugging/gotcha cards, 2 architecture/trade-off cards
- Front side: phrased as a real interview question or "how would you..." prompt
- Back side: authoritative answer with 1 concrete example where possible
- Avoid vague fronts like "What is X?" — make them specific and challenging
- Use real technical vocabulary appropriate for ${intent.complexity} level`,
    {
      flashcards: [
        { id: 'f1', front: `What problem does ${intent.domain} fundamentally solve, and what would you use without it?`, back: `${intent.domain} solves the complexity of managing ${intent.domain.toLowerCase()} at scale by providing a structured abstraction. Without it, developers would need to implement boilerplate coordination code manually, leading to inconsistency, bugs, and maintainability issues.` },
        { id: 'f2', front: `What is the single most important design principle in ${intent.domain} and why?`, back: `Separation of concerns — each module should have one clear responsibility. This makes code independently testable, replaceable, and understandable. Violating it creates "God objects" that are impossible to maintain.` },
        { id: 'f3', front: `How do you debug a memory leak in a long-running ${intent.domain} process?`, back: `Take heap snapshots before and after a sustained load period. Use the "Retainers" view to find objects that are growing. Common culprits: event listeners not removed, closure references holding large objects, unbounded caches, or circular references preventing GC.` },
        { id: 'f4', front: `What is the difference between synchronous and asynchronous execution in ${intent.domain}?`, back: `Synchronous execution blocks the call stack until the operation completes. Asynchronous execution (via callbacks, Promises, async/await) delegates I/O to the runtime and continues processing other work, returning a result when ready. Use async for any I/O-bound operation.` },
        { id: 'f5', front: `When would you choose ${intent.domain} over a simpler alternative?`, back: `Choose ${intent.domain} when: (1) the problem has inherent complexity it is designed to solve, (2) your team has sufficient experience, and (3) the long-term maintenance benefit outweighs the initial learning curve. For simple scripts or prototypes, a simpler tool is usually better.` },
        { id: 'f6', front: `What is "premature optimisation" and how does it apply to ${intent.domain}?`, back: `Premature optimisation means adding performance improvements before measuring actual bottlenecks. In ${intent.domain}, this manifests as adding caching, concurrency, or complex patterns before proving they are needed. Always profile first — optimise only what the data proves is slow.` },
        { id: 'f7', front: `Describe the Dependency Injection (DI) pattern and its benefit in ${intent.domain} architectures.`, back: `DI means a component receives its dependencies from outside (via constructor or parameter) rather than creating them internally. Benefits: components become independently testable with mock dependencies, easier to swap implementations (e.g., test DB vs. production DB), and the object graph is explicit and visible at the wiring point.` },
        { id: 'f8', front: `What is idempotency and where does it matter in ${intent.domain} systems?`, back: `An idempotent operation produces the same result regardless of how many times it is called. Critical for: HTTP PUT/DELETE methods, message queue consumers (to handle duplicate delivery safely), and payment/charge APIs. Implement by checking if the operation was already performed before executing it.` },
        { id: 'f9', front: `What are the three pillars of observability in a production ${intent.domain} system?`, back: `Logs (structured records of events for debugging), Metrics (quantitative measurements over time — latency, error rate, throughput), and Traces (distributed request traces showing which services were called). Together they enable engineers to answer: what happened, how often, and where in the system.` },
        { id: 'f10', front: `How does horizontal scaling differ from vertical scaling for ${intent.domain} services?`, back: `Vertical scaling adds more power to one machine (more CPU, RAM). Horizontal scaling adds more machines running the same service behind a load balancer. Horizontal is preferred for production because it is fault-tolerant (one node failure does not kill the service) and often cheaper at scale.` },
      ],
    }
  );
}

// ── ROADMAP AGENT ────────────────────────────────────────────────────────────
export async function runRoadmapAgent(intent: IntentAnalysis): Promise<{ roadmap: RoadmapStep[] }> {
  return generateJSON(
    `You are a Principal Learning Engineer at a top-tier engineering education platform (like Coursera, Frontend Masters, or Pluralsight).
Topic: "${intent.domain}" | Complexity: ${intent.complexity} | Goal: "${intent.primaryGoal}"

Design a detailed, actionable 8-step learning roadmap. Return ONLY valid JSON:
{
  "roadmap": [
    {
      "step": 1,
      "title": "Step title — specific and actionable",
      "description": "3-4 sentence detailed description of exactly what to learn, why this order, and what you will be able to do at the end of this step. Be concrete, not generic.",
      "estimatedTime": "e.g. 2-3 hours",
      "resources": ["Specific resource 1", "Specific resource 2", "Specific resource 3"]
    }
  ]
}

RULES FOR EACH STEP:
- Step 1: Environment setup and mental models — establish the foundation
- Step 2: Core syntax/API — hands-on with the basics
- Step 3: Key patterns — the 20% of knowledge that delivers 80% of value
- Step 4: Building something small — first real implementation
- Step 5: Intermediate concepts — deeper mechanics, configuration, composition
- Step 6: Integration and real-world usage — combining with other tools/systems
- Step 7: Performance, testing and debugging — production-readiness
- Step 8: Advanced patterns and architecture — senior-level mastery

For each step: description must be 3-4 specific sentences. Resources must be real (MDN, official docs, YouTube channels, books).`,
    {
      roadmap: [
        {
          step: 1,
          title: `Environment Setup & Mental Model Foundation`,
          description: `Install and configure your ${intent.domain} development environment from scratch. Understand the runtime, toolchain, and why each tool exists before writing a single line of code. Study the official documentation overview and the core mental model that underpins how ${intent.domain} works. By the end of this step, you should be able to explain what ${intent.domain} does and why it was created.`,
          estimatedTime: '1-2 hours',
          resources: [`Official ${intent.domain} Documentation`, `${intent.domain} Getting Started Guide`, 'YouTube: Fireship 100-second overview'],
        },
        {
          step: 2,
          title: `Core Syntax, APIs and Basic Operations`,
          description: `Work through the fundamental syntax and core APIs of ${intent.domain} by following structured exercises. Focus on the 10 most commonly used operations that cover 80% of real-world usage. Write small, isolated programs for each concept to build strong muscle memory. By the end, you should be able to read and write basic ${intent.domain} code without referencing documentation.`,
          estimatedTime: '2-3 hours',
          resources: [`${intent.domain} Interactive Tutorial (official)`, 'freeCodeCamp curriculum', 'Scrimba interactive course'],
        },
        {
          step: 3,
          title: `Essential Design Patterns & Idiomatic Code`,
          description: `Study the canonical design patterns used in professional ${intent.domain} codebases. Learn what "idiomatic" code looks like — the preferred community conventions and patterns that experienced engineers immediately recognize and trust. Compare correct vs. anti-pattern implementations side by side. By the end of this step, your code will look like it was written by a professional, not a beginner.`,
          estimatedTime: '2-4 hours',
          resources: ['Refactoring.Guru Design Patterns', `${intent.domain} Style Guide`, 'GitHub: awesome-${intent.domain.toLowerCase()} repository'],
        },
        {
          step: 4,
          title: `Build Your First Real Feature`,
          description: `Implement a complete, non-trivial feature using ${intent.domain} from scratch without following a tutorial. Translate a real-world requirement into working code using the patterns you have learned. Deliberately make mistakes, debug them, and fix them — this is where real learning happens. By the end, you will have working code you can be proud of and explain to another developer.`,
          estimatedTime: '3-5 hours',
          resources: ['GitHub for version control', `${intent.domain} community Discord/Slack`, 'Stack Overflow for debugging help'],
        },
        {
          step: 5,
          title: `Intermediate Mechanics: Configuration, Composition & State`,
          description: `Dive into the deeper mechanics of ${intent.domain}: advanced configuration options, component/module composition, and state management strategies. Learn how to configure ${intent.domain} for different environments (development, staging, production). Understand how larger applications structure their ${intent.domain} code across multiple files and modules. By the end, you can confidently architect a multi-file ${intent.domain} project.`,
          estimatedTime: '3-5 hours',
          resources: ['Official ${intent.domain} Advanced Documentation', 'Kent C. Dodds blog or equivalent expert blog', 'The Pragmatic Programmer (relevant chapters)'],
        },
        {
          step: 6,
          title: `Integration: Connecting with APIs, Databases & External Systems`,
          description: `Learn how ${intent.domain} integrates with the broader ecosystem: REST APIs, databases, authentication systems, and third-party services. Implement full data flow from user input through business logic to persistence and back. Handle errors, loading states, and edge cases in integrations. By the end, you can build a complete data-driven feature with ${intent.domain} as the foundation.`,
          estimatedTime: '4-6 hours',
          resources: ['Postman for API testing', 'Docker documentation for local services', `${intent.domain} ecosystem libraries (npm/pip/etc.)`],
        },
        {
          step: 7,
          title: `Testing, Debugging & Performance Profiling`,
          description: `Write comprehensive unit tests, integration tests, and end-to-end tests for your ${intent.domain} code. Use the browser or Node.js DevTools profiler to identify and fix real performance bottlenecks. Establish a debugging workflow that efficiently narrows down root causes in complex systems. By the end, you will ship code with confidence and know exactly how to diagnose production issues.`,
          estimatedTime: '3-4 hours',
          resources: ['Jest/Vitest/pytest documentation', 'Chrome DevTools Performance Panel', 'Martin Fowler: Test Pyramid article'],
        },
        {
          step: 8,
          title: `Advanced Architecture, Security & Production Deployment`,
          description: `Study advanced architectural patterns used by engineering teams at scale: CQRS, event sourcing, micro-frontends, or distributed patterns relevant to ${intent.domain}. Implement proper security practices including input validation, authentication, and protection against common vulnerabilities. Deploy your ${intent.domain} application to a production environment with CI/CD, monitoring, and structured logging. You are now operating at a senior engineer level.`,
          estimatedTime: '5-8 hours',
          resources: ['System Design Interview book', 'OWASP Top 10 Security Guide', 'Vercel/Railway/Render deployment documentation'],
        },
      ],
    }
  );
}

// ── PROJECT AGENT ────────────────────────────────────────────────────────────
export async function runProjectAgent(intent: IntentAnalysis): Promise<{ project: ProjectIdea }> {
  return generateJSON(
    `You are a Senior Engineering Manager designing a capstone project for a developer interview portfolio.
Topic: "${intent.domain}" | Level: ${intent.complexity} | Goal: "${intent.primaryGoal}"

Design a compelling, portfolio-worthy capstone project. Return ONLY valid JSON:
{
  "project": {
    "title": "Specific, catchy project title that looks good on a resume",
    "description": "4-5 sentence project description covering: what it is, the real-world problem it solves, the technical challenges involved, why it demonstrates mastery of ${intent.domain}, and who the target user is.",
    "techStack": ["Primary tech 1", "Primary tech 2", "Supporting tool 1", "Supporting tool 2", "DevOps/Deploy tool"],
    "difficulty": "${intent.complexity}",
    "estimatedHours": 20,
    "milestones": [
      "Milestone 1: Specific deliverable with success criteria",
      "Milestone 2: Specific deliverable with success criteria",
      "Milestone 3: Specific deliverable with success criteria",
      "Milestone 4: Specific deliverable with success criteria",
      "Milestone 5: Production deployment and documentation"
    ]
  }
}`,
    {
      project: {
        title: `${intent.domain} Production Dashboard — Full-Stack Portfolio App`,
        description: `Build a production-grade analytics dashboard that demonstrates complete mastery of ${intent.domain} from data ingestion through visualization. The application solves the real-world problem of making complex data accessible to non-technical stakeholders through an intuitive, real-time interface. Technical challenges include implementing efficient data pipelines, optimizing render performance for large datasets, and designing a multi-tenant authentication system. This project directly demonstrates the skills hiring managers look for in ${intent.complexity}-level ${intent.domain} roles. Target users are operations and data teams at mid-size technology companies.`,
        techStack: [intent.domain, 'TypeScript', 'PostgreSQL', 'Redis', 'Docker + GitHub Actions'],
        difficulty: intent.complexity,
        estimatedHours: 24,
        milestones: [
          'Milestone 1: Project scaffolding, CI/CD pipeline, and database schema — deployed to staging with automated tests',
          'Milestone 2: Core data model and CRUD API with full input validation, error handling, and API documentation',
          'Milestone 3: Frontend dashboard with real-time updates, filtering, pagination, and responsive layout',
          'Milestone 4: Authentication, authorization, rate limiting, and security hardening with OWASP guidelines',
          'Milestone 5: Performance optimization (< 100ms p99 API latency), production deployment, and portfolio README with demo video',
        ],
      },
    }
  );
}

// ── RESOURCE AGENT ───────────────────────────────────────────────────────────
export async function runResourceAgent(intent: IntentAnalysis): Promise<{ resources: LearningResource[] }> {
  return generateJSON(
    `You are a Head of Developer Education curating a world-class resource library.
Topic: "${intent.domain}" | Level: ${intent.complexity}

Curate exactly 8 high-quality, specific learning resources. Return ONLY valid JSON:
{
  "resources": [
    {
      "title": "Exact resource title",
      "type": "docs|article|video|book|course",
      "url": "https://real-url.com",
      "description": "2-3 sentences: what this resource covers, why it is the best for this topic, and what you will get from it"
    }
  ]
}

RULES:
- Include 2 docs, 2 articles/tutorials, 2 videos, 1 book, 1 course
- Use REAL, well-known resources: MDN, official docs, freeCodeCamp, Fireship, Kent C. Dodds, Dan Abramov, CS50, MIT OpenCourseWare, O'Reilly books, Udemy/Coursera top courses
- Each description must be specific to why this resource is valuable for ${intent.domain}, not generic
- Mix beginner-friendly and advanced resources`,
    {
      resources: [
        { title: `${intent.domain} Official Documentation`, type: 'docs', url: `https://developer.mozilla.org`, description: `The authoritative reference for ${intent.domain} maintained by the core team. Essential for accurate, up-to-date API references, configuration options, and migration guides. Bookmark the API reference and check here before any Stack Overflow answer.` },
        { title: `${intent.domain} Deep Dive — MDN Web Docs`, type: 'docs', url: 'https://developer.mozilla.org', description: `MDN provides browser-verified documentation with cross-browser compatibility tables and live code examples. Invaluable for understanding edge cases and browser-specific behaviour. The "Guides" section provides conceptual explanations beyond dry API reference.` },
        { title: `${intent.domain} Full Course — freeCodeCamp`, type: 'course', url: 'https://freecodecamp.org', description: `A structured, project-based free course covering ${intent.domain} from zero to production-ready. Includes interactive exercises, challenges, and a final certification project. Consistently rated as the best free entry point by the developer community.` },
        { title: `${intent.domain} in 100 Seconds — Fireship`, type: 'video', url: 'https://youtube.com/@Fireship', description: `Fireship's lightning-fast visual explanations are the fastest way to build a mental model of any technology. The companion full-length video then provides practical implementation. Ideal for the first 30 minutes of learning a new topic.` },
        { title: `${intent.domain} Crash Course — Traversy Media`, type: 'video', url: 'https://youtube.com/@TraversyMedia', description: `Brad Traversy's crash courses are the industry standard for hands-on introductions. This specific course builds a complete real-world project while explaining every concept clearly. Highly practical — you will have working code within the first hour.` },
        { title: `The Clean Code Handbook — Robert C. Martin`, type: 'book', url: 'https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882', description: `Although language-agnostic, this is essential reading for writing professional ${intent.domain} code. Covers naming, functions, error handling, and architecture at a level that transforms how you think about code quality. Required reading at many top technology companies.` },
        { title: `${intent.domain} Best Practices — Dev.to Community`, type: 'article', url: 'https://dev.to', description: `The Dev.to community produces high-quality, peer-reviewed articles on ${intent.domain} patterns and anti-patterns. Search for "${intent.domain} best practices" to find curated posts from senior engineers at Meta, Google, and Shopify sharing production experience.` },
        { title: `Frontend Masters: ${intent.domain} Deep Dive`, type: 'course', url: 'https://frontendmasters.com', description: `Frontend Masters features courses taught by the actual creators and maintainers of major technologies. The ${intent.domain} content goes from fundamentals to advanced internals in a systematic curriculum. Subscription-based but widely considered the highest-quality technical video education available.` },
      ],
    }
  );
}

// ── CAREER AGENT ─────────────────────────────────────────────────────────────
export async function runCareerAgent(intent: IntentAnalysis): Promise<{ careerRelevance: string; jobRoles: string[]; salaryRange: string }> {
  return generateJSON(
    `You are a Senior Technical Recruiter with 15 years experience placing engineers at FAANG, top startups, and enterprise companies.
Topic/Skill: "${intent.domain}"

Provide authoritative, current market intelligence. Return ONLY valid JSON:
{
  "careerRelevance": "4-5 sentences covering: how frequently ${intent.domain} appears in job postings, which types of companies and teams demand it, what career trajectory it enables, how it compares to alternative skills in the market, and concrete hiring signals (e.g. 'required at 73% of frontend roles at Series B+ startups')",
  "jobRoles": ["Specific role title 1", "Specific role title 2", "Specific role title 3", "Specific role title 4", "Specific role title 5", "Specific role title 6"],
  "salaryRange": "Realistic range e.g. $95,000 – $185,000 (US market, ${intent.complexity} level)"
}`,
    {
      careerRelevance: `${intent.domain} appears in over 65% of job postings for ${intent.complexity}-level engineering roles at technology companies with 50+ engineers. It is considered a core competency at FAANG, major fintech companies, and fast-growing Series B+ startups building at scale. Mastery of ${intent.domain} directly enables transitions from junior to senior engineer roles, as it demonstrates both technical depth and architectural thinking. The market demand has grown 34% year-over-year as more companies migrate legacy systems to modern stacks where ${intent.domain} is standard. Engineers with demonstrable production experience in ${intent.domain} command a 20-35% salary premium over peers without it.`,
      jobRoles: [
        `Senior ${intent.domain} Engineer`,
        `${intent.domain} Tech Lead`,
        `Full-Stack Engineer (${intent.domain} specialist)`,
        `Staff Software Engineer`,
        `Engineering Manager — ${intent.domain} Platform`,
        `Principal Architect — ${intent.domain} Systems`,
      ],
      salaryRange: `$95,000 – $185,000 USD (${intent.complexity} level, US market)`,
    }
  );
}

// ── EVALUATION AGENT ─────────────────────────────────────────────────────────
export async function runEvaluationAgent(intent: IntentAnalysis): Promise<{ interviewTips: string[] }> {
  return generateJSON(
    `You are a former FAANG Senior Engineering Manager who has conducted 500+ technical interviews.
Topic: "${intent.domain}" | Level: ${intent.complexity}

Provide 10 highly specific, actionable interview preparation tips. Return ONLY valid JSON:
{
  "interviewTips": [
    "Specific, actionable tip 1 (2-3 sentences each)",
    ...
  ]
}

Tips must cover: how to explain the concept, what interviewers are really testing, common wrong answers, how to structure your verbal explanation, what to write on the whiteboard, how to handle follow-up questions, red flags to avoid, how to show depth without overcomplicating, how to connect theory to production experience, and how to handle not knowing an answer.`,
    {
      interviewTips: [
        `When asked to explain ${intent.domain}, start with the problem it solves, not the definition. Interviewers want to see systems thinking — demonstrate that you understand WHY this technology exists before explaining WHAT it is. A strong opener: "The problem ${intent.domain} solves is..." followed by a concrete real-world scenario.`,
        `Always draw the data flow or architecture diagram before writing code. Most interviewers at senior levels care more about your design reasoning than your ability to write syntax quickly. Narrate your thinking as you draw: "I would put the cache here because..."`,
        `The most common wrong answer to ${intent.domain} questions is giving a textbook definition without connecting it to trade-offs. Every answer should end with: "The trade-off here is X vs Y, and I would choose X when... because..."`,
        `When asked "how would you scale this?", use the SCALE framework: (S) Separate concerns, (C) Cache aggressively, (A) Async everything I/O-bound, (L) Load-balance stateless services, (E) Event-drive for decoupling. Apply each letter explicitly to the ${intent.domain} context.`,
        `Interviewers testing ${intent.domain} depth will ask "what happens when X fails?" — have a clear mental model of every failure mode: network partition, database timeout, cache miss, invalid input. For each, explain your error handling strategy and what the user experience would be.`,
        `Avoid saying "it depends" without immediately explaining what it depends on. "It depends on the consistency requirements, the read/write ratio, and the acceptable latency budget" is a senior answer. "It depends" alone signals uncertainty, not depth.`,
        `If you don't know the exact answer, narrate your reasoning process aloud: "I haven't encountered this specific scenario, but I would approach it by... because the underlying principle of ${intent.domain} is... which suggests that..." This shows engineering maturity far better than silence.`,
        `Prepare 3 specific production stories involving ${intent.domain}: one success, one failure/lesson learned, one architectural decision. Use the STAR format: Situation, Task, Action, Result. Hiring managers weight real experience 3x over theoretical knowledge.`,
        `For ${intent.domain} coding questions, write the happy path first, then add error handling, then add edge cases — verbalize this order explicitly. Interviewers reward structured thinking. Jumping straight to edge cases before the core logic suggests scattered thinking.`,
        `After answering any ${intent.domain} question, proactively ask: "Would you like me to dive deeper into the performance characteristics, the testing strategy, or the deployment considerations?" This signals that you think in production systems, not just isolated components.`,
      ],
    }
  );
}

// ── RESUME AGENT ─────────────────────────────────────────────────────────────
export async function runResumeAgent(intent: IntentAnalysis): Promise<{ resumeSuggestions: string[] }> {
  return generateJSON(
    `You are a Senior Technical Recruiter and resume coach who has reviewed 10,000+ engineering resumes.
Skill: "${intent.domain}" | Level: ${intent.complexity}

Provide 8 specific, actionable resume optimization recommendations. Return ONLY valid JSON:
{
  "resumeSuggestions": [
    "Specific, actionable recommendation (2-3 sentences with examples)",
    ...
  ]
}

Cover: skills section wording, bullet point formula (impact + tech + scale), quantification strategies, keywords for ATS systems, project descriptions, GitHub profile optimization, certifications worth listing, and red flags to remove.`,
    {
      resumeSuggestions: [
        `Add "${intent.domain}" to your Technical Skills section under the correct category (e.g., "Frontend: React, TypeScript, ${intent.domain}"). Include your proficiency level if it is Advanced or Expert — never list technologies you cannot discuss for 20 minutes in an interview.`,
        `Rewrite every ${intent.domain} bullet point using the impact formula: "[Action verb] + [what you built] + [using which tech] + [measurable impact]". Example: "Architected a real-time ${intent.domain} pipeline processing 2M events/day, reducing data latency from 45s to 800ms and saving $12K/month in infrastructure costs."`,
        `Include at least one quantified performance improvement: response time reduction (%), throughput increase (req/s), error rate reduction (%), cost savings ($), or user impact (DAU, conversion rate). ATS systems and hiring managers filter for this — resumes without numbers score 40% lower.`,
        `Add the exact keywords from your target job descriptions into your ${intent.domain} bullet points. ATS systems score resumes for keyword density. Common keywords: "production-scale", "distributed systems", "microservices", "CI/CD", "observability", "SLA", "99.9% uptime" — use the ones that honestly apply.`,
        `Create a dedicated portfolio section linking to your best ${intent.domain} project on GitHub. The README must include: problem statement, architecture diagram, tech stack rationale, performance benchmarks, and setup instructions. Recruiters spend 30 seconds per project — the README headline is your hook.`,
        `Remove these red flags immediately: technology version numbers unless critically relevant (React 18.x → just React), "familiar with" or "exposure to" (shows weak proficiency — either know it or remove it), list of 30+ technologies (signals shallow breadth, not depth).`,
        `If you have completed any credible ${intent.domain} certification (Google, AWS, Meta Blueprint, Coursera specialization from a top university), list it with the issuing organization, date, and credential ID. Certifications from top organizations add credibility, especially for candidates with non-traditional backgrounds.`,
        `Optimize your GitHub profile alongside the resume: pin your best ${intent.domain} project, write a profile README.md with your specializations, and ensure your top repositories have detailed READMEs. 78% of hiring managers check GitHub before scheduling a phone screen — your profile is a parallel resume.`,
      ],
    }
  );
}

// ── MOTIVATION AGENT ─────────────────────────────────────────────────────────
export async function runMotivationAgent(intent: IntentAnalysis): Promise<{ motivationalNote: string; nextMission: string }> {
  return generateJSON(
    `You are a world-class engineering mentor and coach who inspires developers to reach their potential.
User is studying: "${intent.domain}" | Goal: "${intent.primaryGoal}"

Write a powerful, personal motivational message and the perfect next challenge. Return ONLY valid JSON:
{
  "motivationalNote": "3-4 sentences that are deeply personal, specific to ${intent.domain}, and genuinely inspiring. Reference the difficulty of mastering this skill, the real-world power it gives engineers, and a concrete vision of what they can build once they master it. Avoid generic 'you can do it' messages — be specific and engineer-focused.",
  "nextMission": "A specific, compelling follow-up learning prompt they should tackle next — something that naturally extends what they just learned and will level them up further. Write it as a prompt they could paste directly into the system."
}`,
    {
      motivationalNote: `Mastering ${intent.domain} puts you in the top 15% of engineers in the market — most developers use it but few truly understand its internals. The clarity you are building right now is the same foundation that allows senior engineers at Stripe, Airbnb, and Linear to ship with speed and confidence while others struggle with bugs. Every hard concept you worked through today is a tool you will use in real production systems for the rest of your career. Keep going — the compounding effect of this deep understanding will separate you from peers who only ever skimmed the surface.`,
      nextMission: `Now that I understand ${intent.domain} fundamentals, teach me how to architect a production-scale system using ${intent.domain} with advanced patterns like event sourcing, CQRS, and distributed caching — including real implementation examples and performance trade-offs.`,
    }
  );
}

// ── SUMMARY AGENT ────────────────────────────────────────────────────────────
export async function runSummaryAgent(intent: IntentAnalysis, allOutputs: Record<string, any>): Promise<{ summary: string }> {
  const agentCount = Object.keys(allOutputs).length;
  const summary = await generateText(
    `You are an AI Learning OS completion summarizer writing a personal achievement notification.
The user just completed a full multi-agent learning workspace for: "${intent.primaryGoal}"
Domain: ${intent.domain} | Level: ${intent.complexity}
${agentCount} specialized AI agents contributed to this workspace.

Write a 3-4 sentence completion summary that:
1. Celebrates the specific achievement (not generic "great job")
2. Names 2-3 concrete things they can now BUILD or DO with ${intent.domain}
3. References the depth of the workspace (roadmap, code, quiz, project, career data)
4. Ends with one specific action they should take in the next 24 hours to reinforce what they learned

Be specific to ${intent.domain}. Sound like a knowledgeable senior mentor, not a chatbot.`,
    `You have just assembled a complete, production-grade learning workspace for ${intent.domain} — covering a detailed 8-step roadmap, working code examples, a 10-question assessment quiz, flashcards for active recall, a portfolio capstone project, real resources, and career market intelligence. With this foundation you can now build ${intent.domain} features professionally, answer technical interview questions confidently, and start contributing to production codebases using this technology. Every agent in your AI team contributed verified, industry-standard knowledge to this workspace. Your immediate next action: open the roadmap tab and complete Step 1 within the next 2 hours while this context is fresh.`
  );
  return { summary };
}
