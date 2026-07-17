/**
 * FOCUS Quiz Module — Recommendations Engine
 * AI-powered (Gemini) or rule-based recommendations from analytics data.
 */

import type { AnalyticsData, Recommendations, RecommendedTopic, SuggestedQuiz, Difficulty } from './types';

/**
 * Rule-based fallback recommendation generator.
 */
function generateRuleBasedRecommendations(analytics: AnalyticsData): Recommendations {
  // Topics to revise — weak areas sorted by lowest accuracy
  const topicsToRevise: RecommendedTopic[] = analytics.weakAreas.slice(0, 5).map(area => ({
    topicId: area.id,
    topicName: area.name,
    subjectName: '', // filled by caller if needed
    accuracy: area.accuracy,
    reason: `Accuracy is ${area.accuracy}% across ${area.attempted} questions — needs focused practice.`,
  }));

  // Suggested quizzes based on weak areas
  const suggestedQuizzes: SuggestedQuiz[] = analytics.weakAreas.slice(0, 3).map(area => ({
    subjectId: '',
    subjectName: '',
    topicId: area.id,
    topicName: area.name,
    difficulty: (area.accuracy < 30 ? 'easy' : area.accuracy < 50 ? 'medium' : 'hard') as Difficulty,
    reason: `Practice ${area.name} at ${area.accuracy < 30 ? 'easy' : area.accuracy < 50 ? 'medium' : 'hard'} difficulty to build confidence.`,
  }));

  // Learning resources (static curated)
  const learningResources = analytics.weakAreas.slice(0, 3).map(area => ({
    topic: area.name,
    resources: [
      `Review core concepts of "${area.name}" in your course materials`,
      `Practice 10 questions daily on "${area.name}"`,
      `Create flashcards for key formulas/definitions in "${area.name}"`,
    ],
  }));

  // Next steps summary
  let nextSteps = '';
  if (analytics.totalAttempts === 0) {
    nextSteps = 'Start your first quiz to get personalised recommendations! Pick any subject and topic to begin.';
  } else if (analytics.weakAreas.length === 0) {
    nextSteps = `Outstanding performance! You're scoring an average of ${analytics.averagePercentage}%. Try increasing the difficulty or exploring new topics to keep growing.`;
  } else {
    const weakest = analytics.weakAreas[0];
    const trend = analytics.improvementTrend;
    const improving = trend.length >= 2 && trend[trend.length - 1].percentage > trend[trend.length - 2].percentage;

    nextSteps = `Focus on "${weakest.name}" where your accuracy is ${weakest.accuracy}%. `;
    nextSteps += improving
      ? `Your scores are trending upward — keep the momentum going! `
      : `Your recent scores dipped — spend 15-20 minutes reviewing this topic today. `;
    nextSteps += `Current streak: ${analytics.quizStreak} day${analytics.quizStreak !== 1 ? 's' : ''}. `;
    nextSteps += analytics.quizStreak > 0
      ? `Don't break the streak!`
      : `Take a quiz today to start building a streak.`;
  }

  return { topicsToRevise, suggestedQuizzes, learningResources, nextSteps };
}

/**
 * Generate recommendations — tries Gemini first, falls back to rules.
 */
export async function generateRecommendations(analytics: AnalyticsData): Promise<Recommendations> {
  // Try AI-powered recommendations via Gemini
  try {
    const { generateJSON } = await import('@/lib/gemini');

    const prompt = `You are an AI learning coach. Based on the following quiz analytics for a student, generate personalised recommendations.

ANALYTICS:
- Total quizzes taken: ${analytics.totalAttempts}
- Average score: ${analytics.averagePercentage}%
- Quiz streak: ${analytics.quizStreak} days
- Weak areas: ${analytics.weakAreas.map(a => `${a.name} (${a.accuracy}%)`).join(', ') || 'None'}
- Strong areas: ${analytics.strongAreas.map(a => `${a.name} (${a.accuracy}%)`).join(', ') || 'None'}
- Recent trend: ${analytics.improvementTrend.slice(-5).map(t => `${t.date}: ${t.percentage}%`).join(', ') || 'No data'}

Return a JSON object with this exact structure:
{
  "topicsToRevise": [{"topicName": "...", "accuracy": 0, "reason": "..."}],
  "nextSteps": "A 2-3 sentence actionable summary for the student"
}

Keep advice specific, encouraging, and actionable. Maximum 3 topics to revise.`;

    const fallback = {
      topicsToRevise: [] as Array<{ topicName: string; accuracy: number; reason: string }>,
      nextSteps: '',
    };

    const aiResult = await generateJSON(prompt, fallback);

    // If we got a valid AI response, merge it with rule-based for completeness
    if (aiResult.nextSteps) {
      const ruleBased = generateRuleBasedRecommendations(analytics);
      return {
        ...ruleBased,
        topicsToRevise: aiResult.topicsToRevise.length > 0
          ? aiResult.topicsToRevise.map((t: any) => ({
              topicId: analytics.weakAreas.find(w => w.name === t.topicName)?.id || '',
              topicName: t.topicName,
              subjectName: '',
              accuracy: t.accuracy,
              reason: t.reason,
            }))
          : ruleBased.topicsToRevise,
        nextSteps: aiResult.nextSteps,
      };
    }
  } catch {
    // Gemini unavailable — fall through to rule-based
  }

  return generateRuleBasedRecommendations(analytics);
}
