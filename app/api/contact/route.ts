import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit } from '@/lib/rate-limit'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// お問い合わせフォームは1時間に5回まで
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message, user_id } = body

    // 入力検証
    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: '必須項目を入力してください。' },
        { status: 400 }
      )
    }

    // メールアドレスの形式検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください。' },
        { status: 400 }
      )
    }

    // メッセージの長さ制限
    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'メッセージは5000文字以内で入力してください。' },
        { status: 400 }
      )
    }

    // データベースに保存
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { error } = await supabase
      .from('contact_requests')
      .insert({
        user_id: user_id || null,
        name: name || null,
        email,
        subject,
        message,
        status: 'new',
      })

    if (error) {
      console.error('Contact request insert error:', error)
      return NextResponse.json(
        { error: 'お問い合わせの送信に失敗しました。' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'お問い合わせを受け付けました。' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: 'エラーが発生しました。' },
      { status: 500 }
    )
  }
}

// レート制限: 1時間に5回まで
export const POST = withRateLimit(postHandler, 5, 60 * 60 * 1000)
