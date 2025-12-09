import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processText, processVideo } from '@/lib/ai'
import { extractYouTubeVideoId, getYouTubeFullText, isYouTubeShorts } from '@/lib/youtube'
import { checkAndUpdateUsage } from '@/lib/free-tier'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { url, userId, skipAI } = await request.json()

    if (!url || !userId) {
      return NextResponse.json({ error: 'URLとユーザーIDが必要です' }, { status: 400 })
    }

    // YouTube URLの検証
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return NextResponse.json({ error: '有効なYouTube URLを入力してください' }, { status: 400 })
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
      .select('ai_summary_enabled, custom_prompt, summary_length')
      .eq('user_id', userId)
      .maybeSingle()

    const apiKey = usageCheck.apiKey
    const aiSummaryEnabled = settings?.ai_summary_enabled ?? true
    const customPrompt = usageCheck.isFreeTier ? null : settings?.custom_prompt
    const summaryLength = settings?.summary_length ?? 3

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
      result = await processVideo(url, apiKey, customPrompt, summaryLength)
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
      result = await processText(fullText, apiKey, customPrompt, summaryLength)
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('YouTube scraping error:', error)
    const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
