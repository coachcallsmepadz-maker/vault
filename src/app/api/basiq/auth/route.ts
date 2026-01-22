import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, createBasiqUser, getConsentUrl, isBasiqConfigured } from '@/lib/basiq'

export async function POST(request: NextRequest) {
    if (!isBasiqConfigured()) {
        return NextResponse.json(
            { error: 'Basiq API not configured' },
            { status: 503 }
        )
    }

    try {
        const body = await request.json()
        const { action, email, userId } = body

        switch (action) {
            case 'token': {
                const token = await getAccessToken()
                return NextResponse.json({ token })
            }

            case 'createUser': {
                if (!email) {
                    return NextResponse.json(
                        { error: 'Email is required' },
                        { status: 400 }
                    )
                }
                const newUserId = await createBasiqUser(email)
                return NextResponse.json({ userId: newUserId })
            }

            case 'consentUrl': {
                if (!userId) {
                    return NextResponse.json(
                        { error: 'User ID is required' },
                        { status: 400 }
                    )
                }
                const url = await getConsentUrl(userId)
                return NextResponse.json({ url })
            }

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                )
        }
    } catch (error: any) {
        console.error('Basiq auth error:', error.response?.data || error.message)
        return NextResponse.json(
            {
                error: 'Authentication failed',
                details: error.response?.data?.errors?.[0]?.detail || error.message
            },
            { status: error.response?.status || 500 }
        )
    }
}
