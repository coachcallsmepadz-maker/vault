'use client'

import { useState, useRef, useEffect } from 'react'
import { RefreshCw, User, ChevronDown, Vault } from 'lucide-react'
import { Button, IconButton } from './ui/Button'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { useAppStore, TIME_PERIODS } from '@/stores/useAppStore'
import type { DateRange } from '@/types'
import { formatDistanceToNow } from 'date-fns'

export function Header() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const profileRef = useRef<HTMLDivElement>(null)

    const selectedPeriod = useAppStore((s) => s.selectedPeriod)
    const setSelectedPeriod = useAppStore((s) => s.setSelectedPeriod)
    const isSyncing = useAppStore((s) => s.isSyncing)
    const lastSyncAt = useAppStore((s) => s.lastSyncAt)
    const setSyncing = useAppStore((s) => s.setSyncing)
    const updateLastSync = useAppStore((s) => s.updateLastSync)

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Keyboard shortcut for refresh
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'r' && !event.metaKey && !event.ctrlKey && !event.altKey) {
                const target = event.target as HTMLElement
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                    handleRefresh()
                }
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    const user = useAppStore((s) => s.user)
    const setConnected = useAppStore((s) => s.setConnected)
    const reset = useAppStore((s) => s.reset)

    // ... (rest of search/dropdown logic)

    const handleRefresh = async () => {
        if (isSyncing) return

        const basiqUserId = user.basiqUserId
        if (!basiqUserId) return

        setSyncing(true)
        try {
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ basiqUserId }),
            })
            if (response.ok) {
                updateLastSync()
                // Refresh data would be handled by React Query in real implementation
                // For now we just refresh the page to trigger the store update if needed,
                // but handleSync in page.tsx already updates the store.
                // However, handleRefresh here doesn't update transactions.
                // To fix this properly, we should move handleSync to a global action or use React Query.
                // For now, let's just reload the page to trigger the mount sync.
                window.location.reload()
            }
        } catch (error) {
            console.error('Sync failed:', error)
        } finally {
            setSyncing(false)
        }
    }

    const handleDisconnect = () => {
        if (confirm('Are you sure you want to disconnect? This will clear all data.')) {
            reset()
            window.location.reload()
        }
    }

    const handlePeriodSelect = (period: DateRange) => {
        setSelectedPeriod(period)
        setIsDropdownOpen(false)
    }

    const lastSyncText = lastSyncAt
        ? `Last synced ${formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })}`
        : 'Never synced'

    return (
        <header className="sticky top-0 z-50 bg-pitch-black/95 backdrop-blur-sm border-b border-iron-grey">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-malachite to-bright-fern">
                            <Vault className="w-6 h-6 text-pitch-black" />
                        </div>
                        <span className="text-xl font-bold text-papaya-whip">
                            Vault
                        </span>
                    </div>

                    {/* Center - Time Period Dropdown */}
                    <div ref={dropdownRef} className="relative">
                        <Button
                            variant="secondary"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="min-w-[160px]"
                        >
                            {selectedPeriod.label}
                            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </Button>

                        {isDropdownOpen && (
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-card border border-iron-grey rounded-lg shadow-xl overflow-hidden animate-fade-in">
                                {TIME_PERIODS.map((period, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handlePeriodSelect(period)}
                                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${selectedPeriod.label === period.label
                                            ? 'bg-malachite/20 text-malachite'
                                            : 'text-papaya-whip hover:bg-papaya-whip/10'
                                            }`}
                                    >
                                        {period.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right - Actions */}
                    <div className="flex items-center gap-3">
                        {/* Last sync indicator */}
                        <span className="text-xs text-papaya-whip/50 hidden sm:block">
                            {lastSyncText}
                        </span>

                        {/* Refresh button */}
                        <Button
                            variant="secondary"
                            onClick={handleRefresh}
                            disabled={isSyncing}
                            icon={isSyncing ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
                        >
                            <span className="hidden sm:inline">
                                {isSyncing ? 'Syncing...' : 'Refresh'}
                            </span>
                        </Button>

                        {/* Profile */}
                        <div ref={profileRef} className="relative">
                            <IconButton
                                icon={<User className="w-5 h-5" />}
                                label="Profile"
                                variant="ghost"
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                            />

                            {isProfileOpen && (
                                <div className="absolute top-full mt-2 right-0 w-56 bg-card border border-iron-grey rounded-lg shadow-xl overflow-hidden animate-fade-in">
                                    <div className="px-4 py-3 border-b border-iron-grey">
                                        <p className="text-sm font-medium text-papaya-whip">
                                            {user.basiqUserId === 'demo-user' ? 'Demo Account' : 'Live Account'}
                                        </p>
                                        <p className="text-xs text-papaya-whip/50 truncate">
                                            {user.basiqUserId === 'demo-user' ? 'Using sample data' : user.id}
                                        </p>
                                    </div>

                                    <div className="py-1">
                                        {user.basiqUserId === 'demo-user' && (
                                            <button
                                                onClick={() => {
                                                    reset()
                                                    window.location.reload()
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-malachite hover:bg-malachite/10 transition-colors"
                                            >
                                                Connect Real Bank
                                            </button>
                                        )}

                                        <button
                                            onClick={handleDisconnect}
                                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                                        >
                                            Disconnect & Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
