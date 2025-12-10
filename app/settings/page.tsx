'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserSettings, upsertUserSettings } from '@/lib/user-settings'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { systemPrompt, imageSystemPrompt, videoSystemPrompt } from '@/lib/ai'
export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // State for each form
  const [nickname, setNickname] = useState('')
  const [nicknameSaving, setNicknameSaving] = useState(false)
  const [nicknameMessage, setNicknameMessage] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')

  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [aiSummaryEnabled, setAiSummaryEnabled] = useState(true)
  const [customPrompt, setCustomPrompt] = useState('')
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [apiKeysSaving, setApiKeysSaving] = useState(false)
  const [apiKeysMessage, setApiKeysMessage] = useState('')

  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [fontFamily, setFontFamily] = useState<'system' | 'serif' | 'mono'>('system')
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [displaySaving, setDisplaySaving] = useState(false)
  const [displayMessage, setDisplayMessage] = useState('')

  const [showDefaultPrompts, setShowDefaultPrompts] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string>('')

  // 無料枠かどうかの判定（APIキーが設定されていない場合は無料枠）
  const isFreeTier = !geminiApiKey || geminiApiKey.trim() === ''

  // debounce用のタイマー
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      loadSettings(user.id)
    }
    checkUser()
  }, [router])

  const loadSettings = async (uid: string) => {
    setLoading(true)
    const settings = await getUserSettings(uid)
    if (settings) {
      setNickname(settings.nickname || '')
      setGeminiApiKey(settings.gemini_api_key || '')
      setAiSummaryEnabled(settings.ai_summary_enabled ?? true)
      setCustomPrompt(settings.custom_prompt || '')
      setSummaryLength(settings.summary_length || 'medium')
      setSidebarVisible(settings.sidebar_visible ?? false)
      setFontFamily(settings.font_family || 'system')
      setFontSize(settings.font_size || 'medium')
    }
    setLoading(false)
  }

  // 自動保存関数
  const autoSave = useCallback(async (settings: any) => {
    if (!userId) return

    setAutoSaving(true)
    try {
      const success = await upsertUserSettings(userId, settings)
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

  useEffect(() => {
    if (!userId || loading) return
    autoSave({ sidebar_visible: sidebarVisible })
  }, [sidebarVisible, userId, loading, autoSave])

  useEffect(() => {
    if (!userId || loading) return
    autoSave({ font_family: fontFamily })
  }, [fontFamily, userId, loading, autoSave])

  useEffect(() => {
    if (!userId || loading) return
    autoSave({ font_size: fontSize })
  }, [fontSize, userId, loading, autoSave])

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
    debouncedAutoSave({ gemini_api_key: geminiApiKey })
  }, [geminiApiKey, userId, loading, debouncedAutoSave])

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
    const success = await upsertUserSettings(userId, { nickname })
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

  const handleDisplaySave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setDisplaySaving(true)
    setDisplayMessage('')
    const success = await upsertUserSettings(userId, {
      sidebar_visible: sidebarVisible,
      font_family: fontFamily,
      font_size: fontSize,
    })
    if (success) {
      setDisplayMessage('表示設定を保存しました')
    } else {
      setDisplayMessage('保存に失敗しました')
    }
    setTimeout(() => setDisplayMessage(''), 3000)
    setDisplaySaving(false)
  }

  const handleApiKeysSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setApiKeysSaving(true)
    setApiKeysMessage('')

    // 無料枠の場合はカスタムプロンプトを強制的にnullにする
    const finalCustomPrompt = isFreeTier ? null : (customPrompt.trim() || null)

    const success = await upsertUserSettings(userId, {
      gemini_api_key: geminiApiKey,
      ai_summary_enabled: aiSummaryEnabled,
      custom_prompt: finalCustomPrompt,
      summary_length: summaryLength,
    })
    if (success) {
      setApiKeysMessage('AI設定を保存しました')
      // 無料枠の場合、保存後にカスタムプロンプトをクリア
      if (isFreeTier && customPrompt) {
        setCustomPrompt('')
      }
    } else {
      setApiKeysMessage('保存に失敗しました')
    }
    setTimeout(() => setApiKeysMessage(''), 3000)
    setApiKeysSaving(false)
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
          {/* Nickname Section */}
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

          {/* Display Settings */}
          <div className="space-y-6 pb-8 border-b">
            <h2 className="text-lg font-semibold">表示設定</h2>
            <div className="flex items-center space-x-2">
              <Switch
                id="sidebarVisible"
                checked={sidebarVisible}
                onCheckedChange={setSidebarVisible}
              />
              <Label htmlFor="sidebarVisible" className="cursor-pointer">
                目次サイドバーを表示する
              </Label>
            </div>
            <p className="text-xs text-gray-500">
              ONにすると、メモページに目次サイドバーが表示されます。OFFにすると、サイドバー機能が完全に非表示になります。
            </p>

            <div className="space-y-2">
              <Label htmlFor="fontFamily">フォント</Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fontFamily"
                    value="system"
                    checked={fontFamily === 'system'}
                    onChange={(e) => setFontFamily(e.target.value as 'system' | 'serif' | 'mono')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">システム</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fontFamily"
                    value="serif"
                    checked={fontFamily === 'serif'}
                    onChange={(e) => setFontFamily(e.target.value as 'system' | 'serif' | 'mono')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-serif">明朝体</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fontFamily"
                    value="mono"
                    checked={fontFamily === 'mono'}
                    onChange={(e) => setFontFamily(e.target.value as 'system' | 'serif' | 'mono')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-mono">等幅</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontSize">文字サイズ</Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fontSize"
                    value="small"
                    checked={fontSize === 'small'}
                    onChange={(e) => setFontSize(e.target.value as 'small' | 'medium' | 'large')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">小</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fontSize"
                    value="medium"
                    checked={fontSize === 'medium'}
                    onChange={(e) => setFontSize(e.target.value as 'small' | 'medium' | 'large')}
                    className="w-4 h-4"
                  />
                  <span className="text-base">中</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fontSize"
                    value="large"
                    checked={fontSize === 'large'}
                    onChange={(e) => setFontSize(e.target.value as 'small' | 'medium' | 'large')}
                    className="w-4 h-4"
                  />
                  <span className="text-lg">大</span>
                </label>
              </div>
            </div>
            <p className="text-xs text-gray-500">変更は自動的に保存されます</p>
          </div>

          {/* AI Settings */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">AI設定</h2>

            {isFreeTier && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>🎁 無料枠を利用中</strong>（1日10回まで）<br />
                  独自のGemini APIキーを設定すると、無制限でご利用いただけます。
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="geminiApiKey">Gemini APIキー</Label>
              <Input id="geminiApiKey" type="password" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} placeholder="AIzaSy..." />
              <p className="text-xs text-gray-500">
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a> から取得
              </p>
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
            <div className="space-y-2">
              <Label htmlFor="customPrompt">カスタムプロンプト（任意）</Label>
              <Textarea
                id="customPrompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="AIに特定の指示を与える場合はここに入力してください。空欄の場合はデフォルトプロンプトを使用します。"
                className="min-h-[150px] text-sm"
                disabled={isFreeTier}
              />
              {isFreeTier ? (
                <p className="text-xs text-orange-600 font-semibold">
                  ⚠️ カスタムプロンプトは無料枠では使用できません。独自のGemini APIキーを設定すると利用可能になります。
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  例: 「レシピの場合は材料を箇条書きで、作り方を番号付きリストで抽出してください」
                </p>
              )}
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
            <p className="text-xs text-gray-500">変更は自動的に保存されます（テキスト入力は1秒後）</p>
          </div>
        </div>
      </div>
    </div>
  )
}