// ContentScrapingService: Single Responsibility - Handle content scraping logic
import { processText, processImage, processVideo, processUrl } from '@/lib/ai'
import { getContentText } from '@/lib/content'
import { extractYouTubeVideoId, getYouTubeFullText, isYouTubeShorts } from '@/lib/youtube'
import { isAllowedUrl } from '@/lib/url-validation'
import type { AIProcessingResult, ServiceResult, UserContext } from './types'

export class ContentScrapingService {
  /**
   * Scrape and process content from a URL
   */
  async scrapeUrl(url: string, userContext: UserContext): Promise<ServiceResult<AIProcessingResult>> {
    try {
      // Validate URL
      if (!isAllowedUrl(url)) {
        return {
          success: false,
          error: '無効なURLです。',
          statusCode: 400
        }
      }

      // Check if AI is disabled
      if (userContext.settings?.ai_summary_enabled === false) {
        return {
          success: true,
          data: {
            type: 'summary',
            data: {
              title: 'メモ',
              content: `URL: ${url}`
            }
          }
        }
      }

      // Get content via scraping
      let text = ''
      try {
        text = await getContentText(url)
      } catch (fetchError) {
        // スクレイピング失敗時：URLのみをGeminiに渡して処理を試みる
        try {
          const result = await processUrl(
            url,
            userContext.apiKey,
            userContext.settings?.custom_prompt,
            userContext.settings?.summary_length
          )
          return {
            success: true,
            data: result
          }
        } catch (geminiError) {
          // Geminiでも失敗した場合、基本情報のみ保存
          return {
            success: true,
            data: {
              type: 'summary',
              data: {
                title: 'メモ',
                content: `URL: ${url}\n\n※ コンテンツの取得に失敗しましたが、URLは保存されました。`
              }
            }
          }
        }
      }

      if (!text || this.isErrorPage(text)) {
        return {
          success: true,
          data: {
            type: 'summary',
            data: {
              title: 'メモ',
              content: `URL: ${url}`
            }
          }
        }
      }

      // Process with AI
      const result = await processText(
        text,
        userContext.apiKey,
        userContext.settings?.custom_prompt,
        userContext.settings?.summary_length
      )

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('[ContentScrapingService] Error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
        statusCode: 500
      }
    }
  }

  /**
   * Process YouTube content
   */
  async scrapeYouTube(url: string, userContext: UserContext): Promise<ServiceResult<AIProcessingResult>> {
    try {
      if (!isAllowedUrl(url)) {
        return {
          success: false,
          error: '無効なURLです。',
          statusCode: 400
        }
      }

      const videoId = extractYouTubeVideoId(url)
      if (!videoId) {
        return {
          success: false,
          error: '動画IDを取得できませんでした',
          statusCode: 400
        }
      }

      if (userContext.settings?.ai_summary_enabled === false) {
        return {
          success: true,
          data: {
            type: 'summary',
            data: {
              title: 'メモ',
              content: `URL: ${url}`
            }
          }
        }
      }

      const isShortsVideo = isYouTubeShorts(url)
      let result: AIProcessingResult

      if (isShortsVideo) {
        result = await processVideo(
          url,
          userContext.apiKey,
          userContext.settings?.custom_prompt,
          userContext.settings?.summary_length
        )
      } else {
        const fullText = await getYouTubeFullText(videoId)
        if (!fullText) {
          return {
            success: true,
            data: {
              type: 'summary',
              data: {
                title: 'メモ',
                content: `URL: ${url}`
              }
            }
          }
        }
        result = await processText(
          fullText,
          userContext.apiKey,
          userContext.settings?.custom_prompt,
          userContext.settings?.summary_length
        )
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('[ContentScrapingService] YouTube error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
        statusCode: 500
      }
    }
  }

  /**
   * Process image content
   */
  async processImageFile(
    base64Image: string,
    userContext: UserContext,
    caption?: string
  ): Promise<ServiceResult<AIProcessingResult>> {
    try {
      if (userContext.settings?.ai_summary_enabled === false) {
        return {
          success: true,
          data: {
            type: 'summary',
            data: {
              title: 'メモ',
              content: '画像ファイル'
            }
          }
        }
      }

      const result = await processImage(
        base64Image,
        userContext.apiKey,
        caption,
        userContext.settings?.custom_prompt,
        userContext.settings?.summary_length
      )

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('[ContentScrapingService] Image processing error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
        statusCode: 500
      }
    }
  }

  /**
   * Detect if content is an error page
   */
  private isErrorPage(text: string): boolean {
    const hasJavaScript = text.includes('JavaScript')
    const hasCookie = text.includes('Cookie')
    const hasEnableJS = text.includes('enable JavaScript')
    const hasSupportedBrowser = text.includes('supported browser')
    const isShort = text.length < 1000

    const isErrorPage = hasJavaScript && hasCookie && isShort
    const isXErrorPage = hasEnableJS || hasSupportedBrowser

    return isErrorPage || isXErrorPage
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // クォータ超過・レート制限エラー
      if (message.includes('429') || message.includes('quota exceeded') || message.includes('rate limit')) {
        return 'AI処理の利用上限に達しました。しばらく時間をおいてから再度お試しください。'
      }

      // 404エラー（ページが見つからない）
      if (message.includes('404') || message.includes('not found')) {
        return '指定されたページが見つかりませんでした。URLが正しいか確認してください。'
      }

      // ネットワークエラー
      if (message.includes('fetch failed') || message.includes('failed to fetch')) {
        return '指定されたURLにアクセスできませんでした。URLが正しいか確認してください。'
      }

      // タイムアウトエラー
      if (message.includes('timeout') || message.includes('timed out')) {
        return 'リクエストがタイムアウトしました。もう一度お試しください。'
      }

      // URL検証エラー
      if (message.includes('invalid or forbidden url')) {
        return '無効なURLです。'
      }
    }
    return 'コンテンツの取得に失敗しました。'
  }
}

// Singleton instance
export const contentScrapingService = new ContentScrapingService()
