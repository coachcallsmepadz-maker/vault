import type { ReactNode, CSSProperties } from 'react'

interface CardProps {
    children: ReactNode
    className?: string
    hover?: boolean
    onClick?: () => void
    style?: CSSProperties
}

export function Card({ children, className = '', hover = false, onClick, style }: CardProps) {
    const baseClasses = 'bg-card border border-iron-grey rounded-xl p-6 transition-all duration-200'
    const hoverClasses = hover ? 'hover:border-malachite/50 hover:shadow-lg hover:shadow-malachite/5 cursor-pointer' : ''
    const clickableClasses = onClick ? 'cursor-pointer' : ''

    return (
        <div
            className={`${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            style={style}
        >
            {children}
        </div>
    )
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={`mb-4 ${className}`}>
            {children}
        </div>
    )
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <h3 className={`text-lg font-semibold text-papaya-whip ${className}`}>
            {children}
        </h3>
    )
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={className}>
            {children}
        </div>
    )
}

export function CardValue({
    children,
    className = '',
    size = 'default',
    color = 'default'
}: {
    children: ReactNode
    className?: string
    size?: 'default' | 'large' | 'small'
    color?: 'default' | 'positive' | 'negative'
}) {
    const sizeClasses = {
        small: 'text-xl',
        default: 'text-2xl',
        large: 'text-4xl',
    }

    const colorClasses = {
        default: 'text-papaya-whip',
        positive: 'text-malachite',
        negative: 'text-expense',
    }

    return (
        <span className={`font-bold tabular-nums ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
            {children}
        </span>
    )
}

export function CardSubtitle({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <p className={`text-sm text-papaya-whip/60 mt-1 ${className}`}>
            {children}
        </p>
    )
}
