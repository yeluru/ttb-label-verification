import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/Nav'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TTB Label Verification · US Treasury',
  description:
    'AI-powered label verification for the US Alcohol and Tobacco Tax and Trade Bureau (TTB) COLA review process.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} h-full`}>
      <body
        className="min-h-full bg-[#F8FAFC] text-[#0F172A] antialiased flex flex-col"
        style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-[#1B4F8A] focus:text-white focus:px-3 focus:py-1.5 focus:text-sm"
        >
          Skip to main content
        </a>
        <Nav />
        <main id="main" className="flex-1 min-h-0">
          {children}
        </main>
      </body>
    </html>
  )
}
