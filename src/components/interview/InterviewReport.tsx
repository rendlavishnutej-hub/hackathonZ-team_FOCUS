'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award, TrendingUp, BookOpen, Mic, Download, ChevronRight,
  Star, Zap, Users, Target, Brain, CheckCircle, XCircle,
  BarChart3, RotateCcw
} from 'lucide-react';
import type { FinalReport, InterviewHistoryItem } from '@/lib/agents/interview/orchestrator';

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
        <polygon key={li} points={pts} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {/* Axis lines */}
      {keys.map((_, i) => {
        const { x, y } = toXY((2 * Math.PI * i) / n, maxR);
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
      })}
      {/* Data polygon */}
      <polygon
        points={dataPts.join(' ')}
        fill="rgba(211,87,154,0.25)"
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
            fill="rgba(255,255,255,0.5)"
            fontSize="8"
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
  const color = score >= 85 ? '#86efac' : score >= 70 ? '#ffe24c' : '#f97316';
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1.2s ease', filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-extrabold" style={{ color }}>{score}</p>
        <p className="text-[9px] uppercase tracking-widest text-gray-500">/ 100</p>
      </div>
    </div>
  );
}

// ─── Metric bar ───────────────────────────────────────────────────────────────
function MetricBar({ label, value }: { label: string; value: number }) {
  const color = value >= 85 ? '#86efac' : value >= 70 ? '#ffe24c' : '#f97316';
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
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

  const gradeColor = report.overallScore >= 80 ? '#86efac' :
                     report.overallScore >= 70 ? '#ffe24c' : '#f97316';

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
      style={{ color: '#f0f0f5', fontFamily: 'var(--font-jakarta), sans-serif' }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border mb-3"
            style={{ backgroundColor: 'rgba(134,239,172,0.1)', borderColor: 'rgba(134,239,172,0.25)', color: '#86efac' }}
          >
            <CheckCircle className="h-3 w-3" />
            Interview Complete
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Performance Report
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {role} · {company} · {interviewType} · {difficulty}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={() => router.push('/interview')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}
          >
            <RotateCcw className="h-4 w-4" />
            New Interview
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ backgroundColor: '#d3579a', color: '#fff' }}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* ── SCORE + RADAR + VERDICT ─────────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-3xl border"
        style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        {/* Score Ring */}
        <div className="flex flex-col items-center justify-center gap-3">
          <ScoreRing score={report.overallScore} />
          <div className="text-center">
            <p className="text-lg font-extrabold" style={{ color: gradeColor }}>{grade}</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">Hiring Verdict</p>
          </div>
        </div>

        {/* Skill Radar */}
        <div className="flex flex-col items-center justify-center">
          <SkillRadar data={report.skillRadar} />
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Skill Radar</p>
        </div>

        {/* Time & verdict text */}
        <div className="space-y-4 flex flex-col justify-center">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Time Analysis</p>
            <p className="text-sm text-gray-300 leading-relaxed">{report.timeAnalysis}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Career Coach</p>
            <p className="text-sm text-gray-300 leading-relaxed">{report.careerCoachFeedback}</p>
          </div>
        </div>
      </div>

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
          <Card title="Strong Areas" icon={<CheckCircle className="h-4 w-4" style={{ color: '#86efac' }} />}>
            <ul className="space-y-2">
              {report.strongAreas.map((area, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <div className="h-1.5 w-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: '#86efac' }} />
                  {area}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Improvement Areas" icon={<XCircle className="h-4 w-4" style={{ color: '#f97316' }} />}>
            <ul className="space-y-2">
              {report.weakAreas.map((area, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <div className="h-1.5 w-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: '#f97316' }} />
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
              className="p-4 rounded-xl border space-y-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">Q{i + 1}</p>
                  <p className="text-sm font-semibold text-gray-200">{item.question}</p>
                </div>
                {item.evaluation && (
                  <div
                    className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-sm font-extrabold"
                    style={{
                      backgroundColor: item.evaluation.score >= 80 ? 'rgba(134,239,172,0.12)' : 'rgba(255,226,76,0.12)',
                      color: item.evaluation.score >= 80 ? '#86efac' : '#ffe24c'
                    }}
                  >
                    {item.evaluation.score}
                  </div>
                )}
              </div>

              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'rgba(90,107,168,0.08)', borderLeft: '2px solid rgba(90,107,168,0.4)' }}
              >
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Your Answer</p>
                <p className="text-xs text-gray-300 leading-relaxed">{item.answer}</p>
              </div>

              {item.evaluation && (
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: 'rgba(211,87,154,0.06)', borderLeft: '2px solid rgba(211,87,154,0.3)' }}
                >
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#d3579a' }}>AI Feedback</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{item.evaluation.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* ── LEARNING ROADMAP ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Topics to Study" icon={<BookOpen className="h-4 w-4" style={{ color: '#ffe24c' }} />}>
          <ul className="space-y-2">
            {report.topicsToLearn.map((topic, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: '#ffe24c' }} />
                {topic}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Recommended Projects" icon={<Target className="h-4 w-4" style={{ color: '#d3579a' }} />}>
          <div className="space-y-3">
            {report.recommendedProjects.map((proj, i) => (
              <div key={i} className="space-y-1">
                <p className="text-sm font-bold text-gray-200">{proj.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{proj.description}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {proj.tech.map(t => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: 'rgba(211,87,154,0.12)', color: '#d3579a' }}
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

      {/* ── RE-INTERVIEW RECOMMENDATION ──────────────────────────────────────── */}
      <div
        className="p-5 rounded-2xl border flex items-start gap-4"
        style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="h-10 w-10 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(211,87,154,0.12)' }}>
          <Mic className="h-5 w-5" style={{ color: '#d3579a' }} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Re-Interview Recommendation</p>
          <p className="text-sm text-gray-300">{report.reInterviewRecommendation}</p>
          <button
            onClick={() => router.push('/interview')}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: '#d3579a' }}
          >
            Schedule another session
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Print-only styles */}
      <style>{`
        @media print {
          body { background: #0a0a0f !important; -webkit-print-color-adjust: exact; }
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
      className="p-5 rounded-2xl border space-y-4"
      style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{title}</span>
      </div>
      {children}
    </div>
  );
}
