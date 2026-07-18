import { GoogleGenerativeAI } from '@google/generative-ai';
import { AGENT_REGISTRY } from '@/lib/agents';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[FOCUS] GEMINI_API_KEY is not set in environment variables.');
}

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
export const ai = genAI;

export interface CareerMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

export interface CourseContextInput {
  id: string;
  title: string;
}

function generateMockGuidance(message: string, courses: CourseContextInput[]): string {
  const query = message.toLowerCase();
  let response = '';

  const courseList = courses.map(c => `**${c.title}**`).join(', ');
  const courseContextPhrase = courses.length > 0
    ? `Since you are currently studying ${courseList}, you are already building a strong foundation. `
    : '';

  if (query.includes('math') || query.includes('art') || query.includes('design')) {
    response = `Thank you for sharing your interest! Combining analytical/mathematical skills with creative artistic skills is a powerful combination. 

${courseContextPhrase}Here are some excellent career paths that bridge these two disciplines:

1. **UX/UI Developer & Designer**: Creating responsive, visually stunning web interfaces using technical styling and layouts.
2. **Game Developer**: Programming interactive simulations, game physics, and 3D graphics.
3. **Data Visualisation Specialist**: Designing dynamic graphs and charts that translate complex mathematics into accessible visual narratives.

**Recommended Next Steps:**
- Build a portfolio combining miniature project interfaces.
- Explore design libraries like Tailwind CSS or framer-motion.`;
  } else if (query.includes('program') || query.includes('code') || query.includes('tech') || query.includes('comput')) {
    response = `Programming and technology offer incredibly diverse career opportunities. 

${courseContextPhrase}Here are some prime technical pathways to explore:

1. **Full-Stack Software Engineer**: Specialising in building both user-facing client code and corresponding database systems.
2. **AI & Prompt Engineer**: Designing interfaces that interface with advanced model layers to build agent workflows.
3. **Cloud DevOps Specialist**: Managing high-performance deployment architectures.

**Recommended Next Steps:**
- Start by building small, end-to-end fullstack React applications.
- Learn version control tools (like Git) to manage your code deposits.`;
  } else if (query.includes('science') || query.includes('research') || query.includes('biol') || query.includes('chem')) {
    response = `A passion for science and research opens the door to high-impact career routes. 

${courseContextPhrase}Consider these path suggestions:

1. **Research & Development Coordinator**: Directing corporate or academic research teams to develop novel technologies.
2. **Bioinformatics Analyst**: Utilizing computing power to analyze complex biological data sequences.
3. **Technical Writer**: Documenting scientific papers and technical journals for the public.

**Recommended Next Steps:**
- Read recent journals in your topics of interest.
- Practice scripting languages like Python for data analysis.`;
  } else if (query.includes('business') || query.includes('start') || query.includes('manage') || query.includes('market')) {
    response = `Entrepreneurship and business management require a combination of strategic vision and tactical execution. 

${courseContextPhrase}Here are some highly recommended career trajectories:

1. **Technical Product Owner**: Leading engineering teams to plan and execute product backlogs.
2. **Growth Marketing Specialist**: Managing data-driven analytics campaigns to source new clients.
3. **Management Consultant**: Solving process-oriented problems for large business organizations.

**Recommended Next Steps:**
- Partner with developers to understand software workflow patterns.
- Read case study analyses on successful tech startups.`;
  } else {
    response = `I'm sorry, but as a Career AI Advisor, I am programmed to only assist with questions related to career guidance, professional development, and education. Please ask me a career-related question!`;
  }

  return response;
}

/**
 * Calls Gemini to generate career guidance based on user message, conversation history, and course context.
 */
export async function generateCareerGuidance(
  message: string,
  history: CareerMessageInput[] = [],
  courses: CourseContextInput[] = []
): Promise<string> {
  if (!genAI) {
    console.warn('[FOCUS Gemini Service] Gemini API key not found. Using simulated career guidance.');
    return generateMockGuidance(message, courses);
  }

  const systemInstruction = AGENT_REGISTRY.career?.systemPrompt || `You are a professional and friendly Career AI Advisor for a student planner application called FOCUS.
Your goal is to provide insightful, realistic, and encouraging career suggestions, guidance, and actionable next steps based on the student's questions, skills, and current courses.

CRITICAL GUARDRAILS:
1. You MUST ONLY answer questions related to career guidance, professional development, jobs, skills, or education.
2. If the user asks a question that is NOT related to career guidance or education (e.g., general chit-chat, coding help, math problems, politics, recipes), you MUST refuse to answer. 
3. When refusing, reply ONLY with a polite variation of: "I'm sorry, but as a Career AI Advisor, I am programmed to only assist with questions related to career guidance, professional development, and education. Please ask me a career-related question!" Do not attempt to answer the off-topic question.

Formatting Guidelines:
- Use bold text for key career titles or section highlights.
- Use bullet points or numbered lists where appropriate to make recommendations easy to read.
- Keep the tone encouraging, structured, and informative.
- If the student provides courses they are currently studying, try to connect your suggestions to how those courses help or how they can leverage them.`;

  // Build the contents array for the request including history and the new message
  const contents: any[] = [];
  
  // Add history to contents if any
  for (const h of history) {
    contents.push({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    });
  }

  // Build context prompt for the current message
  let currentPrompt = '';
  if (courses.length > 0) {
    const courseTitles = courses.map(c => c.title).join(', ');
    currentPrompt += `[Student's Current Courses: ${courseTitles}]\n\n`;
  }
  currentPrompt += `Student Question: ${message}`;

  contents.push({
    role: 'user',
    parts: [{ text: currentPrompt }],
  });

  const models = [
    'gemini-1.5-flash'
  ];

  let lastError: any = null;

  for (const modelName of models) {
    try {
      console.log(`[FOCUS Gemini Service] Trying model ${modelName} for career guidance...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });

      const response = await model.generateContent({
        contents,
        generationConfig: {
          temperature: 0.7,
        },
      });

      const reply = response.response.text();
      if (reply) {
        return reply;
      }
    } catch (error) {
      console.warn(`[FOCUS Gemini Service] Failed with model ${modelName}:`, error);
      lastError = error;
    }
  }

  console.warn('[FOCUS Gemini Service] All API model attempts failed. Falling back to simulated career guidance. Error was:', lastError);
  return generateMockGuidance(message, courses);
}

