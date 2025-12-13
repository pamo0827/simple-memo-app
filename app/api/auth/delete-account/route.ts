import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function DELETE(request: NextRequest) {
  try {
    // リクエストヘッダーから認証を行う
    const authResult = await authenticateRequest(request)

    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        {
          error: '認証が必要です。ログインセッションが切れている可能性があります。一度ログアウトして再ログインしてください。',
          details: authResult.error
        },
        { status: 401 }
      )
    }

    const userId = authResult.userId
    console.log('アカウント削除リクエスト:', { userId })

    // サービスロールクライアントを使用してアカウント削除
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // ユーザーを削除（カスケード削除により関連データも自動削除される）
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

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
