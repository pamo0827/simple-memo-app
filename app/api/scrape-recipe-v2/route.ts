import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { userContextService } from '@/lib/services/UserContextService'
import { contentScrapingService } from '@/lib/services/ContentScrapingService'

/**
 * Refactored API route following SOLID principles
 * - Single Responsibility: Only handles HTTP request/response
 * - Dependency Inversion: Depends on service abstractions
 * - Open/Closed: New scraping sources can be added without modifying this code
 */
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, skipAI } = body

    if (!url) {
      return NextResponse.json({ error: 'URLが必要です。' }, { status: 400 })
    }

    // Skip AI processing if requested
    if (skipAI) {
      return NextResponse.json({
        type: 'summary',
        data: `# メモ\n\n${url}`
      })
    }

    // Get user context (handles authentication, authorization, and settings)
    const userContextResult = await userContextService.getUserContext(request)
    if (!userContextResult.success || !userContextResult.data) {
      return NextResponse.json(
        { error: userContextResult.error },
        { status: userContextResult.statusCode || 500 }
      )
    }

    // Scrape and process content
    const result = await contentScrapingService.scrapeUrl(url, userContextResult.data)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('[Scrape Recipe API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'レシピの取得に失敗しました。' },
      { status: 500 }
    )
  }
}

export const POST = withRateLimit(postHandler, 100, 15 * 60 * 1000)
