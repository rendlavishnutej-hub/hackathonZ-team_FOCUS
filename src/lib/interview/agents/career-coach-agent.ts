// ============================================================
// Career Coach Agent
// ============================================================
// Post-interview generation of personalized learning roadmap,
// practice questions, resource recommendations, and timeline
// estimates for skill gap remediation.
// ============================================================

import { generateJSON } from '@/lib/gemini';
import type {
  CandidateProfile,
  CompanyProfile,
  KnowledgeGraph,
  RecommendedProject,
  LearningResource,
} from '@/lib/interview/types';
import { getWeakTopics, getStrongTopics } from './knowledge-graph';

// ─── Types ───────────────────────────────────────────────────
export interface CareerCoachOutput {
  learningRoadmap: string;
  recommendedProjects: RecommendedProject[];
  learningResources: LearningResource[];
  practiceQuestions: string[];
  learningTimeline: string;
  careerCoachFeedback: string;
  reInterviewRecommendation: string;
}

// ─── Fallback ────────────────────────────────────────────────
function buildFallbackCoachOutput(weakTopics: string[], role: string): CareerCoachOutput {
  return {
    learningRoadmap: `Focus on strengthening: ${weakTopics.slice(0, 3).join(', ') || 'core fundamentals'}. Start with foundational concepts, then build projects.`,
    recommendedProjects: [
      {
        title: `${role} Portfolio Project`,
        description: `Build a full-stack application that demonstrates your skills in ${weakTopics[0] || 'system design'}`,
        tech: ['TypeScript', 'React', 'Node.js'],
        estimatedWeeks: 3,
      },
      {
        title: 'Algorithm Practice Tracker',
        description: 'Build a tool that tracks your daily algorithm practice and shows progress',
        tech: ['Python', 'SQLite', 'Chart.js'],
        estimatedWeeks: 2,
      },
    ],
    learningResources: weakTopics.slice(0, 3).map((topic) => ({
      topic,
      resourceName: `${topic} Deep Dive Course`,
      type: 'Course' as const,
      priority: 'High' as const,
    })),
    practiceQuestions: [
      `Explain the core concepts of ${weakTopics[0] || 'distributed systems'} and their trade-offs.`,
      `Design a system that handles ${weakTopics[1] || 'high concurrency'}. Walk through your approach.`,
      `What are the best practices for ${weakTopics[2] || 'code quality'} in production?`,
    ],
    learningTimeline: '4-6 weeks of focused study',
    careerCoachFeedback: `Your interview showed solid fundamentals. To reach the next level, focus on ${weakTopics.slice(0, 2).join(' and ') || 'deepening your expertise'}.`,
    reInterviewRecommendation: 'Recommended to re-interview after 4-6 weeks of focused preparation.',
  };
}

// ─── Main Function ───────────────────────────────────────────

/**
 * Generates a comprehensive career coaching output based on
 * the candidate's interview performance.
 */
export async function generateCareerCoachOutput(
  role: string,
  company: string,
  overallScore: number,
  candidateProfile: CandidateProfile | undefined,
  knowledgeGraph: KnowledgeGraph | undefined,
  companyProfile: CompanyProfile | undefined,
  difficulty: string
): Promise<CareerCoachOutput> {
  const weakTopics = knowledgeGraph ? getWeakTopics(knowledgeGraph) : [];
  const strongTopics = knowledgeGraph ? getStrongTopics(knowledgeGraph) : [];
  const fallback = buildFallbackCoachOutput(weakTopics, role);

  const isGeminiAvailable = !!process.env.GEMINI_API_KEY;
  if (!isGeminiAvailable) return fallback;

  const profileContext = candidateProfile
    ? `Strong topics: ${candidateProfile.strongTopics.join(', ')}
Weak topics: ${candidateProfile.weakTopics.join(', ')}
Resume skills: ${candidateProfile.resumeProfile?.skills?.join(', ') || 'not provided'}
Experience: ${candidateProfile.resumeProfile?.experienceYears || 'unknown'} years`
    : 'No detailed profile available.';

  const prompt = `You are the Career Coach Agent for an AI interview system.

The candidate just completed a ${company} interview for ${role} at ${difficulty} difficulty.
Overall score: ${overallScore}/100.

CANDIDATE PROFILE:
${profileContext}

KNOWLEDGE MAP:
- Strong Topics: ${strongTopics.join(', ') || 'none identified'}
- Weak Topics: ${weakTopics.join(', ') || 'none identified'}

COMPANY CONTEXT:
${companyProfile ? `${companyProfile.name} prioritizes: ${companyProfile.questionPriorities.join(', ')}` : 'General interview'}

TASK: Generate a personalized career coaching output. Return a JSON object:
{
  "learningRoadmap": "<3-5 sentence structured learning plan, ordered by priority>",
  "recommendedProjects": [
    {
      "title": "<project name>",
      "description": "<1 sentence description>",
      "tech": ["tech1", "tech2"],
      "estimatedWeeks": <number>
    }
  ],
  "learningResources": [
    {
      "topic": "<topic>",
      "resourceName": "<specific course or book name — real names only>",
      "type": "Book|Course|Practice|Documentation",
      "priority": "High|Medium|Low"
    }
  ],
  "practiceQuestions": ["<question 1>", "<question 2>", "..."],
  "learningTimeline": "<e.g., '4-6 weeks to reach Senior bar at ${company}'>",
  "careerCoachFeedback": "<2-3 sentence personalized feedback>",
  "reInterviewRecommendation": "<when should they re-interview and what to focus on>"
}

RULES:
- recommendedProjects: 2-3 projects that directly address weak areas
- learningResources: 3-5 resources. Use REAL course/book names (e.g., "Designing Data-Intensive Applications", "MIT 6.824 Distributed Systems"). No URLs.
- practiceQuestions: 3-5 questions targeting their weakest areas
- Be specific, actionable, and encouraging
- Calibrate timeline to the gap between current score and target bar`;

  const result = await generateJSON<CareerCoachOutput>(prompt, fallback);

  return {
    learningRoadmap: result.learningRoadmap || fallback.learningRoadmap,
    recommendedProjects: Array.isArray(result.recommendedProjects) && result.recommendedProjects.length > 0
      ? result.recommendedProjects
      : fallback.recommendedProjects,
    learningResources: Array.isArray(result.learningResources) && result.learningResources.length > 0
      ? result.learningResources
      : fallback.learningResources,
    practiceQuestions: Array.isArray(result.practiceQuestions) && result.practiceQuestions.length > 0
      ? result.practiceQuestions
      : fallback.practiceQuestions,
    learningTimeline: result.learningTimeline || fallback.learningTimeline,
    careerCoachFeedback: result.careerCoachFeedback || fallback.careerCoachFeedback,
    reInterviewRecommendation: result.reInterviewRecommendation || fallback.reInterviewRecommendation,
  };
}
