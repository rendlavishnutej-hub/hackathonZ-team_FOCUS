import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Check, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing — FOCUS AI',
  description:
    'Choose the FOCUS AI plan that suits you. Start free with 3 AI-generated curriculum sessions per month, or upgrade for unlimited agent orchestration.',
  openGraph: {
    title: 'Pricing — FOCUS AI',
    description: 'Start free with 3 AI sessions/month or go unlimited. Transparent, simple pricing.',
    url: '/pricing',
  },
  alternates: { canonical: '/pricing' },
};

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
  accentYellow: '#ffe24c',
  accentBlue: '#bec6e0',
  accentPink: '#ffafd3',
  accentGreen: '#86efac',
  accentPurple: '#d3579a',
};

export default function PricingPage() {
  const plans = [
    {
      name: 'Free Trial',
      price: '$0',
      description: 'Test the multi-agent curriculum planner.',
      features: [
        '3 agent syllabus runs per month',
        'Standard learning roadmaps',
        'Text-only quiz assessments',
        'Basic session logging security'
      ],
      cta: 'Get Started',
      href: '/signup',
      highlighted: false
    },
    {
      name: 'Orchestrator Pro',
      price: '$19',
      period: '/mo',
      description: 'Unlock maximum AI capabilities and depth.',
      features: [
        'Unlimited syllabus runs',
        'Deep research academic source crawls',
        'Interactive code sandbox exercises',
        'Critique and revision iteration bounds (10x)',
        'Biometric passkeys and MFA support'
      ],
      cta: 'Upgrade to Pro',
      href: '/signup',
      highlighted: true
    },
    {
      name: 'Enterprise Grid',
      price: '$89',
      period: '/mo',
      description: 'For corporate training and educational grids.',
      features: [
        'Everything in Pro tier',
        'Dedicated agent resources (Gemini Flash Pro)',
        'Teams API key dashboard integrations',
        'SAML/SSO authentication custom tunnels',
        '24/7 priority developer SLA'
      ],
      cta: 'Contact Sales',
      href: 'mailto:sales@focus.ai',
      highlighted: false
    }
  ];

  return (
    <div 
      className="flex-1 flex flex-col min-h-screen relative dots-bg"
      style={{ backgroundColor: C.cream, color: C.onSurface, fontFamily: 'var(--font-jakarta), sans-serif' }}
    >
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: 'rgba(124,92,255,0.05)' }} />

      {/* Header */}
      <header 
        className="w-full border-b py-4 px-6 sm:px-12 flex justify-between items-center max-w-7xl mx-auto z-10"
        style={{ borderColor: C.surfaceVariant }}
      >
        <Link href="/" className="flex items-center group">
          <span className="text-4xl font-bold tracking-tight" style={{ color: C.primary, fontFamily: 'var(--font-fredoka), sans-serif' }}>
            Focus
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold transition-colors" style={{ color: C.onSurfaceVariant }}>
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="px-4 py-2 text-xs font-bold rounded-lg transition-all hover:scale-[1.01]"
            style={{ backgroundColor: C.primary, color: C.onPrimary }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 sm:px-12 py-16 flex flex-col items-center justify-center text-center space-y-12 z-10">
        <div className="space-y-4 max-w-3xl">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: C.accentPurple }}>
            PRICING SCHEME
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none" style={{ color: C.primary }}>
            Invest in your <br />
            <span className="text-gradient">AI Roadmap</span>
          </h1>
          <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: C.onSurfaceVariant }}>
            Choose the depth of your agent critiques. Upgrading grants unlimited syllabus generation.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full pt-6">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`p-8 rounded-3xl border flex flex-col justify-between text-left transition-all ${
                plan.highlighted 
                  ? 'shadow-xl relative' 
                  : 'hover:shadow-md'
              }`}
              style={{
                backgroundColor: C.surfaceContainerLowest,
                borderColor: plan.highlighted ? C.accentPurple : C.surfaceVariant,
                boxShadow: plan.highlighted ? '0 12px 40px rgba(211,87,154,0.12)' : '0 4px 20px rgba(0,0,0,0.03)',
              }}
            >
              {plan.highlighted && (
                <span 
                  className="absolute -top-3 left-8 px-3 py-0.5 text-white text-[9px] font-bold tracking-widest uppercase rounded-full"
                  style={{ backgroundColor: C.accentPurple }}
                >
                  RECOMMENDED
                </span>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: C.primary }}>{plan.name}</h3>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: C.onSurfaceVariant }}>{plan.description}</p>
                </div>
                
                <div className="flex items-baseline" style={{ color: C.primary }}>
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  {plan.period && <span className="text-sm font-semibold ml-1" style={{ color: C.outline }}>{plan.period}</span>}
                </div>

                <ul className="space-y-3.5 border-t pt-6" style={{ borderColor: C.surfaceVariant }}>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs" style={{ color: C.onSurfaceVariant }}>
                      <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: C.accentPurple }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                {plan.highlighted ? (
                  <Link
                    href={plan.href}
                    className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-md hover:scale-[1.01]"
                    style={{ backgroundColor: C.primary, color: C.onPrimary }}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    href={plan.href}
                    className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl font-semibold text-xs border transition-all hover:bg-zinc-50"
                    style={{
                      borderColor: C.outlineVariant,
                      backgroundColor: C.surfaceContainerLow,
                      color: C.onSurface,
                    }}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
