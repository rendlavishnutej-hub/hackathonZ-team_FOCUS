// ============================================================
// Resume Analyzer Agent
// ============================================================
// Extracts structured candidate information from raw resume
// text. Output is used by every other agent to personalise
// questions and evaluation throughout the interview.
// ============================================================

import { generateJSON, generateText } from '@/lib/gemini';
import type { ResumeProfile } from '@/lib/interview/types';

// ─── Fallback mock data ──────────────────────────────────────
function buildFallbackProfile(role: string): ResumeProfile {
  return {
    skills: ['Problem Solving', 'Communication', 'Teamwork'],
    technologies: ['TypeScript', 'React', 'Node.js', 'SQL'],
    projectHighlights: [
      'Built scalable web applications with React',
      'Developed REST APIs with Node.js and Express',
    ],
    experienceYears: 2,
    educationLevel: 'Bachelor\'s in Computer Science',
    strongAreas: ['Frontend Development', 'API Design', 'Agile Collaboration'],
    weakAreas: ['Distributed Systems', 'Cloud Infrastructure', 'Kubernetes'],
    summary: `Candidate has solid foundational skills in ${role}-related frontend and backend development. Potential gaps include large-scale distributed systems and cloud-native infrastructure.`,
  };
}

// ─── Main Agent Function ─────────────────────────────────────

/**
 * Analyzes the candidate's resume text and extracts a structured
 * ResumeProfile that informs all subsequent agents.
 */
export async function analyzeResume(
  resumeText: string,
  role: string
): Promise<ResumeProfile> {
  const fallback = buildFallbackProfile(role);

  if (!resumeText || resumeText.trim().length < 50) {
    return fallback;
  }

  const isGeminiAvailable = !!process.env.GEMINI_API_KEY;
  if (!isGeminiAvailable) return fallback;

  // Step 1: Extract structured profile
  const profile = await generateJSON<ResumeProfile>(
    `You are the Resume Analyzer Agent for a top-tier technical interview system.

TASK: Analyze the resume below for a candidate applying for "${role}".

Extract and return a JSON object with EXACTLY this structure:
{
  "skills": ["skill1", "skill2", ...],
  "technologies": ["tech1", "tech2", ...],
  "projectHighlights": ["brief description of notable project 1", "..."],
  "experienceYears": <number>,
  "educationLevel": "<degree> in <field>",
  "strongAreas": ["area1", "area2", "area3"],
  "weakAreas": ["gap1", "gap2", "gap3"],
  "summary": "2-3 sentence summary of candidate strengths and gaps relative to the ${role} role"
}

Rules:
- skills: soft and hard skills (max 10)
- technologies: programming languages, frameworks, tools (max 15)
- projectHighlights: most impressive projects (max 4, one sentence each)
- strongAreas: technical domains where candidate shows depth (max 5)
- weakAreas: gaps or areas not mentioned in resume for this role (max 5)
- summary: used verbatim in interview context, be specific and factual

RESUME:
${resumeText.slice(0, 4000)}`,
    fallback
  );

  // Step 2: Generate a human-readable summary string for prompt injection
  const summaryText = await generateText(
    `Based on this resume analysis for a ${role} candidate:
Skills: ${profile.skills.join(', ')}
Technologies: ${profile.technologies.join(', ')}
Strong Areas: ${profile.strongAreas.join(', ')}
Weak Areas: ${profile.weakAreas.join(', ')}
Experience: ${profile.experienceYears} years

Write 2 concise sentences summarizing this candidate's background for an interviewer. Be specific. No fluff.`,
    profile.summary
  );

  return {
    ...profile,
    summary: summaryText || profile.summary,
  };
}

/**
 * Builds the resume context string injected into LLM prompts.
 * Keeps it short enough to not bloat the context window.
 */
export function buildResumeContext(profile: ResumeProfile): string {
  if (!profile || !profile.skills.length) return 'No resume provided.';

  return [
    `Background: ${profile.summary}`,
    `Technologies: ${profile.technologies.slice(0, 8).join(', ')}`,
    `Strong Areas: ${profile.strongAreas.join(', ')}`,
    `Gaps to probe: ${profile.weakAreas.join(', ')}`,
    `Experience: ${profile.experienceYears} years`,
  ].join(' | ');
}
