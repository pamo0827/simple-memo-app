import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processImage } from '@/lib/ai'
import { checkAndUpdateUsage } from '@/lib/free-tier'
import { authenticateRequest } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// ファイルサイズ制限: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024
// 許可する画像形式
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    // セキュリティ: 認証トークンからユーザーIDを取得
    const authResult = await authenticateRequest(request)
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        { error: '認証が必要です。' },
        { status: 401 }
      )
    }
    const userId = authResult.userId

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const skipAI = formData.get('skipAI') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'ファイルが必要です。' }, { status: 400 })
    }

    // セキュリティ: ファイルサイズ制限
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `ファイルサイズが大きすぎます。最大${MAX_FILE_SIZE / 1024 / 1024}MBまでです。` },
        { status: 400 }
      )
    }

    // セキュリティ: ファイルタイプの厳格な検証
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '画像ファイルのみ対応しています。' }, { status: 400 })
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '対応していない画像形式です。JPEG、PNG、GIF、WebPのみ対応しています。' },
        { status: 400 }
      )
    }

    // セキュリティ: ファイル名の検証（パストラバーサル対策）
    const filename = file.name
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: '不正なファイル名です。' }, { status: 400 })
    }

  // リクエストでAIをスキップする指定がある場合
  if (skipAI) {
    console.log('[OCR] AI skipped by request - creating basic memo')
    return NextResponse.json({
      type: 'summary',
      data: `# メモ\n\n画像ファイル: ${file.name}`
    })
  }

  // 無料枠の使用制限チェック
  const usageCheck = await checkAndUpdateUsage(userId)
  if (!usageCheck.allowed) {
    return NextResponse.json({
      error: usageCheck.errorMessage
    }, { status: 429 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: userSettings, error: userError } = await supabase
    .from('user_settings')
    .select('ai_summary_enabled, custom_prompt')
    .eq('user_id', userId)
    .single()

  if (userError || !userSettings) {
    return NextResponse.json({ error: 'User settings not found.' }, { status: 404 })
  }

  const apiKey = usageCheck.apiKey
  const aiSummaryEnabled = userSettings.ai_summary_enabled ?? true
  const customPrompt = usageCheck.isFreeTier ? null : userSettings.custom_prompt

  // AI要約が無効の場合の処理
  if (!aiSummaryEnabled) {
    console.log('[OCR] AI summary disabled - creating basic memo')
    return NextResponse.json({
      type: 'summary',
      data: `# メモ\n\n画像ファイル: ${file.name}`
    })
  }

  // 画像ファイルをBase64エンコード
  // Gemini Vision APIは画像をBase64形式で受け取る
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const base64Image = fileBuffer.toString('base64')

  // 画像から情報を抽出
  // Gemini Vision APIを使用して、画像内のテキスト、URL、レシピ情報などを抽出
  const result = await processImage(base64Image, apiKey, undefined, customPrompt)

  // 抽出結果をフロントエンドに返す
  return NextResponse.json(result)

  } catch (error) {
    // サーバーログには詳細を記録
    console.error('[OCR Recipe] Error:', error)

    // セキュリティ: クライアントには一般的なメッセージのみ返す（情報漏洩防止）
    let userMessage = '画像の処理に失敗しました。'
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
      }
      // 内部エラーの詳細は返さない
    }

    return NextResponse.json({ error: userMessage }, { status: statusCode })
  }
}
