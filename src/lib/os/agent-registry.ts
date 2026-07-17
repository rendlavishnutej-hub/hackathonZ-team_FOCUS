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
// Each function takes the shared context and returns structured output.

export async function runResearchAgent(intent: IntentAnalysis): Promise<{ notes: string }> {
  const notes = await generateText(
    `You are an expert Research Agent for an AI Learning OS.
Topic: "${intent.domain}"
Complexity level: ${intent.complexity}

Write comprehensive, educational notes on this topic.
Structure them with clear sections using these headers: Overview, Core Concepts, How It Works, Common Patterns, Best Practices, Common Mistakes.
Each section should be 2-4 paragraphs. Write for a ${intent.complexity} developer audience.
Use plain text, no markdown symbols, no code blocks.`,
    `Comprehensive notes on ${intent.domain} covering overview, core concepts, patterns, and best practices.`
  );
  return { notes };
}

export async function runCurriculumAgent(intent: IntentAnalysis): Promise<{ overview: string; estimatedTime: string; difficulty: string }> {
  return generateJSON(
    `You are a Curriculum Agent designing a learning experience.
Topic: "${intent.domain}" | Complexity: ${intent.complexity}

Return ONLY this JSON:
{
  "overview": "2-3 sentence engaging overview of what the learner will master",
  "estimatedTime": "e.g. 4-6 hours",
  "difficulty": "e.g. Intermediate"
}`,
    {
      overview: `Master the key concepts and practical applications of ${intent.domain}.`,
      estimatedTime: '3-5 hours',
      difficulty: intent.complexity.charAt(0).toUpperCase() + intent.complexity.slice(1),
    }
  );
}

export async function runDiagramAgent(intent: IntentAnalysis): Promise<{ conceptMap: ConceptNode[] }> {
  return generateJSON(
    `You are a Diagram Agent creating a concept map.
Topic: "${intent.domain}"

Return a JSON concept map with EXACTLY this shape:
{
  "conceptMap": [
    { "concept": "Main Topic", "children": ["Sub-concept A", "Sub-concept B", "Sub-concept C"] },
    { "concept": "Sub-concept A", "children": ["Detail 1", "Detail 2"] },
    { "concept": "Sub-concept B", "children": ["Detail 3", "Detail 4"] }
  ]
}

Create 5-8 nodes showing how concepts relate. First node is always the main topic.`,
    {
      conceptMap: [
        { concept: intent.domain, children: ['Core Concepts', 'Patterns', 'Applications'] },
        { concept: 'Core Concepts', children: ['Fundamentals', 'Theory'] },
        { concept: 'Patterns', children: ['Best Practices', 'Anti-patterns'] },
        { concept: 'Applications', children: ['Real-world Use Cases'] },
      ],
    }
  );
}

export async function runQuizAgent(intent: IntentAnalysis, notes?: string): Promise<{ quiz: QuizQuestion[] }> {
  return generateJSON(
    `You are a Quiz Agent generating assessment questions.
Topic: "${intent.domain}" | Level: ${intent.complexity}
${notes ? `Context:\n${notes.slice(0, 1000)}` : ''}

Generate exactly 5 multiple-choice questions. Return ONLY this JSON:
{
  "quiz": [
    {
      "id": "q1",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIdx": 0,
      "explanation": "Why this option is correct"
    }
  ]
}

Rules: answerIdx is 0-3. Make distractors plausible. Cover different aspects of the topic.`,
    {
      quiz: [
        {
          id: 'q1',
          question: `What is the primary purpose of ${intent.domain}?`,
          options: ['To solve specific programming problems efficiently', 'To make code look prettier', 'To slow down development', 'To replace existing tools'],
          answerIdx: 0,
          explanation: `${intent.domain} is designed to solve specific engineering problems efficiently.`,
        },
      ],
    }
  );
}

export async function runCodeAgent(intent: IntentAnalysis): Promise<{ codeExamples: Array<{ title: string; language: string; code: string }> }> {
  return generateJSON(
    `You are a Code Agent generating practical examples.
Topic: "${intent.domain}" | Level: ${intent.complexity}

Generate 3 progressively complex code examples. Return ONLY this JSON:
{
  "codeExamples": [
    { "title": "Basic Example", "language": "typescript", "code": "// well-commented code here" },
    { "title": "Intermediate Pattern", "language": "typescript", "code": "// more complex example" },
    { "title": "Advanced Implementation", "language": "typescript", "code": "// production-grade example" }
  ]
}

Rules: Use TypeScript unless another language is more appropriate. Add helpful comments. 10-30 lines each.`,
    {
      codeExamples: [
        { title: 'Basic Example', language: 'typescript', code: `// ${intent.domain} - Basic Example\nconsole.log("Hello from ${intent.domain}");` },
        { title: 'Intermediate Pattern', language: 'typescript', code: `// ${intent.domain} - Intermediate\nfunction example() {\n  return "intermediate";\n}` },
        { title: 'Advanced Implementation', language: 'typescript', code: `// ${intent.domain} - Advanced\nclass AdvancedExample {\n  execute() { return "production-ready"; }\n}` },
      ],
    }
  );
}

export async function runFlashcardAgent(intent: IntentAnalysis): Promise<{ flashcards: Flashcard[] }> {
  return generateJSON(
    `You are a Flashcard Agent creating study cards.
Topic: "${intent.domain}"

Create exactly 6 flashcards. Return ONLY this JSON:
{
  "flashcards": [
    { "id": "f1", "front": "Question or term", "back": "Answer or definition" }
  ]
}

Make cards concise and memorable. Cover key terms, concepts, and "gotchas".`,
    {
      flashcards: [
        { id: 'f1', front: `What is ${intent.domain}?`, back: `${intent.domain} is a fundamental concept in modern software development.` },
        { id: 'f2', front: `When should you use ${intent.domain}?`, back: 'When you need to solve specific engineering challenges efficiently.' },
      ],
    }
  );
}

export async function runProjectAgent(intent: IntentAnalysis): Promise<{ project: ProjectIdea }> {
  return generateJSON(
    `You are a Project Agent designing a hands-on project.
Topic: "${intent.domain}" | Level: ${intent.complexity}

Design a practical project. Return ONLY this JSON:
{
  "project": {
    "title": "Project title",
    "description": "2-3 sentence description",
    "techStack": ["Tech1", "Tech2", "Tech3"],
    "difficulty": "${intent.complexity}",
    "estimatedHours": 8,
    "milestones": ["Milestone 1", "Milestone 2", "Milestone 3", "Milestone 4"]
  }
}`,
    {
      project: {
        title: `${intent.domain} Showcase App`,
        description: `Build a production-ready application demonstrating core ${intent.domain} concepts.`,
        techStack: ['TypeScript', 'React', 'Node.js'],
        difficulty: intent.complexity,
        estimatedHours: 8,
        milestones: ['Setup & architecture', 'Core implementation', 'Testing & polish', 'Deploy & share'],
      },
    }
  );
}

export async function runResourceAgent(intent: IntentAnalysis): Promise<{ resources: LearningResource[] }> {
  return generateJSON(
    `You are a Resource Agent curating learning materials.
Topic: "${intent.domain}" | Level: ${intent.complexity}

Curate 5 high-quality resources. Return ONLY this JSON:
{
  "resources": [
    { "title": "Resource name", "type": "docs", "url": "https://example.com", "description": "Why this is useful" }
  ]
}

Types: article | video | book | course | docs
Include a mix of types. Recommend real, well-known resources (MDN, official docs, freeCodeCamp, etc.).`,
    {
      resources: [
        { title: `Official ${intent.domain} Documentation`, type: 'docs', url: 'https://developer.mozilla.org', description: 'The definitive reference.' },
        { title: `${intent.domain} Crash Course`, type: 'video', description: 'Quick video introduction to core concepts.' },
        { title: `${intent.domain} Best Practices`, type: 'article', description: 'Community-approved patterns and anti-patterns.' },
      ],
    }
  );
}

export async function runCareerAgent(intent: IntentAnalysis): Promise<{ careerRelevance: string; jobRoles: string[]; salaryRange: string }> {
  return generateJSON(
    `You are a Career Agent providing market insights.
Topic: "${intent.domain}"

Return ONLY this JSON:
{
  "careerRelevance": "2-3 sentences on how this skill impacts career and hiring",
  "jobRoles": ["Role 1", "Role 2", "Role 3", "Role 4"],
  "salaryRange": "e.g. $90k - $160k"
}`,
    {
      careerRelevance: `${intent.domain} is highly valued in the job market and appears in many senior engineering job descriptions.`,
      jobRoles: ['Software Engineer', 'Senior Developer', 'Tech Lead', 'Solutions Architect'],
      salaryRange: '$85k - $150k',
    }
  );
}

export async function runRoadmapAgent(intent: IntentAnalysis): Promise<{ roadmap: RoadmapStep[] }> {
  return generateJSON(
    `You are a Roadmap Agent creating a learning path.
Topic: "${intent.domain}" | Goal: ${intent.primaryGoal}

Create a 5-step learning roadmap. Return ONLY this JSON:
{
  "roadmap": [
    { "step": 1, "title": "Step title", "description": "What to do", "estimatedTime": "2 hours" }
  ]
}

Each step should build on the previous. Make it actionable and specific.`,
    {
      roadmap: [
        { step: 1, title: 'Foundation', description: `Learn the basics of ${intent.domain}`, estimatedTime: '2 hours' },
        { step: 2, title: 'Core Concepts', description: 'Dive into fundamental patterns', estimatedTime: '3 hours' },
        { step: 3, title: 'Practice', description: 'Build exercises and small projects', estimatedTime: '4 hours' },
        { step: 4, title: 'Advanced Topics', description: 'Explore edge cases and optimizations', estimatedTime: '3 hours' },
        { step: 5, title: 'Real-world Application', description: 'Build a production-grade project', estimatedTime: '6 hours' },
      ],
    }
  );
}

export async function runEvaluationAgent(intent: IntentAnalysis): Promise<{ interviewTips: string[] }> {
  return generateJSON(
    `You are an Interview Evaluation Agent.
Topic: "${intent.domain}" | For: technical interviews

Return ONLY this JSON:
{
  "interviewTips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"]
}

Tips should be specific, actionable advice for technical interviews about this topic.`,
    {
      interviewTips: [
        `Be able to explain ${intent.domain} from first principles`,
        'Walk through trade-offs clearly and confidently',
        'Provide real-world examples from experience',
        'Ask clarifying questions before diving into solutions',
        'Always discuss time and space complexity',
      ],
    }
  );
}

export async function runResumeAgent(intent: IntentAnalysis): Promise<{ resumeSuggestions: string[] }> {
  return generateJSON(
    `You are a Resume Agent optimizing professional profiles.
Skill: "${intent.domain}"

Return ONLY this JSON:
{
  "resumeSuggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3", "Suggestion 4"]
}

Each suggestion should be a specific resume bullet or keyword recommendation for this skill.`,
    {
      resumeSuggestions: [
        `Add "${intent.domain}" to your skills section with proficiency level`,
        `Include quantified achievements using ${intent.domain}`,
        'List specific projects that demonstrate this skill',
        'Add relevant certifications or courses completed',
      ],
    }
  );
}

export async function runMotivationAgent(intent: IntentAnalysis): Promise<{ motivationalNote: string; nextMission: string }> {
  return generateJSON(
    `You are a Motivation Agent for a learning platform.
User is studying: "${intent.domain}"

Return ONLY this JSON:
{
  "motivationalNote": "An inspiring, personal 1-2 sentence message about mastering this skill",
  "nextMission": "A specific follow-up topic they should explore next, as a short prompt"
}`,
    {
      motivationalNote: `Mastering ${intent.domain} will set you apart as an engineer who truly understands the craft. Keep going!`,
      nextMission: `Advanced patterns in ${intent.domain} and performance optimization`,
    }
  );
}

export async function runSummaryAgent(intent: IntentAnalysis, allOutputs: Record<string, any>): Promise<{ summary: string }> {
  const summary = await generateText(
    `You are a Summary Agent for an AI Learning OS.
The user asked: "${intent.primaryGoal}"

In 2-3 sentences, write a completion summary celebrating what they just learned and what they can do now.
Be encouraging and specific to ${intent.domain}.`,
    `You've successfully generated a complete learning workspace for ${intent.domain}. Your personalized roadmap, notes, code examples, and quiz are ready. Start with the roadmap and track your progress!`
  );
  return { summary };
}
