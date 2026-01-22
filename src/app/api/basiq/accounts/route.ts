import { NextRequest, NextResponse } from 'next/server'
import { getAccounts, getTotalBalance, isBasiqConfigured } from '@/lib/basiq'

export async function GET(request: NextRequest) {
    if (!isBasiqConfigured()) {
        return NextResponse.json(
            { error: 'Basiq API not configured' },
            { status: 503 }
        )
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
        return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
        )
    }

    try {
        const [accounts, totalBalance] = await Promise.all([
            getAccounts(userId),
            getTotalBalance(userId),
        ])

        return NextResponse.json({
            accounts,
            totalBalance,
        })
    } catch (error) {
        console.error('Error fetching accounts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch accounts' },
            { status: 500 }
        )
    }
}
