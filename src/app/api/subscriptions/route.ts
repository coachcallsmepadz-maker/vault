import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured, removeSubscription } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json()
        const { id } = body

        if (!id) {
            return NextResponse.json(
                { error: 'Subscription ID is required' },
                { status: 400 }
            )
        }

        if (isSupabaseConfigured()) {
            const success = await removeSubscription(id)
            if (!success) {
                return NextResponse.json(
                    { error: 'Failed to remove subscription' },
                    { status: 500 }
                )
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error removing subscription:', error)
        return NextResponse.json(
            { error: 'Failed to remove subscription' },
            { status: 500 }
        )
    }
}
