import axios from 'axios'
import type { BasiqAccount, BasiqTransaction } from '@/types'
import { CONFIG } from './config'

const BASIQ_API_URL = CONFIG.BASIQ_API_URL
const BASIQ_API_KEY = CONFIG.BASIQ_API_KEY

// Token cache
let accessToken: string | null = null
let tokenExpiry: Date | null = null

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (accessToken && tokenExpiry && tokenExpiry > new Date()) {
        return accessToken
    }

    // Request new token
    const response = await axios.post(
        `${BASIQ_API_URL}/token`,
        'scope=SERVER_ACCESS',
        {
            headers: {
                'Authorization': `Basic ${BASIQ_API_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'basiq-version': '3.0',
            },
        }
    )

    accessToken = response.data.access_token
    // Set expiry to 50 minutes (tokens last 60 minutes)
    tokenExpiry = new Date(Date.now() + 50 * 60 * 1000)

    return accessToken!
}

/**
 * Create a new Basiq user
 */
export async function createBasiqUser(email: string, mobile?: string): Promise<string> {
    const token = await getAccessToken()

    const response = await axios.post(
        `${BASIQ_API_URL}/users`,
        { email, mobile },
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'basiq-version': '3.0',
            },
        }
    )

    return response.data.id
}

/**
 * Get consent URL for user to connect their bank
 */
export async function getConsentUrl(userId: string): Promise<string> {
    const token = await getAccessToken()

    const response = await axios.post(
        `${BASIQ_API_URL}/users/${userId}/auth_link`,
        {},
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'basiq-version': '3.0',
            },
        }
    )

    return response.data.links.self
}

/**
 * Fetch all accounts for a user
 */
export async function getAccounts(userId: string): Promise<BasiqAccount[]> {
    const token = await getAccessToken()

    const response = await axios.get(
        `${BASIQ_API_URL}/users/${userId}/accounts`,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'basiq-version': '3.0',
            },
        }
    )

    return (response.data.data || []).map((account: Record<string, unknown>) => ({
        id: account.id,
        name: account.name,
        accountNo: account.accountNo,
        balance: parseFloat(account.balance as string || '0'),
        availableBalance: parseFloat(account.availableFunds as string || '0'),
        type: (account.class as Record<string, unknown>)?.type || 'unknown',
        status: account.status,
        institution: account.institution,
    }))
}

/**
 * Fetch transactions for a user within a date range
 */
export async function getTransactions(
    userId: string,
    from: Date,
    to: Date
): Promise<BasiqTransaction[]> {
    const token = await getAccessToken()

    const fromStr = from.toISOString().split('T')[0]
    const toStr = to.toISOString().split('T')[0]

    const allTransactions: BasiqTransaction[] = []
    let nextUrl = `${BASIQ_API_URL}/users/${userId}/transactions?filter=transaction.postDate.bt('${fromStr}','${toStr}')&limit=500`

    while (nextUrl) {
        const response = await axios.get(nextUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'basiq-version': '3.0',
            },
        })

        allTransactions.push(...(response.data.data || []))
        nextUrl = response.data.links?.next || null
    }

    return allTransactions
}

/**
 * Get total balance across all accounts
 */
export async function getTotalBalance(userId: string): Promise<number> {
    const accounts = await getAccounts(userId)
    return accounts.reduce((sum, account) => sum + account.balance, 0)
}

/**
 * Parse Basiq transaction to standardized format
 */
export function parseTransaction(tx: BasiqTransaction): {
    basiq_transaction_id: string
    merchant_name: string
    amount: number
    category: string
    transaction_date: string
    description: string
    type: 'income' | 'expense' | 'transfer'
} {
    const amount = parseFloat(tx.amount)
    const merchantName = tx.enrich?.merchant?.businessName || tx.description || 'Unknown'

    // Determine transaction type
    let type: 'income' | 'expense' | 'transfer' = 'expense'
    if (tx.direction === 'credit' || amount > 0) {
        // Check if it's an internal transfer
        const descLower = tx.description.toLowerCase()
        if (descLower.includes('transfer') && !descLower.includes('salary')) {
            type = 'transfer'
        } else {
            type = 'income'
        }
    }

    // Map category
    const categoryTitle = tx.enrich?.category?.anzsic?.division?.title?.toLowerCase() || ''
    let category = 'other'

    if (categoryTitle.includes('food') || categoryTitle.includes('restaurant') || categoryTitle.includes('cafe')) {
        category = 'food-dining'
    } else if (categoryTitle.includes('transport') || categoryTitle.includes('automotive')) {
        category = 'transportation'
    } else if (categoryTitle.includes('retail') || categoryTitle.includes('shopping')) {
        category = 'shopping'
    } else if (categoryTitle.includes('health') || categoryTitle.includes('medical')) {
        category = 'health'
    } else if (categoryTitle.includes('entertainment') || categoryTitle.includes('recreation')) {
        category = 'entertainment'
    } else if (categoryTitle.includes('utility') || categoryTitle.includes('electricity') || categoryTitle.includes('gas')) {
        category = 'bills-utilities'
    }

    if (type === 'income') {
        category = 'income'
    } else if (type === 'transfer') {
        category = 'transfer'
    }

    return {
        basiq_transaction_id: tx.id,
        merchant_name: merchantName,
        amount: Math.abs(amount),
        category,
        transaction_date: tx.transactionDate || tx.postDate,
        description: tx.description,
        type,
    }
}

/**
 * Check if Basiq is configured
 */
export function isBasiqConfigured(): boolean {
    return BASIQ_API_KEY !== '' && BASIQ_API_KEY !== '[TO_BE_CONFIGURED]'
}
