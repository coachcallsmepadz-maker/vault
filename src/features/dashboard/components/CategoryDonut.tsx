'use client'

import { useMemo } from 'react'
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { ChartSkeleton } from '@/components/ui/LoadingSpinner'
import { useAppStore } from '@/stores/useAppStore'
import { formatCurrency, getCategoryColor } from '@/lib/utils'
import { CATEGORY_MAP } from '@/types'

interface TooltipPayload {
    name: string
    value: number
    payload: {
        percentage: number
        color: string
    }
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (!active || !payload?.length) return null

    const data = payload[0]

    return (
        <div className="bg-card border border-iron-grey rounded-lg p-3 shadow-xl">
            <p className="text-papaya-whip font-medium">{data.name}</p>
            <p className="text-papaya-whip/80 text-sm">
                {formatCurrency(data.value)}
            </p>
            <p className="text-papaya-whip/60 text-xs">
                {data.payload.percentage.toFixed(1)}% of total
            </p>
        </div>
    )
}

interface LegendPayload {
    value: string
    color: string
}

const CustomLegend = ({ payload }: { payload?: LegendPayload[] }) => {
    if (!payload?.length) return null

    return (
        <div className="flex flex-wrap justify-center gap-3 mt-4">
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs">
                    <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-papaya-whip/70">{entry.value}</span>
                </div>
            ))}
        </div>
    )
}

export function CategoryDonut() {
    const getTransactionsInPeriod = useAppStore((s) => s.getTransactionsInPeriod)
    const isLoading = useAppStore((s) => s.isLoading)

    const { chartData, totalSpent } = useMemo(() => {
        const transactions = getTransactionsInPeriod()
        const expenseTransactions = transactions.filter((t) => t.type === 'expense')

        // Group by category
        const categoryTotals = expenseTransactions.reduce((acc, t) => {
            const category = t.category || 'other'
            acc[category] = (acc[category] || 0) + t.amount
            return acc
        }, {} as Record<string, number>)

        const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0)

        // Convert to chart data format
        const data = Object.entries(categoryTotals)
            .map(([category, amount], index) => ({
                name: CATEGORY_MAP[category]?.name || category,
                value: amount,
                percentage: total > 0 ? (amount / total) * 100 : 0,
                color: CATEGORY_MAP[category]?.color || getCategoryColor(index),
                icon: CATEGORY_MAP[category]?.icon || '📦',
            }))
            .sort((a, b) => b.value - a.value)

        return { chartData: data, totalSpent: total }
    }, [getTransactionsInPeriod])

    if (isLoading) {
        return <ChartSkeleton className="h-full" />
    }

    const hasData = chartData.length > 0 && totalSpent > 0

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
                {!hasData ? (
                    <div className="h-[300px] flex items-center justify-center text-papaya-whip/50">
                        No expense data available
                    </div>
                ) : (
                    <div className="relative">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    animationBegin={0}
                                    animationDuration={500}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={entry.color}
                                            stroke="none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend content={<CustomLegend />} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginBottom: '40px' }}>
                            <div className="text-center">
                                <p className="text-xs text-papaya-whip/50">Total Spent</p>
                                <p className="text-xl font-bold text-papaya-whip">
                                    {formatCurrency(totalSpent)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
