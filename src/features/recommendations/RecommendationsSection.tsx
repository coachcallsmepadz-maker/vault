'use client'

import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/LoadingSpinner'
import { useAppStore } from '@/stores/useAppStore'
import { formatDate } from '@/lib/utils'
import type { Recommendation } from '@/types'

interface RecommendationCardProps {
    recommendation: Recommendation
    index: number
}

function RecommendationCard({ recommendation, index }: RecommendationCardProps) {
    return (
        <Card
            className="animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="text-3xl mb-3">{recommendation.icon}</div>

            <h4 className="font-semibold text-papaya-whip mb-2">
                {recommendation.title}
            </h4>

            <p className="text-sm text-papaya-whip/70 mb-3">
                {recommendation.analysis}
            </p>

            <p className="text-sm text-malachite font-medium">
                {recommendation.action}
            </p>
        </Card>
    )
}

export function RecommendationsSection() {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [generatedAt, setGeneratedAt] = useState<Date | null>(null)
    const [canGenerate, setCanGenerate] = useState(true)
    const [hoursUntilRefresh, setHoursUntilRefresh] = useState(0)

    const user = useAppStore((s) => s.user)

    // Check for cached recommendations on mount
    useEffect(() => {
        if (user.id) {
            checkCachedRecommendations()
        }
    }, [user.id])

    const checkCachedRecommendations = async () => {
        try {
            const response = await fetch(`/api/recommendations?userId=${user.id}`)
            if (response.ok) {
                const data = await response.json()
                if (data.recommendations) {
                    setRecommendations(data.recommendations)
                    setGeneratedAt(new Date(data.generatedAt))

                    // Check if 24 hours have passed
                    const hoursSince = (Date.now() - new Date(data.generatedAt).getTime()) / (1000 * 60 * 60)
                    if (hoursSince < 24) {
                        setCanGenerate(false)
                        setHoursUntilRefresh(Math.ceil(24 - hoursSince))
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch cached recommendations:', err)
        }
    }

    const generateRecommendations = async () => {
        if (!user.id || !canGenerate) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            })

            if (!response.ok) {
                throw new Error('Failed to generate recommendations')
            }

            const data = await response.json()
            setRecommendations(data.recommendations)
            setGeneratedAt(new Date(data.generatedAt))
            setCanGenerate(false)
            setHoursUntilRefresh(24)
        } catch (err) {
            setError('Unable to generate insights. Please try again later.')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="mt-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-malachite" />
                    <h2 className="text-lg font-semibold text-papaya-whip">
                        AI Insights for Next 14 Days
                    </h2>
                </div>

                {recommendations.length === 0 ? (
                    <Button
                        variant="primary"
                        onClick={generateRecommendations}
                        loading={isLoading}
                        disabled={!canGenerate || isLoading}
                        icon={<Sparkles className="w-4 h-4" />}
                    >
                        {canGenerate ? 'Generate Insights' : `Check back in ${hoursUntilRefresh}h`}
                    </Button>
                ) : (
                    <div className="flex items-center gap-3">
                        {generatedAt && (
                            <span className="text-xs text-papaya-whip/50">
                                Generated {formatDate(generatedAt)} • Refreshes daily
                            </span>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={generateRecommendations}
                            disabled={!canGenerate || isLoading}
                            icon={<RefreshCw className="w-4 h-4" />}
                        >
                            Refresh
                        </Button>
                    </div>
                )}
            </div>

            {/* Content */}
            {error && (
                <Card className="border-critical/50">
                    <CardContent className="text-center py-6">
                        <p className="text-critical">{error}</p>
                    </CardContent>
                </Card>
            )}

            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <Skeleton width={40} height={40} variant="rectangular" className="mb-3 rounded-lg" />
                            <Skeleton width="80%" height={20} className="mb-2" />
                            <Skeleton width="100%" height={14} className="mb-1" />
                            <Skeleton width="90%" height={14} className="mb-3" />
                            <Skeleton width="70%" height={16} />
                        </Card>
                    ))}
                </div>
            )}

            {recommendations.length > 0 && !isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendations.map((rec, index) => (
                        <RecommendationCard
                            key={index}
                            recommendation={rec}
                            index={index}
                        />
                    ))}
                </div>
            )}

            {recommendations.length === 0 && !isLoading && !error && (
                <Card>
                    <CardContent className="text-center py-8">
                        <Sparkles className="w-12 h-12 text-iron-grey mx-auto mb-3" />
                        <p className="text-papaya-whip/70">
                            Get personalized recommendations based on your spending
                        </p>
                        <p className="text-papaya-whip/50 text-sm mt-1">
                            Click &quot;Generate Insights&quot; to analyze your finances
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
