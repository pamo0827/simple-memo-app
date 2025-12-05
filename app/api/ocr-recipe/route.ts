import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processImage } from '@/lib/ai'
import { checkAndUpdateUsage } from '@/lib/free-tier'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const userId = formData.get('userId') as string | null
  const skipAI = formData.get('skipAI') === 'true'

  if (!file || !userId) {
    return NextResponse.json({ error: 'File and userId are required' }, { status: 400 })
  }

  // ファイルタイプのチェック（画像のみ対応）
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: '現在、画像ファイルのみ対応しています。' }, { status: 400 })
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

  try {
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
    console.error('OCR Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json({ error: `Failed to process file: ${errorMessage}` }, { status: 500 })
  }
}
