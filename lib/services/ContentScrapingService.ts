// ContentScrapingService: Single Responsibility - Handle content scraping logic
import { processText, processImage, processVideo } from '@/lib/ai'
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
            data: `# メモ\n\n${url}`
          }
        }
      }

      // Get content
      const text = await getContentText(url)

      if (!text || this.isErrorPage(text)) {
        return {
          success: true,
          data: {
            type: 'summary',
            data: `# メモ\n\n${url}`
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
            data: `# メモ\n\n${url}`
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
              data: `# メモ\n\n${url}`
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
            data: '# メモ\n\n画像ファイル'
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
      if (error.message.includes('fetch failed') || error.message.includes('Failed to fetch')) {
        return '指定されたURLにアクセスできませんでした。'
      }
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        return 'リクエストがタイムアウトしました。もう一度お試しください。'
      }
      if (error.message.includes('Invalid or forbidden URL')) {
        return '無効なURLです。'
      }
    }
    return 'コンテンツの取得に失敗しました。'
  }
}

// Singleton instance
export const contentScrapingService = new ContentScrapingService()
