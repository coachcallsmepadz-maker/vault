interface BadgeProps {
    variant?: 'default' | 'success' | 'warning' | 'info' | 'new'
    children: React.ReactNode
    className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
    const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium'

    const variantClasses = {
        default: 'bg-iron-grey/50 text-papaya-whip/80',
        success: 'bg-malachite/20 text-malachite',
        warning: 'bg-expense/20 text-expense',
        info: 'bg-blue-500/20 text-blue-400',
        new: 'bg-bright-fern/20 text-bright-fern animate-pulse',
    }

    return (
        <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
            {children}
        </span>
    )
}
