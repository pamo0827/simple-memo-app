import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { downloadAndStoreAvatar } from '@/lib/avatar'
import { authenticateRequest } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  // 認証チェック
  const authResult = await authenticateRequest(request)

  if (!authResult.authenticated || !authResult.userId) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { provider } = body

    if (provider !== 'twitter') {
      return NextResponse.json(
        { error: '未対応のプロバイダーです' },
        { status: 400 }
      )
    }

    // サービスロールでユーザー情報を取得
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(authResult.userId)

    if (userError || !user) {
      console.error('ユーザー取得エラー:', userError)
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // Twitter identityからアバターURLを取得
    const identities = user.identities || []
    const twitterIdentity = identities.find(id => id.provider === 'twitter')

    if (!twitterIdentity) {
      return NextResponse.json(
        { error: 'Twitter認証情報が見つかりません' },
        { status: 404 }
      )
    }

    const avatarUrl = user.user_metadata?.avatar_url ||
                     user.user_metadata?.picture ||
                     twitterIdentity.identity_data?.avatar_url

    if (!avatarUrl) {
      return NextResponse.json(
        { error: 'アバター画像が見つかりません' },
        { status: 404 }
      )
    }

    // アバターをダウンロードして保存
    const result = await downloadAndStoreAvatar(user.id, avatarUrl, 'twitter')

    if (!result.success) {
      console.error('アバターダウンロードエラー:', result.error)
      return NextResponse.json(
        { error: 'アバターの保存に失敗しました' },
        { status: 500 }
      )
    }

    // ユーザー設定を更新
    const { error: settingsError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        avatar_url: result.avatarUrl,
        avatar_provider: 'twitter',
        avatar_storage_path: result.storagePath,
        nickname: user.user_metadata?.name || user.user_metadata?.full_name || null,
      }, {
        onConflict: 'user_id',
      })

    if (settingsError) {
      console.error('設定保存エラー:', settingsError)
      return NextResponse.json(
        { error: '設定の保存に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      avatarUrl: result.avatarUrl,
    })
  } catch (error) {
    console.error('アバター処理エラー:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
