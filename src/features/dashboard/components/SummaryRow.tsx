'use client'

import { ArrowUpRight, ArrowDownRight, PiggyBank } from 'lucide-react'
import { Card, CardValue, CardSubtitle } from '@/components/ui/Card'
import { useAppStore } from '@/stores/useAppStore'
import { formatCurrency } from '@/lib/utils'

export function SummaryRow() {
    const getStats = useAppStore((s) => s.getStats)
    const selectedPeriod = useAppStore((s) => s.selectedPeriod)
    const stats = getStats()

    const isPositiveSavings = stats.netSavings >= 0

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Income Card */}
            <Card hover>
                <div className="flex items-start justify-between">
                    <div>
                        <CardSubtitle>Income ({selectedPeriod.label})</CardSubtitle>
                        <CardValue color="positive">
                            {formatCurrency(stats.incomeThisPeriod)}
                        </CardValue>
                    </div>
                    <div className="p-2 rounded-lg bg-malachite/20">
                        <ArrowUpRight className="w-5 h-5 text-malachite" />
                    </div>
                </div>
            </Card>

            {/* Expenses Card */}
            <Card hover>
                <div className="flex items-start justify-between">
                    <div>
                        <CardSubtitle>Expenses ({selectedPeriod.label})</CardSubtitle>
                        <CardValue color="negative">
                            {formatCurrency(stats.expensesThisPeriod)}
                        </CardValue>
                    </div>
                    <div className="p-2 rounded-lg bg-expense/20">
                        <ArrowDownRight className="w-5 h-5 text-expense" />
                    </div>
                </div>
            </Card>

            {/* Net Savings Card */}
            <Card hover>
                <div className="flex items-start justify-between">
                    <div>
                        <CardSubtitle>Net Savings</CardSubtitle>
                        <CardValue color={isPositiveSavings ? 'positive' : 'negative'}>
                            {isPositiveSavings ? '+' : ''}{formatCurrency(stats.netSavings)}
                        </CardValue>
                    </div>
                    <div className={`p-2 rounded-lg ${isPositiveSavings ? 'bg-malachite/20' : 'bg-expense/20'}`}>
                        <PiggyBank className={`w-5 h-5 ${isPositiveSavings ? 'text-malachite' : 'text-expense'}`} />
                    </div>
                </div>
            </Card>
        </div>
    )
}
