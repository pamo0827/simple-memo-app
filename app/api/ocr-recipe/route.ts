import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { userContextService } from '@/lib/services/UserContextService'
import { contentScrapingService } from '@/lib/services/ContentScrapingService'

// ファイルサイズ制限: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024
// 許可する画像形式
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

/**
 * SOLID Refactored: ocr-recipe route
 *
 * This route now follows the Single Responsibility Principle:
 * - HTTP handling only (request parsing, file validation, response formatting)
 * - Business logic delegated to service layer
 * - Authentication & authorization delegated to UserContextService
 * - Image processing delegated to ContentScrapingService
 */

// OCRは負荷が高いため、レート制限を厳しく設定（15分間に20回）
async function postHandler(request: NextRequest) {
  try {
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

    // Handle skipAI without authentication (basic memo only)
    if (skipAI) {
      console.log('[OCR] AI skipped by request - creating basic memo')
      return NextResponse.json({
        type: 'summary',
        data: `# メモ\n\n画像ファイル: ${file.name}`
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

    // 画像ファイルをBase64エンコード
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const base64Image = fileBuffer.toString('base64')

    // Process image file
    const result = await contentScrapingService.processImageFile(
      base64Image,
      userContextResult.data,
      file.name
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      )
    }

    return NextResponse.json(result.data)

  } catch (error) {
    console.error('[OCR Recipe] Error:', error)
    return NextResponse.json(
      { error: '画像の処理に失敗しました。' },
      { status: 500 }
    )
  }
}

export const POST = withRateLimit(postHandler, 20, 15 * 60 * 1000)

