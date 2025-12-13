import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function DELETE(request: NextRequest) {
  try {
    // クライアント側のSupabaseクライアントを作成してセッションを取得
    const cookieStore = await cookies()
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('認証エラー詳細:', {
        error: userError,
        hasUser: !!user,
        errorMessage: userError?.message,
        errorStatus: userError?.status
      })

      return NextResponse.json(
        {
          error: '認証が必要です。ログインセッションが切れている可能性があります。一度ログアウトして再ログインしてください。',
          details: userError?.message
        },
        { status: 401 }
      )
    }

    console.log('アカウント削除リクエスト:', { userId: user.id, email: user.email })

    // サービスロールクライアントを使用してアカウント削除
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // ユーザーを削除（カスケード削除により関連データも自動削除される）
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('アカウント削除エラー:', deleteError)
      return NextResponse.json(
        { error: 'アカウントの削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('アカウント削除処理エラー:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
