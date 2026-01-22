'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { BalanceCards } from '@/features/dashboard/components/BalanceCards'
import { SummaryRow } from '@/features/dashboard/components/SummaryRow'
import { TrendChart } from '@/features/dashboard/components/TrendChart'
import { CategoryDonut } from '@/features/dashboard/components/CategoryDonut'
import { TopCategories } from '@/features/dashboard/components/TopCategories'
import { SubscriptionsSection } from '@/features/subscriptions/SubscriptionsSection'
import { RecommendationsSection } from '@/features/recommendations/RecommendationsSection'
import { Button } from '@/components/ui/Button'
import { Vault } from 'lucide-react'

export default function DashboardPage() {
    const [isHydrated, setIsHydrated] = useState(false)

    const isConnected = useAppStore((s) => s.isConnected)
    const setConnected = useAppStore((s) => s.setConnected)
    const setUser = useAppStore((s) => s.setUser)
    const setTransactions = useAppStore((s) => s.setTransactions)
    const setSubscriptions = useAppStore((s) => s.setSubscriptions)
    const setBalance = useAppStore((s) => s.setBalance)
    const setLoading = useAppStore((s) => s.setLoading)
    const updateLastSync = useAppStore((s) => s.updateLastSync)
    const lastSyncAt = useAppStore((s) => s.lastSyncAt)

    // Handle hydration
    useEffect(() => {
        setIsHydrated(true)
    }, [])

    const [email, setEmail] = useState('')
    const [isConnecting, setIsConnecting] = useState(false)

    // Handle hydration
    useEffect(() => {
        setIsHydrated(true)
    }, [])

    // Auto-sync on mount if needed
    useEffect(() => {
        if (!isHydrated) return

        // Check if we should auto-sync (if last sync > 1 hour ago)
        const shouldAutoSync = !lastSyncAt ||
            (new Date().getTime() - new Date(lastSyncAt).getTime()) > 60 * 60 * 1000

        if (isConnected && shouldAutoSync) {
            handleSync()
        }
    }, [isHydrated, isConnected])

    const handleSync = async () => {
        setLoading(true)

        try {
            const basiqUserId = useAppStore.getState().user.basiqUserId

            if (!basiqUserId) {
                console.warn('No Basiq User ID found for sync')
                return
            }

            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ basiqUserId }),
            })

            if (response.ok) {
                const result = await response.json()

                if (result.data) {
                    setTransactions(result.data.transactions || [])
                    setSubscriptions(result.data.subscriptions || [])
                    setBalance(result.data.balance || 0)
                    updateLastSync()
                }
            }
        } catch (error) {
            console.error('Sync failed:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDemoConnect = async () => {
        // Set demo user and connect
        setUser({ id: 'demo-user', basiqUserId: 'demo-user' })
        setConnected(true)

        // Load demo data
        // We'll call handleSync which now handles getting the user id from store
        setTimeout(() => handleSync(), 0)
    }

    const handleRealConnect = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setIsConnecting(true)
        try {
            // 1. Create Basiq User
            const userRes = await fetch('/api/basiq/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'createUser', email }),
            })

            if (!userRes.ok) throw new Error('Failed to create Basiq user')
            const { userId } = await userRes.json()

            // 2. Save user to store
            setUser({ id: userId, basiqUserId: userId })

            // 3. Get Consent URL
            const consentRes = await fetch('/api/basiq/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'consentUrl', userId }),
            })

            if (!consentRes.ok) throw new Error('Failed to get consent URL')
            const { url } = await consentRes.json()

            // 4. Mark as connected (to show dashboard upon return)
            setConnected(true)

            // 5. Redirect to Basiq
            window.location.href = url
        } catch (error) {
            console.error('Connection failed:', error)
            alert('Failed to connect to Basiq. Please check your configuration.')
        } finally {
            setIsConnecting(false)
        }
    }

    // Don't render until hydrated to avoid hydration mismatch
    if (!isHydrated) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                <div className="animate-pulse-slow">
                    <Vault className="w-12 h-12 text-malachite" />
                </div>
            </div>
        )
    }

    // Landing page for new users
    if (!isConnected) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
                <div className="text-center w-full max-w-md">
                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-malachite to-bright-fern">
                        <Vault className="w-10 h-10 text-pitch-black" />
                    </div>

                    <h1 className="text-3xl font-bold text-papaya-whip mb-3">
                        Welcome to Vault
                    </h1>

                    <p className="text-papaya-whip/70 mb-8">
                        Connect your bank account to start tracking your finances with AI-powered insights.
                    </p>

                    <form onSubmit={handleRealConnect} className="space-y-4 mb-8">
                        <div className="text-left">
                            <label htmlFor="email" className="block text-xs font-medium text-papaya-whip/50 mb-1.5 ml-1">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-papaya-whip placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-malachite/50 focus:border-malachite transition-all"
                            />
                        </div>

                        <Button
                            variant="primary"
                            size="lg"
                            type="submit"
                            className="w-full"
                            disabled={isConnecting}
                        >
                            {isConnecting ? 'Connecting...' : 'Connect Bank Account'}
                        </Button>
                    </form>

                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-pitch-black px-2 text-papaya-whip/30">Or try first</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={handleDemoConnect}
                            className="w-full"
                        >
                            Try Demo Mode
                        </Button>

                        <p className="text-xs text-papaya-whip/40">
                            No bank connection required for demo mode.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Main dashboard
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Hero Section - Balance Cards */}
            <section>
                <BalanceCards />
            </section>

            {/* Summary Row */}
            <section>
                <SummaryRow />
            </section>

            {/* Main Content - Two Columns */}
            <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column - 60% */}
                <div className="lg:col-span-3 space-y-6">
                    <TrendChart />
                    <TopCategories />
                </div>

                {/* Right Column - 40% */}
                <div className="lg:col-span-2">
                    <CategoryDonut />
                </div>
            </section>

            {/* Subscriptions Section */}
            <section>
                <SubscriptionsSection />
            </section>

            {/* AI Recommendations Section */}
            <section>
                <RecommendationsSection />
            </section>
        </div>
    )
}
