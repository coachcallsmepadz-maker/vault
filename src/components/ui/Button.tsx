import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    icon?: ReactNode
    children: ReactNode
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-pitch-black disabled:opacity-50 disabled:cursor-not-allowed'

    const variantClasses = {
        primary: 'bg-malachite text-pitch-black hover:brightness-110 focus:ring-malachite active:scale-[0.98]',
        secondary: 'bg-transparent border border-iron-grey text-papaya-whip hover:border-papaya-whip/50 focus:ring-iron-grey active:scale-[0.98]',
        ghost: 'bg-transparent text-papaya-whip hover:bg-papaya-whip/10 focus:ring-papaya-whip/30',
        danger: 'bg-critical text-white hover:brightness-110 focus:ring-critical active:scale-[0.98]',
    }

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    }

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <LoadingSpinner size="sm" />
            ) : icon ? (
                <span className="w-4 h-4">{icon}</span>
            ) : null}
            {children}
        </button>
    )
}

// Icon-only button variant
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: ReactNode
    label: string
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
}

export function IconButton({
    icon,
    label,
    variant = 'ghost',
    size = 'md',
    className = '',
    ...props
}: IconButtonProps) {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-pitch-black disabled:opacity-50 disabled:cursor-not-allowed'

    const variantClasses = {
        primary: 'bg-malachite text-pitch-black hover:brightness-110 focus:ring-malachite',
        secondary: 'bg-transparent border border-iron-grey text-papaya-whip hover:border-papaya-whip/50 focus:ring-iron-grey',
        ghost: 'bg-transparent text-papaya-whip hover:bg-papaya-whip/10 focus:ring-papaya-whip/30',
    }

    const sizeClasses = {
        sm: 'p-1.5 w-7 h-7',
        md: 'p-2 w-9 h-9',
        lg: 'p-3 w-11 h-11',
    }

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            aria-label={label}
            {...props}
        >
            {icon}
        </button>
    )
}
