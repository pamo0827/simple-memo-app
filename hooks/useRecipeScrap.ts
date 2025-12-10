/**
 * useRecipeScrap: Custom hook for recipe scraping logic
 *
 * Single Responsibility: Manage recipe scraping state and operations
 * Benefits:
 * - Separates business logic from UI
 * - Reusable across components
 * - Easy to test
 * - Centralized state management
 */

import { useState, useCallback } from 'react'
import { recipeApiService } from '@/lib/api/RecipeApiService'
import type { RecipeData } from '@/lib/api/types'

interface UseRecipeScrapResult {
  // State
  isScraping: boolean
  scrapeError: string
  bulkProgress: { current: number; total: number } | null

  // Actions
  scrapeUrl: (url: string, useAI: boolean) => Promise<RecipeData | null>
  scrapeMultipleUrls: (urls: string[], useAI: boolean) => Promise<Array<{ url: string; data: RecipeData | null }>>
  scrapeYouTube: (url: string, useAI: boolean) => Promise<RecipeData | null>
  uploadFile: (file: File, useAI: boolean) => Promise<RecipeData | null>
  resetError: () => void
}

export function useRecipeScrap(): UseRecipeScrapResult {
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState('')
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null)

  const resetError = useCallback(() => {
    setScrapeError('')
  }, [])

  const scrapeUrl = useCallback(async (url: string, useAI: boolean): Promise<RecipeData | null> => {
    setIsScraping(true)
    setScrapeError('')

    try {
      const result = await recipeApiService.scrapeUrl({ url, useAI })

      if (!result.success || !result.data) {
        setScrapeError(result.error || 'URLの取得に失敗しました')
        return null
      }

      return result.data
    } catch (error) {
      const message = error instanceof Error ? error.message : '予期しないエラーが発生しました'
      setScrapeError(message)
      return null
    } finally {
      setIsScraping(false)
    }
  }, [])

  const scrapeYouTube = useCallback(async (url: string, useAI: boolean): Promise<RecipeData | null> => {
    setIsScraping(true)
    setScrapeError('')

    try {
      const result = await recipeApiService.scrapeYouTube({ url, useAI })

      if (!result.success || !result.data) {
        setScrapeError(result.error || 'YouTube動画の取得に失敗しました')
        return null
      }

      return result.data
    } catch (error) {
      const message = error instanceof Error ? error.message : '予期しないエラーが発生しました'
      setScrapeError(message)
      return null
    } finally {
      setIsScraping(false)
    }
  }, [])

  const uploadFile = useCallback(async (file: File, useAI: boolean): Promise<RecipeData | null> => {
    setIsScraping(true)
    setScrapeError('')

    try {
      const result = await recipeApiService.uploadFile({ file, useAI })

      if (!result.success || !result.data) {
        setScrapeError(result.error || 'ファイルのアップロードに失敗しました')
        return null
      }

      return result.data
    } catch (error) {
      const message = error instanceof Error ? error.message : '予期しないエラーが発生しました'
      setScrapeError(message)
      return null
    } finally {
      setIsScraping(false)
    }
  }, [])

  const scrapeMultipleUrls = useCallback(async (
    urls: string[],
    useAI: boolean
  ): Promise<Array<{ url: string; data: RecipeData | null }>> => {
    setIsScraping(true)
    setScrapeError('')
    setBulkProgress({ current: 0, total: urls.length })

    try {
      const results = await recipeApiService.scrapeMultipleUrls(
        urls,
        useAI,
        (current, total) => setBulkProgress({ current, total })
      )

      return results.map(({ url, result }) => ({
        url,
        data: result.success && result.data ? result.data : null,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : '予期しないエラーが発生しました'
      setScrapeError(message)
      return urls.map(url => ({ url, data: null }))
    } finally {
      setIsScraping(false)
      setBulkProgress(null)
    }
  }, [])

  return {
    isScraping,
    scrapeError,
    bulkProgress,
    scrapeUrl,
    scrapeMultipleUrls,
    scrapeYouTube,
    uploadFile,
    resetError,
  }
}
