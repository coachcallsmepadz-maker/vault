import { GoogleGenerativeAI } from '@google/generative-ai'
import { RecommendationsArraySchema, type Recommendation, type CategoryBreakdown } from '@/types'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null

interface SpendingData {
    last14DaysBreakdown: CategoryBreakdown[]
    previous14DaysTotal: number
    topCategories: string[]
    subscriptionCount: number
    subscriptionTotal: number
    income: number
    expenses: number
    net: number
}

/**
 * Generate AI recommendations using Gemini
 */
export async function generateRecommendations(data: SpendingData): Promise<Recommendation[]> {
    if (!genAI) {
        throw new Error('Gemini API not configured')
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const categoryBreakdown = data.last14DaysBreakdown
        .map(c => `${c.category}: $${c.amount.toFixed(2)} (${c.percentage.toFixed(1)}%)`)
        .join('\n')

    const prompt = `You are a personal finance advisor. Analyze this user's spending data and provide exactly 3 actionable recommendations for the next 14 days.

Data:
Last 14 days spending breakdown:
${categoryBreakdown}

Previous 14 days total: $${data.previous14DaysTotal.toFixed(2)}
Top 3 categories: ${data.topCategories.join(', ')}
Total subscriptions: ${data.subscriptionCount} costing $${data.subscriptionTotal.toFixed(2)}/month
Income: $${data.income.toFixed(2)} | Expenses: $${data.expenses.toFixed(2)} | Net: $${data.net.toFixed(2)}

Format your response as a JSON array of exactly 3 objects:
[
  {
    "icon": "emoji",
    "title": "short actionable title",
    "analysis": "what you observed in their spending",
    "action": "specific target or suggestion"
  }
]

Focus on:
1. Highest spending category with reduction opportunity
2. Subscription optimization or recurring cost insight
3. Positive reinforcement or savings goal

Be specific with numbers. Keep each field under 100 characters. Return ONLY the JSON array, no other text.`

    try {
        const result = await model.generateContent(prompt)
        const response = result.response.text()

        // Extract JSON from response
        const jsonMatch = response.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
            throw new Error('No valid JSON array found in response')
        }

        const parsed = JSON.parse(jsonMatch[0])
        const validated = RecommendationsArraySchema.parse(parsed)

        return validated
    } catch (error) {
        console.error('Error generating recommendations:', error)

        // Return fallback recommendations
        return [
            {
                icon: '📊',
                title: 'Track Your Top Category',
                analysis: `Your highest spending category is ${data.topCategories[0] || 'not yet determined'}.`,
                action: 'Set a weekly budget limit and monitor daily spending.',
            },
            {
                icon: '🔄',
                title: 'Review Subscriptions',
                analysis: `You have ${data.subscriptionCount} active subscriptions totaling $${data.subscriptionTotal.toFixed(2)}/month.`,
                action: 'Consider consolidating or canceling unused services.',
            },
            {
                icon: '💰',
                title: 'Build Your Savings',
                analysis: `Your net savings this period is $${data.net.toFixed(2)}.`,
                action: data.net > 0 ? 'Great job! Aim to save 20% of income.' : 'Focus on reducing expenses by 10%.',
            },
        ]
    }
}

/**
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
    return GEMINI_API_KEY !== '' && GEMINI_API_KEY !== '[TO_BE_CONFIGURED]'
}
