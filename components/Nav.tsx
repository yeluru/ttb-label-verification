'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield } from 'lucide-react'

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`relative h-14 inline-flex items-center px-3 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4F8A] ${
        active
          ? 'text-[#1B4F8A]'
          : 'text-[#64748B] hover:text-[#1E293B]'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      {label}
      {active && (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#1B4F8A]" aria-hidden="true" />
      )}
    </Link>
  )
}

export function Nav() {
  const pathname = usePathname() ?? '/'
  return (
    <header className="h-14 bg-white border-b border-[#E2E8F0] sticky top-0 z-30">
      <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Shield className="h-5 w-5 text-[#1B4F8A]" aria-hidden="true" />
          <span className="text-[16px] font-semibold text-[#1E293B] group-hover:text-[#1B4F8A] transition-colors">
            TTB Label Verification
          </span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Primary">
          <NavLink href="/" label="Single Verify" active={pathname === '/'} />
          <NavLink href="/batch" label="Batch Verify" active={pathname.startsWith('/batch')} />
        </nav>
      </div>
    </header>
  )
}
