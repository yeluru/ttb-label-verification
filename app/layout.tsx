import type { Metadata } from 'next'
import { Outfit, Fira_Sans, Fira_Code } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/Nav'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
})

const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fira-sans',
  display: 'swap',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-fira-code',
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
    <html lang="en" className={`${outfit.variable} ${firaSans.variable} ${firaCode.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var theme = localStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', theme);
          })();
        ` }} />
      </head>
      <body
        className="min-h-full antialiased flex flex-col"
        style={{ fontFamily: 'var(--font-fira-sans), sans-serif' }}
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
