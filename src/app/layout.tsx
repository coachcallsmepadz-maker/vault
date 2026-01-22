import type { Metadata } from 'next'
import { QueryProvider } from '@/providers/QueryProvider'
import { Header } from '@/components/Header'
import './globals.css'

export const metadata: Metadata = {
    title: 'Vault - Personal Finance Tracker',
    description: 'Track your income, expenses, and subscriptions with AI-powered insights',
    keywords: ['finance', 'budget', 'money', 'tracker', 'expenses', 'income'],
    authors: [{ name: 'Vault' }],
    viewport: 'width=device-width, initial-scale=1',
    themeColor: '#14130e',
    openGraph: {
        title: 'Vault - Personal Finance Tracker',
        description: 'Track your income, expenses, and subscriptions with AI-powered insights',
        type: 'website',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <QueryProvider>
                    <div className="min-h-screen flex flex-col">
                        <Header />
                        <main className="flex-1">
                            {children}
                        </main>
                    </div>
                </QueryProvider>
            </body>
        </html>
    )
}
