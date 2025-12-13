'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getPages, createPage } from '@/lib/pages'

export default function AuthCallbackClient() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('認証処理中...')

  useEffect(() => {
    let mounted = true

    const handleAuthCallback = async () => {
      // セッションの確立を待機
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return

        console.log('Auth state change:', event, !!session)

        if (event === 'SIGNED_IN' && session) {
          setStatus('ログインしました。データを取得中...')
          
          try {
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

            // デフォルトページを作成（存在しない場合）
            try {
              const pages = await getPages(session.user.id)
              if (pages.length === 0) {
                await createPage(session.user.id, 'メイン')
              }
            } catch (err) {
              console.error('デフォルトページ作成エラー:', err)
              // エラーがあってもログインは続行
            }

            // ログイン成功、リダイレクト
            router.push('/recipes')
          } catch (err) {
            console.error('初期データ作成エラー:', err)
            // エラーがあってもリダイレクト
            router.push('/recipes')
          }
        } else if (event === 'SIGNED_OUT') {
           // 何もしない、またはエラー表示
           console.log('User signed out during callback')
        }
      })

      // フォールバック: すでにセッションがある場合、または一定時間経過してもイベントが来ない場合
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('セッション取得エラー:', sessionError)
        if (mounted) setError('認証に失敗しました')
        setTimeout(() => router.push('/login'), 3000)
        return
      }

      if (session) {
         // onAuthStateChangeが発火しない場合の保険（すでにSIGNED_IN済みなど）
         // ただし onAuthStateChange は登録直後に現在の状態でも発火するはずなので、
         // ここでの処理は重複を避けるために最小限にするか、何もしないでイベントに任せるのが安全だが、
         // イベントが発火しないケースを考慮してログだけ出しておく
         console.log('Session already exists via getSession')
      } else {
        // セッションがない場合、少し待ってもイベントが来なければエラー
        setTimeout(() => {
          if (mounted && !supabase.auth.getSession().then(({data}) => data.session)) {
             // 5秒待ってもセッションがなければエラーとみなす（ただし非同期なので完全ではない）
             // 実際にはユーザーが操作するわけではないので、ここで判定するのは難しいが、
             // ハッシュが含まれていない場合などはここで弾く
             const hash = window.location.hash
             if (!hash && !window.location.search) {
                 setError('認証情報が見つかりません')
                 setTimeout(() => router.push('/login'), 3000)
             }
          }
        }, 5000)
      }

      return () => {
        mounted = false
        subscription.unsubscribe()
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
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}
