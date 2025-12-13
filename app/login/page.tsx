'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Fingerprint } from 'lucide-react'
import { isPasskeyAvailable } from '@/lib/passkey'
import { useAuth } from '@/hooks/useAuth'

// Twitter icon SVG component
function TwitterIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LoginComponent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [isSignupMode, setIsSignupMode] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [passkeyAvailable, setPasskeyAvailable] = useState(false)
  const [showPasskeyRegister, setShowPasskeyRegister] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    loading,
    error,
    setError,
    handleTwitterLogin,
    handlePasskeyLogin,
    handleEmailLogin,
    handleSignup,
    registerPasskeyFlow
  } = useAuth()

  useEffect(() => {
    if (searchParams.get('test_user') === 'true') {
      setEmail('test@mail.com')
      setPassword('weqho8-vIkkew-sojbas')
    }

    setPasskeyAvailable(isPasskeyAvailable())

    const handleHashError = () => {
      if (typeof window === 'undefined') return

      const hash = window.location.hash
      if (!hash) return

      const params = new URLSearchParams(hash.substring(1))
      const errorDescription = params.get('error_description')
      const err = params.get('error')

      if (errorDescription === 'Error getting user email from external provider') {
        setError('Twitterアカウントからメールアドレスを取得できませんでした。Twitterの設定でメールアドレスが登録・確認されているかご確認ください。')
        window.history.replaceState(null, '', window.location.pathname)
      } else if (err || errorDescription) {
        setError(decodeURIComponent(errorDescription || '認証エラーが発生しました'))
        window.history.replaceState(null, '', window.location.pathname)
      }
    }

    handleHashError()
  }, [searchParams, setError])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignupMode) {
      await handleSignup(email, password, nickname)
      // Redirect handled in useAuth or component re-render
    } else {
      await handleEmailLogin(email, password)
      // Redirect handled in useAuth or component re-render
    }
  }

  const onRegisterPasskey = async () => {
    const success = await registerPasskeyFlow()
    if (success) {
      setShowPasskeyRegister(false)
    }
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

            {!isSignupMode && (
              <div className="mb-6 hidden">
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-4">
                {isSignupMode && (
                  <div className="space-y-2">
                    <Label htmlFor="nickname">ニックネーム</Label>
                    <Input
                      id="nickname"
                      type="text"
                      required
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
