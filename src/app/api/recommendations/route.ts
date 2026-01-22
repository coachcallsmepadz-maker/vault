import { NextRequest, NextResponse } from 'next/server'
import {
    isSupabaseConfigured,
    getCachedRecommendations,
    saveRecommendations,
    getTransactions,
    getSubscriptions,
} from '@/lib/supabase'
import { generateRecommendations, isGeminiConfigured } from '@/lib/gemini'
import { calculateMonthlySubscriptionCost } from '@/lib/subscriptionDetector'
import { CATEGORY_MAP, type CategoryBreakdown } from '@/types'
import { getCategoryColor } from '@/lib/utils'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
        return NextResponse.json(
            { error: 'userId is required' },
            { status: 400 }
        )
    }

    // Check for cached recommendations
    if (isSupabaseConfigured()) {
        const cached = await getCachedRecommendations(userId)
        if (cached) {
            return NextResponse.json({
                recommendations: cached.recommendations,
                generatedAt: cached.generated_at,
                expiresAt: cached.expires_at,
            })
        }
    }

    return NextResponse.json({ recommendations: null })
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId } = body

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            )
        }

        // Check for cached recommendations first
        if (isSupabaseConfigured()) {
            const cached = await getCachedRecommendations(userId)
            if (cached) {
                return NextResponse.json({
                    recommendations: cached.recommendations,
                    generatedAt: cached.generated_at,
                    expiresAt: cached.expires_at,
                    cached: true,
                })
            }
        }

        // Check if Gemini is configured
        if (!isGeminiConfigured()) {
            // Return fallback recommendations
            return NextResponse.json({
                recommendations: getFallbackRecommendations(),
                generatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                cached: false,
            })
        }

        // Gather data for AI analysis
        const now = new Date()
        const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        const previous14Days = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)

        let transactions: unknown[] = []
        let subscriptions: unknown[] = []

        if (isSupabaseConfigured()) {
            transactions = await getTransactions(userId, previous14Days, now)
            subscriptions = await getSubscriptions(userId)
        }

        // Calculate spending breakdown
        const last14DaysTransactions = (transactions as { transaction_date: string; type: string; category: string; amount: number }[])
            .filter((t) => new Date(t.transaction_date) >= last14Days)

        const previous14DaysTransactions = (transactions as { transaction_date: string; type: string; category: string; amount: number }[])
            .filter((t) => {
                const date = new Date(t.transaction_date)
                return date >= previous14Days && date < last14Days
            })

        // Category breakdown
        const categoryTotals: Record<string, number> = {}
        let totalExpenses = 0
        let income = 0

        for (const tx of last14DaysTransactions) {
            if (tx.type === 'expense') {
                const category = tx.category || 'other'
                categoryTotals[category] = (categoryTotals[category] || 0) + tx.amount
                totalExpenses += tx.amount
            } else if (tx.type === 'income') {
                income += tx.amount
            }
        }

        const last14DaysBreakdown: CategoryBreakdown[] = Object.entries(categoryTotals)
            .map(([category, amount], index) => ({
                category: CATEGORY_MAP[category]?.name || category,
                amount,
                percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
                color: CATEGORY_MAP[category]?.color || getCategoryColor(index),
                icon: CATEGORY_MAP[category]?.icon || '📦',
            }))
            .sort((a, b) => b.amount - a.amount)

        const previous14DaysTotal = previous14DaysTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)

        const topCategories = last14DaysBreakdown.slice(0, 3).map((c) => c.category)

        const subscriptionTotal = calculateMonthlySubscriptionCost(subscriptions as { isActive: boolean; amount: number; frequency: string }[])

        // Generate recommendations
        const recommendations = await generateRecommendations({
            last14DaysBreakdown,
            previous14DaysTotal,
            topCategories,
            subscriptionCount: (subscriptions as unknown[]).length,
            subscriptionTotal,
            income,
            expenses: totalExpenses,
            net: income - totalExpenses,
        })

        // Cache recommendations
        if (isSupabaseConfigured()) {
            await saveRecommendations(
                userId,
                recommendations,
                last14Days,
                now
            )
        }

        return NextResponse.json({
            recommendations,
            generatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            cached: false,
        })
    } catch (error) {
        console.error('Recommendations error:', error)
        return NextResponse.json(
            {
                error: 'Failed to generate recommendations',
                recommendations: getFallbackRecommendations(),
                generatedAt: new Date().toISOString(),
            },
            { status: 200 } // Return 200 with fallback
        )
    }
}

function getFallbackRecommendations() {
    return [
        {
            icon: '📊',
            title: 'Review Your Spending Patterns',
            analysis: 'Take time to review where your money goes each week.',
            action: 'Set up category budgets to track your largest expenses.',
        },
        {
            icon: '🔄',
            title: 'Audit Your Subscriptions',
            analysis: 'Subscriptions can add up quickly without notice.',
            action: 'Cancel any services you haven\'t used in the last month.',
        },
        {
            icon: '💰',
            title: 'Start a Savings Goal',
            analysis: 'Even small amounts add up over time.',
            action: 'Aim to save 10% of each paycheck automatically.',
        },
    ]
}
