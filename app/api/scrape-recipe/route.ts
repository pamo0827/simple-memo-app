import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processText } from '@/lib/ai'
import { getContentText } from '@/lib/content'
import { checkAndUpdateUsage } from '@/lib/free-tier'
import { authenticateRequest } from '@/lib/auth'
import { isAllowedUrl } from '@/lib/url-validation'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// --- API Route Handler ---

export async function POST(request: NextRequest) {
  try {
    // セキュリティ: 認証トークンからユーザーIDを取得（リクエストボディからは受け取らない）
    const authResult = await authenticateRequest(request)
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        { error: '認証が必要です。' },
        { status: 401 }
      )
    }
    const userId = authResult.userId

    const { url, skipAI } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URLが必要です。' }, { status: 400 })
    }

    // セキュリティ: URL検証（SSRF対策）
    if (!isAllowedUrl(url)) {
      return NextResponse.json(
        { error: '無効なURLです。' },
        { status: 400 }
      )
    }

    // リクエストでAIをスキップする指定がある場合
    if (skipAI) {
      console.log('[Scrape] AI skipped by request - creating basic memo with URL')
      return NextResponse.json({
        type: 'summary',
        data: `# メモ\n\n${url}`
      })
    }

    // 無料枠の使用制限チェック
    const usageCheck = await checkAndUpdateUsage(userId)
    if (!usageCheck.allowed) {
      return NextResponse.json({
        error: usageCheck.errorMessage
      }, { status: 429 })
    }

    // Get user's settings from database
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: settings } = await supabase
      .from('user_settings')
      .select('ai_summary_enabled, custom_prompt')
      .eq('user_id', userId)
      .maybeSingle()

    const apiKey = usageCheck.apiKey
    const aiSummaryEnabled = settings?.ai_summary_enabled ?? true
    const customPrompt = usageCheck.isFreeTier ? null : settings?.custom_prompt

    // AI要約が無効の場合の処理
    if (!aiSummaryEnabled) {
      console.log('[Scrape] AI summary disabled - creating basic memo with URL')
      return NextResponse.json({
        type: 'summary',
        data: `# メモ\n\n${url}`
      })
    }

    // URLからコンテンツを取得
    const text = await getContentText(url)
    console.log('[Scrape] Content length:', text?.length)
    console.log('[Scrape] Content preview:', text?.substring(0, 200))

    // コンテンツが取得できなかった場合の処理
    // URLが無効、アクセス不可、または空のページの場合、
    // タイトル「メモ」とURLのみを含む基本的なメモを返す
    if (!text) {
      console.log('[Scrape] No content retrieved - creating basic memo with URL')
      return NextResponse.json({
        type: 'summary',
        data: `# メモ\n\n${url}`
      })
    }

    // エラーページの検出
    // X/Twitter等のサイトは、サーバーサイドからのアクセスに対して
    // JavaScriptエラーページを返すことがある
    // このような場合、エラーページの内容を解析せず、基本的なメモを返す
    const hasJavaScript = text.includes('JavaScript')
    const hasCookie = text.includes('Cookie')
    const hasEnableJS = text.includes('enable JavaScript')
    const hasSupportedBrowser = text.includes('supported browser')
    const isShort = text.length < 1000

    console.log('[Scrape] Error page detection:', { hasJavaScript, hasCookie, hasEnableJS, hasSupportedBrowser, isShort })

    const isErrorPage = hasJavaScript && hasCookie && isShort
    const isXErrorPage = hasEnableJS || hasSupportedBrowser

    if (isErrorPage || isXErrorPage) {
      console.log('[Scrape] Detected error page content - creating basic memo with URL')
      return NextResponse.json({
        type: 'summary',
        data: `# メモ\n\n${url}`
      })
    }

    // Extract recipe using the centralized AI function
    const result = await processText(text, apiKey, customPrompt)

    return NextResponse.json(result)

  } catch (error) {
    // サーバーログには詳細を記録
    console.error('[Scrape Recipe] Error:', error)

    // セキュリティ: クライアントには一般的なメッセージのみ返す（情報漏洩防止）
    let userMessage = 'レシピの取得に失敗しました。'
    let statusCode = 500

    // 特定のエラーのみユーザーフレンドリーなメッセージを返す
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('Failed to fetch')) {
        userMessage = '指定されたURLにアクセスできませんでした。'
        statusCode = 400
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        userMessage = 'リクエストがタイムアウトしました。もう一度お試しください。'
        statusCode = 408
      } else if (error.message.includes('Invalid or forbidden URL')) {
        userMessage = '無効なURLです。'
        statusCode = 400
      }
      // 内部エラーの詳細は返さない
    }

    return NextResponse.json({ error: userMessage }, { status: statusCode })
  }
}
