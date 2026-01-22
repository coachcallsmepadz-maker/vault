'use client'

import { useMemo } from 'react'
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/LoadingSpinner'
import { useAppStore } from '@/stores/useAppStore'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import type { Transaction } from '@/types'

interface TransactionRowProps {
    transaction: Transaction
}

function TransactionRow({ transaction }: TransactionRowProps) {
    const getIcon = () => {
        switch (transaction.type) {
            case 'income':
                return <ArrowUpRight className="w-4 h-4 text-malachite" />
            case 'expense':
                return <ArrowDownRight className="w-4 h-4 text-expense" />
            case 'transfer':
                return <ArrowLeftRight className="w-4 h-4 text-iron-grey" />
        }
    }

    const getAmountColor = () => {
        switch (transaction.type) {
            case 'income':
                return 'text-malachite'
            case 'expense':
                return 'text-expense'
            default:
                return 'text-papaya-whip/70'
        }
    }

    const getAmountPrefix = () => {
        switch (transaction.type) {
            case 'income':
                return '+'
            case 'expense':
                return '-'
            default:
                return ''
        }
    }

    return (
        <div className="flex items-center gap-3 py-3 border-b border-iron-grey/30 last:border-0">
            <div className={`p-2 rounded-lg ${transaction.type === 'income'
                    ? 'bg-malachite/10'
                    : transaction.type === 'expense'
                        ? 'bg-expense/10'
                        : 'bg-iron-grey/20'
                }`}>
                {getIcon()}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-papaya-whip truncate">
                    {transaction.merchantName}
                </p>
                <p className="text-xs text-papaya-whip/50">
                    {formatDate(transaction.transactionDate)} • {transaction.time || formatTime(transaction.transactionDate)}
                </p>
            </div>

            <div className="text-right">
                <p className={`text-sm font-medium tabular-nums ${getAmountColor()}`}>
                    {getAmountPrefix()}{formatCurrency(transaction.amount)}
                </p>
                {transaction.description && (
                    <p className="text-xs text-papaya-whip/40 truncate max-w-[120px]">
                        {transaction.description}
                    </p>
                )}
            </div>
        </div>
    )
}

export function TransactionList({ limit = 10 }: { limit?: number }) {
    const getTransactionsInPeriod = useAppStore((s) => s.getTransactionsInPeriod)
    const isLoading = useAppStore((s) => s.isLoading)

    const transactions = useMemo(() => {
        return getTransactionsInPeriod()
            .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
            .slice(0, limit)
    }, [getTransactionsInPeriod, limit])

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 py-3 border-b border-iron-grey/30 last:border-0">
                            <Skeleton variant="circular" width={36} height={36} />
                            <div className="flex-1">
                                <Skeleton width="50%" height={16} className="mb-1" />
                                <Skeleton width="30%" height={12} />
                            </div>
                            <Skeleton width={80} height={16} />
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                {transactions.length === 0 ? (
                    <div className="text-center py-8 text-papaya-whip/50">
                        No transactions found
                    </div>
                ) : (
                    <div>
                        {transactions.map((tx) => (
                            <TransactionRow key={tx.id} transaction={tx} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
