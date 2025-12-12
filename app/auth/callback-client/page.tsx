'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackClient() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLからコードを取得
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('セッション取得エラー:', sessionError)
          setError('認証に失敗しました')
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        if (session?.user) {
          // Twitter OAuth の場合、アバターをダウンロード
          const identities = session.user.identities || []
          const twitterIdentity = identities.find(id => id.provider === 'twitter')

          if (twitterIdentity) {
            // サーバー側のAPIを呼び出してアバターをダウンロード
            try {
              await fetch('/api/auth/process-avatar', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  userId: session.user.id,
                  provider: 'twitter',
                }),
              })
            } catch (err) {
              console.error('アバター処理エラー:', err)
              // エラーがあってもログインは続行
            }
          }

          // ログイン成功、リダイレクト
          router.push('/recipes')
        } else {
          setError('セッションが見つかりません')
          setTimeout(() => router.push('/login'), 3000)
        }
      } catch (err) {
        console.error('認証処理エラー:', err)
        setError('予期しないエラーが発生しました')
        setTimeout(() => router.push('/login'), 3000)
      }
    }

    handleAuthCallback()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">ログインページにリダイレクトします...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">認証処理中...</p>
      </div>
    </div>
  )
}
