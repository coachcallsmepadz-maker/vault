'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardValue, CardSubtitle } from '@/components/ui/Card'
import { useAppStore } from '@/stores/useAppStore'
import { formatCurrency } from '@/lib/utils'

export function BalanceCards() {
    const getStats = useAppStore((s) => s.getStats)
    const stats = getStats()

    const isPositiveChange = stats.todaysChange >= 0

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Balance Card */}
            <Card className="relative overflow-hidden">
                <div className="absolute inset-0 gradient-card pointer-events-none" />
                <div className="relative">
                    <CardSubtitle>Current Balance</CardSubtitle>
                    <CardValue size="large">
                        {formatCurrency(stats.totalBalance)}
                    </CardValue>
                </div>
            </Card>

            {/* Today's Net Change Card */}
            <Card className="relative overflow-hidden">
                <div className="absolute inset-0 gradient-card pointer-events-none" />
                <div className="relative">
                    <CardSubtitle>Today&apos;s Movement</CardSubtitle>
                    <div className="flex items-center gap-2">
                        <CardValue
                            size="large"
                            color={isPositiveChange ? 'positive' : 'negative'}
                        >
                            {isPositiveChange ? '+' : ''}{formatCurrency(stats.todaysChange)}
                        </CardValue>
                        {isPositiveChange ? (
                            <TrendingUp className="w-6 h-6 text-malachite" />
                        ) : (
                            <TrendingDown className="w-6 h-6 text-expense" />
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}
