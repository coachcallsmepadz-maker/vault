import type { Transaction, Subscription } from '@/types'
import { addDays, differenceInDays } from 'date-fns'

interface DetectedSubscription {
    merchantName: string
    amount: number
    frequency: 'monthly' | 'weekly' | 'yearly'
    nextBillingDate: Date
    confidence: number
}

// Known subscription merchants for higher confidence detection
const KNOWN_SUBSCRIPTION_MERCHANTS = [
    'netflix', 'spotify', 'apple', 'amazon prime', 'disney+', 'disney plus',
    'adobe', 'microsoft', 'hulu', 'hbo', 'youtube premium', 'youtube music',
    'gym', 'fitness', 'planet fitness', 'anytime fitness',
    'dropbox', 'google one', 'icloud', 'onedrive',
    'audible', 'kindle', 'paramount+', 'peacock',
    'stan', 'binge', 'kayo', 'foxtel', 'optus sport',
]

/**
 * Detect recurring subscriptions from transaction history
 */
export function detectSubscriptions(
    transactions: Transaction[],
    existingSubscriptions: Subscription[] = []
): DetectedSubscription[] {
    const detected: DetectedSubscription[] = []

    // Group transactions by merchant
    const merchantGroups = new Map<string, Transaction[]>()

    for (const tx of transactions) {
        if (tx.type !== 'expense') continue

        const merchantKey = tx.merchantName.toLowerCase().trim()
        const existing = merchantGroups.get(merchantKey) || []
        existing.push(tx)
        merchantGroups.set(merchantKey, existing)
    }

    // Analyze each merchant group
    for (const [merchant, txs] of merchantGroups) {
        // Need at least 2 transactions to detect a pattern
        if (txs.length < 2) continue

        // Sort by date
        const sorted = [...txs].sort(
            (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
        )

        // Check for recurring pattern
        const pattern = analyzePattern(sorted)

        if (pattern) {
            // Check if already tracked
            const alreadyTracked = existingSubscriptions.some(
                sub => sub.merchantName.toLowerCase() === merchant
            )

            if (!alreadyTracked) {
                detected.push({
                    merchantName: txs[0].merchantName, // Use original case
                    amount: pattern.averageAmount,
                    frequency: pattern.frequency,
                    nextBillingDate: pattern.nextBillingDate,
                    confidence: pattern.confidence,
                })
            }
        }
    }

    // Sort by confidence, then amount
    return detected
        .filter(d => d.confidence >= 0.6)
        .sort((a, b) => {
            if (b.confidence !== a.confidence) return b.confidence - a.confidence
            return b.amount - a.amount
        })
}

interface PatternResult {
    frequency: 'monthly' | 'weekly' | 'yearly'
    averageAmount: number
    nextBillingDate: Date
    confidence: number
}

function analyzePattern(transactions: Transaction[]): PatternResult | null {
    if (transactions.length < 2) return null

    // Calculate intervals between transactions
    const intervals: number[] = []
    for (let i = 1; i < transactions.length; i++) {
        const prev = new Date(transactions[i - 1].transactionDate)
        const curr = new Date(transactions[i].transactionDate)
        intervals.push(differenceInDays(curr, prev))
    }

    // Calculate average interval
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length

    // Check amounts consistency (within $1)
    const amounts = transactions.map(t => t.amount)
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const amountVariance = amounts.every(a => Math.abs(a - avgAmount) <= 1)

    if (!amountVariance) return null

    // Determine frequency
    let frequency: 'monthly' | 'weekly' | 'yearly'
    let intervalConfidence: number

    if (avgInterval >= 6 && avgInterval <= 8) {
        frequency = 'weekly'
        intervalConfidence = 1 - Math.abs(avgInterval - 7) / 7
    } else if (avgInterval >= 28 && avgInterval <= 32) {
        frequency = 'monthly'
        intervalConfidence = 1 - Math.abs(avgInterval - 30) / 30
    } else if (avgInterval >= 360 && avgInterval <= 370) {
        frequency = 'yearly'
        intervalConfidence = 1 - Math.abs(avgInterval - 365) / 365
    } else {
        return null
    }

    // Check if it's a known subscription merchant
    const merchantLower = transactions[0].merchantName.toLowerCase()
    const isKnownMerchant = KNOWN_SUBSCRIPTION_MERCHANTS.some(
        known => merchantLower.includes(known)
    )

    // Calculate confidence
    let confidence = intervalConfidence * 0.6 + 0.4 // Base confidence from interval
    if (isKnownMerchant) confidence += 0.2
    if (transactions.length >= 3) confidence += 0.1
    confidence = Math.min(confidence, 1)

    // Predict next billing date
    const lastTx = transactions[transactions.length - 1]
    const lastDate = new Date(lastTx.transactionDate)

    const daysToAdd = frequency === 'weekly' ? 7 : frequency === 'monthly' ? 30 : 365
    const nextBillingDate = addDays(lastDate, daysToAdd)

    return {
        frequency,
        averageAmount: Math.round(avgAmount * 100) / 100,
        nextBillingDate,
        confidence,
    }
}

/**
 * Calculate total monthly subscription cost
 */
export function calculateMonthlySubscriptionCost(subscriptions: Array<{
    isActive?: boolean
    amount: number
    frequency: string
}>): number {
    return subscriptions.reduce((total, sub) => {
        if (sub.isActive === false) return total

        let monthlyAmount = sub.amount
        if (sub.frequency === 'weekly') {
            monthlyAmount = sub.amount * 4.33
        } else if (sub.frequency === 'yearly') {
            monthlyAmount = sub.amount / 12
        }

        return total + monthlyAmount
    }, 0)
}

