import { NextRequest, NextResponse } from 'next/server'
import {
    isBasiqConfigured,
    getTransactions as getBasiqTransactions,
    parseTransaction,
    getTotalBalance
} from '@/lib/basiq'
import {
    isSupabaseConfigured,
    getUser,
    upsertTransactions,
    getSubscriptions,
    upsertSubscription,
    updateLastSync,
} from '@/lib/supabase'
import { detectSubscriptions } from '@/lib/subscriptionDetector'
import type { Transaction, Subscription } from '@/types'
import { formatTime } from '@/lib/utils'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { basiqUserId } = body

        if (!basiqUserId) {
            return NextResponse.json(
                { error: 'basiqUserId is required' },
                { status: 400 }
            )
        }

        // Check if Basiq is configured
        if (!isBasiqConfigured()) {
            // Return mock data for demo
            return NextResponse.json({
                success: true,
                message: 'Demo mode - Basiq not configured',
                data: getMockData(),
            })
        }

        // Fetch transactions from Basiq (last 90 days for subscription detection)
        const toDate = new Date()
        const fromDate = new Date(toDate.getTime() - 90 * 24 * 60 * 60 * 1000)

        const [basiqTransactions, balance] = await Promise.all([
            getBasiqTransactions(basiqUserId, fromDate, toDate),
            getTotalBalance(basiqUserId),
        ])

        // Parse transactions
        const parsedTransactions = basiqTransactions.map((tx) => ({
            ...parseTransaction(tx),
            user_id: '', // Will be set below
        }))

        let userId = ''
        let existingSubscriptions: Subscription[] = []

        // If Supabase is configured, persist data
        if (isSupabaseConfigured()) {
            const user = await getUser(basiqUserId)
            if (user) {
                userId = user.id

                // Prepare transactions for upsert
                const transactionsToUpsert = parsedTransactions.map((tx) => ({
                    ...tx,
                    user_id: userId,
                }))

                // Upsert transactions
                await upsertTransactions(transactionsToUpsert)

                // Get existing subscriptions
                existingSubscriptions = await getSubscriptions(userId) as Subscription[]

                // Update last sync
                await updateLastSync(userId)
            }
        }

        // Detect subscriptions from transactions
        const fullTransactions: Transaction[] = parsedTransactions.map((tx, i) => ({
            id: tx.basiq_transaction_id,
            userId: userId,
            basiqTransactionId: tx.basiq_transaction_id,
            merchantName: tx.merchant_name,
            amount: tx.amount,
            category: tx.category,
            transactionDate: new Date(tx.transaction_date),
            time: formatTime(tx.transaction_date),
            description: tx.description,
            type: tx.type,
            createdAt: new Date(),
        }))

        const detectedSubscriptions = detectSubscriptions(fullTransactions, existingSubscriptions)

        // Save new subscriptions
        if (isSupabaseConfigured() && userId) {
            for (const sub of detectedSubscriptions) {
                await upsertSubscription({
                    user_id: userId,
                    merchant_name: sub.merchantName,
                    amount: sub.amount,
                    frequency: sub.frequency,
                    next_billing_date: sub.nextBillingDate.toISOString().split('T')[0],
                    auto_detected: true,
                })
            }
        }

        // Get last 30 days of transactions for response
        const thirtyDaysAgo = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000)
        const recentTransactions = fullTransactions.filter(
            (tx) => new Date(tx.transactionDate) >= thirtyDaysAgo
        )

        return NextResponse.json({
            success: true,
            data: {
                transactions: recentTransactions,
                subscriptions: [...existingSubscriptions, ...detectedSubscriptions.map((s, i) => ({
                    id: `new-${i}`,
                    userId: userId,
                    merchantName: s.merchantName,
                    amount: s.amount,
                    frequency: s.frequency,
                    nextBillingDate: s.nextBillingDate,
                    detectedAt: new Date(),
                    isActive: true,
                    autoDetected: true,
                }))],
                balance,
                transactionsAdded: parsedTransactions.length,
                subscriptionsDetected: detectedSubscriptions.length,
                lastSyncAt: new Date(),
            },
        })
    } catch (error) {
        console.error('Sync error:', error)
        return NextResponse.json(
            { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

// Mock data for demo when Basiq is not configured
function getMockData() {
    const now = new Date()
    const transactions: Transaction[] = []

    const merchants = [
        { name: 'Woolworths', category: 'food-dining', type: 'expense' as const, range: [20, 150] },
        { name: 'Coles', category: 'food-dining', type: 'expense' as const, range: [15, 120] },
        { name: 'Uber Eats', category: 'food-dining', type: 'expense' as const, range: [20, 60] },
        { name: 'Shell', category: 'transportation', type: 'expense' as const, range: [40, 100] },
        { name: 'Netflix', category: 'entertainment', type: 'expense' as const, range: [16, 23] },
        { name: 'Spotify', category: 'entertainment', type: 'expense' as const, range: [12, 12] },
        { name: 'Origin Energy', category: 'bills-utilities', type: 'expense' as const, range: [80, 200] },
        { name: 'Telstra', category: 'bills-utilities', type: 'expense' as const, range: [89, 89] },
        { name: 'JB Hi-Fi', category: 'shopping', type: 'expense' as const, range: [50, 500] },
        { name: 'Employer Salary', category: 'income', type: 'income' as const, range: [3500, 4500] },
        { name: 'Interest', category: 'income', type: 'income' as const, range: [5, 20] },
    ]

    // Generate 30 days of transactions
    for (let i = 0; i < 30; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const numTransactions = Math.floor(Math.random() * 4) + 1

        for (let j = 0; j < numTransactions; j++) {
            const merchant = merchants[Math.floor(Math.random() * merchants.length)]
            const amount = merchant.range[0] + Math.random() * (merchant.range[1] - merchant.range[0])

            transactions.push({
                id: `mock-${i}-${j}`,
                userId: 'mock-user',
                basiqTransactionId: `basiq-${i}-${j}`,
                merchantName: merchant.name,
                amount: Math.round(amount * 100) / 100,
                category: merchant.category,
                transactionDate: date,
                time: formatTime(date),
                description: null,
                type: merchant.type,
                createdAt: date,
            })
        }
    }

    const subscriptions: Subscription[] = [
        {
            id: 'sub-1',
            userId: 'mock-user',
            merchantName: 'Netflix',
            amount: 22.99,
            frequency: 'monthly',
            nextBillingDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
            detectedAt: new Date(),
            isActive: true,
            autoDetected: true,
        },
        {
            id: 'sub-2',
            userId: 'mock-user',
            merchantName: 'Spotify',
            amount: 11.99,
            frequency: 'monthly',
            nextBillingDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
            detectedAt: new Date(),
            isActive: true,
            autoDetected: true,
        },
        {
            id: 'sub-3',
            userId: 'mock-user',
            merchantName: 'Telstra',
            amount: 89.00,
            frequency: 'monthly',
            nextBillingDate: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000),
            detectedAt: new Date(),
            isActive: true,
            autoDetected: false,
        },
    ]

    const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

    return {
        transactions,
        subscriptions,
        balance: 12847.50 + totalIncome - totalExpenses,
        transactionsAdded: transactions.length,
        subscriptionsDetected: 0,
        lastSyncAt: new Date(),
    }
}
