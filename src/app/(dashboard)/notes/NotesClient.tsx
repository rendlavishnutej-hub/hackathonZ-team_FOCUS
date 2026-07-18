'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, ChevronRight, Loader2, BookMarked, Sparkles, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';

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
  accentBlue: '#bec6e0',
  accentPink: '#ffafd3',
  accentPurple: '#d3579a',
};

export default function NotesClient() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      if (!res.ok) throw new Error('Failed to generate notes');
      
      const data = await res.json();
      
      const newCourse = {
        id: `standalone-${Date.now()}`,
        title: data.title || prompt,
        createdAt: new Date().toLocaleDateString(),
        syllabus: {
          lessons: [
            { id: 'mod-1', title: 'Module 1: Fundamentals' },
            { id: 'mod-2', title: 'Module 2: Advanced Concepts' },
            { id: 'mod-3', title: 'Module 3: Application' }
          ]
        },
        notes: { notes: data.notes },
        isStandalone: true
      };

      const stored = localStorage.getItem('focus_courses');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newCourse);
      localStorage.setItem('focus_courses', JSON.stringify(list));
      
      setCourses(prev => [newCourse, ...prev]);
      setPrompt('');
      setExpandedCourse(newCourse.id);
    } catch (err) {
      console.error(err);
      alert('Error generating notes. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = (e: React.MouseEvent, course: any) => {
    e.stopPropagation();
    const doc = new jsPDF();
    let y = 20;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(course.title, 20, y);
    y += 15;
    
    doc.setFontSize(12);
    course.notes.notes.forEach((noteGroup: any, idx: number) => {
      const lesson = course.syllabus?.lessons?.find((l: any) => l.id === noteGroup.lessonId) || { title: `Module ${idx + 1}` };
      
      doc.setFont('helvetica', 'bold');
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(lesson.title, 20, y);
      y += 8;
      
      doc.setFont('helvetica', 'normal');
      noteGroup.bullets.forEach((bullet: string) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const lines = doc.splitTextToSize(`• ${bullet}`, 170);
        doc.text(lines, 25, y);
        y += 6 * lines.length + 2;
      });
      
      y += 8;
    });
    
    doc.save(`${course.title.replace(/\s+/g, '_')}_Notes.pdf`);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('focus_courses');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only keep courses that actually have generated notes
        const withNotes = parsed.filter((c: any) => c.notes && c.notes.notes && c.notes.notes.length > 0);
        setCourses(withNotes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center pt-20 animate-pulse">
        <Loader2 className="h-8 w-8 text-black animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-2 pb-6 border-b" style={{ borderColor: C.surfaceVariant }}>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black" style={{ fontFamily: 'var(--font-jakarta), sans-serif' }}>
          My Study Notes
        </h1>
        <p className="text-sm font-body max-w-2xl" style={{ color: C.onSurfaceVariant }}>
          All your high-yield generated study notes from past orchestrations are saved here for quick review.
        </p>
      </div>

      {/* Quick Generate Input */}
      <form onSubmit={handleGenerate} className="relative max-w-2xl">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isGenerating}
          placeholder="What do you want to learn? (e.g. Docker Basics)"
          className="w-full px-6 py-4 rounded-2xl border text-sm font-medium focus:outline-none transition-all shadow-sm disabled:opacity-50"
          style={{
            backgroundColor: C.surfaceContainerLowest,
            borderColor: C.outlineVariant,
            color: C.primary,
          }}
        />
        <button
          type="submit"
          disabled={!prompt.trim() || isGenerating}
          className="absolute right-2 top-2 bottom-2 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
          style={{
            backgroundColor: C.primary,
            color: C.onPrimary,
          }}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate
            </>
          )}
        </button>
      </form>

      {courses.length === 0 && !isGenerating ? (
        <div 
          className="border border-dashed p-12 rounded-3xl text-center space-y-4"
          style={{ borderColor: C.outlineVariant, backgroundColor: C.surfaceContainerLow }}
        >
          <div 
            className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: `${C.accentBlue}30`, borderColor: C.surfaceVariant, color: '#5a6ba8' }}
          >
            <BookMarked className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-sm text-black">No Notes Found</h4>
            <p className="text-xs max-w-sm mx-auto" style={{ color: C.outline }}>
              Generate a new syllabus from the dashboard to automatically create AI study notes.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 border text-xs font-semibold rounded-xl transition-all hover:shadow-md"
            style={{ borderColor: C.outlineVariant, backgroundColor: C.surfaceContainerLowest, color: C.onSurfaceVariant }}
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {courses.map(course => {
            const isExpanded = expandedCourse === course.id;
            
            return (
              <div 
                key={course.id}
                className="rounded-3xl border shadow-sm overflow-hidden transition-all"
                style={{ backgroundColor: C.surfaceContainerLowest, borderColor: C.surfaceVariant }}
              >
                {/* Course Note Header (Click to expand) */}
                <div 
                  onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                  className="p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" style={{ color: C.accentPurple }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        {course.createdAt}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-black font-display uppercase tracking-wide">
                      {course.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] px-2 py-1 bg-black text-white rounded font-bold uppercase tracking-wider">
                      {course.notes.notes.length} Modules
                    </span>
                    <ChevronRight 
                      className={`h-5 w-5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                    />
                  </div>
                </div>

                {/* Expanded Notes Content */}
                {isExpanded && (
                  <div className="p-6 border-t bg-zinc-50/50 space-y-8" style={{ borderColor: C.surfaceVariant }}>
                    {course.notes.notes.map((noteGroup: any, idx: number) => {
                      const lesson = course.syllabus?.lessons?.find((l: any) => l.id === noteGroup.lessonId) || { title: `Module ${idx + 1}` };
                      
                      return (
                        <div key={idx} className="space-y-3">
                          <h4 className="text-sm font-bold text-black uppercase tracking-wide border-l-2 pl-3" style={{ borderColor: C.accentPurple }}>
                            {lesson.title}
                          </h4>
                          <ul className="space-y-2 pl-4">
                            {noteGroup.bullets.map((bullet: string, bIdx: number) => (
                              <li key={bIdx} className="flex items-start gap-2.5">
                                <span className="text-blue-500 mt-0.5 text-[10px]">●</span>
                                <span className="text-xs leading-relaxed" style={{ color: C.onSurfaceVariant }}>
                                  {bullet}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                    
                    <div className="pt-4 border-t flex items-center justify-end gap-3" style={{ borderColor: C.surfaceVariant }}>
                       <button
                         onClick={(e) => handleDownloadPDF(e, course)}
                         className="px-4 py-2 border text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 hover:bg-zinc-100"
                         style={{ borderColor: C.outlineVariant, color: C.onSurfaceVariant }}
                       >
                         <Download className="h-3.5 w-3.5" />
                         Download PDF
                       </button>

                       {!course.isStandalone && (
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             router.push(`/course/${course.id}`);
                           }}
                           className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-90"
                         >
                           Open Full Course Workspace
                         </button>
                       )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
