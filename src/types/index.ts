import { z } from 'zod'

// ============ Base Types ============

export interface User {
    id: string
    basiqUserId: string | null
    createdAt: Date
    lastSyncAt: Date | null
}

export interface Transaction {
    id: string
    userId: string
    basiqTransactionId: string
    merchantName: string
    amount: number
    category: string
    transactionDate: Date
    time: string
    description: string | null
    type: 'income' | 'expense' | 'transfer'
    createdAt: Date
}

export interface Subscription {
    id: string
    userId: string
    merchantName: string
    amount: number
    frequency: 'monthly' | 'weekly' | 'yearly'
    nextBillingDate: Date
    detectedAt: Date
    isActive: boolean
    autoDetected: boolean
}

export interface Recommendation {
    icon: string
    title: string
    analysis: string
    action: string
}

export interface AIRecommendations {
    id: string
    userId: string
    recommendations: Recommendation[]
    analysisPeriodStart: Date
    analysisPeriodEnd: Date
    generatedAt: Date
    expiresAt: Date
}

// ============ Dashboard Types ============

export interface DashboardStats {
    totalBalance: number
    todaysChange: number
    incomeThisPeriod: number
    expensesThisPeriod: number
    netSavings: number
}

export interface CategoryBreakdown {
    category: string
    amount: number
    percentage: number
    color: string
    icon: string
}

export interface DailyTrend {
    date: string
    income: number
    expenses: number
    balance: number
}

export interface DateRange {
    from: Date
    to: Date
    label: string
}

// ============ API Response Types ============

export interface BasiqAccount {
    id: string
    name: string
    accountNo: string
    balance: number
    availableBalance: number
    type: string
    status: string
    institution: string
}

export interface BasiqTransaction {
    id: string
    status: string
    description: string
    amount: string
    account: string
    balance: string
    direction: 'credit' | 'debit'
    class: string
    institution: string
    postDate: string
    transactionDate: string
    subClass?: {
        title: string
        code: string
    }
    enrich?: {
        merchant?: {
            businessName: string
        }
        category?: {
            anzsic?: {
                division?: {
                    title: string
                }
            }
        }
    }
}

export interface SyncResult {
    success: boolean
    transactionsAdded: number
    subscriptionsDetected: number
    lastSyncAt: Date
    error?: string
}

// ============ Zod Schemas ============

export const RecommendationSchema = z.object({
    icon: z.string(),
    title: z.string().max(100),
    analysis: z.string().max(200),
    action: z.string().max(150),
})

export const RecommendationsArraySchema = z.array(RecommendationSchema).length(3)

export const DateRangeSchema = z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
})

export const TransactionTypeSchema = z.enum(['income', 'expense', 'transfer'])
export const FrequencySchema = z.enum(['monthly', 'weekly', 'yearly'])

// ============ Category Mapping ============

export const CATEGORY_MAP: Record<string, { name: string; icon: string; color: string }> = {
    'food-dining': { name: 'Food & Dining', icon: '🍽️', color: '#FF6B35' },
    'bills-utilities': { name: 'Bills & Utilities', icon: '💡', color: '#4d5453' },
    'transportation': { name: 'Transportation', icon: '🚗', color: '#2ba413' },
    'entertainment': { name: 'Entertainment', icon: '🎬', color: '#9333ea' },
    'shopping': { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
    'health': { name: 'Health', icon: '💊', color: '#06b6d4' },
    'transfer': { name: 'Transfer', icon: '💸', color: '#6366f1' },
    'income': { name: 'Income', icon: '💰', color: '#0dd44c' },
    'other': { name: 'Other', icon: '📦', color: '#78716c' },
}

export const TIME_PERIOD_OPTIONS: DateRange[] = [
    { from: new Date(), to: new Date(), label: 'Last 7 days' },
    { from: new Date(), to: new Date(), label: 'Last 30 days' },
    { from: new Date(), to: new Date(), label: 'Last 90 days' },
    { from: new Date(), to: new Date(), label: 'Current month' },
]

// ============ Local Storage Keys ============

export const STORAGE_KEYS = {
    BASIQ_USER_ID: 'basiq_user_id',
    LAST_SYNC_AT: 'last_sync_at',
    CACHED_TRANSACTIONS: 'cached_transactions',
    CACHED_BALANCE: 'cached_balance',
    CACHED_SUBSCRIPTIONS: 'cached_subscriptions',
    SELECTED_PERIOD: 'selected_period',
} as const
