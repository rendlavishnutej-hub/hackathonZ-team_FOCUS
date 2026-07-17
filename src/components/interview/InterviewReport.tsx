'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award, TrendingUp, BookOpen, Mic, Download, ChevronRight,
  Star, Zap, Users, Target, Brain, CheckCircle, XCircle,
  BarChart3, RotateCcw
} from 'lucide-react';
import type { FinalReport, InterviewHistoryItem } from '@/lib/interview/types';

const C = {
  cream: '#fef9f2',
  primary: '#000000',
  onPrimary: '#ffffff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f8f3ec',
  surfaceContainer: '#f2ede6',
  surfaceContainerHigh: '#ece7e1',
  surfaceVariant: '#e6e2db',
  onSurface: '#1d1c18',
  onSurfaceVariant: '#45464d',
  outline: '#76777d',
  outlineVariant: '#c6c6cd',
  inverseOnSurface: '#f5f0e9',
  inverseSurface: '#32302c',
  accentYellow: '#ffe24c',
  accentBlue: '#bec6e0',
  accentPink: '#ffafd3',
  accentGreen: '#86efac',
  accentPurple: '#d3579a',
  secondaryContainer: '#fcdf46',
};

interface Props {
  report: FinalReport;
  history: InterviewHistoryItem[];
  role: string;
  company: string;
  difficulty: string;
  interviewType: string;
}

// ─── Radial Skill Radar (pure CSS/SVG) ──────────────────────────────────────
function SkillRadar({ data }: {
  data: { communication: number; technical: number; behavioral: number; confidence: number; problemSolving: number }
}) {
  const size     = 200;
  const center   = size / 2;
  const maxR     = 80;
  const keys: (keyof typeof data)[] = ['communication', 'technical', 'behavioral', 'confidence', 'problemSolving'];
  const labels = ['Comm.', 'Technical', 'Behavioral', 'Confidence', 'Problem\nSolving'];
  const n = keys.length;

  const toXY = (angle: number, r: number) => ({
    x: center + r * Math.cos(angle - Math.PI / 2),
    y: center + r * Math.sin(angle - Math.PI / 2),
  });

  const bgLevels = [20, 40, 60, 80, 100];
  const bgPolygons = bgLevels.map(level => {
    const r = (level / 100) * maxR;
    const pts = keys.map((_, i) => {
      const { x, y } = toXY((2 * Math.PI * i) / n, r);
      return `${x},${y}`;
    });
    return pts.join(' ');
  });

  const dataR = keys.map(k => ((data[k] || 0) / 100) * maxR);
  const dataPts = keys.map((_, i) => {
    const { x, y } = toXY((2 * Math.PI * i) / n, dataR[i]);
    return `${x},${y}`;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background levels */}
      {bgPolygons.map((pts, li) => (
        <polygon key={li} points={pts} fill="none" stroke={C.surfaceVariant} strokeWidth="1" />
      ))}
      {/* Axis lines */}
      {keys.map((_, i) => {
        const { x, y } = toXY((2 * Math.PI * i) / n, maxR);
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke={C.surfaceVariant} strokeWidth="1" />;
      })}
      {/* Data polygon */}
      <polygon
        points={dataPts.join(' ')}
        fill="rgba(211,87,154,0.2)"
        stroke="#d3579a"
        strokeWidth="2"
      />
      {/* Data dots */}
      {dataPts.map((pt, i) => {
        const [cx, cy] = pt.split(',').map(Number);
        return <circle key={i} cx={cx} cy={cy} r={3} fill="#d3579a" />;
      })}
      {/* Labels */}
      {labels.map((label, i) => {
        const { x, y } = toXY((2 * Math.PI * i) / n, maxR + 18);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={C.onSurfaceVariant}
            fontSize="8.5"
            fontWeight="600"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 58;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 85 ? '#047857' : score >= 70 ? '#d97706' : '#ea580c';
  const circleBg = '#e6e2db';
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke={circleBg} strokeWidth="8" />
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1.2s ease', filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.05))` }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-extrabold" style={{ color }}>{score}</p>
        <p className="text-[9px] uppercase tracking-widest text-[#76777d]">/ 100</p>
      </div>
    </div>
  );
}

// ─── Metric bar ───────────────────────────────────────────────────────────────
function MetricBar({ label, value }: { label: string; value: number }) {
  const color = value >= 85 ? '#047857' : value >= 70 ? '#d97706' : '#ea580c';
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-650">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function InterviewReport({ report, history, role, company, difficulty, interviewType }: Props) {
  const router  = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const grade = report.overallScore >= 90 ? 'Exceptional' :
                report.overallScore >= 80 ? 'Strong Hire' :
                report.overallScore >= 70 ? 'Hire' :
                report.overallScore >= 60 ? 'Borderline' : 'No Hire';

  const gradeColor = report.overallScore >= 80 ? '#047857' :
                     report.overallScore >= 70 ? '#d97706' : '#ea580c';

  const handleDownloadPDF = () => {
    window.print();
  };

  const avgMetrics = {
    communication:     Math.round(history.reduce((s, h) => s + (h.evaluation?.communication || 0), 0) / (history.length || 1)),
    technicalAccuracy: Math.round(history.reduce((s, h) => s + (h.evaluation?.technicalAccuracy || 0), 0) / (history.length || 1)),
    confidence:        Math.round(history.reduce((s, h) => s + (h.evaluation?.confidence || 0), 0) / (history.length || 1)),
    grammar:           Math.round(history.reduce((s, h) => s + (h.evaluation?.grammar || 0), 0) / (history.length || 1)),
    problemSolving:    Math.round(history.reduce((s, h) => s + (h.evaluation?.problemSolving || 0), 0) / (history.length || 1)),
    depth:             Math.round(history.reduce((s, h) => s + (h.evaluation?.depth || 0), 0) / (history.length || 1)),
    clarity:           Math.round(history.reduce((s, h) => s + (h.evaluation?.clarity || 0), 0) / (history.length || 1)),
    professionalism:   Math.round(history.reduce((s, h) => s + (h.evaluation?.professionalism || 0), 0) / (history.length || 1)),
  };

  return (
    <div
      ref={printRef}
      className="max-w-5xl mx-auto space-y-8 pb-12"
      style={{ color: '#000000', fontFamily: 'var(--font-jakarta), sans-serif' }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border mb-3"
            style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}
          >
            <CheckCircle className="h-3 w-3" />
            Interview Complete
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-black">
            Performance Report
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: C.onSurfaceVariant }}>
            {role} · {company} · {interviewType} · {difficulty}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={() => router.push('/interview')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all hover:bg-zinc-100 bg-white"
            style={{ borderColor: C.surfaceVariant, color: C.onSurfaceVariant }}
          >
            <RotateCcw className="h-4 w-4" />
            New Interview
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md"
            style={{ backgroundColor: C.accentPurple, color: '#fff' }}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* ── SCORE + RADAR + VERDICT ─────────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-3xl border bg-white"
        style={{ borderColor: C.surfaceVariant }}
      >
        {/* Score Ring */}
        <div className="flex flex-col items-center justify-center gap-3">
          <ScoreRing score={report.overallScore} />
          <div className="text-center">
            <p className="text-lg font-extrabold" style={{ color: gradeColor }}>{grade}</p>
            <p className="text-[10px] uppercase tracking-widest text-[#76777d] mt-0.5">Hiring Verdict</p>
          </div>
        </div>

        {/* Skill Radar */}
        <div className="flex flex-col items-center justify-center">
          <SkillRadar data={report.skillRadar} />
          <p className="text-[10px] uppercase tracking-widest text-[#76777d] mt-1">Skill Radar</p>
        </div>

        {/* Time & verdict text */}
        <div className="space-y-4 flex flex-col justify-center">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-550 font-bold mb-1">Time Analysis</p>
            <p className="text-xs leading-relaxed text-zinc-700">{report.timeAnalysis}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-550 font-bold mb-1">Career Coach</p>
            <p className="text-xs leading-relaxed text-zinc-700">{report.careerCoachFeedback}</p>
          </div>
        </div>
      </div>

      {/* ── ENHANCED ANALYTICS ─────────────────────────────────────────────── */}
      {(report.probabilityOfSelection !== undefined || report.companyReadiness !== undefined) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {report.probabilityOfSelection !== undefined && (
            <div
              className="p-4 rounded-2xl border bg-white text-center"
              style={{ borderColor: C.surfaceVariant }}
            >
              <p className="text-2xl font-extrabold" style={{ color: report.probabilityOfSelection >= 70 ? '#047857' : report.probabilityOfSelection >= 50 ? '#d97706' : '#ea580c' }}>
                {report.probabilityOfSelection}%
              </p>
              <p className="text-[9px] uppercase tracking-widest text-[#76777d] mt-1 font-bold">Selection Probability</p>
            </div>
          )}
          {report.companyReadiness !== undefined && (
            <div
              className="p-4 rounded-2xl border bg-white text-center"
              style={{ borderColor: C.surfaceVariant }}
            >
              <p className="text-2xl font-extrabold" style={{ color: report.companyReadiness >= 7 ? '#047857' : report.companyReadiness >= 5 ? '#d97706' : '#ea580c' }}>
                {report.companyReadiness}/10
              </p>
              <p className="text-[9px] uppercase tracking-widest text-[#76777d] mt-1 font-bold">Company Readiness</p>
            </div>
          )}
          {report.estimatedLevel && (
            <div
              className="p-4 rounded-2xl border bg-white text-center"
              style={{ borderColor: C.surfaceVariant }}
            >
              <p className="text-lg font-extrabold" style={{ color: '#5a6ba8' }}>
                {report.estimatedLevel}
              </p>
              <p className="text-[9px] uppercase tracking-widest text-[#76777d] mt-1 font-bold">Estimated Level</p>
            </div>
          )}
          {report.leadershipScore !== undefined && (
            <div
              className="p-4 rounded-2xl border bg-white text-center"
              style={{ borderColor: C.surfaceVariant }}
            >
              <p className="text-2xl font-extrabold" style={{ color: report.leadershipScore >= 70 ? '#047857' : '#d97706' }}>
                {report.leadershipScore}
              </p>
              <p className="text-[9px] uppercase tracking-widest text-[#76777d] mt-1 font-bold">Leadership Score</p>
            </div>
          )}
        </div>
      )}

      {/* ── CONFIDENCE TREND ───────────────────────────────────────────────── */}
      {report.confidenceTrend && report.confidenceTrend.length > 1 && (
        <Card title="Confidence Trend" icon={<TrendingUp className="h-4 w-4" style={{ color: '#5a6ba8' }} />}>
          <div className="h-16 flex items-end gap-1">
            {report.confidenceTrend.map((val: number, i: number) => {
              const height = Math.max(4, (val / 100) * 60);
              const color = val >= 75 ? '#047857' : val >= 55 ? '#d97706' : '#ea580c';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[8px] font-bold" style={{ color }}>{val}</span>
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{ height, backgroundColor: color, opacity: 0.75, minWidth: 8 }}
                  />
                  <span className="text-[7px] text-zinc-400">Q{i + 1}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── METRIC BREAKDOWN ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Performance Metrics" icon={<BarChart3 className="h-4 w-4" style={{ color: '#d3579a' }} />}>
          <div className="space-y-3">
            <MetricBar label="Communication"     value={avgMetrics.communication} />
            <MetricBar label="Technical Accuracy" value={avgMetrics.technicalAccuracy} />
            <MetricBar label="Confidence"         value={avgMetrics.confidence} />
            <MetricBar label="Problem Solving"    value={avgMetrics.problemSolving} />
            <MetricBar label="Depth"              value={avgMetrics.depth} />
            <MetricBar label="Clarity"            value={avgMetrics.clarity} />
            <MetricBar label="Grammar"            value={avgMetrics.grammar} />
            <MetricBar label="Professionalism"    value={avgMetrics.professionalism} />
          </div>
        </Card>

        {/* Strong & Weak Areas */}
        <div className="space-y-4">
          <Card title="Strong Areas" icon={<CheckCircle className="h-4 w-4" style={{ color: '#047857' }} />}>
            <ul className="space-y-2">
              {report.strongAreas.map((area, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-800">
                  <div className="h-1.5 w-1.5 rounded-full mt-2 shrink-0 fill-emerald-600 bg-emerald-600" />
                  {area}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Improvement Areas" icon={<XCircle className="h-4 w-4" style={{ color: '#ea580c' }} />}>
            <ul className="space-y-2">
              {report.weakAreas.map((area, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-800">
                  <div className="h-1.5 w-1.5 rounded-full mt-2 shrink-0 bg-[#ea580c]" />
                  {area}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* ── Q&A BREAKDOWN ─────────────────────────────────────────────────── */}
      <Card title="Question-by-Question Breakdown" icon={<Brain className="h-4 w-4" style={{ color: '#5a6ba8' }} />}>
        <div className="space-y-4">
          {history.map((item, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border space-y-3 bg-white"
              style={{ borderColor: C.surfaceVariant }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#76777d]">Q{i + 1}</p>
                  <p className="text-sm font-semibold text-black">{item.question}</p>
                </div>
                {item.evaluation && (
                  <div
                    className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-sm font-extrabold"
                    style={{
                      backgroundColor: item.evaluation.score >= 80 ? 'rgba(134,239,172,0.15)' : 'rgba(255,226,76,0.15)',
                      color: item.evaluation.score >= 80 ? '#047857' : '#d97706'
                    }}
                  >
                    {item.evaluation.score}
                  </div>
                )}
              </div>

              <div
                className="p-3.5 rounded-xl border"
                style={{ backgroundColor: `${C.accentBlue}08`, borderColor: `${C.accentBlue}40`, borderLeft: `3px solid #5a6ba8` }}
              >
                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-1">Your Answer</p>
                <p className="text-xs text-zinc-700 leading-relaxed">{item.answer}</p>
              </div>

              {item.evaluation && (
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: `${C.accentPink}06`, borderColor: `${C.accentPink}30`, borderLeft: `3px solid #d3579a` }}
                >
                  <p className="text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: '#d3579a' }}>AI Feedback</p>
                  <p className="text-xs text-zinc-700 leading-relaxed">{item.evaluation.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* ── LEARNING ROADMAP ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Topics to Study" icon={<BookOpen className="h-4 w-4" style={{ color: C.accentPurple }} />}>
          <ul className="space-y-2">
            {report.topicsToLearn.map((topic, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-zinc-800">
                <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: '#ffe24c' }} />
                {topic}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Recommended Projects" icon={<Target className="h-4 w-4" style={{ color: '#d3579a' }} />}>
          <div className="space-y-4">
            {report.recommendedProjects.map((proj, i) => (
              <div key={i} className="space-y-1 bg-[#fcfaf5] p-3 rounded-xl border border-zinc-200">
                <p className="text-sm font-bold text-black">{proj.title}</p>
                <p className="text-xs text-zinc-650 leading-relaxed">{proj.description}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {proj.tech.map(t => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-zinc-200 text-zinc-800"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── LEARNING RESOURCES ─────────────────────────────────────────────── */}
      {report.learningResources && report.learningResources.length > 0 && (
        <Card title="Learning Resources" icon={<Star className="h-4 w-4" style={{ color: '#d97706' }} />}>
          <div className="space-y-2">
            {report.learningResources.map((res, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#fcfaf5] border border-zinc-200">
                <div
                  className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-[9px] font-bold uppercase"
                  style={{
                    backgroundColor: res.priority === 'High' ? 'rgba(234,88,12,0.1)' : res.priority === 'Medium' ? 'rgba(217,119,6,0.1)' : 'rgba(4,120,87,0.1)',
                    color: res.priority === 'High' ? '#ea580c' : res.priority === 'Medium' ? '#d97706' : '#047857',
                  }}
                >
                  {res.type === 'Book' ? '📖' : res.type === 'Course' ? '🎓' : res.type === 'Practice' ? '💪' : '📄'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-black">{res.resourceName}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{res.topic} · {res.type} · {res.priority} priority</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── PRACTICE QUESTIONS ─────────────────────────────────────────────── */}
      {report.practiceQuestions && report.practiceQuestions.length > 0 && (
        <Card title="Practice Questions" icon={<Users className="h-4 w-4" style={{ color: '#5a6ba8' }} />}>
          <ol className="space-y-2 list-decimal list-inside">
            {report.practiceQuestions.map((q, i) => (
              <li key={i} className="text-sm text-zinc-800 leading-relaxed">
                {q}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* ── LEARNING TIMELINE ──────────────────────────────────────────────── */}
      {report.learningTimeline && (
        <div
          className="p-4 rounded-2xl border bg-gradient-to-r from-[#fef9f2] to-white flex items-center gap-3"
          style={{ borderColor: C.surfaceVariant }}
        >
          <Zap className="h-5 w-5 shrink-0" style={{ color: '#ffe24c' }} />
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#76777d]">Estimated Timeline</p>
            <p className="text-sm font-semibold text-black mt-0.5">{report.learningTimeline}</p>
          </div>
        </div>
      )}

      {/* ── RE-INTERVIEW RECOMMENDATION ──────────────────────────────────────── */}
      <div
        className="p-5 rounded-2xl border flex items-start gap-4 bg-white"
        style={{ borderColor: C.surfaceVariant }}
      >
        <div className="h-10 w-10 rounded-xl shrink-0 flex items-center justify-center bg-zinc-50 border">
          <Mic className="h-5 w-5" style={{ color: '#d3579a' }} />
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#76777d] mb-1">Re-Interview Recommendation</p>
          <p className="text-sm text-zinc-700">{report.reInterviewRecommendation}</p>
          <button
            onClick={() => router.push('/interview')}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold hover:opacity-85 text-[#d3579a]"
          >
            Schedule another session
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Print-only styles */}
      <style>{`
        @media print {
          body { background: #fef9f2 !important; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Card wrapper ──────────────────────────────────────────────────────────
function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="p-5 rounded-2xl border space-y-4 bg-white"
      style={{ borderColor: C.surfaceVariant }}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#76777d]">{title}</span>
      </div>
      {children}
    </div>
  );
}
