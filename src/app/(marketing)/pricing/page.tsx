import React from 'react';
import Link from 'next/link';
import { Terminal, Check, ArrowRight } from 'lucide-react';

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
    <div className="flex-1 bg-[#0A0A0F] text-[#F5F5F7] flex flex-col min-h-screen relative dots-bg">
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#7C5CFF]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="w-full border-b border-white/5 py-4 px-6 sm:px-12 flex justify-between items-center max-w-7xl mx-auto z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#7C5CFF] to-[#22D3D0] p-[1px]">
            <div className="h-full w-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
              <Terminal className="h-4.5 w-4.5 text-[#22D3D0]" />
            </div>
          </div>
          <span className="font-display text-2xl tracking-wide text-white">FOCUS</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="px-4 py-2 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] text-zinc-950 text-xs font-bold rounded-lg transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 sm:px-12 py-16 flex flex-col items-center justify-center text-center space-y-12 z-10">
        <div className="space-y-4 max-w-3xl">
          <span className="font-display text-sm tracking-widest text-[#7C5CFF] uppercase">
            PRICING SCHEME
          </span>
          <h1 className="font-display text-4xl sm:text-6xl tracking-wide text-white uppercase leading-none">
            INVEST IN YOUR <br />
            <span className="text-gradient">AI ROADMAP</span>
          </h1>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Choose the depth of your agent critiques. Upgrading grants unlimited syllabus generation.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full pt-6">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`glass-panel p-8 rounded-3xl border flex flex-col justify-between text-left transition-all ${
                plan.highlighted 
                  ? 'border-[#7C5CFF] bg-[#7C5CFF]/5 shadow-xl relative' 
                  : 'border-white/5 bg-zinc-950/40 hover:border-white/10'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3.5 left-8 px-3 py-1 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] text-zinc-950 text-[10px] font-bold tracking-widest uppercase rounded-full">
                  RECOMMENDED
                </span>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{plan.description}</p>
                </div>
                
                <div className="flex items-baseline text-white">
                  <span className="text-4xl font-display tracking-tight">{plan.price}</span>
                  {plan.period && <span className="text-sm text-zinc-500 font-semibold ml-1">{plan.period}</span>}
                </div>

                <ul className="space-y-3.5 border-t border-white/5 pt-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <Check className="h-4 w-4 text-[#22D3D0] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                {plan.highlighted ? (
                  <Link
                    href={plan.href}
                    className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl font-semibold text-sm text-zinc-950 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] hover:opacity-90 transition-all shadow-md"
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    href={plan.href}
                    className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl font-semibold text-xs border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-all"
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
