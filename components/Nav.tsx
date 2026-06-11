'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, ExternalLink, Sun, Moon } from 'lucide-react'


function NavLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`relative flex items-center justify-center h-9 px-3.5 rounded-md text-[13.5px] font-semibold transition-all duration-200 ${
        active
          ? 'bg-[var(--header-active-bg)] text-[var(--header-active-text)] shadow-[var(--header-active-shadow)]'
          : 'text-[var(--header-inactive-text)] hover:text-white hover:bg-[var(--header-inactive-hover-bg)]'
      }`}
    >
      {label}
    </Link>
  )
}

export function Nav() {
  const pathname = usePathname() ?? '/'
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const activeTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' || 'light'
    setTheme(activeTheme)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    localStorage.setItem('theme', nextTheme)
  }

  return (
    <header className="sticky top-0 z-30 bg-[var(--header-bg)] backdrop-blur-md border-b border-[var(--header-border)] shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-colors duration-200">
      <div className="h-16 max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 group rounded-md outline-none"
        >
          <span className="relative h-10 w-10 rounded-md bg-[var(--header-logo-bg)] border border-[var(--header-logo-border)] inline-flex items-center justify-center shadow-sm transition-colors duration-200">
            <ShieldCheck className="h-5 w-5 text-[var(--header-logo-icon)]" aria-hidden strokeWidth={2.25} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[var(--header-inactive-text)] opacity-80">
              U.S. Treasury · TTB
            </span>
            <span className="text-[15px] font-bold text-white transition-colors tracking-tight">
              Label Verification
            </span>
          </span>
        </Link>

        <nav className="ml-2 hidden sm:flex items-center gap-1.5" aria-label="Primary">
          <NavLink href="/" label="Home" active={pathname === '/'} />
          <NavLink href="/single" label="Single Verify" active={pathname.startsWith('/single')} />
          <NavLink
            href="/batch"
            label="Batch Verify"
            active={pathname.startsWith('/batch')}
          />
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            className="h-9 w-9 inline-flex items-center justify-center rounded-md theme-toggle-btn transition-transform hover:scale-110 cursor-pointer"
          >
            {theme === 'light' ? (
              <Moon className="h-4.5 w-4.5" aria-hidden />
            ) : (
              <Sun className="h-4.5 w-4.5 text-amber-400" aria-hidden />
            )}
          </button>

          <div className="hidden md:flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 h-7 rounded-md bg-slate-800 border border-slate-700/60 px-2.5 text-xs font-medium text-slate-300">
              <span className="relative flex h-1.5 w-1.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Prototype build
            </span>
            <a
              href="https://www.ttb.gov/regulated-commodities/labeling/labeling-resources"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              TTB labeling
              <ExternalLink className="h-3 w-3 text-slate-500" aria-hidden />
            </a>
          </div>
        </div>
      </div>
      <nav
        className="sm:hidden border-t border-[var(--header-border)] px-3 py-2 grid grid-cols-3 gap-2"
        aria-label="Primary mobile"
      >
        <NavLink href="/" label="Home" active={pathname === '/'} />
        <NavLink href="/single" label="Single" active={pathname.startsWith('/single')} />
        <NavLink
          href="/batch"
          label="Batch"
          active={pathname.startsWith('/batch')}
        />
      </nav>
    </header>
  )
}
