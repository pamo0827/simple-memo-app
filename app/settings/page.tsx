'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { getUserSettings, upsertUserSettings } from '@/lib/user-settings'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, ChevronUp, Fingerprint, Trash2, Pencil, Camera, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { systemPrompt, imageSystemPrompt, videoSystemPrompt } from '@/lib/ai'
import { Avatar } from '@/components/ui/avatar'
import { uploadAvatarFile, deleteAvatar } from '@/lib/avatar'
import {
  isPasskeyAvailable,
  registerPasskey,
  getUserPasskeys,
  deletePasskey,
  updatePasskeyName,
  type PasskeyCredential
} from '@/lib/passkey'
export default function SettingsPage() {
  const supabase = createClientComponentClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // State for each form
  const [nickname, setNickname] = useState('')
  const [nicknameSaving, setNicknameSaving] = useState(false)
  const [nicknameMessage, setNicknameMessage] = useState('')

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarProvider, setAvatarProvider] = useState<string | null>(null)
  const [avatarStoragePath, setAvatarStoragePath] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarMessage, setAvatarMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')

  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [aiSummaryEnabled, setAiSummaryEnabled] = useState(true)
  const [autoAiSummary, setAutoAiSummary] = useState(true)
  const [customPrompt, setCustomPrompt] = useState('')
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [apiKeysSaving, setApiKeysSaving] = useState(false)
  const [apiKeysMessage, setApiKeysMessage] = useState('')

  const [showDefaultPrompts, setShowDefaultPrompts] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string>('')
  const [apiKeySaveStatus, setApiKeySaveStatus] = useState<'saved' | 'saving' | 'error' | ''>('')

  // パスキー関連のstate
  const [passkeys, setPasskeys] = useState<PasskeyCredential[]>([])
  const [passkeyAvailable, setPasskeyAvailable] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [passkeyMessage, setPasskeyMessage] = useState('')
  const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(null)
  const [editingPasskeyName, setEditingPasskeyName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  // Twitter認証状態
  const [isTwitterLogin, setIsTwitterLogin] = useState(false)
  const [twitterUsername, setTwitterUsername] = useState<string | null>(null)

  // アカウント削除
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // 無料枠の使用状況
  const [freeTierUsage, setFreeTierUsage] = useState<number>(0)
  const [freeTierLimit, setFreeTierLimit] = useState<number>(10)
  const [loadingUsage, setLoadingUsage] = useState(false)

  // 無料枠かどうかの判定（APIキーが設定されていない場合は無料枠）
  const isFreeTier = !geminiApiKey || geminiApiKey.trim() === ''

  // debounce用のタイマー
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoad = useRef(true)
  const initialApiKey = useRef<string>('')

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      setUserEmail(user.email || '')

      // Twitter認証状態をチェック
      const identities = user.identities || []
      const twitterIdentity = identities.find(id => id.provider === 'twitter')
      if (twitterIdentity) {
        setIsTwitterLogin(true)
        setTwitterUsername(user.user_metadata?.user_name || user.user_metadata?.name || null)
      }

      loadSettings(user.id)

      // パスキーの可用性をチェック
      setPasskeyAvailable(isPasskeyAvailable())

      // パスキーリストを読み込み
      loadPasskeys(user.id)
    }
    checkUser()
  }, [router])

  const loadSettings = async (uid: string) => {
    setLoading(true)
    const settings = await getUserSettings(uid, supabase)
    if (settings) {
      setNickname(settings.nickname || '')
      setAvatarUrl(settings.avatar_url || null)
      setAvatarProvider(settings.avatar_provider || null)
      setAvatarStoragePath(settings.avatar_storage_path || null)
      const apiKey = settings.gemini_api_key || ''
      setGeminiApiKey(apiKey)
      initialApiKey.current = apiKey // 初期値を保存
      setAiSummaryEnabled(settings.ai_summary_enabled ?? true)
      setAutoAiSummary(settings.auto_ai_summary ?? true)
      setCustomPrompt(settings.custom_prompt || '')
      setSummaryLength(settings.summary_length || 'medium')

      // 無料枠の使用状況を取得
      if (!settings.gemini_api_key || settings.gemini_api_key.trim() === '') {
        const { data: usageData } = await supabase
          .from('user_settings')
          .select('daily_usage_count, last_usage_date')
          .eq('user_id', uid)
          .single()

        if (usageData) {
          // 今日の日付と比較して、リセットが必要かチェック
          const today = new Date().toISOString().split('T')[0]
          const lastUsageDate = usageData.last_usage_date

          if (lastUsageDate && lastUsageDate === today) {
            setFreeTierUsage(usageData.daily_usage_count || 0)
          } else {
            // 日付が違う場合は0にリセット
            setFreeTierUsage(0)
          }
        }
      }
    }
    setLoading(false)
    // 初回ロード完了をマーク
    setTimeout(() => {
      isInitialLoad.current = false
    }, 100)
  }

  const loadPasskeys = async (uid: string) => {
    const userPasskeys = await getUserPasskeys(uid, supabase)
    setPasskeys(userPasskeys)
  }

  const refreshUsage = async () => {
    if (!userId) return
    setLoadingUsage(true)

    try {
      const { data: usageData } = await supabase
        .from('user_settings')
        .select('daily_usage_count, last_usage_date')
        .eq('user_id', userId)
        .single()

      if (usageData) {
        // 今日の日付と比較して、リセットが必要かチェック
        const today = new Date().toISOString().split('T')[0]
        const lastUsageDate = usageData.last_usage_date

        if (lastUsageDate && lastUsageDate === today) {
          setFreeTierUsage(usageData.daily_usage_count || 0)
        } else {
          // 日付が違う場合は0にリセット
          setFreeTierUsage(0)
        }
      }
    } catch (error) {
      console.error('Failed to refresh usage:', error)
    } finally {
      setLoadingUsage(false)
    }
  }

  const handleRegisterPasskey = async () => {
    if (!userId || !userEmail) return

    setPasskeyLoading(true)
    setPasskeyMessage('')

    const result = await registerPasskey(
      { email: userEmail, userId },
      'このデバイス',
      supabase
    )

    if (result.success) {
      setPasskeyMessage('パスキーを登録しました')
      await loadPasskeys(userId)
    } else {
      setPasskeyMessage(result.error || 'パスキーの登録に失敗しました')
    }

    setTimeout(() => setPasskeyMessage(''), 3000)
    setPasskeyLoading(false)
  }

  const handleDeletePasskey = async (passkeyId: string) => {
    if (!confirm('このパスキーを削除しますか？')) return

    setPasskeyLoading(true)
    const result = await deletePasskey(passkeyId, supabase)

    if (result.success) {
      setPasskeyMessage('パスキーを削除しました')
      if (userId) await loadPasskeys(userId)
    } else {
      setPasskeyMessage(result.error || 'パスキーの削除に失敗しました')
    }

    setTimeout(() => setPasskeyMessage(''), 3000)
    setPasskeyLoading(false)
  }

  const handleUpdatePasskeyName = async (passkeyId: string, newName: string) => {
    if (!newName.trim()) return

    const result = await updatePasskeyName(passkeyId, newName.trim(), supabase)

    if (result.success) {
      if (userId) await loadPasskeys(userId)
      setEditingPasskeyId(null)
      setEditingPasskeyName('')
    } else {
      setPasskeyMessage(result.error || 'パスキー名の更新に失敗しました')
      setTimeout(() => setPasskeyMessage(''), 3000)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未使用'
    const date = new Date(dateString)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 自動保存関数
  const autoSave = useCallback(async (settings: any) => {
    if (!userId) return

    setAutoSaving(true)
    try {
      const success = await upsertUserSettings(supabase, userId, settings)
      if (success) {
        const now = new Date()
        setLastSaved(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}に保存`)
      }
    } catch (error) {
      console.error('Auto-save error:', error)
    } finally {
      setAutoSaving(false)
    }
  }, [userId])

  // debounce付き自動保存（テキスト入力用）
  const debouncedAutoSave = useCallback((settings: any) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      autoSave(settings)
    }, 1000)
  }, [autoSave])

  // 各設定項目の変更を監視して自動保存
  useEffect(() => {
    if (!userId || loading) return
    debouncedAutoSave({ nickname })
  }, [nickname, userId, loading, debouncedAutoSave])

  // `sidebarVisible` は常にONになるため、設定項目から削除

  useEffect(() => {
    if (!userId || loading) return
    autoSave({ summary_length: summaryLength })
  }, [summaryLength, userId, loading, autoSave])

  useEffect(() => {
    if (!userId || loading) return
    autoSave({ ai_summary_enabled: aiSummaryEnabled })
  }, [aiSummaryEnabled, userId, loading, autoSave])

  useEffect(() => {
    if (!userId || loading) return
    autoSave({ auto_ai_summary: autoAiSummary })
  }, [autoAiSummary, userId, loading, autoSave])

  useEffect(() => {
    if (!userId || loading || isInitialLoad.current) return
    if (geminiApiKey === initialApiKey.current) return

    setApiKeySaveStatus('saving')

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const success = await upsertUserSettings(supabase, userId, { gemini_api_key: geminiApiKey })

        if (success) {
          setApiKeySaveStatus('saved')
          initialApiKey.current = geminiApiKey
          const now = new Date()
          setLastSaved(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}に保存`)

          setTimeout(() => setApiKeySaveStatus(''), 3000)
        } else {
          setApiKeySaveStatus('error')
        }
      } catch (error) {
        console.error('API key save error:', error)
        setApiKeySaveStatus('error')
      }
    }, 1000)
  }, [geminiApiKey, userId, loading])

  useEffect(() => {
    if (!userId || loading) return
    const finalCustomPrompt = isFreeTier ? null : (customPrompt.trim() || null)
    debouncedAutoSave({ custom_prompt: finalCustomPrompt })
  }, [customPrompt, userId, loading, isFreeTier, debouncedAutoSave])

  const handleUpdateNickname = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setNicknameSaving(true)
    setNicknameMessage('')
    const success = await upsertUserSettings(supabase, userId, { nickname })
    if (success) {
      setNicknameMessage('ニックネームを更新しました')
    } else {
      setNicknameMessage('更新に失敗しました')
    }
    setTimeout(() => setNicknameMessage(''), 3000)
    setNicknameSaving(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage('')

    if (newPassword.length < 6) {
      setPasswordMessage('パスワードは6文字以上で入力してください。')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('新しいパスワードが一致しません。')
      return
    }

    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMessage(`エラー: ${error.message}`)
    } else {
      setPasswordMessage('パスワードを更新しました。')
      setNewPassword('')
      setConfirmPassword('')
    }
    setTimeout(() => setPasswordMessage(''), 3000)
    setPasswordSaving(false)
  }

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setAvatarUploading(true)
    setAvatarMessage('')

    const result = await uploadAvatarFile(supabase, userId, file)

    if (result.success) {
      const success = await upsertUserSettings(supabase, userId, {
        avatar_url: result.avatarUrl,
        avatar_provider: 'manual',
        avatar_storage_path: result.storagePath,
      })

      if (success) {
        setAvatarUrl(result.avatarUrl || null)
        setAvatarProvider('manual')
        setAvatarStoragePath(result.storagePath || null)
        setAvatarMessage('アバターを更新しました')
      } else {
        setAvatarMessage('アバターの保存に失敗しました')
      }
    } else {
      setAvatarMessage(result.error || 'アバターのアップロードに失敗しました')
    }

    setTimeout(() => setAvatarMessage(''), 3000)
    setAvatarUploading(false)
  }

  // Avatar delete handler
  const handleAvatarDelete = async () => {
    if (!userId || !avatarStoragePath) return
    if (!confirm('アバターを削除しますか？')) return

    setAvatarUploading(true)
    setAvatarMessage('')

    const deleted = await deleteAvatar(supabase, avatarStoragePath)

    if (deleted) {
      const success = await upsertUserSettings(supabase, userId, {
        avatar_url: null,
        avatar_provider: null,
        avatar_storage_path: null,
      })

      if (success) {
        setAvatarUrl(null)
        setAvatarProvider(null)
        setAvatarStoragePath(null)
        setAvatarMessage('アバターを削除しました')
      }
    } else {
      setAvatarMessage('アバターの削除に失敗しました')
    }

    setTimeout(() => setAvatarMessage(''), 3000)
    setAvatarUploading(false)
  }

  // Account delete handler
  const handleDeleteAccount = async () => {
    if (!userId) return
    if (deleteConfirmText !== '削除') {
      return
    }

    setIsDeleting(true)

    try {
      // セッションを確実に最新の状態にするためにユーザー情報を再取得
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('ユーザー情報の取得に失敗しました。再ログインしてください。')
      }

      const { data: { session } } = await supabase.auth.getSession()

      // アカウント削除APIを呼び出す
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        },
      })

      if (response.ok) {
        // ログアウトしてログインページにリダイレクト
        await supabase.auth.signOut()
        router.push('/login?deleted=true')
      } else {
        const data = await response.json()
        console.error('削除エラー詳細:', data)

        // 認証エラーの場合は再ログインを促す
        if (response.status === 401) {
          if (confirm('セッションが切れています。一度ログアウトして再ログインしてから、もう一度お試しください。\n\nログアウトしますか？')) {
            await supabase.auth.signOut()
            router.push('/login')
          }
        } else {
          alert(`アカウント削除に失敗しました: ${data.error || '不明なエラー'}\n\n詳細: ${data.details || 'なし'}`)
        }
      }
    } catch (error) {
      console.error('Account deletion error:', error)
      alert('アカウント削除中にエラーが発生しました')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setDeleteConfirmText('')
    }
  }

  // `handleDisplaySave`, `displaySaving`, `displayMessage` はサイドバー設定削除に伴い不要

  const handleApiKeysSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setApiKeysSaving(true)
    setApiKeysMessage('')

    try {
      console.log('Settings: Starting API key save')

      // 無料枠の場合はカスタムプロンプトを強制的にnullにする
      const finalCustomPrompt = isFreeTier ? null : (customPrompt.trim() || null)

      console.log('Settings: Calling upsertUserSettings with data:', {
        gemini_api_key: geminiApiKey ? '***' : null,
        ai_summary_enabled: aiSummaryEnabled,
        auto_ai_summary: autoAiSummary,
        custom_prompt: finalCustomPrompt ? '***' : null,
        summary_length: summaryLength,
      })

      const success = await upsertUserSettings(supabase, userId, {
        gemini_api_key: geminiApiKey,
        ai_summary_enabled: aiSummaryEnabled,
        auto_ai_summary: autoAiSummary,
        custom_prompt: finalCustomPrompt,
        summary_length: summaryLength,
      })

      console.log('Settings: upsertUserSettings result:', success)

      if (success) {
        setApiKeysMessage('AI設定を保存しました')
        // 無料枠の場合、保存後にカスタムプロンプトをクリア
        if (isFreeTier && customPrompt) {
          setCustomPrompt('')
        }
      } else {
        console.error('Settings: Save failed - upsertUserSettings returned false')
        setApiKeysMessage('保存に失敗しました')
      }
    } catch (error) {
      console.error('Settings: Exception during API key save:', error)
      setApiKeysMessage('保存中にエラーが発生しました: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setTimeout(() => setApiKeysMessage(''), 3000)
      setApiKeysSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.push('/')} className="mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
        <div className="mb-8">
          <h1 className="text-2xl font-bold">設定</h1>
          {lastSaved && (
            <p className="text-sm text-gray-500 mt-2">
              {autoSaving ? '保存中...' : lastSaved}
            </p>
          )}
        </div>

        <div className="space-y-12">
          {/* Nickname and Avatar Section */}
          <div className="space-y-6 pb-8 border-b">
            <h2 className="text-lg font-semibold">プロフィール</h2>
            <div className="space-y-2">
              <Label htmlFor="nickname">ニックネーム</Label>
              <Input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="表示名"
              />
              <p className="text-xs text-gray-500">変更は自動的に保存されます</p>
            </div>

            {/* Avatar Section */}
            <div className="space-y-4">
              <Label>プロフィール画像</Label>
              <div className="flex items-center gap-4">
                <Avatar src={avatarUrl} nickname={nickname} size="xl" />
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      size="sm"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {avatarUploading ? 'アップロード中...' : '画像を選択'}
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleAvatarDelete}
                        disabled={avatarUploading}
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        削除
                      </Button>
                    )}
                  </div>
                  {avatarProvider === 'twitter' && (
                    <p className="text-xs text-gray-500">
                      Twitterから取得したプロフィール画像です
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    推奨: 正方形の画像、2MB以下
                  </p>
                </div>
              </div>
              {avatarMessage && (
                <p className={`text-sm ${avatarMessage.includes('失敗') ? 'text-red-600' : 'text-green-600'}`}>
                  {avatarMessage}
                </p>
              )}
            </div>
          </div>

          {/* Password Form */}
          <form onSubmit={handleUpdatePassword} className="space-y-6 pb-8 border-b">
            <h2 className="text-lg font-semibold">パスワード変更</h2>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新しいパスワード</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6文字以上"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="もう一度入力"
              />
            </div>
            {passwordMessage && <p className={`text-sm ${passwordMessage.includes('エラー') ? 'text-red-600' : 'text-green-600'}`}>{passwordMessage}</p>}
            <Button type="submit" disabled={passwordSaving}>
              {passwordSaving ? '更新中...' : 'パスワードを更新'}
            </Button>
          </form>



          {/* AI Settings */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">AI設定</h2>

            {isFreeTier && (
              <div className={`${freeTierUsage >= freeTierLimit ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
                <div className="flex items-start justify-between gap-4">
                  <p className={`text-sm ${freeTierUsage >= freeTierLimit ? 'text-red-800' : 'text-orange-800'} flex-1`}>
                    <strong>🎁 無料枠を利用中</strong>（1日{freeTierLimit}回まで）<br />
                    {freeTierUsage >= freeTierLimit ? (
                      <>
                        <span className="font-bold text-red-900">本日の無料枠を使い切りました。</span><br />
                        独自のGemini APIキーを設定すると、今すぐ無制限でご利用いただけます。
                      </>
                    ) : (
                      <>
                        本日の使用回数: <strong>{freeTierUsage}/{freeTierLimit}回</strong><br />
                        独自のGemini APIキーを設定すると、無制限でご利用いただけます。
                      </>
                    )}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshUsage}
                    disabled={loadingUsage}
                    className="flex-shrink-0"
                  >
                    {loadingUsage ? '更新中...' : '更新'}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="geminiApiKey">Gemini APIキー</Label>
              <Input
                id="geminiApiKey"
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
              />
              <p className="text-xs text-gray-500">
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a> から取得
              </p>
              {geminiApiKey && apiKeySaveStatus === 'saving' && (
                <p className="text-xs text-blue-600">
                  💾 保存中...
                </p>
              )}
              {geminiApiKey && apiKeySaveStatus === 'saved' && (
                <p className="text-xs text-green-600">
                  ✓ APIキーを保存しました
                </p>
              )}
              {apiKeySaveStatus === 'error' && (
                <p className="text-xs text-red-600">
                  ✗ 保存に失敗しました
                </p>
              )}
              {geminiApiKey && !apiKeySaveStatus && (
                <p className="text-xs text-gray-600">
                  ✓ APIキーが設定されています
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="aiSummaryEnabled"
                checked={aiSummaryEnabled}
                onCheckedChange={setAiSummaryEnabled}
              />
              <Label htmlFor="aiSummaryEnabled" className="cursor-pointer">
                AI要約機能を有効にする
              </Label>
            </div>
            <p className="text-xs text-gray-500">
              OFFにすると、URLや画像を追加する際にAIによる自動要約を行わず、基本情報のみを保存します。
            </p>
            <div className="flex items-center space-x-2">
              <Switch
                id="autoAiSummary"
                checked={autoAiSummary}
                onCheckedChange={setAutoAiSummary}
                disabled={!aiSummaryEnabled}
              />
              <Label htmlFor="autoAiSummary" className="cursor-pointer">
                URL入力時に自動でAI要約を開始
              </Label>
            </div>
            <p className="text-xs text-gray-500">
              ONにすると、URLを入力した瞬間に自動的にAI要約を開始します。OFFの場合は、ボタンをクリックして手動で開始します。
            </p>
            <div className="space-y-2">
              <Label htmlFor="summaryLength">要約の文字数</Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="summaryLength"
                    value="short"
                    checked={summaryLength === 'short'}
                    onChange={(e) => setSummaryLength(e.target.value as 'short' | 'medium' | 'long')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">短い</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="summaryLength"
                    value="medium"
                    checked={summaryLength === 'medium'}
                    onChange={(e) => setSummaryLength(e.target.value as 'short' | 'medium' | 'long')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">普通</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="summaryLength"
                    value="long"
                    checked={summaryLength === 'long'}
                    onChange={(e) => setSummaryLength(e.target.value as 'short' | 'medium' | 'long')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">詳しい</span>
                </label>
              </div>
              <p className="text-xs text-gray-500">
                AI要約の文字数を調整できます。短い=簡潔、普通=バランス、詳しい=詳細な要約
              </p>
            </div>
            {!isFreeTier && (
              <div className="space-y-2">
                <Label htmlFor="customPrompt">カスタムプロンプト（任意）</Label>
                <Textarea
                  id="customPrompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="AIに特定の指示を与える場合はここに入力してください。空欄の場合はデフォルトプロンプトを使用します。"
                  className="min-h-[150px] text-sm"
                />
                <p className="text-xs text-gray-500">
                  例: 「レシピの場合は材料を箇条書きで、作り方を番号付きリストで抽出してください」「要約は常に「結論」「理由」「具体例」の構成にしてください」
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowDefaultPrompts(!showDefaultPrompts)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showDefaultPrompts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    デフォルトプロンプトを確認
                  </button>
                  {showDefaultPrompts && (
                    <div className="mt-3 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">テキスト/ウェブページ用プロンプト</h4>
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">{systemPrompt}</pre>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2">画像用プロンプト</h4>
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">{imageSystemPrompt}</pre>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2">動画用プロンプト（YouTube Shorts）</h4>
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">{videoSystemPrompt}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500">変更は自動的に保存されます（テキスト入力は1秒後）</p>
          </div>
        </div>

        {/* お問い合わせ */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-12 mb-8">
          <h2 className="text-lg font-semibold mb-4">お問い合わせ</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              ご質問やご要望がありましたら、Twitterでお気軽にお声がけください。
            </p>
            <a
              href="https://x.com/shiro3504"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @shiro3504
            </a>
          </div>
        </div>

        {/* アカウント情報 */}
        {isTwitterLogin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-12">
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <h3 className="text-sm font-semibold text-blue-900">Twitter連携中</h3>
            </div>
            {twitterUsername && (
              <p className="text-sm text-blue-800">
                @{twitterUsername} でログイン中です
              </p>
            )}
          </div>
        )}

        {/* ログアウト */}
        <div className="mt-8 mb-8 pb-8 border-t pt-8 space-y-4">
          <Button
            variant="destructive"
            onClick={async () => {
              if (confirm('ログアウトしますか？')) {
                await supabase.auth.signOut()
                router.push('/login')
              }
            }}
            className="w-full"
          >
            ログアウト
          </Button>

          {/* アカウント削除ボタン */}
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            アカウントを削除
          </Button>
        </div>

        {/* アカウント削除確認ダイアログ */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                アカウント削除の確認
              </DialogTitle>
              <DialogDescription className="space-y-3 pt-4">
                <p className="font-semibold text-gray-900">
                  この操作は取り消すことができません。
                </p>
                <p className="text-sm text-gray-700">
                  アカウントを削除すると、以下のデータが完全に削除されます：
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
                  <li>すべてのメモとレシピ</li>
                  <li>すべてのページとカテゴリ</li>
                  <li>ユーザー設定とプロフィール情報</li>
                  <li>パスキー情報</li>
                </ul>
                <p className="text-sm text-gray-700 pt-2">
                  削除を実行するには、下のボックスに「<span className="font-semibold">削除</span>」と入力してください。
                </p>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="削除"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="text-center font-semibold"
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setDeleteConfirmText('')
                }}
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== '削除' || isDeleting}
                className="w-full sm:w-auto"
              >
                {isDeleting ? '削除中...' : 'アカウントを削除'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}