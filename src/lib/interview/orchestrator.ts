// ============================================================
// Interview Orchestrator (Rewrite)
// ============================================================
// Thin state-machine coordinator that delegates all logic to
// specialized agent modules. Receives state, calls agents in
// the correct sequence, and returns updated state.
// ============================================================

import type {
  InterviewState,
  AgentLog,
  CandidateProfile,
  InterviewHistoryItem,
} from '@/lib/interview/types';

// Agents
import { analyzeResume, buildResumeContext } from './agents/resume-agent';
import { getCompanyProfile, getMaxQuestions } from './agents/company-agent';
import { createKnowledgeGraph, updateKnowledgeGraph, getStrongTopics, getWeakTopics, buildKnowledgeGraphSummary } from './agents/knowledge-graph';
import { evaluateAnswer } from './agents/evaluation-agent';
import { createAdaptiveDifficultyState, adjustDifficulty } from './agents/adaptive-difficulty';
import { buildConversationContext, hashQuestion } from './agents/memory-agent';
import { generateQuestion, generateOpeningQuestion } from './agents/question-agent';
import { formatForVoice } from './agents/voice-agent';
import { generateFinalReport } from './agents/report-agent';

// ─── Logging Helper ──────────────────────────────────────────

function log(
  logs: AgentLog[],
  agentId: string,
  message: string,
  status: AgentLog['status'] = 'info'
): AgentLog[] {
  return [
    ...logs,
    {
      agentId,
      timestamp: new Date().toISOString(),
      message,
      status,
    },
  ];
}

// ─── Create Initial State ────────────────────────────────────

export function createInitialState(params: {
  sessionId: string;
  role: string;
  company: string;
  difficulty: string;
  interviewType: string;
  resumeText?: string;
}): InterviewState {
  return {
    sessionId: params.sessionId,
    role: params.role,
    company: params.company,
    difficulty: params.difficulty,
    interviewType: params.interviewType,
    resumeText: params.resumeText,
    history: [],
    currentQuestionIndex: 0,
    maxQuestions: 8,  // will be overridden by company profile
    followUpCount: 0,
    hintsGiven: 0,
    questionHashes: [],
    activeAgentId: null,
    status: 'idle',
    logs: [],
  };
}

// ─── Turn 0: Initialize Interview ────────────────────────────

export async function initializeInterview(
  state: InterviewState
): Promise<InterviewState> {
  let s: InterviewState = { ...state, status: 'running', logs: [...state.logs] };

  try {
    // 1. Company Profile Agent
    s.logs = log(s.logs, 'company-agent', `Loading ${s.company} interview profile...`, 'info');
    s.activeAgentId = 'company-agent';
    const companyProfile = getCompanyProfile(s.company);
    s.companyProfile = companyProfile;
    s.maxQuestions = getMaxQuestions(companyProfile, s.interviewType);
    s.companyStyle = companyProfile.interviewStyle;
    s.logs = log(s.logs, 'company-agent', `${s.company} profile loaded. Style: ${companyProfile.interviewStyle.slice(0, 80)}...`, 'success');

    // 2. Resume Analyzer Agent
    s.logs = log(s.logs, 'resume-agent', 'Analyzing candidate resume...', 'info');
    s.activeAgentId = 'resume-agent';
    let resumeContext = '';
    const candidateProfile: CandidateProfile = {
      strongTopics: [],
      weakTopics: [],
      confidenceTrend: [],
      communicationTrend: [],
      hintsReceived: 0,
      scoreTrend: [],
      leadershipSignals: [],
      communicationNotes: [],
    };

    if (s.resumeText && s.resumeText.trim().length > 20) {
      const resumeProfile = await analyzeResume(s.resumeText, s.role);
      candidateProfile.resumeProfile = resumeProfile;
      resumeContext = buildResumeContext(resumeProfile);
      s.resumeAnalysis = resumeContext;
      s.logs = log(s.logs, 'resume-agent', `Resume analyzed. Skills: ${resumeProfile.skills.slice(0, 4).join(', ')}`, 'success');
    } else {
      s.logs = log(s.logs, 'resume-agent', 'No resume provided. Using generic context.', 'warning');
    }

    s.candidateProfile = candidateProfile;

    // 3. Knowledge Graph Init
    s.logs = log(s.logs, 'knowledge-graph', 'Initializing candidate knowledge graph...', 'info');
    s.activeAgentId = 'knowledge-graph';
    s.knowledgeGraph = createKnowledgeGraph();
    s.logs = log(s.logs, 'knowledge-graph', 'Knowledge graph initialized.', 'success');

    // 4. Adaptive Difficulty Init
    s.adaptiveDifficulty = createAdaptiveDifficultyState(s.difficulty);

    // 5. Question Generator Agent — first question
    s.logs = log(s.logs, 'question-agent', 'Generating opening question...', 'info');
    s.activeAgentId = 'question-agent';
    const opening = await generateOpeningQuestion(
      s.role,
      s.interviewType,
      s.difficulty,
      companyProfile,
      resumeContext
    );
    s.nextQuestion = opening.question;
    s.questionHashes = [hashQuestion(opening.question)];
    s.logs = log(s.logs, 'question-agent', `Opening question ready. Topic: ${opening.targetTopic}`, 'success');

    // 6. Voice Formatter Agent
    s.logs = log(s.logs, 'voice-agent', 'Formatting for speech...', 'info');
    s.activeAgentId = 'voice-agent';
    s.spokenPrompt = await formatForVoice(
      opening.question,
      0,
      false,
      undefined,
      undefined,
      companyProfile.name
    );
    s.logs = log(s.logs, 'voice-agent', 'Speech prompt ready.', 'success');

    s.activeAgentId = null;
    s.status = 'running';
    return s;

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    s.logs = log(s.logs, 'orchestrator', `Initialization error: ${errMsg}`, 'error');
    s.status = 'failed';
    s.activeAgentId = null;
    return s;
  }
}

// ─── Turn N: Process Candidate Answer ────────────────────────

export async function processAnswer(
  state: InterviewState,
  answer: string
): Promise<InterviewState> {
  let s: InterviewState = { ...state, status: 'running', logs: [...state.logs] };

  try {
    const currentQuestion = s.nextQuestion || 'Unknown question';
    const now = Date.now();

    // Record the answer in history
    const historyItem: InterviewHistoryItem = {
      question: currentQuestion,
      answer,
      isFollowUp: false,
      questionIndex: s.currentQuestionIndex,
      askedAt: s.history.length > 0
        ? (s.history[s.history.length - 1].answeredAt || now - 60000)
        : now - 60000,
      answeredAt: now,
    };

    // 1. Memory Agent — build context
    s.logs = log(s.logs, 'memory-agent', 'Building conversation context...', 'info');
    s.activeAgentId = 'memory-agent';
    const conversationContext = buildConversationContext(
      s.history,
      s.knowledgeGraph,
      s.candidateProfile
    );
    s.logs = log(s.logs, 'memory-agent', `Context built. ${s.history.length} turns in memory.`, 'success');

    // 2. Evaluation Agent — score the answer
    s.logs = log(s.logs, 'evaluation-agent', `Evaluating answer for Q${s.currentQuestionIndex + 1}...`, 'info');
    s.activeAgentId = 'evaluation-agent';
    const evaluation = await evaluateAnswer(
      currentQuestion,
      answer,
      s.role,
      s.adaptiveDifficulty?.currentLevel || s.difficulty,
      s.companyProfile,
      conversationContext
    );
    historyItem.evaluation = evaluation;
    s.lastEvaluation = evaluation;
    s.logs = log(s.logs, 'evaluation-agent', `Score: ${evaluation.score}/100. Topics: ${evaluation.topicsCovered.join(', ')}`, 'success');

    // 3. Knowledge Graph Update
    s.logs = log(s.logs, 'knowledge-graph', 'Updating knowledge graph...', 'info');
    s.activeAgentId = 'knowledge-graph';
    if (s.knowledgeGraph) {
      s.knowledgeGraph = updateKnowledgeGraph(
        s.knowledgeGraph,
        evaluation,
        s.currentQuestionIndex
      );
    }
    s.logs = log(s.logs, 'knowledge-graph', `Graph updated. ${Object.keys(s.knowledgeGraph || {}).length} topics tracked.`, 'success');

    // 4. Candidate Profile Update
    if (s.candidateProfile) {
      s.candidateProfile = {
        ...s.candidateProfile,
        confidenceTrend: [...s.candidateProfile.confidenceTrend, evaluation.confidence],
        communicationTrend: [...s.candidateProfile.communicationTrend, evaluation.communication],
        scoreTrend: [...s.candidateProfile.scoreTrend, evaluation.score],
        strongTopics: s.knowledgeGraph ? getStrongTopics(s.knowledgeGraph) : s.candidateProfile.strongTopics,
        weakTopics: s.knowledgeGraph ? getWeakTopics(s.knowledgeGraph) : s.candidateProfile.weakTopics,
        leadershipSignals: evaluation.leadershipSignals >= 70
          ? [...s.candidateProfile.leadershipSignals, `Q${s.currentQuestionIndex + 1}: Leadership signal detected`]
          : s.candidateProfile.leadershipSignals,
      };
    }

    // 5. Adaptive Difficulty
    let hintText: string | undefined;
    if (s.adaptiveDifficulty) {
      s.logs = log(s.logs, 'adaptive-difficulty', 'Checking difficulty adjustment...', 'info');
      s.activeAgentId = 'adaptive-difficulty';
      const diffResult = adjustDifficulty(
        s.adaptiveDifficulty,
        evaluation.score,
        s.currentQuestionIndex
      );
      s.adaptiveDifficulty = diffResult.updatedState;
      s.difficulty = diffResult.updatedState.currentLevel;
      if (diffResult.difficultyChanged) {
        s.logs = log(s.logs, 'adaptive-difficulty', `Difficulty adjusted to: ${diffResult.updatedState.currentLevel}`, 'warning');
      }
      if (diffResult.shouldHint) {
        hintText = diffResult.hintText;
        s.hintsGiven = (s.hintsGiven || 0) + 1;
        if (s.candidateProfile) {
          s.candidateProfile.hintsReceived = s.candidateProfile.hintsReceived + 1;
        }
      }
      s.logs = log(s.logs, 'adaptive-difficulty', `Current level: ${diffResult.updatedState.currentLevel}`, 'success');
    }

    // Push to history AFTER evaluation
    s.history = [...s.history, historyItem];
    s.currentQuestionIndex = s.currentQuestionIndex + 1;

    // 6. Check if interview should end
    if (s.currentQuestionIndex >= s.maxQuestions) {
      // Interview Complete — generate report
      s.logs = log(s.logs, 'report-agent', 'Generating final interview report...', 'info');
      s.activeAgentId = 'report-agent';
      const report = await generateFinalReport(s);
      s.finalReport = report;
      s.status = 'completed';
      s.activeAgentId = null;
      s.logs = log(s.logs, 'report-agent', `Report complete. Overall: ${report.overallScore}/100. Level: ${report.estimatedLevel}`, 'success');
      s.logs = log(s.logs, 'orchestrator', 'Interview session completed.', 'success');
      return s;
    }

    // 7. Question Generator Agent — next question
    s.logs = log(s.logs, 'question-agent', 'Generating next question...', 'info');
    s.activeAgentId = 'question-agent';

    const knowledgeGraphSummary = s.knowledgeGraph
      ? buildKnowledgeGraphSummary(s.knowledgeGraph)
      : 'No topics explored yet.';

    const nextQ = await generateQuestion(
      s.role,
      s.interviewType,
      s.adaptiveDifficulty?.currentLevel || s.difficulty,
      s.companyProfile,
      conversationContext,
      evaluation,
      s.followUpCount,
      s.currentQuestionIndex,
      s.questionHashes,
      knowledgeGraphSummary,
      hintText
    );

    s.nextQuestion = nextQ.question;
    s.questionHashes = [...s.questionHashes, hashQuestion(nextQ.question)];
    if (nextQ.isFollowUp) {
      s.followUpCount = s.followUpCount + 1;
    }
    historyItem.isFollowUp = nextQ.isFollowUp;
    s.logs = log(s.logs, 'question-agent', `Q${s.currentQuestionIndex + 1} ready. ${nextQ.isFollowUp ? 'Follow-up' : 'New topic'}: ${nextQ.targetTopic}`, 'success');

    // 8. Voice Formatter Agent
    s.logs = log(s.logs, 'voice-agent', 'Formatting for speech...', 'info');
    s.activeAgentId = 'voice-agent';
    s.spokenPrompt = await formatForVoice(
      nextQ.question,
      s.currentQuestionIndex,
      nextQ.isFollowUp,
      evaluation.score,
      hintText,
      s.companyProfile?.name
    );
    s.logs = log(s.logs, 'voice-agent', 'Speech prompt ready.', 'success');

    s.activeAgentId = null;
    s.status = 'running';
    return s;

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    s.logs = log(s.logs, 'orchestrator', `Processing error: ${errMsg}`, 'error');
    s.status = 'failed';
    s.activeAgentId = null;
    return s;
  }
}

// ─── Legacy Compatibility: runInterviewTurn ──────────────────
// Provides backward compatibility with the existing API route
// which sends `{ state, userMessage }` and expects the same
// shape back.

export async function runInterviewTurn(
  state: InterviewState,
  userMessage: string
): Promise<InterviewState> {
  // Turn 0: Initialize if no history and no current question
  if (state.history.length === 0 && !state.nextQuestion) {
    return initializeInterview(state);
  }

  // Turn N: Process answer
  return processAnswer(state, userMessage);
}
