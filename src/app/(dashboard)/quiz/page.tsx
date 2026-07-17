import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';
import QuizHubClient from './QuizHubClient';

export const metadata = {
  title: 'Quiz | FOCUS Dashboard',
  description: 'Test your knowledge with interactive quizzes across subjects and topics.',
};

export default async function QuizPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-[#fef9f2] text-black overflow-hidden font-sans">
      <Sidebar userEmail={user.email!} />
      
      <main className="flex-1 overflow-y-auto relative perspective-1000">
        
        {/* Animated Cinematic Background - Bright Brain on the Right */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-end">
          
          {/* Bright Global Glows on the right */}
          <div className="absolute top-[10%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[140px] bg-[#7C5CFF]/30 animate-pulse-slow" />
          <div className="absolute bottom-[5%] right-[5%] w-[600px] h-[600px] rounded-full blur-[120px] bg-[#22D3D0]/30 animate-pulse-slow delay-1000" />
          <div className="absolute top-[40%] right-[15%] w-[400px] h-[400px] rounded-full blur-[100px] bg-[#f0f0f5]/10 animate-pulse" />
          
          {/* Right-Aligned AI Brain SVG */}
          <div className="absolute right-[-10%] opacity-[0.20] scale-150 md:scale-[2.2] mix-blend-screen animate-float">
            <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
              <g stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                {/* Left Hemisphere */}
                <path d="M400,200 C300,150 200,250 200,350 C200,450 250,550 350,600 C380,615 390,620 400,620" />
                <path d="M400,250 C320,210 240,290 240,370 C240,450 280,530 360,570" />
                <path d="M400,300 C340,270 280,330 280,390 C280,450 310,510 370,540" />
                
                {/* Right Hemisphere */}
                <path d="M400,200 C500,150 600,250 600,350 C600,450 550,550 450,600 C420,615 410,620 400,620" />
                <path d="M400,250 C480,210 560,290 560,370 C560,450 520,530 440,570" />
                <path d="M400,300 C460,270 520,330 520,390 C520,450 490,510 430,540" />

                {/* Neural Connections / Nodes - Brighter */}
                <circle cx="350" cy="300" r="5" fill="#7C5CFF" className="animate-ping-slow" />
                <circle cx="280" cy="400" r="4" fill="#22D3D0" className="animate-ping-slow delay-500" />
                <circle cx="450" cy="300" r="6" fill="#7C5CFF" className="animate-ping-slow delay-1000" />
                <circle cx="520" cy="400" r="5" fill="#22D3D0" className="animate-ping-slow delay-700" />
                <circle cx="400" cy="200" r="7" fill="#ffffff" className="animate-pulse" />
                <circle cx="360" cy="500" r="4" fill="#7C5CFF" className="animate-ping-slow delay-300" />
                <circle cx="440" cy="500" r="5" fill="#22D3D0" className="animate-ping-slow delay-1100" />
                <circle cx="600" cy="350" r="5" fill="#ffffff" className="animate-ping-slow delay-200" />
                
                {/* Connecting Lines */}
                <path d="M400,200 L350,300 L280,400 L360,500 L400,620" stroke="#7C5CFF" strokeWidth="1" opacity="0.8" />
                <path d="M400,200 L450,300 L520,400 L440,500 L400,620" stroke="#22D3D0" strokeWidth="1" opacity="0.8" />
                <path d="M350,300 L450,300" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" strokeDasharray="4 4" />
                <path d="M280,400 L520,400" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" strokeDasharray="4 4" />
                <path d="M360,500 L440,500" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" strokeDasharray="4 4" />
                <path d="M350,300 L400,400 L450,300" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
                <path d="M360,500 L400,400 L440,500" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
              </g>
            </svg>
          </div>

          {/* Flowing Data Streams (CSS Gradient lines) */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-[20%] left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#7C5CFF] to-transparent animate-scan-fast" />
            <div className="absolute top-[50%] left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#22D3D0] to-transparent animate-scan-slow" />
            <div className="absolute top-[80%] left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#7C5CFF] to-transparent animate-scan-fast delay-700" />
          </div>

          {/* Floating Particles focused on the right side */}
          <div className="absolute inset-y-0 right-0 w-[60%]">
            {[...Array(30)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-white/40 animate-float-particle shadow-[0_0_8px_2px_rgba(255,255,255,0.4)]"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDuration: `${10 + Math.random() * 15}s`,
                  animationDelay: `${Math.random() * 3}s`,
                  opacity: Math.random() * 0.6 + 0.2
                }}
              />
            ))}
          </div>
          
          {/* Noise Overlay for texture */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 p-8 md:p-12 min-h-full">
          <QuizHubClient userEmail={user.email!} userId={user.id} />
        </div>
      </main>
    </div>
  );
}
