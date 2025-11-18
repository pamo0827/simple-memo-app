import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processImage, processText } from '@/lib/ai'
import { getInstagramContent } from '@/lib/instagram'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { url, userId } = await request.json()

    if (!url || !userId) {
      return NextResponse.json({ error: 'URLとユーザーIDが必要です' }, { status: 400 })
    }

    // Instagram URLの検証
    if (!url.includes('instagram.com')) {
      return NextResponse.json({ error: '有効なInstagram URLを入力してください' }, { status: 400 })
    }

    // ユーザー設定を取得
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: settings } = await supabase
      .from('user_settings')
      .select('gemini_api_key')
      .eq('user_id', userId)
      .maybeSingle()

    const apiKey = settings?.gemini_api_key

    // APIキーがない場合の処理
    // Gemini APIキーが設定されていない場合、画像やキャプションを解析できないため、
    // タイトル「メモ」とURLのみを含む基本的なメモを返す
    if (!apiKey) {
      console.log('[Instagram] No API key - creating basic memo with URL')
      return NextResponse.json({
        type: 'summary',
        data: `# メモ\n\n${url}`
      })
    }

    // Instagramから画像とキャプションを取得
    // Instagramは複数の方法で情報を抽出：
    // 1. 公式oEmbed API（最も信頼性が高い）
    // 2. HTMLからのスクレイピング（og:image, og:description, h1タグなど）
    // 3. 埋め込みJSONデータの解析
    console.log('Fetching Instagram content from:', url)
    const { imageBase64, caption } = await getInstagramContent(url)
    console.log('Instagram content result:', { hasImage: !!imageBase64, hasCaption: !!caption, captionLength: caption?.length })

    let result

    // 画像もキャプションも取得できなかった場合の処理
    // Instagramの投稿が非公開、削除済み、またはスクレイピングがブロックされた場合、
    // タイトル「メモ」とURLのみを含む基本的なメモを返す
    // これにより、ユーザーは少なくともURLを保存できる
    if (!imageBase64 && !caption) {
      console.log('No Instagram content found - creating basic memo with URL')
      return NextResponse.json({
        type: 'summary',
        data: `# メモ\n\n${url}`
      })
    }
    // 画像がある場合は画像処理（キャプションがあれば一緒に解析）
    else if (imageBase64) {
      result = await processImage(imageBase64, apiKey, caption || undefined)
    }
    // 画像がなくキャプションのみの場合はテキスト処理
    else if (caption) {
      result = await processText(caption, apiKey)
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Instagram scraping error:', error)
    const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
