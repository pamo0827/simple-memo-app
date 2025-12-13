'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getPages, createPage } from '@/lib/pages'
import { Session } from '@supabase/supabase-js'

export default function AuthCallbackClient() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('認証処理中...')
  const processedRef = useRef(false)

  useEffect(() => {
    let mounted = true

    const finalizeLogin = async (session: Session) => {
      if (processedRef.current) return
      processedRef.current = true

      console.log('Finalizing login for user:', session.user.id)
      if (mounted) setStatus('ログインしました。データを取得中...')

      try {
        // Twitter OAuth の場合、アバターをダウンロード
        const identities = session.user.identities || []
        const twitterIdentity = identities.find(id => id.provider === 'twitter')

        if (twitterIdentity) {
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
        }

        if (mounted) router.push('/recipes')
      } catch (err) {
        console.error('初期データ作成エラー:', err)
        if (mounted) router.push('/recipes')
      }
    }

    const handleAuthCallback = async () => {
      // 1. イベントリスナーを設定
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return
        console.log('Auth state change:', event, !!session)

        if (session) {
          await finalizeLogin(session)
        } else if (event === 'SIGNED_OUT') {
           console.log('User signed out during callback')
        }
      })

      // 2. 現在のセッションを確認 (リスナーが発火しなかった場合や、すでにセッションがある場合用)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('セッション取得エラー:', sessionError)
        if (mounted) setError('認証に失敗しました')
        setTimeout(() => { if (mounted) router.push('/login') }, 3000)
        return
      }

      if (session) {
         console.log('Session exists via getSession')
         await finalizeLogin(session)
      } else {
        // セッションがない場合、ハッシュも確認
        setTimeout(() => {
          if (!mounted || processedRef.current) return
          
          // 再度確認
          supabase.auth.getSession().then(({ data }) => {
            if (!data.session) {
               console.log('No session found after timeout')
               const hash = window.location.hash
               // ハッシュもクエリもない場合はエラーとみなす
               if (!hash && !window.location.search) {
                   if (mounted) setError('認証情報が見つかりません')
                   setTimeout(() => { if (mounted) router.push('/login') }, 3000)
               }
            }
          })
        }, 5000)
      }

      return () => {
        subscription.unsubscribe()
      }
    }

    handleAuthCallback()

    return () => {
      mounted = false
    }
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
