import type { Metadata } from 'next'
import './globals.css'
import { DemoModeBanner } from '@/components/DemoModeBanner'

export const metadata: Metadata = {
  title: 'OpsPilot AI - Incident Response Dashboard',
  description: 'AI-powered incident response agent for AWS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <DemoModeBanner />
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">OpsPilot AI</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">AWS Agentic AI</span>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
