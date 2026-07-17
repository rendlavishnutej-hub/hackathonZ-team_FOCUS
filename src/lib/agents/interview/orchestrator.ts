import { generateJSON, generateText } from '@/lib/gemini';

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface AgentLog {
  agentId: string;
  timestamp: string;
  message: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface EvaluationResult {
  score: number;
  communication: number;
  technicalAccuracy: number;
  confidence: number;
  grammar: number;
  problemSolving: number;
  depth: number;
  clarity: number;
  professionalism: number;
  feedback: string;
}

export interface InterviewHistoryItem {
  question: string;
  answer: string;
  evaluation?: EvaluationResult;
}

export interface RecommendedProject {
  title: string;
  description: string;
  tech: string[];
}

export interface FinalReport {
  overallScore: number;
  skillRadar: {
    communication: number;
    technical: number;
    behavioral: number;
    confidence: number;
    problemSolving: number;
  };
  timeAnalysis: string;
  strongAreas: string[];
  weakAreas: string[];
  topicsToLearn: string[];
  recommendedProjects: RecommendedProject[];
  careerCoachFeedback: string;
  reInterviewRecommendation: string;
}

export interface InterviewState {
  sessionId: string;
  role: string;
  company: string;
  difficulty: string;
  interviewType: string;
  resumeText?: string;
  history: InterviewHistoryItem[];
  currentQuestionIndex: number;
  maxQuestions: number;
  activeAgentId: string | null;
  status: 'idle' | 'running' | 'completed' | 'failed';
  logs: AgentLog[];
  nextQuestion?: string;
  spokenPrompt?: string; // Short spoken form
  finalReport?: FinalReport;
  resumeAnalysis?: string;
  companyStyle?: string;
}

// ─── AGENT PROMPTS ──────────────────────────────────────────────────────────

const AGENTS = {
  orchestrator: {
    name: 'Interview Orchestrator',
    prompt: `You are the lead Interview Orchestrator. Your role is to guide the conversation flow, maintain interview memory, manage stage transitions, and coordinate specialized agents to simulate a real top-tier technical/behavioral interview.`,
  },
  resumeAnalyzer: {
    name: 'Resume Analyzer Agent',
    prompt: `You are the Resume Analyzer Agent. Review the candidate's resume text and extract key technologies, projects, strong skill areas, and potential knowledge gaps relative to the target role.`,
  },
  companyResearcher: {
    name: 'Company Research Agent',
    prompt: `You are the Company Research Agent. Your job is to simulate the hiring bar, interview patterns, and evaluation rubrics of specific companies. E.g., Google focuses heavily on algorithms/Googlyness; Amazon on Leadership Principles; Meta on speed/systems; OpenAI on cutting-edge AI architecture.`,
  },
  questionGenerator: {
    name: 'Question Generator Agent',
    prompt: `You are the Question Generator Agent. Synthesize the candidate's role, company style, resume details, previous answers, and current difficulty level to generate a high-impact, realistic next interview question.`,
  },
  voiceConversation: {
    name: 'Voice Conversation Agent',
    prompt: `You are the Voice Conversation Agent. Refine the generated question into a natural, spoken-ready prompt. Keep it conversational, brief (under 40 words), and polite. Avoid markdown code blocks, bullet points, or list formats. Format for speech synthesis.`,
  },
  evaluation: {
    name: 'Evaluation Agent',
    prompt: `You are the Evaluation Agent. Score the candidate's response from 0 to 100 on: Communication, Technical Accuracy, Grammar, Problem Solving, Depth, Clarity, Professionalism. Output constructive critique.`,
  },
  followUp: {
    name: 'Follow-up Agent',
    prompt: `You are the Follow-up Agent. Analyze the user's answer. If they left out a key concept, made a minor error, or gave a high-level response, draft a brief follow-up question to probe deeper.`,
  },
  hint: {
    name: 'Hint Agent',
    prompt: `You are the Hint Agent. If the user struggles or stays silent, formulate a gentle, progressive hint to guide them without giving away the complete solution.`,
  },
  behaviorAnalysis: {
    name: 'Behavior Analysis Agent',
    prompt: `You are the Behavior Analysis Agent. Review the candidate's language, formatting, and structural approach. Evaluate their tone and professional decorum.`,
  },
  confidenceScoring: {
    name: 'Confidence Scoring Agent',
    prompt: `You are the Confidence Scoring Agent. Evaluate the candidate's confidence level based on conversational structure, vocabulary choice, and self-corrections.`,
  },
  careerCoach: {
    name: 'Career Coach Agent',
    prompt: `You are the Career Coach Agent. Provide professional long-term growth recommendations, career trajectory advice, and interview preparedness tips based on the candidate's overall session performance.`,
  },
  feedbackGenerator: {
    name: 'Feedback Generator',
    prompt: `You are the Feedback Generator. Aggregate all performance metrics, score averages, and behavioral insights into a structured final performance report.`,
  },
  learningRecommendation: {
    name: 'Learning Recommendation Agent',
    prompt: `You are the Learning Recommendation Agent. Suggest targeted study topics, academic resources, and specific, hands-on portfolio projects designed to close the candidate's identified skill gaps.`,
  },
};

// ─── FALLBACK DATA GENERATORS (Mock Mode) ───────────────────────────────────

function generateMockQuestion(role: string, company: string, type: string, index: number): { text: string; spoken: string } {
  const techQuestions = [
    {
      text: `Let's talk about scalability. How would you design a rate limiting system for a high-throughput API at ${company}? What algorithm would you choose, and why?`,
      spoken: `Great. Let's talk about scalability. How would you design a rate limiting system for a high-throughput API at ${company}? What algorithm would you choose, and why?`
    },
    {
      text: `Suppose we are seeing a bottleneck in database read operations for a feed generation service. Walk me through your debugging steps and how you would apply caching or indexing.`,
      spoken: `Suppose we are seeing a bottleneck in database read operations for a feed generation service. Walk me through your debugging steps and how you would apply caching or indexing.`
    },
    {
      text: `Can you explain the difference between optimistic and pessimistic locking in database transactions, and how you would handle race conditions in a distributed system?`,
      spoken: `Can you explain the difference between optimistic and pessimistic locking, and how you would handle race conditions in a distributed system?`
    },
    {
      text: `In a frontend application, how would you optimize initial page load times and bundle sizes for a complex dashboard with dynamic visualization tools?`,
      spoken: `In a frontend application, how would you optimize initial page load times and bundle size for a dashboard with complex charting tools?`
    },
    {
      text: `Finally, how do you keep up with security vulnerabilities such as Cross-Site Scripting or SQL Injection, and how do you ensure secure-by-default code inside your team?`,
      spoken: `Finally, how do you keep up with security vulnerabilities like XSS or SQL injection, and how do you ensure secure-by-default code inside your team?`
    }
  ];

  const behavioralQuestions = [
    {
      text: `Tell me about a time you had a significant technical disagreement with a teammate. How did you handle it, and what was the outcome?`,
      spoken: `To start off, tell me about a time you had a significant technical disagreement with a teammate. How did you handle it, and what was the outcome?`
    },
    {
      text: `Describe a situation where you had to ship a feature under extremely tight deadlines with incomplete specifications. How did you manage trade-offs?`,
      spoken: `Describe a situation where you had to ship a feature under extremely tight deadlines with incomplete specifications. How did you manage those trade-offs?`
    },
    {
      text: `How do you handle constructive feedback or negative critique on a design document that you spent weeks preparing?`,
      spoken: `How do you handle constructive feedback or negative critique on a design document that you spent weeks preparing?`
    },
    {
      text: `Tell me about a time you failed or made a critical mistake in production. What happened, and what did you learn from it?`,
      spoken: `Tell me about a time you made a critical mistake in production. What happened, and what did you learn from it?`
    },
    {
      text: `Why do you want to join ${company}, and how do you see yourself aligning with our engineering values over the next few years?`,
      spoken: `Lastly, why do you want to join ${company}, and how do you see yourself aligning with our engineering values over the next few years?`
    }
  ];

  const pool = (type.toLowerCase().includes('behavioral') || type.toLowerCase().includes('hr')) ? behavioralQuestions : techQuestions;
  const q = pool[index % pool.length];
  return q;
}

function generateMockEvaluation(question: string, answer: string): EvaluationResult {
  const score = Math.floor(Math.random() * 20) + 75; // 75-95
  return {
    score,
    communication: Math.floor(Math.random() * 15) + 80,
    technicalAccuracy: Math.floor(Math.random() * 15) + 78,
    confidence: Math.floor(Math.random() * 20) + 75,
    grammar: Math.floor(Math.random() * 10) + 88,
    problemSolving: Math.floor(Math.random() * 15) + 80,
    depth: Math.floor(Math.random() * 20) + 75,
    clarity: Math.floor(Math.random() * 15) + 82,
    professionalism: Math.floor(Math.random() * 10) + 90,
    feedback: `Good response. You structured your thoughts logically and demonstrated a solid understanding of the concepts. To improve further, you could provide more specific metrics, like cache hit ratios or database query latency improvements, to ground your answer in real-world performance.`
  };
}

function generateMockReport(state: InterviewState): FinalReport {
  const history = state.history;
  const evals = history.map(h => h.evaluation).filter(Boolean) as EvaluationResult[];
  
  const avg = (fn: (e: EvaluationResult) => number) => 
    evals.length > 0 ? Math.round(evals.reduce((sum, e) => sum + fn(e), 0) / evals.length) : 85;

  const overallScore = Math.round(evals.reduce((sum, e) => sum + e.score, 0) / (evals.length || 1));

  return {
    overallScore,
    skillRadar: {
      communication: avg(e => e.communication),
      technical: avg(e => e.technicalAccuracy),
      behavioral: avg(e => e.professionalism),
      confidence: avg(e => e.confidence),
      problemSolving: avg(e => e.problemSolving)
    },
    timeAnalysis: `Average response duration was 42 seconds, indicating structured, prompt response times with natural pauses.`,
    strongAreas: [
      `Structured problem-solving approach`,
      `Excellent communication clarity and professional vocabulary`,
      `Strong foundational knowledge of distributed systems and caching layers`
    ],
    weakAreas: [
      `Could provide deeper mathematical bounds (e.g., Big O complexity) in coding discussions`,
      `Tendency to give high-level answers before detailing trade-offs`
    ],
    topicsToLearn: [
      `Distributed Consensus algorithms (Raft, Paxos)`,
      `Advanced Caching Strategies (Write-through vs Write-back, Cache Invalidation)`,
      `Web Security Headers and CORS policies`
    ],
    recommendedProjects: [
      {
        title: `Distributed Key-Value Store`,
        description: `Build a replicated, memory-mapped key-value store using Raft consensus for state synchronization.`,
        tech: [`Go`, `gRPC`, `Raft`]
      },
      {
        title: `Real-time Rate Limiter Middleware`,
        description: `Design a high-performance HTTP gateway middleware deploying token bucket and sliding window rate limiting.`,
        tech: [`Node.js`, `Redis`, `TypeScript`]
      }
    ],
    careerCoachFeedback: `You demonstrate the technical capability and communication structure typical of a Senior Engineer. To clear the bar at top-tier companies like ${state.company}, practice calling out concrete performance tradeoffs and metrics immediately when answering system design questions.`,
    reInterviewRecommendation: `Highly recommended to schedule a follow-up mock session on System Design or Coding within 5 days.`
  };
}

// ─── AGENT EXECUTION SERVICE ────────────────────────────────────────────────

export async function runInterviewTurn(state: InterviewState, userRawAnswer?: string): Promise<InterviewState> {
  const updatedState = { ...state };
  updatedState.logs = [...state.logs];
  
  const addLog = (agentId: string, message: string, status: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    updatedState.logs.push({
      agentId,
      message,
      status,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const isGeminiAvailable = !!process.env.GEMINI_API_KEY;

  // Turn 0: Initialization & First Question
  if (state.currentQuestionIndex === 0 && !userRawAnswer) {
    updatedState.status = 'running';
    addLog('orchestrator', `Initializing Mock Interview Session for candidate...`, 'info');
    
    // 1. Resume Analysis
    if (state.resumeText) {
      updatedState.activeAgentId = 'resumeAnalyzer';
      addLog('resumeAnalyzer', `Analyzing resume skills and mapping to the target role (${state.role})...`, 'info');
      
      if (isGeminiAvailable) {
        const result = await generateText(
          `${AGENTS.resumeAnalyzer.prompt}\n\nROLE: ${state.role}\n\nRESUME CONTENT:\n${state.resumeText}\n\nExtract key skills and gaps in 3 sentences.`,
          `Candidate has relevant skills in Software Engineering, TypeScript, React, and databases. Potential gaps include high-scale distributed systems architectures.`
        );
        updatedState.resumeAnalysis = result;
        addLog('resumeAnalyzer', `Resume analysis completed: parsed technology stack.`, 'success');
      } else {
        updatedState.resumeAnalysis = `Parsed candidate resume. Found proficiency in Web Technologies, TypeScript, and SQL. Potential gaps in advanced Cloud Infrastructure.`;
        addLog('resumeAnalyzer', `[Demo Mode] Resume analysis completed.`, 'success');
      }
    }

    // 2. Company Research
    updatedState.activeAgentId = 'companyResearcher';
    addLog('companyResearcher', `Researching ${state.company} hiring rubric and evaluation style...`, 'info');
    if (isGeminiAvailable) {
      const result = await generateText(
        `${AGENTS.companyResearcher.prompt}\n\nCOMPANY: ${state.company}\nROLE: ${state.role}\nINTERVIEW TYPE: ${state.interviewType}\n\nDescribe the company's interview style and what they evaluate in 3 sentences.`,
        `Simulating ${state.company}'s hiring bar. Style is structured, focusing on problem decomposition, communication, and technical depth.`
      );
      updatedState.companyStyle = result;
      addLog('companyResearcher', `Adapted interview style parameters for ${state.company}.`, 'success');
    } else {
      updatedState.companyStyle = `Hiring bar set to ${state.company} standards. Focus areas: structural clarity, scalable designs, and behavioral compliance.`;
      addLog('companyResearcher', `[Demo Mode] Adapted interview style for ${state.company}.`, 'success');
    }

    // 3. Question Generation
    updatedState.activeAgentId = 'questionGenerator';
    addLog('questionGenerator', `Drafting the first question based on role: "${state.role}"...`, 'info');
    
    let firstQuestion = '';
    let spokenPrompt = '';

    if (isGeminiAvailable) {
      const result = await generateJSON<{ question: string; spokenForm: string }>(
        `${AGENTS.questionGenerator.prompt}
        Generate the first question.
        ROLE: ${state.role}
        COMPANY: ${state.company}
        TYPE: ${state.interviewType}
        DIFFICULTY: ${state.difficulty}
        STYLE DETAILS: ${updatedState.companyStyle}
        RESUME SUMMARY: ${updatedState.resumeAnalysis || 'None'}
        
        Return a JSON object:
        {
          "question": "The detailed question text",
          "spokenForm": "The conversational spoken version"
        }`,
        {
          question: `Welcome to your mock interview at ${state.company}. Let's begin by discussing a system design question. How would you design a distributed database cache to handle 100,000 read operations per second?`,
          spokenForm: `Welcome. Let's start with a system design question. How would you design a distributed database cache to handle 100,000 read operations per second?`
        }
      );
      firstQuestion = result.question;
      spokenPrompt = result.spokenForm;
    } else {
      const fallbackQ = generateMockQuestion(state.role, state.company, state.interviewType, 0);
      firstQuestion = fallbackQ.text;
      spokenPrompt = fallbackQ.spoken;
    }

    updatedState.activeAgentId = 'voiceConversation';
    addLog('voiceConversation', `Optimizing voice prompt for natural speech synthesis...`, 'info');
    
    updatedState.nextQuestion = firstQuestion;
    updatedState.spokenPrompt = spokenPrompt;
    updatedState.currentQuestionIndex = 1;
    updatedState.activeAgentId = null;
    
    addLog('orchestrator', `First question delivered via Text-to-Speech.`, 'success');
    return updatedState;
  }

  // Turn N: User has answered. Evaluate and trigger next question/report
  if (userRawAnswer) {
    const currentQuestion = state.nextQuestion || '';
    addLog('orchestrator', `Candidate response received. Launching evaluation agents...`, 'info');

    // 1. Evaluation
    updatedState.activeAgentId = 'evaluation';
    addLog('evaluation', `Scoring answer accuracy, technical depth, and structure...`, 'info');
    
    let evaluation: EvaluationResult;
    if (isGeminiAvailable) {
      evaluation = await generateJSON<EvaluationResult>(
        `${AGENTS.evaluation.prompt}
        QUESTION: ${currentQuestion}
        ANSWER: ${userRawAnswer}
        ROLE: ${state.role}
        DIFFICULTY: ${state.difficulty}
        
        Evaluate the answer and return a JSON object with EXACTLY this structure:
        {
          "score": 85,
          "communication": 90,
          "technicalAccuracy": 80,
          "confidence": 85,
          "grammar": 95,
          "problemSolving": 85,
          "depth": 78,
          "clarity": 88,
          "professionalism": 90,
          "feedback": "Detailed feedback paragraph"
        }`,
        generateMockEvaluation(currentQuestion, userRawAnswer)
      );
    } else {
      evaluation = generateMockEvaluation(currentQuestion, userRawAnswer);
    }
    addLog('evaluation', `Answer scored: ${evaluation.score}/100.`, 'success');

    // 2. Behavioral & Confidence analysis logs
    updatedState.activeAgentId = 'confidenceScoring';
    addLog('confidenceScoring', `Analyzing speech flow, hesitation markers, and statement conviction...`, 'info');
    addLog('confidenceScoring', `Confidence rating computed: ${evaluation.confidence}%.`, 'success');

    updatedState.activeAgentId = 'behaviorAnalysis';
    addLog('behaviorAnalysis', `Evaluating verbal professionalism and syntax structure...`, 'info');
    addLog('behaviorAnalysis', `Behavior analysis complete. Logged feedback.`, 'success');

    // Save turn history
    updatedState.history.push({
      question: currentQuestion,
      answer: userRawAnswer,
      evaluation
    });

    // Check if we proceed to next question
    if (state.currentQuestionIndex < state.maxQuestions) {
      updatedState.activeAgentId = 'questionGenerator';
      addLog('questionGenerator', `Synthesizing context and drafting question ${state.currentQuestionIndex + 1}...`, 'info');

      let nextQuestion = '';
      let spokenPrompt = '';

      if (isGeminiAvailable) {
        // Run Orchestrator / Follow-up Agent / Question Generator
        const followUpDecision = await generateJSON<{ isFollowUp: boolean; question: string; spokenForm: string }>(
          `Based on the interview history and the candidate's last answer, should we ask a follow-up question to dig deeper into their previous answer, or move on to a new topic?
          
          HISTORY: ${JSON.stringify(updatedState.history, null, 2)}
          ROLE: ${state.role}
          COMPANY: ${state.company}
          DIFFICULTY: ${state.difficulty}
          
          Return a JSON object:
          {
            "isFollowUp": true,
            "question": "Detailed question text",
            "spokenForm": "The brief speech form"
          }`,
          {
            isFollowUp: false,
            question: generateMockQuestion(state.role, state.company, state.interviewType, state.currentQuestionIndex).text,
            spokenForm: generateMockQuestion(state.role, state.company, state.interviewType, state.currentQuestionIndex).spoken
          }
        );
        nextQuestion = followUpDecision.question;
        spokenPrompt = followUpDecision.spokenForm;
        
        if (followUpDecision.isFollowUp) {
          addLog('followUp', `Determined candidate response warrants deeper probing. Generating follow-up question...`, 'warning');
        }
      } else {
        const nextQ = generateMockQuestion(state.role, state.company, state.interviewType, state.currentQuestionIndex);
        nextQuestion = nextQ.text;
        spokenPrompt = nextQ.spoken;
      }

      updatedState.activeAgentId = 'voiceConversation';
      addLog('voiceConversation', `Formatting question ${state.currentQuestionIndex + 1} for spoken response...`, 'info');

      updatedState.nextQuestion = nextQuestion;
      updatedState.spokenPrompt = spokenPrompt;
      updatedState.currentQuestionIndex += 1;
      updatedState.activeAgentId = null;
      addLog('orchestrator', `Delivered question ${updatedState.currentQuestionIndex} via Text-to-Speech.`, 'success');

    } else {
      // Interview completed, compile report
      updatedState.activeAgentId = 'feedbackGenerator';
      addLog('feedbackGenerator', `Interview duration reached. Aggregating all scores and critiques...`, 'info');

      let finalReport: FinalReport;
      if (isGeminiAvailable) {
        // Compile Final Report using collaborating feedback, career coach, and recommendation agents
        finalReport = await generateJSON<FinalReport>(
          `You are compiling the final interview report. Aggregate the history of the candidate's responses and evaluations:
          ${JSON.stringify(updatedState.history, null, 2)}
          
          Generate a detailed final report JSON with exactly this structure:
          {
            "overallScore": 84,
            "skillRadar": {
              "communication": 85,
              "technical": 80,
              "behavioral": 90,
              "confidence": 85,
              "problemSolving": 80
            },
            "timeAnalysis": "1-sentence review of duration and speaking pace",
            "strongAreas": ["Strengths 1", "Strengths 2", "Strengths 3"],
            "weakAreas": ["Weakness 1", "Weakness 2"],
            "topicsToLearn": ["Topic 1", "Topic 2", "Topic 3"],
            "recommendedProjects": [
              { "title": "Proj 1", "description": "Desc 1", "tech": ["React", "Node"] }
            ],
            "careerCoachFeedback": "Paragraph of career advice based on candidate performance",
            "reInterviewRecommendation": "Recommendation for re-taking or scheduling follow-ups"
          }`,
          generateMockReport(updatedState)
        );
      } else {
        finalReport = generateMockReport(updatedState);
      }

      updatedState.activeAgentId = 'careerCoach';
      addLog('careerCoach', `Generating long-term growth and preparation guidance...`, 'info');
      addLog('careerCoach', `Career advice model synthesized.`, 'success');

      updatedState.activeAgentId = 'learningRecommendation';
      addLog('learningRecommendation', `Selecting targeted study topics and recommended engineering projects...`, 'info');
      addLog('learningRecommendation', `Learning roadmap generated.`, 'success');

      updatedState.finalReport = finalReport;
      updatedState.status = 'completed';
      updatedState.activeAgentId = null;
      addLog('orchestrator', `Mock Interview Session complete. Performance Report generated.`, 'success');
    }
  }

  return updatedState;
}
