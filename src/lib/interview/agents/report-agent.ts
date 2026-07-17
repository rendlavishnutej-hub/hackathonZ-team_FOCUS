// ============================================================
// Report Generator Agent
// ============================================================
// Compiles the final structured interview report from all
// agent outputs: evaluations, knowledge graph, candidate
// profile, career coach output.
// ============================================================

import { generateJSON } from '@/lib/gemini';
import type {
  InterviewState,
  FinalReport,
  EvaluationResult,
  CompanyProfile,
} from '@/lib/interview/types';
import { getStrongTopics, getWeakTopics } from './knowledge-graph';
import { generateCareerCoachOutput, type CareerCoachOutput } from './career-coach-agent';

// ─── Helpers ─────────────────────────────────────────────────

function computeAverage(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function computeWeightedScore(
  evaluations: EvaluationResult[],
  weights: CompanyProfile['evaluationWeights'] | undefined
): number {
  if (evaluations.length === 0) return 0;

  const w = weights || { technical: 30, behavioral: 25, communication: 20, leadership: 10, problemSolving: 15 };

  const avgTechnical = computeAverage(evaluations.map((e) => e.technicalAccuracy));
  const avgBehavioral = computeAverage(evaluations.map((e) => e.professionalism));
  const avgCommunication = computeAverage(evaluations.map((e) => e.communication));
  const avgLeadership = computeAverage(evaluations.map((e) => e.leadershipSignals));
  const avgProblemSolving = computeAverage(evaluations.map((e) => e.problemSolving));

  return Math.round(
    (avgTechnical * w.technical +
     avgBehavioral * w.behavioral +
     avgCommunication * w.communication +
     avgLeadership * w.leadership +
     avgProblemSolving * w.problemSolving) / 100
  );
}

function estimateLevel(overallScore: number, difficulty: string): FinalReport['estimatedLevel'] {
  if (difficulty === 'Expert' && overallScore >= 80) return 'Staff';
  if (difficulty === 'Expert' && overallScore >= 90) return 'Principal';
  if (overallScore >= 85) return 'Senior';
  if (overallScore >= 70) return 'Mid';
  if (overallScore >= 55) return 'Junior';
  return 'Intern';
}

function computeProbability(overallScore: number, companyProfile?: CompanyProfile): number {
  // Base probability from score
  let probability = Math.max(0, Math.min(100, Math.round(overallScore * 0.85 + 8)));

  // Company adjustment (top companies are harder)
  const topTier = ['Google', 'Meta', 'Apple', 'OpenAI', 'NVIDIA'];
  if (companyProfile && topTier.includes(companyProfile.name)) {
    probability = Math.max(0, probability - 10);
  }

  return Math.min(100, Math.max(0, probability));
}

// ─── Main Function ───────────────────────────────────────────

/**
 * Generates the complete final interview report.
 */
export async function generateFinalReport(
  state: InterviewState
): Promise<FinalReport> {
  const evaluations = state.history
    .map((h) => h.evaluation)
    .filter((e): e is EvaluationResult => !!e);

  const overallScore = state.companyProfile
    ? computeWeightedScore(evaluations, state.companyProfile.evaluationWeights)
    : computeAverage(evaluations.map((e) => e.score));

  const strongAreas = state.knowledgeGraph
    ? getStrongTopics(state.knowledgeGraph)
    : evaluations.flatMap((e) => e.topicsCovered).filter((_, i, a) => a.indexOf(_) === i).slice(0, 5);

  const weakAreas = state.knowledgeGraph
    ? getWeakTopics(state.knowledgeGraph)
    : [];

  const confidenceTrend = state.candidateProfile?.confidenceTrend || evaluations.map((e) => e.confidence);
  const scoreTrend = state.candidateProfile?.scoreTrend || evaluations.map((e) => e.score);

  // Career Coach output
  let coachOutput: CareerCoachOutput;
  try {
    coachOutput = await generateCareerCoachOutput(
      state.role,
      state.company,
      overallScore,
      state.candidateProfile,
      state.knowledgeGraph,
      state.companyProfile,
      state.difficulty
    );
  } catch {
    coachOutput = {
      learningRoadmap: 'Focus on strengthening your weak areas identified above.',
      recommendedProjects: [],
      learningResources: [],
      practiceQuestions: [],
      learningTimeline: '4-6 weeks',
      careerCoachFeedback: 'Good effort. Continue practicing and building projects.',
      reInterviewRecommendation: 'Re-interview after focused preparation on weak areas.',
    };
  }

  // Skill radar
  const skillRadar = {
    communication: computeAverage(evaluations.map((e) => e.communication)),
    technical: computeAverage(evaluations.map((e) => e.technicalAccuracy)),
    behavioral: computeAverage(evaluations.map((e) => e.professionalism)),
    confidence: computeAverage(evaluations.map((e) => e.confidence)),
    problemSolving: computeAverage(evaluations.map((e) => e.problemSolving)),
  };

  const leadershipScore = computeAverage(evaluations.map((e) => e.leadershipSignals));
  const behavioralScore = computeAverage(evaluations.map((e) => e.professionalism));
  const companyReadiness = Math.round(overallScore / 10); // 0-10 scale
  const probabilityOfSelection = computeProbability(overallScore, state.companyProfile);
  const estimatedLvl = estimateLevel(overallScore, state.difficulty);

  // Time analysis
  const answeredItems = state.history.filter((h) => h.askedAt && h.answeredAt);
  const avgResponseTime = answeredItems.length > 0
    ? Math.round(answeredItems.reduce((sum, h) => sum + ((h.answeredAt! - h.askedAt) / 1000), 0) / answeredItems.length)
    : 0;
  const timeAnalysis = avgResponseTime > 0
    ? `Average response time: ${avgResponseTime}s. ${avgResponseTime < 30 ? 'Quick responder — good pace.' : avgResponseTime < 90 ? 'Moderate pace — room for improvement.' : 'Slow responses — practice thinking aloud to reduce silence.'}`
    : 'Response time data not available.';

  // Try to enhance with Gemini
  let topicsToLearn = weakAreas.slice(0, 5);
  if (process.env.GEMINI_API_KEY && weakAreas.length > 0) {
    try {
      const enhancedTopics = await generateJSON<{ topics: string[] }>(
        `Given these weak interview topics: ${weakAreas.join(', ')}
For a ${state.role} at ${state.company}, list the 5 most important specific sub-topics to study.
Return: { "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"] }`,
        { topics: weakAreas.slice(0, 5) }
      );
      topicsToLearn = enhancedTopics.topics || topicsToLearn;
    } catch {
      // Use fallback
    }
  }

  return {
    overallScore,
    skillRadar,
    leadershipScore,
    behavioralScore,
    companyReadiness,
    probabilityOfSelection,
    estimatedLevel: estimatedLvl,
    confidenceTrend,
    scoreTrend,
    timeAnalysis,
    strongAreas,
    weakAreas,
    topicsToLearn,
    recommendedProjects: coachOutput.recommendedProjects,
    learningResources: coachOutput.learningResources,
    practiceQuestions: coachOutput.practiceQuestions,
    careerCoachFeedback: coachOutput.careerCoachFeedback,
    reInterviewRecommendation: coachOutput.reInterviewRecommendation,
    learningTimeline: coachOutput.learningTimeline,
  };
}
