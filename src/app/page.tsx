import type { Metadata } from 'next';
import { Suspense } from 'react';
import LandingClient from '@/components/marketing/LandingClient';

export const metadata: Metadata = {
  title: 'FOCUS — Orchestrate the Future of Learning from a Single Prompt',
  description:
    'Stop the daily hassle of disconnected tools. FOCUS dynamically coordinates specialist AI agents powered by Gemini to research, design, and generate complete personalised learning experiences.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'FOCUS — Orchestrate the Future of Learning',
    description:
      'Specialist AI agents that research, design, and generate complete personalised learning experiences from a single prompt.',
    url: '/',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <div className="flex-1 bg-[#0A0A0F] text-[#F5F5F7] flex flex-col min-h-screen relative dots-bg">
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#7C5CFF]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ── JSON-LD Structured Data ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'FOCUS AI',
            applicationCategory: 'EducationApplication',
            description:
              'FOCUS dynamically coordinates specialist AI agents to research, design, and generate complete personalised learning experiences.',
            url: process.env.NEXT_PUBLIC_APP_URL || 'https://focus-ai.app',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description: 'Free tier available',
            },
            featureList: [
              'Multi-agent AI orchestration',
              'Personalised curriculum generation',
              'Interactive quiz assessment',
              'Real-time agent collaboration',
            ],
          }),
        }}
      />

      <LandingClient />
    </div>
  );
}
