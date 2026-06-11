import Link from 'next/link'
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Files, Brain, Database, ScanLine, ArrowUpRight, Eye } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 dark:bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 dark:bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-purple-500/20 dark:bg-purple-600/20 rounded-full blur-[150px] mix-blend-screen animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-16 lg:py-28 relative z-10 space-y-32">
        {/* Hero Section */}
        <section className="text-center space-y-10 max-w-5xl mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface)]/60 dark:bg-slate-800/60 backdrop-blur-md border border-[var(--color-border)] text-[var(--color-text)] text-xs font-semibold tracking-[0.2em] uppercase shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            TTB COLA Verification Engine V1.0
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-[var(--color-text)]" style={{ fontFamily: 'var(--font-outfit), sans-serif', lineHeight: '1.1' }}>
            Compliance, Accelerated by{' '}
            <span className="relative inline-block mt-2 md:mt-0">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                Vision AI
              </span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-full blur-sm animate-glow-line" />
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-[var(--color-text-secondary)] leading-relaxed max-w-3xl mx-auto font-light">
            A secure, stateless architecture designed to instantly extract and cross-reference alcohol label artworks against submitted Form 5100.31 data using Claude 3.5 Sonnet (Latest).
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8">
            <Link href="/single" className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold text-white bg-blue-600 dark:bg-blue-500 rounded-xl overflow-hidden transition-all hover:scale-105 shadow-lg hover:shadow-[0_0_40px_rgba(37,99,235,0.4)]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <ScanLine className="relative z-10 h-5 w-5" />
              <span className="relative z-10">Launch Single Verify</span>
              <ArrowRight className="relative z-10 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link href="/batch" className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold text-[var(--color-text)] bg-[var(--color-surface)]/60 dark:bg-slate-800/60 backdrop-blur-md border border-[var(--color-border)] rounded-xl transition-all hover:scale-105 hover:bg-[var(--color-surface)] hover:shadow-xl">
              <Files className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              <span>Run Batch Process</span>
            </Link>
          </div>
        </section>

        {/* Feature Grid with Glassmorphism */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
          {[
            {
              icon: Brain,
              color: 'text-blue-600 dark:text-blue-400',
              bg: 'bg-blue-500/10',
              border: 'border-blue-500/20',
              title: 'Claude 3.5 Sonnet (Latest)',
              desc: 'State-of-the-art vision processing. Operates as a strict, zero-temperature OCR engine to extract verbatim text with granular confidence scoring.'
            },
            {
              icon: CheckCircle2,
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-500/10',
              border: 'border-emerald-500/20',
              title: 'Deterministic Matching',
              desc: 'Pure functional TypeScript logic for comparing forms against labels. Executes exact diffs, numeric normalization, and fuzzy string matching without AI hallucination.'
            },
            {
              icon: Database,
              color: 'text-purple-600 dark:text-purple-400',
              bg: 'bg-purple-500/10',
              border: 'border-purple-500/20',
              title: 'Stateless Security',
              desc: 'Zero-persistence architecture. Files are rasterized locally, processed entirely in-memory on Edge/Node runtimes, and instantly discarded post-verification.'
            }
          ].map((feature, idx) => (
            <div key={idx} className="group relative p-8 rounded-2xl bg-[var(--color-surface)]/60 dark:bg-slate-800/60 backdrop-blur-lg border border-[var(--color-border)] hover:border-blue-500/30 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 ${feature.bg} rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700`} />
              <div className={`relative h-14 w-14 rounded-xl ${feature.bg} flex items-center justify-center border ${feature.border} mb-6 shadow-inner`}>
                <feature.icon className={`h-7 w-7 ${feature.color}`} />
              </div>
              <h3 className="relative text-2xl font-bold text-[var(--color-text)] mb-3 tracking-tight">{feature.title}</h3>
              <p className="relative text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Human in the Loop Callout */}
        <section className="relative rounded-3xl overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />
          
          <div className="relative p-10 md:p-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-200 text-xs font-semibold tracking-wide uppercase">
                <ShieldCheck className="h-4 w-4" />
                Compliance Guardrails
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                Built for <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">Human-in-the-Loop</span>
              </h2>
              <p className="text-lg text-blue-100/80 leading-relaxed max-w-xl">
                This platform is an accelerator, not an autonomous approver. While it eliminates massive amounts of manual transcription and cross-referencing, final authority remains securely with TTB Reviewers.
              </p>
            </div>
            
            <div className="flex-1 w-full max-w-md">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
                <div className="flex gap-4 items-start">
                  <div className="mt-1 h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg">Automated Verification</h4>
                    <p className="text-blue-100/70 text-sm mt-1 leading-relaxed">Verbatim text matching for fields like ABV, Brand Name, and Net Contents are processed instantly.</p>
                  </div>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="flex gap-4 items-start">
                  <div className="mt-1 h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30 shrink-0">
                    <Eye className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg">Visual Confirmation</h4>
                    <p className="text-blue-100/70 text-sm mt-1 leading-relaxed">Subjective and visual requirements like font sizing, contrasting colors, and legibility still require manual reviewer sign-off.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack Footer */}
        <footer className="pt-12 border-t border-[var(--color-border)] text-center pb-12 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
          <p className="text-sm text-[var(--color-text-muted)] font-semibold uppercase tracking-[0.2em] mb-8">
            Powered by Modern Tooling
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 hover:opacity-100 transition-opacity duration-500">
            {['Next.js 14 App Router', 'Tailwind CSS', 'Claude 3.5 Sonnet (Latest)', 'TypeScript', 'Serverless Run-times'].map((tech, i) => (
              <span key={i} className="flex items-center gap-2 text-lg font-medium text-[var(--color-text)]">
                <ArrowUpRight className="h-4 w-4 text-[var(--color-primary)] opacity-50" />
                {tech}
              </span>
            ))}
          </div>
        </footer>
      </div>
    </div>
  )
}
