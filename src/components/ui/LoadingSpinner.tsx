interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    }

    return (
        <svg
            className={`animate-spin ${sizeClasses[size]} ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    )
}

// Loading skeleton for content placeholders
interface SkeletonProps {
    className?: string
    variant?: 'text' | 'circular' | 'rectangular'
    width?: string | number
    height?: string | number
}

export function Skeleton({
    className = '',
    variant = 'text',
    width,
    height,
}: SkeletonProps) {
    const baseClasses = 'animate-pulse bg-iron-grey/30'

    const variantClasses = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    }

    const style: React.CSSProperties = {}
    if (width) style.width = typeof width === 'number' ? `${width}px` : width
    if (height) style.height = typeof height === 'number' ? `${height}px` : height

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    )
}

// Card loading skeleton
export function CardSkeleton({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-card border border-iron-grey rounded-xl p-6 ${className}`}>
            <Skeleton className="w-1/3 mb-2" height={16} />
            <Skeleton className="w-2/3" height={32} />
            <Skeleton className="w-1/4 mt-2" height={14} />
        </div>
    )
}

// Chart loading skeleton
export function ChartSkeleton({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-card border border-iron-grey rounded-xl p-6 ${className}`}>
            <Skeleton className="w-1/4 mb-4" height={20} />
            <div className="flex items-end gap-2 h-48">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1"
                        height={`${Math.random() * 80 + 20}%`}
                        variant="rectangular"
                    />
                ))}
            </div>
        </div>
    )
}
