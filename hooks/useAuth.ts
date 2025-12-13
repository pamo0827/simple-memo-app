import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { authenticateWithPasskey, registerPasskey, isPasskeyAvailable } from '@/lib/passkey'
import { getPages, createPage } from '@/lib/pages'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleTwitterLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${window.location.origin}/auth/callback-client`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handlePasskeyLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await authenticateWithPasskey()
      if (!result.success || !result.credentialId) {
        throw new Error(result.error || 'パスキー認証に失敗しました')
      }
      const response = await fetch('/api/auth/passkey-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: result.credentialId }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'パスキーログインに失敗しました')
      }
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
      })
      if (sessionError) throw new Error('セッションの設定に失敗しました')
      router.push('/recipes')
    } catch (err: any) {
      console.error('パスキーログインエラー:', err)
      setError(err.message || 'パスキーログインに失敗しました')
      setLoading(false)
    }
  }

  const handleEmailLogin = async (email: string, password: string): Promise<{ user: any, showPasskeyRegister: boolean } | undefined> => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      
      let showPasskeyRegister = false
      if (isPasskeyAvailable() && data.user) {
        const { data: passkeys } = await supabase
          .from('passkeys')
          .select('id')
          .eq('user_id', data.user.id)
          .limit(1)
        if (!passkeys || passkeys.length === 0) {
          showPasskeyRegister = true
        }
      }

      if (!showPasskeyRegister) {
        router.push('/')
      }
      return { user: data.user, showPasskeyRegister }
    } catch (err: any) {
      console.error('ログインエラー:', err)
      setError(err.message || 'ログインに失敗しました')
      return undefined
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (email: string, password: string, nickname: string): Promise<{ user: any, showPasskeyRegister: boolean } | undefined> => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` }
      })

      if (error) {
         if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          throw new Error('このメールアドレスは既に登録されています。ログインしてください。Twitterアカウントと連携している場合は、Twitterでログインしてください。')
        }
        throw error
      }
      
      if (data.user && !data.session) {
        setError('確認メールを送信しました。メールを確認してください。')
        return undefined
      }
      
      if (data.user) {
        await supabase.from('user_settings').insert([{ user_id: data.user.id, nickname: nickname || null }])
        try {
          const pages = await getPages(data.user.id)
          if (pages.length === 0) await createPage(data.user.id, 'メイン')
        } catch (err) {
          console.error('デフォルトページ作成エラー:', err)
        }

        const showPasskeyRegister = isPasskeyAvailable()
        if (!showPasskeyRegister) {
            router.push('/')
        }
        return { user: data.user, showPasskeyRegister }
      }
    } catch (err: any) {
      console.error('新規登録エラー:', err)
      setError(err.message || 'エラーが発生しました')
      return undefined
    } finally {
      setLoading(false)
    }
  }

   const registerPasskeyFlow = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインしてください')

      const result = await registerPasskey({ email: user.email!, userId: user.id }, 'このデバイス')
      if (!result.success) throw new Error(result.error || 'パスキー登録に失敗しました')

      router.push('/')
      return true
    } catch (err: any) {
      console.error('パスキー登録エラー:', err)
      setError(err.message || 'パスキー登録に失敗しました')
      setLoading(false)
      return false
    }
  }

  return {
    loading,
    error,
    setError,
    handleTwitterLogin,
    handlePasskeyLogin,
    handleEmailLogin,
    handleSignup,
    registerPasskeyFlow
  }
}
