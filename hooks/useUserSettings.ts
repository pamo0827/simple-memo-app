/**
 * useUserSettings: Custom hook for user settings management
 *
 * Single Responsibility: Manage user settings state
 * Benefits:
 * - Centralized settings logic
 * - Type-safe
 * - Easy to test
 * - Reusable
 */

import { useState, useEffect, useCallback } from 'react'
import { getUserSettings, upsertUserSettings } from '@/lib/user-settings'
import type { UserSettings } from '@/lib/supabase'

interface UseUserSettingsResult {
  settings: Partial<UserSettings> | null
  loading: boolean
  error: string | null
  updateSettings: (updates: Partial<UserSettings>) => Promise<boolean>
  refreshSettings: () => Promise<void>
}

export function useUserSettings(userId: string | null): UseUserSettingsResult {
  const [settings, setSettings] = useState<Partial<UserSettings> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getUserSettings(userId)
      setSettings(data)
    } catch (err) {
      console.error('[useUserSettings] Error loading settings:', err)
      setError(err instanceof Error ? err.message : '設定の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const updateSettings = useCallback(async (updates: Partial<UserSettings>): Promise<boolean> => {
    if (!userId) return false

    try {
      const success = await upsertUserSettings(userId, updates as any)
      if (success) {
        setSettings(prev => ({ ...prev, ...updates }))
      }
      return success
    } catch (err) {
      console.error('[useUserSettings] Error updating settings:', err)
      setError(err instanceof Error ? err.message : '設定の更新に失敗しました')
      return false
    }
  }, [userId])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings: loadSettings,
  }
}
