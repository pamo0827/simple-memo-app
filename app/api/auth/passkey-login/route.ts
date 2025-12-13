import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { credentialId } = body

    if (!credentialId) {
      return NextResponse.json(
        { error: 'credential IDが必要です' },
        { status: 400 }
      )
    }

    // サービスロールでSupabaseクライアントを作成
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // パスキー情報を取得
    const { data: passkey, error: passkeyError } = await supabase
      .from('passkeys')
      .select('user_id')
      .eq('credential_id', credentialId)
      .single()

    if (passkeyError || !passkey) {
      console.error('パスキー取得エラー:', passkeyError)
      return NextResponse.json(
        { error: 'パスキーが見つかりません' },
        { status: 404 }
      )
    }

    // ユーザー情報を取得
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(passkey.user_id)

    if (userError || !user || !user.email) {
      console.error('ユーザー取得エラー:', userError)
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    console.log('Passkey Login: User found:', user.id, 'Email:', user.email)

    // マジックリンクトークンを生成
    console.log('Passkey Login: Generating magic link for email:', user.email)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    })

    if (linkError) {
      console.error('Passkey Login: Token generation error:', linkError)
      console.error('Passkey Login: Error details:', JSON.stringify(linkError))
    }

    if (!linkData) {
      console.error('Passkey Login: No link data returned')
    } else {
      console.log('Passkey Login: Link data received, has action_link:', !!linkData.properties?.action_link)
    }

    if (linkError || !linkData) {
      return NextResponse.json(
        { error: 'トークンの生成に失敗しました' },
        { status: 500 }
      )
    }

    // 最終使用日時を更新
    await supabase
      .from('passkeys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('credential_id', credentialId)

    // トークンのハッシュ部分を抽出（URLに含まれている）
    // 例: https://example.com/auth/confirm#access_token=...&refresh_token=...
    const url = new URL(linkData.properties.action_link)
    const hash = url.hash.substring(1) // #を除去
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken) {
      console.error('アクセストークンが見つかりません')
      return NextResponse.json(
        { error: 'トークンの生成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
    })
  } catch (error) {
    console.error('パスキーログインエラー:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
