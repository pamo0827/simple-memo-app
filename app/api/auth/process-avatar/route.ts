import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { downloadAndStoreAvatar } from '@/lib/avatar'
import { authenticateRequest } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  console.log('=== process-avatar API called ===')

  // 認証チェック
  const authResult = await authenticateRequest(request)
  console.log('Auth result:', { authenticated: authResult.authenticated, userId: authResult.userId })

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
      console.error('Twitter認証情報が見つかりません')
      return NextResponse.json(
        { error: 'Twitter認証情報が見つかりません' },
        { status: 404 }
      )
    }

    // デバッグ: ユーザーメタデータとidentityデータをログ出力
    console.log('User metadata:', JSON.stringify(user.user_metadata, null, 2))
    console.log('Twitter identity data:', JSON.stringify(twitterIdentity.identity_data, null, 2))

    const avatarUrl = user.user_metadata?.avatar_url ||
                     user.user_metadata?.picture ||
                     user.user_metadata?.profile_image_url ||
                     twitterIdentity.identity_data?.avatar_url ||
                     twitterIdentity.identity_data?.picture ||
                     twitterIdentity.identity_data?.profile_image_url

    if (!avatarUrl) {
      console.error('アバター画像が見つかりません')
      console.error('User metadata:', user.user_metadata)
      console.error('Identity data:', twitterIdentity.identity_data)
      return NextResponse.json(
        { error: 'アバター画像が見つかりません' },
        { status: 404 }
      )
    }

    console.log('Avatar URL found:', avatarUrl)

    // アバターをダウンロードして保存
    const result = await downloadAndStoreAvatar(user.id, avatarUrl, 'twitter')

    if (!result.success) {
      console.error('アバターダウンロードエラー:', result.error)
      return NextResponse.json(
        { error: 'アバターの保存に失敗しました' },
        { status: 500 }
      )
    }

    // ユーザー名を取得
    const nickname = user.user_metadata?.name ||
                    user.user_metadata?.full_name ||
                    user.user_metadata?.user_name ||
                    twitterIdentity.identity_data?.name ||
                    twitterIdentity.identity_data?.full_name ||
                    twitterIdentity.identity_data?.user_name ||
                    null

    console.log('Nickname found:', nickname)

    // ユーザー設定を更新
    const { error: settingsError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        avatar_url: result.avatarUrl,
        avatar_provider: 'twitter',
        avatar_storage_path: result.storagePath,
        nickname: nickname,
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

    console.log('✓ Successfully saved user settings:', {
      userId: user.id,
      avatarUrl: result.avatarUrl,
      nickname: nickname,
      avatarProvider: 'twitter'
    })

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
