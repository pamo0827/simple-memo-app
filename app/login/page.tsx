'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Fingerprint } from 'lucide-react'
import { isPasskeyAvailable, authenticateWithPasskey, registerPasskey } from '@/lib/passkey'
import { getPages, createPage } from '@/lib/pages'

// Twitter icon SVG component
function TwitterIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function LoginComponent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [isSignupMode, setIsSignupMode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passkeyAvailable, setPasskeyAvailable] = useState(false)
  const [showPasskeyRegister, setShowPasskeyRegister] = useState(false)
  const [justLoggedIn, setJustLoggedIn] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('test_user') === 'true') {
      setEmail('test@mail.com')
      setPassword('weqho8-vIkkew-sojbas')
    }

    // パスキーが利用可能かチェック
    setPasskeyAvailable(isPasskeyAvailable())

    // URLハッシュからエラーをチェック (OAuthリダイレクトエラー用)
    const handleHashError = () => {
      if (typeof window === 'undefined') return
      
      const hash = window.location.hash
      if (!hash) return

      const params = new URLSearchParams(hash.substring(1))
      const errorDescription = params.get('error_description')
      const error = params.get('error')

      if (errorDescription === 'Error getting user email from external provider') {
        setError('Twitterアカウントからメールアドレスを取得できませんでした。Twitterの設定でメールアドレスが登録・確認されているかご確認ください。')
        // URLをきれいにする
        window.history.replaceState(null, '', window.location.pathname)
      } else if (error || errorDescription) {
        setError(decodeURIComponent(errorDescription || '認証エラーが発生しました'))
        window.history.replaceState(null, '', window.location.pathname)
      }
    }

    handleHashError()
  }, [searchParams])

  // Twitter OAuth認証
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
    // OAuthはリダイレクトするため、ここでloadingをfalseにしない
  }

  // パスキーで自動ログイン
  const handlePasskeyLogin = async () => {
    setLoading(true)
    setError('')

    try {
      // パスキーで認証
      const result = await authenticateWithPasskey()

      if (!result.success || !result.credentialId) {
        setError(result.error || 'パスキー認証に失敗しました')
        setLoading(false)
        return
      }

      // サーバー側のAPIを呼び出してトークンを取得
      const response = await fetch('/api/auth/passkey-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentialId: result.credentialId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'パスキーログインに失敗しました')
        setLoading(false)
        return
      }

      // トークンを使ってSupabaseのセッションを設定
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
      })

      if (sessionError) {
        console.error('セッション設定エラー:', sessionError)
        setError('セッションの設定に失敗しました')
        setLoading(false)
        return
      }

      // ログイン成功
      router.push('/recipes')
    } catch (err) {
      console.error('パスキーログインエラー:', err)
      setError('パスキーログインに失敗しました')
      setLoading(false)
    }
  }

  // パスキーを登録
  const handleRegisterPasskey = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('ログインしてください')
        setLoading(false)
        return
      }

      const result = await registerPasskey(
        { email: user.email!, userId: user.id },
        'このデバイス'
      )

      if (!result.success) {
        setError(result.error || 'パスキー登録に失敗しました')
        setLoading(false)
        return
      }

      setShowPasskeyRegister(false)
      router.push('/')
    } catch (err) {
      console.error('パスキー登録エラー:', err)
      setError('パスキー登録に失敗しました')
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('ログイン開始:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('ログイン結果:', { data, error })

      if (error) {
        setError(error.message)
      } else {
        console.log('ログイン成功、リダイレクト中')
        setJustLoggedIn(true)

        // パスキーが利用可能で、まだ登録していない場合、登録を促す
        if (passkeyAvailable && data.user) {
          const { data: passkeys } = await supabase
            .from('passkeys')
            .select('id')
            .eq('user_id', data.user.id)
            .limit(1)

          if (!passkeys || passkeys.length === 0) {
            setShowPasskeyRegister(true)
            setLoading(false)
            return
          }
        }

        router.push('/')
      }
    } catch (err) {
      console.error('ログインエラー:', err)
      setError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('新規登録開始:', email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      })

      console.log('新規登録結果:', { data, error })

      if (error) {
        setError(error.message)
      } else if (data.user && !data.session) {
        setError('確認メールを送信しました。メールを確認してください。')
      } else if (data.user) {
        // ユーザー設定にニックネームを保存
        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert([
            {
              user_id: data.user.id,
              nickname: nickname || null,
            }
          ])

        if (settingsError) {
          console.error('設定保存エラー:', settingsError)
        }

        // デフォルトページを作成
        try {
          const pages = await getPages(data.user.id)
          if (pages.length === 0) {
            await createPage(data.user.id, 'メイン')
          }
        } catch (err) {
          console.error('デフォルトページ作成エラー:', err)
          // エラーがあっても登録は続行
        }

        console.log('登録成功、リダイレクト中')
        setJustLoggedIn(true)

        // パスキーが利用可能な場合、登録を促す
        if (passkeyAvailable && data.user) {
          setShowPasskeyRegister(true)
          setLoading(false)
          return
        }

        router.push('/')
      }
    } catch (err) {
      console.error('新規登録エラー:', err)
      setError('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // パスキー登録ダイアログ
  if (showPasskeyRegister) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Fingerprint className="h-6 w-6" />
                パスキーを登録
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-3">
                <p className="text-gray-700">
                  パスキーを登録すると、次回から生体認証や画面ロックで簡単にログインできます。
                </p>
                <p className="text-sm text-gray-500">
                  顔認証、指紋認証、またはPINコードでログインできるようになります。
                </p>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleRegisterPasskey}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  <Fingerprint className="h-5 w-5 mr-2" />
                  {loading ? '登録中...' : 'パスキーを登録'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/')}
                  disabled={loading}
                  className="w-full"
                >
                  スキップ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MEMOTTO</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">{isSignupMode ? '新規登録' : 'ログイン'}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Twitter OAuth ボタン */}
            <div className="mb-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleTwitterLogin}
                disabled={loading}
                className="w-full border-2 border-blue-400 text-blue-600 hover:bg-blue-50"
                size="lg"
              >
                <TwitterIcon className="h-5 w-5 mr-2" />
                {isSignupMode ? 'Twitterで登録' : 'Twitterでログイン'}
              </Button>
            </div>

            {/* パスキーログインボタン（ログインモード時のみ） */}
            {!isSignupMode && passkeyAvailable && (
              <div className="mb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePasskeyLogin}
                  disabled={loading}
                  className="w-full border-2 border-amber-500 text-amber-700 hover:bg-amber-50"
                  size="lg"
                >
                  <Fingerprint className="h-5 w-5 mr-2" />
                  パスキーでログイン
                </Button>
              </div>
            )}

            {/* 区切り線 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            <form className="space-y-6" onSubmit={isSignupMode ? handleSignup : handleLogin}>
              <div className="space-y-4">
                {isSignupMode && (
                  <div className="space-y-2">
                    <Label htmlFor="nickname">ニックネーム</Label>
                    <Input
                      id="nickname"
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="山田太郎"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">パスワード</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? '処理中...' : (isSignupMode ? '登録' : 'ログイン')}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsSignupMode(!isSignupMode)
                    setError('')
                  }}
                  disabled={loading}
                  className="w-full"
                >
                  {isSignupMode ? 'アカウントをお持ちの方はこちら' : '新規登録はこちら'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <LoginComponent />
    </Suspense>
  )
}
