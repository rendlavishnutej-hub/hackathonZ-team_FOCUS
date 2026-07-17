import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';
import InterviewDashboardClient from '@/components/interview/InterviewDashboard';

export const metadata = {
  title: 'AI Mock Interview | FOCUS Operating System',
  description: 'Practice high-impact, voice-based technical and behavioral mock interviews with expert AI agents.',
};

export default async function InterviewDashboardPage() {
  const supabase = await createClient();

  // Fetch user (securely using getUser)
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f] text-[#f0f0f5] selection:bg-[#7C5CFF]/30 font-sans">
      {/* Sidebar navigation */}
      <Sidebar userEmail={user.email!} />

      {/* Main dashboard space with cinematic background */}
      <main className="flex-1 overflow-y-auto relative perspective-1000">
        
        {/* Animated Cinematic Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
          
          {/* Subtle Global Glows */}
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] bg-[#7C5CFF]/10 animate-pulse-slow" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] bg-[#22D3D0]/10 animate-pulse-slow delay-1000" />
          
          {/* Central AI Brain SVG */}
          <div className="absolute opacity-[0.03] scale-150 md:scale-[2.5] mix-blend-screen animate-float">
            <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
              <g stroke="#ffffff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                {/* Left Hemisphere */}
                <path d="M400,200 C300,150 200,250 200,350 C200,450 250,550 350,600 C380,615 390,620 400,620" />
                <path d="M400,250 C320,210 240,290 240,370 C240,450 280,530 360,570" />
                <path d="M400,300 C340,270 280,330 280,390 C280,450 310,510 370,540" />
                
                {/* Right Hemisphere */}
                <path d="M400,200 C500,150 600,250 600,350 C600,450 550,550 450,600 C420,615 410,620 400,620" />
                <path d="M400,250 C480,210 560,290 560,370 C560,450 520,530 440,570" />
                <path d="M400,300 C460,270 520,330 520,390 C520,450 490,510 430,540" />

                {/* Neural Connections / Nodes */}
                <circle cx="350" cy="300" r="4" fill="#7C5CFF" className="animate-ping-slow" />
                <circle cx="280" cy="400" r="3" fill="#22D3D0" className="animate-ping-slow delay-500" />
                <circle cx="450" cy="300" r="4" fill="#7C5CFF" className="animate-ping-slow delay-1000" />
                <circle cx="520" cy="400" r="3" fill="#22D3D0" className="animate-ping-slow delay-700" />
                <circle cx="400" cy="200" r="5" fill="#f0f0f5" className="animate-pulse" />
                <circle cx="360" cy="500" r="3" fill="#7C5CFF" className="animate-ping-slow delay-300" />
                <circle cx="440" cy="500" r="3" fill="#22D3D0" className="animate-ping-slow delay-1100" />
                
                {/* Connecting Lines */}
                <path d="M400,200 L350,300 L280,400 L360,500 L400,620" stroke="#7C5CFF" strokeWidth="0.5" opacity="0.5" />
                <path d="M400,200 L450,300 L520,400 L440,500 L400,620" stroke="#22D3D0" strokeWidth="0.5" opacity="0.5" />
                <path d="M350,300 L450,300" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" strokeDasharray="4 4" />
                <path d="M280,400 L520,400" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" strokeDasharray="4 4" />
                <path d="M360,500 L440,500" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" strokeDasharray="4 4" />
                <path d="M350,300 L400,400 L450,300" stroke="#ffffff" strokeWidth="0.5" opacity="0.2" />
                <path d="M360,500 L400,400 L440,500" stroke="#ffffff" strokeWidth="0.5" opacity="0.2" />
              </g>
            </svg>
          </div>

          {/* Flowing Data Streams (CSS Gradient lines) */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#7C5CFF] to-transparent animate-scan-fast" />
            <div className="absolute top-2/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#22D3D0] to-transparent animate-scan-slow" />
            <div className="absolute top-3/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#7C5CFF] to-transparent animate-scan-fast delay-700" />
          </div>

          {/* Floating Particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/20 animate-float-particle"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDuration: `${10 + Math.random() * 20}s`,
                  animationDelay: `${Math.random() * 5}s`,
                  opacity: Math.random() * 0.5 + 0.1
                }}
              />
            ))}
          </div>
          
          {/* Noise Overlay for texture */}
          <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        </div>
        
        <div className="relative z-10 p-6 md:p-10 min-h-full">
          <InterviewDashboardClient userEmail={user.email!} />
        </div>
      </main>
    </div>
  );
}
