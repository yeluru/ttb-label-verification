'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, ExternalLink, Github } from 'lucide-react'

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
      className={`relative inline-flex items-center h-9 px-3.5 rounded-md text-[13.5px] font-medium transition-colors duration-150 ${
        active
          ? 'bg-[#EEF4FB] text-[#1B4F8A]'
          : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F6F8FB]'
      }`}
    >
      {label}
    </Link>
  )
}

export function Nav() {
  const pathname = usePathname() ?? '/'
  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-[#E2E8F0]">
      <div className="h-16 max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 group rounded-md outline-none"
        >
          <span className="relative h-10 w-10 rounded-lg bg-gradient-to-br from-[#1B4F8A] to-[#163F6E] inline-flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" aria-hidden strokeWidth={2.25} />
            <span
              aria-hidden
              className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/15"
            />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
              U.S. Treasury · TTB
            </span>
            <span className="text-[15px] font-semibold text-[#0F172A] group-hover:text-[#1B4F8A] transition-colors tracking-tight">
              Label Verification
            </span>
          </span>
        </Link>

        <nav className="ml-2 hidden sm:flex items-center gap-1" aria-label="Primary">
          <NavLink href="/" label="Single Verify" active={pathname === '/'} />
          <NavLink
            href="/batch"
            label="Batch Verify"
            active={pathname.startsWith('/batch')}
          />
        </nav>

        <div className="ml-auto hidden md:flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 chip">
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
            </span>
            Prototype build
          </span>
          <a
            href="https://www.ttb.gov/labeling"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#0F172A] transition-colors"
          >
            TTB labeling
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
      </div>
    </header>
  )
}
