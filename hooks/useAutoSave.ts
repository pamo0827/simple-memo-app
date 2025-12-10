/**
 * useAutoSave: Custom hook for auto-saving settings
 *
 * Single Responsibility: Manage auto-save logic
 * Benefits:
 * - Reusable auto-save logic
 * - Configurable debounce delay
 * - Automatic cleanup
 * - Type-safe
 */

import { useEffect, useRef, useCallback, useState } from 'react'

interface UseAutoSaveOptions<T> {
  value: T
  onSave: (value: T) => Promise<void>
  delay?: number
  enabled?: boolean
}

interface UseAutoSaveResult {
  isSaving: boolean
  lastSaved: string
  error: string | null
}

export function useAutoSave<T>({
  value,
  onSave,
  delay = 1000,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveResult {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState('')
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousValueRef = useRef<T>(value)

  const save = useCallback(async (valueToSave: T) => {
    if (!enabled) return

    setIsSaving(true)
    setError(null)

    try {
      await onSave(valueToSave)
      const now = new Date()
      setLastSaved(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}に保存`)
    } catch (err) {
      console.error('[useAutoSave] Error:', err)
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }, [enabled, onSave])

  useEffect(() => {
    // Skip if value hasn't changed or auto-save is disabled
    if (!enabled || value === previousValueRef.current) {
      return
    }

    previousValueRef.current = value

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save(value)
    }, delay)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay, enabled, save])

  return {
    isSaving,
    lastSaved,
    error,
  }
}

/**
 * Immediate auto-save hook (no debounce)
 * Use for switches, radio buttons, etc.
 */
export function useImmediateAutoSave<T>({
  value,
  onSave,
  enabled = true,
}: Omit<UseAutoSaveOptions<T>, 'delay'>): UseAutoSaveResult {
  return useAutoSave({ value, onSave, delay: 0, enabled })
}
