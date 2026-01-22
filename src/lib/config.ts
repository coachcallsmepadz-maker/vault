export const CONFIG = {
    // Falls back to the hardcoded key if env var is missing (for immediate Vercel fix)
    BASIQ_API_KEY: process.env.BASIQ_API_KEY || 'NzY4NWIyYTQtM2NkYy00MDA4LTkzNzktZjE2Y2EzYTA4Y2E2OjkwZDI4MDU1LTkyNjUtNDkxMy1iYTk5LTc4MGVmMDhlZDU3Yg==',
    BASIQ_API_URL: process.env.NEXT_PUBLIC_BASIQ_API_URL || 'https://au-api.basiq.io',
}
