'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, ExternalLink } from 'lucide-react'

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
      className={`relative flex items-center justify-center h-9 px-3.5 rounded-md text-[13.5px] font-medium transition-colors duration-150 ${
        active
          ? 'bg-white text-[#0B1F33]'
          : 'text-white/75 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
    </Link>
  )
}

export function Nav() {
  const pathname = usePathname() ?? '/'
  return (
    <header className="sticky top-0 z-30 bg-[#0B1F33] border-b border-white/10 shadow-[0_1px_0_rgb(255_255_255/0.08),0_14px_32px_-24px_rgb(15_23_42/0.9)]">
      <div className="h-16 max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 group rounded-md outline-none"
        >
          <span className="relative h-10 w-10 rounded-md bg-white inline-flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-5 w-5 text-[#1B4F8A]" aria-hidden strokeWidth={2.25} />
            <span
              aria-hidden
              className="absolute inset-0 rounded-md ring-1 ring-inset ring-[#1B4F8A]/15"
            />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#9FB6D1]">
              U.S. Treasury · TTB
            </span>
            <span className="text-[15px] font-semibold text-white transition-colors tracking-tight">
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
          <span className="inline-flex items-center gap-1.5 h-7 rounded-md bg-white/10 px-2.5 text-xs font-medium text-white/85">
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
            className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
          >
            TTB labeling
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
      </div>
      <nav
        className="sm:hidden border-t border-white/10 px-3 py-2 grid grid-cols-2 gap-2"
        aria-label="Primary mobile"
      >
        <NavLink href="/" label="Single Verify" active={pathname === '/'} />
        <NavLink
          href="/batch"
          label="Batch Verify"
          active={pathname.startsWith('/batch')}
        />
      </nav>
    </header>
  )
}
