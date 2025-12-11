/**
 * RecipeApiService: Single Responsibility - Handle recipe-related API calls
 *
 * Benefits:
 * - Centralizes all API logic
 * - Easy to mock for testing
 * - Consistent error handling
 * - Type-safe API calls
 */

import type { RecipeData, ScrapeUrlRequest, UploadFileRequest, ApiResponse } from './types'
import { supabase } from '@/lib/supabase'

class RecipeApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    return headers
  }

  private async fetchApi<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const authHeaders = await this.getAuthHeaders()

      const response = await fetch(url, {
        ...options,
        headers: {
          ...authHeaders,
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'リクエストに失敗しました',
        }
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error('[RecipeApiService] Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ネットワークエラーが発生しました',
      }
    }
  }

  /**
   * Scrape a URL and extract recipe/content
   */
  async scrapeUrl(request: ScrapeUrlRequest): Promise<ApiResponse<RecipeData>> {
    return this.fetchApi<RecipeData>('/api/scrape-recipe', {
      method: 'POST',
      body: JSON.stringify({
        url: request.url,
        skipAI: request.skipAI || !request.useAI,
      }),
    })
  }

  /**
   * Scrape YouTube URL
   */
  async scrapeYouTube(request: ScrapeUrlRequest): Promise<ApiResponse<RecipeData>> {
    return this.fetchApi<RecipeData>('/api/scrape-youtube', {
      method: 'POST',
      body: JSON.stringify({
        url: request.url,
        skipAI: request.skipAI || !request.useAI,
      }),
    })
  }

  /**
   * Upload and process an image file
   */
  async uploadFile(request: UploadFileRequest): Promise<ApiResponse<RecipeData>> {
    try {
      const formData = new FormData()
      formData.append('file', request.file)
      formData.append('skipAI', String(request.skipAI || !request.useAI))

      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/ocr-recipe', {
        method: 'POST',
        headers,
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'ファイルのアップロードに失敗しました',
        }
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error('[RecipeApiService] Upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'アップロードエラーが発生しました',
      }
    }
  }

  /**
   * Process multiple URLs in bulk
   */
  async scrapeMultipleUrls(
    urls: string[],
    useAI: boolean,
    onProgress?: (current: number, total: number) => void
  ): Promise<Array<{ url: string; result: ApiResponse<RecipeData> }>> {
    const results: Array<{ url: string; result: ApiResponse<RecipeData> }> = []

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      onProgress?.(i + 1, urls.length)

      // Determine which API to use based on URL
      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')
      const result = isYouTube
        ? await this.scrapeYouTube({ url, useAI })
        : await this.scrapeUrl({ url, useAI })

      results.push({ url, result })

      // Small delay to avoid rate limiting
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return results
  }
}

// Export singleton instance
export const recipeApiService = new RecipeApiService()
