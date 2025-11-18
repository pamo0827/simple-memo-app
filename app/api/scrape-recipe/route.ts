import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processText } from '@/lib/ai'
import { getContentText } from '@/lib/content'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// --- API Route Handler ---

export async function POST(request: NextRequest) {
  try {
    const { url, userId } = await request.json()

    if (!url || !userId) {
      return NextResponse.json({ error: 'URL and User ID are required' }, { status: 400 })
    }

    // Get user's settings from database
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: settings } = await supabase
      .from('user_settings')
      .select('gemini_api_key')
      .eq('user_id', userId)
      .maybeSingle()

    const apiKey = settings?.gemini_api_key

    // APIキーがない場合の処理
    // Gemini APIキーが設定されていない場合、コンテンツを解析できないため、
    // タイトル「メモ」とURLのみを含む基本的なメモを返す
    // これにより、ユーザーはURLを保存でき、後でAPIキーを設定してから解析できる
    if (!apiKey) {
      console.log('[Scrape] No API key - creating basic memo with URL')
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
    // X/Twitter、Instagram等のサイトは、サーバーサイドからのアクセスに対して
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
    const result = await processText(text, apiKey)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Recipe scraping error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
