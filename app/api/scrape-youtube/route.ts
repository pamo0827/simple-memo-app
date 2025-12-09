import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processText, processVideo } from '@/lib/ai'
import { extractYouTubeVideoId, getYouTubeFullText, isYouTubeShorts } from '@/lib/youtube'
import { checkAndUpdateUsage } from '@/lib/free-tier'
import { authenticateRequest } from '@/lib/auth'
import { isAllowedUrl } from '@/lib/url-validation'
import { withRateLimit } from '@/lib/rate-limit'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function postHandler(request: NextRequest) {
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

    // YouTube URLの検証
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return NextResponse.json({ error: '有効なYouTube URLを入力してください。' }, { status: 400 })
    }

    // 動画IDを抽出
    const videoId = extractYouTubeVideoId(url)
    if (!videoId) {
      return NextResponse.json({ error: '動画IDを取得できませんでした' }, { status: 400 })
    }

    // リクエストでAIをスキップする指定がある場合
    if (skipAI) {
      console.log('[YouTube] AI skipped by request - creating basic memo with URL')
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

    // ユーザー設定を取得
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
      console.log('[YouTube] AI summary disabled - creating basic memo with URL')
      return NextResponse.json({
        type: 'summary',
        data: `# メモ\n\n${url}`
      })
    }

    // Shortsかどうか判定
    // YouTube Shortsは通常の動画とは異なり、字幕が利用できない場合が多い
    // そのため、Geminiの動画解析APIを使用して直接処理する
    const isShortsVideo = isYouTubeShorts(url)

    let result

    if (isShortsVideo) {
      // Shortsの場合、動画を直接解析
      console.log('Analyzing YouTube Shorts with Gemini video API...')
      result = await processVideo(url, apiKey, customPrompt)
    } else {
      // 通常の動画の場合、字幕とメタデータを取得
      // youtubei.jsライブラリを使用して、動画の字幕（transcript）と説明文を取得
      console.log('Fetching YouTube transcript and metadata...')
      const fullText = await getYouTubeFullText(videoId)

      // 字幕が取得できなかった場合の処理
      // 字幕が無効になっている、自動生成されていない、または利用不可の場合、
      // タイトル「メモ」とURLのみを含む基本的なメモを返す
      if (!fullText) {
        console.log('[YouTube] No transcript available - creating basic memo with URL')
        return NextResponse.json({
          type: 'summary',
          data: `# メモ\n\n${url}`
        })
      }

      // 字幕とメタデータからコンテンツを抽出
      result = await processText(fullText, apiKey, customPrompt)
    }

    return NextResponse.json(result)

  } catch (error) {
    // サーバーログには詳細を記録
    console.error('[YouTube Scrape] Error:', error)

    // セキュリティ: クライアントには一般的なメッセージのみ返す（情報漏洩防止）
    let userMessage = 'YouTube動画の取得に失敗しました。'
    let statusCode = 500

    // 特定のエラーのみユーザーフレンドリーなメッセージを返す
    if (error instanceof Error) {
      if (error.message.includes('Invalid API key') || error.message.includes('API key')) {
        userMessage = 'APIキーの設定に問題があります。設定を確認してください。'
        statusCode = 400
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        userMessage = 'リクエストがタイムアウトしました。もう一度お試しください。'
        statusCode = 408
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        userMessage = 'APIの利用制限に達しました。しばらく待ってから再度お試しください。'
        statusCode = 429
      } else if (error.message.includes('Video unavailable') || error.message.includes('not available')) {
        userMessage = 'この動画は利用できません。'
        statusCode = 404
      } else if (error.message.includes('Invalid or forbidden URL')) {
        userMessage = '無効なURLです。'
        statusCode = 400
      }
      // 内部エラーの詳細は返さない
    }

    return NextResponse.json({ error: userMessage }, { status: statusCode })
  }
}

export const POST = withRateLimit(postHandler, 100, 15 * 60 * 1000)

