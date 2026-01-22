'use client'

import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/LoadingSpinner'
import { useAppStore } from '@/stores/useAppStore'
import { formatCurrency, calculatePercentage, getCategoryColor } from '@/lib/utils'
import { CATEGORY_MAP } from '@/types'

interface CategoryItemProps {
    name: string
    icon: string
    amount: number
    percentage: number
    color: string
    onClick?: () => void
}

function CategoryItem({ name, icon, amount, percentage, color, onClick }: CategoryItemProps) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-papaya-whip/5 transition-colors group"
        >
            <span className="text-xl">{icon}</span>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-papaya-whip truncate">
                        {name}
                    </span>
                    <span className="text-sm font-medium text-papaya-whip tabular-nums">
                        {formatCurrency(amount)}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-iron-grey/30 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: color,
                        }}
                    />
                </div>
            </div>

            <span className="text-xs text-papaya-whip/50 tabular-nums w-12 text-right">
                {percentage.toFixed(1)}%
            </span>

            <ChevronRight className="w-4 h-4 text-papaya-whip/30 group-hover:text-papaya-whip/60 transition-colors" />
        </button>
    )
}

export function TopCategories() {
    const getTransactionsInPeriod = useAppStore((s) => s.getTransactionsInPeriod)
    const selectedPeriod = useAppStore((s) => s.selectedPeriod)
    const isLoading = useAppStore((s) => s.isLoading)

    const categories = useMemo(() => {
        const transactions = getTransactionsInPeriod()
        const expenseTransactions = transactions.filter((t) => t.type === 'expense')

        // Group by category
        const categoryTotals = expenseTransactions.reduce((acc, t) => {
            const category = t.category || 'other'
            acc[category] = (acc[category] || 0) + t.amount
            return acc
        }, {} as Record<string, number>)

        const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0)

        // Convert to sorted array with top 5
        return Object.entries(categoryTotals)
            .map(([category, amount], index) => ({
                id: category,
                name: CATEGORY_MAP[category]?.name || category,
                icon: CATEGORY_MAP[category]?.icon || '📦',
                amount,
                percentage: calculatePercentage(amount, total),
                color: CATEGORY_MAP[category]?.color || getCategoryColor(index),
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
    }, [getTransactionsInPeriod])

    const handleCategoryClick = (categoryId: string) => {
        // This could open a filtered transaction view
        console.log('View transactions for category:', categoryId)
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Top Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3">
                            <Skeleton variant="circular" width={32} height={32} />
                            <div className="flex-1">
                                <Skeleton width="60%" height={16} className="mb-2" />
                                <Skeleton width="100%" height={6} />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Top Categories ({selectedPeriod.label})</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {categories.length === 0 ? (
                    <div className="text-center py-8 text-papaya-whip/50">
                        No expense categories found
                    </div>
                ) : (
                    <div className="space-y-1">
                        {categories.map((category) => (
                            <CategoryItem
                                key={category.id}
                                name={category.name}
                                icon={category.icon}
                                amount={category.amount}
                                percentage={category.percentage}
                                color={category.color}
                                onClick={() => handleCategoryClick(category.id)}
                            />
                        ))}
                    </div>
                )}

                {/* View All Link */}
                <button className="mt-4 w-full py-2 text-sm text-malachite hover:text-bright-fern transition-colors flex items-center justify-center gap-1">
                    View All Transactions
                    <ChevronRight className="w-4 h-4" />
                </button>
            </CardContent>
        </Card>
    )
}
