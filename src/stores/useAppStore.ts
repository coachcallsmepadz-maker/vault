import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Transaction, Subscription, DashboardStats, DateRange } from '@/types'
import { subDays, startOfMonth } from 'date-fns'

interface User {
    id: string | null
    basiqUserId: string | null
}

interface AppState {
    // User state
    user: User
    isConnected: boolean

    // Data state
    transactions: Transaction[]
    subscriptions: Subscription[]
    balance: number

    // Sync state
    lastSyncAt: Date | null
    isLoading: boolean
    isSyncing: boolean
    error: string | null

    // UI state
    selectedPeriod: DateRange
    isSubscriptionsExpanded: boolean

    // Actions
    setUser: (user: User) => void
    setConnected: (connected: boolean) => void
    setTransactions: (transactions: Transaction[]) => void
    setSubscriptions: (subscriptions: Subscription[]) => void
    addSubscription: (subscription: Subscription) => void
    removeSubscription: (id: string) => void
    setBalance: (balance: number) => void
    setLoading: (loading: boolean) => void
    setSyncing: (syncing: boolean) => void
    setError: (error: string | null) => void
    updateLastSync: () => void
    setSelectedPeriod: (period: DateRange) => void
    toggleSubscriptionsExpanded: () => void

    // Computed getters (as methods)
    getStats: () => DashboardStats
    getTransactionsInPeriod: () => Transaction[]

    // Reset
    reset: () => void
}

const getDefaultPeriod = (): DateRange => ({
    from: subDays(new Date(), 30),
    to: new Date(),
    label: 'Last 30 days',
})

const initialState = {
    user: { id: null, basiqUserId: null },
    isConnected: false,
    transactions: [],
    subscriptions: [],
    balance: 0,
    lastSyncAt: null,
    isLoading: false,
    isSyncing: false,
    error: null,
    selectedPeriod: getDefaultPeriod(),
    isSubscriptionsExpanded: false,
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            ...initialState,

            // Actions
            setUser: (user) => set({ user }),

            setConnected: (connected) => set({ isConnected: connected }),

            setTransactions: (transactions) => set({ transactions }),

            setSubscriptions: (subscriptions) => set({ subscriptions }),

            addSubscription: (subscription) => set((state) => ({
                subscriptions: [...state.subscriptions, subscription],
            })),

            removeSubscription: (id) => set((state) => ({
                subscriptions: state.subscriptions.filter((s) => s.id !== id),
            })),

            setBalance: (balance) => set({ balance }),

            setLoading: (loading) => set({ isLoading: loading }),

            setSyncing: (syncing) => set({ isSyncing: syncing }),

            setError: (error) => set({ error }),

            updateLastSync: () => set({ lastSyncAt: new Date() }),

            setSelectedPeriod: (period) => set({ selectedPeriod: period }),

            toggleSubscriptionsExpanded: () => set((state) => ({
                isSubscriptionsExpanded: !state.isSubscriptionsExpanded,
            })),

            // Computed getters
            getStats: () => {
                const state = get()
                const periodTransactions = state.getTransactionsInPeriod()

                const incomeThisPeriod = periodTransactions
                    .filter((t) => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0)

                const expensesThisPeriod = periodTransactions
                    .filter((t) => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0)

                // Get today's transactions for today's change
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const todayTransactions = state.transactions.filter((t) => {
                    const txDate = new Date(t.transactionDate)
                    txDate.setHours(0, 0, 0, 0)
                    return txDate.getTime() === today.getTime()
                })

                const todaysIncome = todayTransactions
                    .filter((t) => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0)

                const todaysExpense = todayTransactions
                    .filter((t) => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0)

                return {
                    totalBalance: state.balance,
                    todaysChange: todaysIncome - todaysExpense,
                    incomeThisPeriod,
                    expensesThisPeriod,
                    netSavings: incomeThisPeriod - expensesThisPeriod,
                }
            },

            getTransactionsInPeriod: () => {
                const state = get()
                const { from, to } = state.selectedPeriod

                return state.transactions.filter((t) => {
                    const txDate = new Date(t.transactionDate)
                    return txDate >= from && txDate <= to
                })
            },

            reset: () => set(initialState),
        }),
        {
            name: 'vault-storage',
            partialize: (state) => ({
                user: state.user,
                isConnected: state.isConnected,
                transactions: state.transactions,
                subscriptions: state.subscriptions,
                balance: state.balance,
                lastSyncAt: state.lastSyncAt,
                selectedPeriod: state.selectedPeriod,
            }),
        }
    )
)

// Selector hooks for common data
export const useUser = () => useAppStore((state) => state.user)
export const useIsConnected = () => useAppStore((state) => state.isConnected)
export const useTransactions = () => useAppStore((state) => state.transactions)
export const useSubscriptions = () => useAppStore((state) => state.subscriptions)
export const useBalance = () => useAppStore((state) => state.balance)
export const useIsLoading = () => useAppStore((state) => state.isLoading)
export const useIsSyncing = () => useAppStore((state) => state.isSyncing)
export const useError = () => useAppStore((state) => state.error)
export const useSelectedPeriod = () => useAppStore((state) => state.selectedPeriod)

// Time period options helper
export const TIME_PERIODS: DateRange[] = [
    { from: subDays(new Date(), 7), to: new Date(), label: 'Last 7 days' },
    { from: subDays(new Date(), 30), to: new Date(), label: 'Last 30 days' },
    { from: subDays(new Date(), 90), to: new Date(), label: 'Last 90 days' },
    { from: startOfMonth(new Date()), to: new Date(), label: 'Current month' },
]
