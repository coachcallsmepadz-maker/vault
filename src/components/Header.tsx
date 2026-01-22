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
    const dropdownRef = useRef<HTMLDivElement>(null)

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

    const handleRefresh = async () => {
        if (isSyncing) return

        setSyncing(true)
        try {
            const response = await fetch('/api/sync', { method: 'POST' })
            if (response.ok) {
                updateLastSync()
                // Refresh data would be handled by React Query in real implementation
            }
        } catch (error) {
            console.error('Sync failed:', error)
        } finally {
            setSyncing(false)
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
                        <IconButton
                            icon={<User className="w-5 h-5" />}
                            label="Profile"
                            variant="ghost"
                        />
                    </div>
                </div>
            </div>
        </header>
    )
}
