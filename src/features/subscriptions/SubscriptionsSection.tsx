'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, X, CreditCard } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { IconButton } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/LoadingSpinner'
import { useAppStore } from '@/stores/useAppStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { calculateMonthlySubscriptionCost } from '@/lib/subscriptionDetector'
import type { Subscription } from '@/types'

interface SubscriptionCardProps {
    subscription: Subscription
    onRemove: (id: string) => void
}

function SubscriptionCard({ subscription, onRemove }: SubscriptionCardProps) {
    const frequencyLabel = {
        monthly: '/month',
        weekly: '/week',
        yearly: '/year',
    }[subscription.frequency]

    return (
        <Card className="relative group">
            {subscription.autoDetected && (
                <Badge variant="new" className="absolute top-3 right-3">
                    Auto-detected
                </Badge>
            )}

            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h4 className="font-semibold text-papaya-whip mb-1">
                        {subscription.merchantName}
                    </h4>

                    <p className="text-lg font-bold text-papaya-whip">
                        {formatCurrency(subscription.amount)}
                        <span className="text-sm font-normal text-papaya-whip/50">
                            {frequencyLabel}
                        </span>
                    </p>

                    <p className="text-xs text-papaya-whip/50 mt-2">
                        Next billing: {formatDate(subscription.nextBillingDate)}
                    </p>

                    <Badge
                        variant={subscription.isActive ? 'success' : 'default'}
                        className="mt-2"
                    >
                        {subscription.isActive ? 'Active' : 'Paused'}
                    </Badge>
                </div>

                <IconButton
                    icon={<X className="w-4 h-4" />}
                    label="Remove subscription"
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemove(subscription.id)}
                />
            </div>
        </Card>
    )
}

export function SubscriptionsSection() {
    const subscriptions = useAppStore((s) => s.subscriptions)
    const removeSubscription = useAppStore((s) => s.removeSubscription)
    const isSubscriptionsExpanded = useAppStore((s) => s.isSubscriptionsExpanded)
    const toggleSubscriptionsExpanded = useAppStore((s) => s.toggleSubscriptionsExpanded)
    const isLoading = useAppStore((s) => s.isLoading)

    const activeSubscriptions = subscriptions.filter((s) => s.isActive)
    const monthlyTotal = calculateMonthlySubscriptionCost(activeSubscriptions)
    const newSubscriptions = activeSubscriptions.filter((s) => s.autoDetected)

    const handleRemove = async (id: string) => {
        // Optimistically remove from UI
        removeSubscription(id)

        // Call API to update Supabase
        try {
            await fetch('/api/subscriptions', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })
        } catch (error) {
            console.error('Failed to remove subscription:', error)
        }
    }

    if (isLoading) {
        return (
            <div className="mt-8 bg-card border border-iron-grey rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <Skeleton width={200} height={24} />
                    <Skeleton width={100} height={24} />
                </div>
            </div>
        )
    }

    return (
        <div className="mt-8">
            {/* Header - Always visible */}
            <button
                onClick={toggleSubscriptionsExpanded}
                className="w-full flex items-center justify-between bg-card border border-iron-grey rounded-xl p-4 hover:border-iron-grey/80 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-malachite" />
                    <span className="font-semibold text-papaya-whip">Subscriptions</span>
                    {newSubscriptions.length > 0 && (
                        <Badge variant="new">
                            {newSubscriptions.length} new detected
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-papaya-whip">
                        {formatCurrency(monthlyTotal)}
                        <span className="text-sm font-normal text-papaya-whip/50">/month</span>
                    </span>

                    {isSubscriptionsExpanded ? (
                        <ChevronUp className="w-5 h-5 text-papaya-whip/50" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-papaya-whip/50" />
                    )}
                </div>
            </button>

            {/* Expanded content */}
            {isSubscriptionsExpanded && (
                <div className="mt-4 animate-slide-down">
                    {activeSubscriptions.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-8">
                                <CreditCard className="w-12 h-12 text-iron-grey mx-auto mb-3" />
                                <p className="text-papaya-whip/70">No subscriptions detected yet</p>
                                <p className="text-papaya-whip/50 text-sm mt-1">
                                    We&apos;ll automatically detect recurring payments from your transactions
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeSubscriptions.map((subscription) => (
                                <SubscriptionCard
                                    key={subscription.id}
                                    subscription={subscription}
                                    onRemove={handleRemove}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
