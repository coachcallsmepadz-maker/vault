import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
    return (
        supabaseUrl !== '' &&
        supabaseUrl !== '[TO_BE_CONFIGURED]' &&
        supabaseAnonKey !== '' &&
        supabaseAnonKey !== '[TO_BE_CONFIGURED]'
    )
}

export const supabase = isSupabaseConfigured()
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

// Database helper functions
export async function getUser(basiqUserId: string) {
    if (!supabase) return null

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('basiq_user_id', basiqUserId)
        .single()

    if (error) {
        console.error('Error fetching user:', error)
        return null
    }

    return data
}

export async function createUser(basiqUserId: string) {
    if (!supabase) return null

    const { data, error } = await supabase
        .from('users')
        .insert({ basiq_user_id: basiqUserId })
        .select()
        .single()

    if (error) {
        console.error('Error creating user:', error)
        return null
    }

    return data
}

export async function getTransactions(userId: string, from: Date, to: Date) {
    if (!supabase) return []

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('transaction_date', from.toISOString())
        .lte('transaction_date', to.toISOString())
        .order('transaction_date', { ascending: false })

    if (error) {
        console.error('Error fetching transactions:', error)
        return []
    }

    return data || []
}

export async function upsertTransactions(transactions: {
    user_id: string
    basiq_transaction_id: string
    merchant_name: string
    amount: number
    category: string
    transaction_date: string
    description: string | null
    type: 'income' | 'expense' | 'transfer'
}[]) {
    if (!supabase || transactions.length === 0) return { success: true, count: 0 }

    const { data, error } = await supabase
        .from('transactions')
        .upsert(transactions, { onConflict: 'basiq_transaction_id' })
        .select()

    if (error) {
        console.error('Error upserting transactions:', error)
        return { success: false, count: 0 }
    }

    return { success: true, count: data?.length || 0 }
}

export async function getSubscriptions(userId: string) {
    if (!supabase) return []

    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('amount', { ascending: false })

    if (error) {
        console.error('Error fetching subscriptions:', error)
        return []
    }

    return data || []
}

export async function upsertSubscription(subscription: {
    user_id: string
    merchant_name: string
    amount: number
    frequency: 'monthly' | 'weekly' | 'yearly'
    next_billing_date: string
    auto_detected: boolean
}) {
    if (!supabase) return null

    // Check if subscription already exists
    const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', subscription.user_id)
        .eq('merchant_name', subscription.merchant_name)
        .single()

    if (existing) {
        // Update existing
        const { data, error } = await supabase
            .from('subscriptions')
            .update({
                amount: subscription.amount,
                next_billing_date: subscription.next_billing_date,
            })
            .eq('id', existing.id)
            .select()
            .single()

        if (error) console.error('Error updating subscription:', error)
        return data
    } else {
        // Insert new
        const { data, error } = await supabase
            .from('subscriptions')
            .insert(subscription)
            .select()
            .single()

        if (error) console.error('Error inserting subscription:', error)
        return data
    }
}

export async function removeSubscription(id: string) {
    if (!supabase) return false

    const { error } = await supabase
        .from('subscriptions')
        .update({ is_active: false })
        .eq('id', id)

    if (error) {
        console.error('Error removing subscription:', error)
        return false
    }

    return true
}

export async function getCachedRecommendations(userId: string) {
    if (!supabase) return null

    const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

    if (error) return null

    return data
}

export async function saveRecommendations(
    userId: string,
    recommendations: unknown[],
    periodStart: Date,
    periodEnd: Date
) {
    if (!supabase) return null

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { data, error } = await supabase
        .from('ai_recommendations')
        .insert({
            user_id: userId,
            recommendations,
            analysis_period_start: periodStart.toISOString(),
            analysis_period_end: periodEnd.toISOString(),
            expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

    if (error) {
        console.error('Error saving recommendations:', error)
        return null
    }

    return data
}

export async function updateLastSync(userId: string) {
    if (!supabase) return

    await supabase
        .from('users')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', userId)
}
