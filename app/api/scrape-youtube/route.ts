import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { userContextService } from '@/lib/services/UserContextService'
import { contentScrapingService } from '@/lib/services/ContentScrapingService'
import { extractYouTubeVideoId } from '@/lib/youtube'

/**
 * SOLID Refactored: scrape-youtube route
 *
 * This route now follows the Single Responsibility Principle:
 * - HTTP handling only (request parsing, response formatting)
 * - Business logic delegated to service layer
 * - Authentication & authorization delegated to UserContextService
 * - YouTube scraping delegated to ContentScrapingService
 */

async function postHandler(request: NextRequest) {
  try {
    const { url, skipAI } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URLが必要です。' }, { status: 400 })
    }

    // YouTube URLの検証
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return NextResponse.json({ error: '有効なYouTube URLを入力してください。' }, { status: 400 })
    }

    // 動画IDを抽出
    const videoId = extractYouTubeVideoId(url)
    if (!videoId) {
      return NextResponse.json({ error: '動画IDを取得できませんでした' }, { status: 400 })
    }

    // Handle skipAI without authentication (basic memo only)
    if (skipAI) {
      console.log('[YouTube] AI skipped by request - creating basic memo with URL')
      return NextResponse.json({
        type: 'summary',
        data: `# メモ\n\n${url}`
      })
    }

    // Get user context (handles auth, authorization, settings)
    const userContextResult = await userContextService.getUserContext(request)
    if (!userContextResult.success || !userContextResult.data) {
      return NextResponse.json(
        { error: userContextResult.error },
        { status: userContextResult.statusCode || 500 }
      )
    }

    // Scrape and process YouTube video
    const result = await contentScrapingService.scrapeYouTube(url, userContextResult.data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      )
    }

    return NextResponse.json(result.data)

  } catch (error) {
    console.error('[YouTube Scrape] Error:', error)
    return NextResponse.json(
      { error: 'YouTube動画の取得に失敗しました。' },
      { status: 500 }
    )
  }
}

export const POST = withRateLimit(postHandler, 100, 15 * 60 * 1000)

