import { NextRequest, NextResponse } from 'next/server'
import { getTransactions, parseTransaction, isBasiqConfigured } from '@/lib/basiq'

export async function GET(request: NextRequest) {
    if (!isBasiqConfigured()) {
        return NextResponse.json(
            { error: 'Basiq API not configured' },
            { status: 503 }
        )
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!userId) {
        return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
        )
    }

    // Default to last 30 days if no dates provided
    const toDate = to ? new Date(to) : new Date()
    const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    try {
        const rawTransactions = await getTransactions(userId, fromDate, toDate)

        // Parse and standardize transactions
        const transactions = rawTransactions.map(parseTransaction)

        return NextResponse.json({
            transactions,
            count: transactions.length,
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
        })
    } catch (error) {
        console.error('Error fetching transactions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        )
    }
}
