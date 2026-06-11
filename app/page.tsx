import Link from 'next/link'
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Files, Brain, Database, Eye, XCircle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 lg:py-20 space-y-24">
      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-4xl mx-auto fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs font-semibold tracking-wide uppercase mb-4">
          <ShieldCheck className="h-4 w-4" />
          Prototype V1.0
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[var(--color-text)]" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
          Automating COLA Verification with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">Vision AI</span>
        </h1>
        <p className="text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto">
          A secure, stateless prototype designed to accelerate U.S. Treasury TTB label approvals by instantly extracting and cross-referencing text against submitted form data.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/single" className="btn-primary w-full sm:w-auto text-base px-8 py-3.5 rounded-lg shadow-lg shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/40 transition-all hover:-translate-y-0.5 group">
            <Zap className="h-5 w-5 mr-2" />
            Try Single Verification
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/batch" className="btn-ghost w-full sm:w-auto text-base px-8 py-3.5 rounded-lg border-2 border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-all">
            <Files className="h-5 w-5 mr-2" />
            Run Batch Process
          </Link>
        </div>
      </section>

      {/* Architecture / How it Works Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card panel-accent p-8 space-y-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text)]">1. Claude 3.5 Sonnet</h3>
          <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">
            The image is securely passed to Anthropic&apos;s state-of-the-art vision model. It acts as a strict OCR engine, extracting text verbatim with high precision and reporting confidence levels for obscured fields.
          </p>
        </div>

        <div className="card panel-accent p-8 space-y-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text)]">2. Deterministic Matching</h3>
          <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">
            AI handles extraction, but compliance logic is pure, deterministic TypeScript. It performs fuzzy matching, numerical conversions, and exact string diffs to flag discrepancies without AI hallucination risk.
          </p>
        </div>

        <div className="card panel-accent p-8 space-y-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text)]">3. Stateless Security</h3>
          <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">
            Built for privacy. There is no database. Images are processed entirely in memory via serverless Edge/Node functions and instantly discarded, ensuring strict data residency compliance.
          </p>
        </div>
      </section>

      {/* Visual Constraints Section */}
      <section className="card panel-accent p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Eye className="h-48 w-48 text-[var(--color-primary)]" />
        </div>
        <div className="max-w-2xl relative z-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] tracking-tight">
            Designed for Human-in-the-Loop
          </h2>
          <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
            This tool is an <strong>accelerator</strong>, not an autonomous approver. While it drastically reduces manual data entry and visual scanning, hiring managers and reviewers retain final authority.
          </p>
          <ul className="space-y-3 mt-6">
            <li className="flex items-start gap-3 text-[14px] text-[var(--color-text)]">
              <XCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <span>Visual-only requirements like font sizing, contrasting colors, and legibility still require manual confirmation.</span>
            </li>
            <li className="flex items-start gap-3 text-[14px] text-[var(--color-text)]">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>Verbatim text matches (ABV, Brand Name, Class/Type) are automated instantly.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Tech Stack Footer */}
      <footer className="pt-12 border-t border-[var(--color-border)] text-center pb-8">
        <p className="text-[13px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider mb-6">
          Built with Modern Web Technologies
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <span className="text-lg font-bold font-mono tracking-tight">Next.js 14</span>
          <span className="text-lg font-bold font-mono tracking-tight">Tailwind CSS</span>
          <span className="text-lg font-bold font-mono tracking-tight">Claude 3.5 Sonnet</span>
          <span className="text-lg font-bold font-mono tracking-tight">TypeScript</span>
        </div>
      </footer>
    </div>
  )
}
