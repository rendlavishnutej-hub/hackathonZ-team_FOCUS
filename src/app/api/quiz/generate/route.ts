import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getModel } from '@/lib/gemini';
import type { Question, QuestionType, Difficulty } from '@/lib/quiz/types';

export const dynamic = 'force-dynamic';

function generateMockQuestions(fileName: string, difficulty: Difficulty, count: number, fileId: string): Question[] {
  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  const types: QuestionType[] = ['mcq', 'true-false', 'fill-blank', 'one-word', 'match'];

  return Array.from({ length: count }, (_, i) => {
    const qType = types[i % types.length];
    const qId = `q-gen-${Math.random().toString(36).substring(2, 12)}-${i}`;
    const marks = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
    const negativeMarks = difficulty === 'easy' ? 0.5 : difficulty === 'medium' ? 0.75 : 1;
    const base = { id: qId, subjectId: 'generated', topicId: 'generated', fileId, difficulty, marks, negativeMarks };

    if (qType === 'mcq') return { ...base, type: 'mcq' as const, question: `Regarding "${cleanName}", which option best describes its core purpose?`, payload: { options: [`Primary functionality of ${cleanName}`, 'Secondary implementation detail', 'Auxiliary interface layer', 'Legacy compatibility shim'] }, correctAnswer: { correct: 0 }, explanation: `The primary functionality is the core purpose described in ${cleanName}.` };
    if (qType === 'true-false') return { ...base, type: 'true-false' as const, question: `The document "${cleanName}" covers industry-standard best practices.`, payload: { statement: `The document "${cleanName}" covers industry-standard best practices.` }, correctAnswer: { correct: true }, explanation: `Yes, the content aligns with current industry standards.` };
    if (qType === 'fill-blank') return { ...base, type: 'fill-blank' as const, question: `In ${cleanName}, the mechanism used to coordinate processes is called the ___.`, payload: { text: `In ${cleanName}, the mechanism used to coordinate processes is called the ___.` }, correctAnswer: { answers: ['orchestrator'], alternatives: [['coordinator', 'manager', 'controller']] }, explanation: `Orchestrator (or coordinator) is the standard term for this coordination mechanism.` };
    if (qType === 'one-word') return { ...base, type: 'one-word' as const, question: `What single term best describes the efficiency metric used in ${cleanName}?`, payload: {}, correctAnswer: { correct: 'performance', alternatives: ['throughput', 'latency'] }, explanation: `Performance is the key efficiency metric in this context.` };
    return { ...base, type: 'match' as const, question: `Match each component of "${cleanName}" to its role:`, payload: { leftItems: ['Engine', 'Data Layer', 'Interface', 'Logger'], rightItems: ['Processes logic', 'Queries storage', 'Renders UI', 'Collects traces'] }, correctAnswer: { mapping: [0, 1, 2, 3] }, explanation: `Each component has a distinct responsibility in the system architecture.` };
  });
}

function parseGeminiQuestions(raw: any[], fileId: string, difficulty: Difficulty): Question[] {
  return raw.map((q, idx) => ({
    id: `q-gen-${Math.random().toString(36).substring(2, 12)}-${idx}`,
    subjectId: 'generated',
    topicId: 'generated',
    fileId,
    difficulty,
    type: q.type as QuestionType,
    question: q.question || '',
    payload: q.payload || {},
    correctAnswer: q.correctAnswer || {},
    explanation: q.explanation || 'No explanation provided.',
    marks: q.marks || (difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4),
    negativeMarks: q.negativeMarks || (difficulty === 'easy' ? 0.5 : difficulty === 'medium' ? 0.75 : 1),
  }));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { fileId, difficulty, questionCount, forceRegenerate } = body as {
    fileId: string; difficulty: Difficulty; questionCount: number; forceRegenerate?: boolean;
  };

  if (!fileId || !difficulty || !questionCount) {
    return NextResponse.json({ error: 'Missing parameters: fileId, difficulty, questionCount are required.' }, { status: 400 });
  }

  // 1. Verify file belongs to user (using snake_case column)
  const { data: file } = await supabase
    .from('quiz_files')
    .select('*')
    .eq('id', fileId)
    .eq('user_id', user.id)
    .single();

  if (!file) {
    return NextResponse.json({ error: 'File not found or access denied.' }, { status: 404 });
  }

  // 2. Return cached questions if they exist and regeneration not forced
  if (!forceRegenerate) {
    const { data: existing } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('file_id', fileId)
      .eq('difficulty', difficulty);

    if (existing && existing.length >= questionCount) {
      const shuffled = [...existing].sort(() => Math.random() - 0.5).slice(0, questionCount);
      // Normalize snake_case to camelCase
      return NextResponse.json({ questions: normalizeQuestions(shuffled), cached: true });
    }
  }

  // 3. AI Generation
  const model = getModel('gemini-1.5-flash');
  let questions: Question[];

  if (!model) {
    console.warn('[FOCUS Quiz] No Gemini API key — using mock question generator.');
    questions = generateMockQuestions(file.name, difficulty, questionCount, fileId);
  } else {
    const fileContent = file.content || file.raw_content || '';
    const prompt = `You are an expert educational assessment designer.
Generate exactly ${questionCount} quiz questions based ONLY on the content of the provided document.
Difficulty: "${difficulty}"

Use a balanced mix of these 5 types (roughly equal distribution):
1. "mcq": 4 options array, correctAnswer = { "correct": index }
2. "true-false": correctAnswer = { "correct": true|false }
3. "fill-blank": question text has "___" placeholder, correctAnswer = { "answers": ["word"], "alternatives": [["alt1"]] }
4. "one-word": correctAnswer = { "correct": "word", "alternatives": ["alt"] }
5. "match": payload has "leftItems" and "rightItems" arrays of equal length, correctAnswer = { "mapping": [rightIndex, ...] }

Marks per question: ${difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4}
Negative marks: ${difficulty === 'easy' ? 0.5 : difficulty === 'medium' ? 0.75 : 1}

Respond with ONLY a raw JSON array (no markdown, no code fences):
[{"type":"...","question":"...","payload":{...},"correctAnswer":{...},"explanation":"...","marks":N,"negativeMarks":N}]

Document title: ${file.name}
Document content:
${fileContent.substring(0, 14000)}`;

    try {
      let result;
      if (file.raw_content && file.type === 'application/pdf') {
        result = await model.generateContent([prompt, { inlineData: { data: file.raw_content, mimeType: 'application/pdf' } }]);
      } else {
        result = await model.generateContent(prompt);
      }

      const text = result.response.text().trim();
      const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      questions = parseGeminiQuestions(parsed, fileId, difficulty);
    } catch (err) {
      console.error('[FOCUS Quiz] Gemini generation failed, falling back to mock:', err);
      questions = generateMockQuestions(file.name, difficulty, questionCount, fileId);
    }
  }

  // 4. Persist generated questions using snake_case columns
  for (const q of questions) {
    await supabase.from('quiz_questions').insert({
      id: q.id,
      subject_id: q.subjectId,
      topic_id: q.topicId,
      file_id: q.fileId,
      difficulty: q.difficulty,
      type: q.type,
      question: q.question,
      payload: q.payload,
      correct_answer: q.correctAnswer,
      explanation: q.explanation,
      marks: q.marks,
      negative_marks: q.negativeMarks,
    });
  }

  return NextResponse.json({ questions, cached: false });
}

// Normalize Supabase snake_case rows to camelCase Question objects
function normalizeQuestions(rows: any[]): Question[] {
  return rows.map(r => ({
    id: r.id,
    subjectId: r.subject_id,
    topicId: r.topic_id,
    fileId: r.file_id,
    difficulty: r.difficulty,
    type: r.type,
    question: r.question,
    payload: r.payload,
    correctAnswer: r.correct_answer,
    explanation: r.explanation,
    marks: r.marks,
    negativeMarks: r.negative_marks,
  }));
}
