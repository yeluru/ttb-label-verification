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
      className={`relative h-full inline-flex items-center px-4 text-sm font-medium transition-colors duration-150 ${
        active
          ? 'text-[#1B4F8A]'
          : 'text-[#475569] hover:text-[#0F172A]'
      }`}
    >
      {label}
      {active && (
        <span
          aria-hidden
          className="absolute inset-x-3 -bottom-px h-0.5 bg-[#1B4F8A] rounded-full"
        />
      )}
    </Link>
  )
}

export function Nav() {
  const pathname = usePathname() ?? '/'
  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] sticky top-0 z-30 backdrop-blur-[2px]">
      <div className="h-full max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none rounded-md"
        >
          <span className="h-9 w-9 rounded-md bg-[#1B4F8A] inline-flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" aria-hidden />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
              U.S. Treasury · TTB
            </span>
            <span className="text-[15px] font-semibold text-[#0F172A] group-hover:text-[#1B4F8A] transition-colors">
              Label Verification
            </span>
          </span>
        </Link>

        <nav className="ml-2 hidden sm:flex h-full items-stretch" aria-label="Primary">
          <NavLink href="/" label="Single Verify" active={pathname === '/'} />
          <NavLink
            href="/batch"
            label="Batch Verify"
            active={pathname.startsWith('/batch')}
          />
        </nav>

        <div className="ml-auto hidden md:flex items-center gap-3 text-xs text-[#94A3B8]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" aria-hidden />
            Prototype build
          </span>
          <a
            href="https://www.ttb.gov/labeling"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[#475569] hover:text-[#0F172A] transition-colors"
          >
            TTB labeling
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
      </div>
    </header>
  )
}
