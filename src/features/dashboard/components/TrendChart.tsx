'use client'

import { useMemo } from 'react'
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Area,
    ComposedChart,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { ChartSkeleton } from '@/components/ui/LoadingSpinner'
import { useAppStore } from '@/stores/useAppStore'
import { format, eachDayOfInterval, startOfDay } from 'date-fns'

interface CustomTooltipProps {
    active?: boolean
    payload?: Array<{
        name: string
        value: number
        color: string
    }>
    label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null

    return (
        <div className="bg-card border border-iron-grey rounded-lg p-3 shadow-xl">
            <p className="text-papaya-whip font-medium mb-2">{label}</p>
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-papaya-whip/70">{entry.name}:</span>
                    <span className="text-papaya-whip font-medium">
                        ${entry.value.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            ))}
        </div>
    )
}

export function TrendChart() {
    const transactions = useAppStore((s) => s.transactions)
    const selectedPeriod = useAppStore((s) => s.selectedPeriod)
    const isLoading = useAppStore((s) => s.isLoading)

    const chartData = useMemo(() => {
        const { from, to } = selectedPeriod
        const days = eachDayOfInterval({ start: from, end: to })

        return days.map((day) => {
            const dayStart = startOfDay(day)
            const dayTransactions = transactions.filter((t) => {
                const txDate = startOfDay(new Date(t.transactionDate))
                return txDate.getTime() === dayStart.getTime()
            })

            const income = dayTransactions
                .filter((t) => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0)

            const expenses = dayTransactions
                .filter((t) => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)

            return {
                date: format(day, 'MMM d'),
                fullDate: format(day, 'MMM d, yyyy'),
                income,
                expenses,
            }
        })
    }, [transactions, selectedPeriod])

    if (isLoading) {
        return <ChartSkeleton />
    }

    const hasData = chartData.some((d) => d.income > 0 || d.expenses > 0)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Income vs Expenses Trend</CardTitle>
            </CardHeader>
            <CardContent>
                {!hasData ? (
                    <div className="h-[300px] flex items-center justify-center text-papaya-whip/50">
                        No transaction data available for this period
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0dd44c" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0dd44c" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#4d5453"
                                opacity={0.3}
                                vertical={false}
                            />

                            <XAxis
                                dataKey="date"
                                stroke="#fff1d0"
                                opacity={0.7}
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={{ stroke: '#4d5453' }}
                            />

                            <YAxis
                                stroke="#fff1d0"
                                opacity={0.7}
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />

                            <Tooltip content={<CustomTooltip />} />

                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                formatter={(value) => (
                                    <span className="text-papaya-whip/70 text-sm">{value}</span>
                                )}
                            />

                            <Area
                                type="monotone"
                                dataKey="income"
                                stroke="#0dd44c"
                                fill="url(#incomeGradient)"
                                strokeWidth={0}
                            />

                            <Area
                                type="monotone"
                                dataKey="expenses"
                                stroke="#FF6B35"
                                fill="url(#expenseGradient)"
                                strokeWidth={0}
                            />

                            <Line
                                type="monotone"
                                dataKey="income"
                                name="Income"
                                stroke="#0dd44c"
                                strokeWidth={2}
                                dot={{ fill: '#0dd44c', r: 3 }}
                                activeDot={{ r: 6, fill: '#0dd44c' }}
                            />

                            <Line
                                type="monotone"
                                dataKey="expenses"
                                name="Expenses"
                                stroke="#FF6B35"
                                strokeWidth={2}
                                dot={{ fill: '#FF6B35', r: 3 }}
                                activeDot={{ r: 6, fill: '#FF6B35' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}
