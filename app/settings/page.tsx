'use client'

import { useEffect, useState } from 'react'
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
  const [apiKeysSaving, setApiKeysSaving] = useState(false)
  const [apiKeysMessage, setApiKeysMessage] = useState('')

  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [displaySaving, setDisplaySaving] = useState(false)
  const [displayMessage, setDisplayMessage] = useState('')

  const [showDefaultPrompts, setShowDefaultPrompts] = useState(false)

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
      setSidebarVisible(settings.sidebar_visible ?? false)
    }
    setLoading(false)
  }

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

    const success = await upsertUserSettings(userId, {
      gemini_api_key: geminiApiKey,
      ai_summary_enabled: aiSummaryEnabled,
      custom_prompt: customPrompt.trim() || null,
    })
    if (success) {
      setApiKeysMessage('AI設定を保存しました')
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
        <h1 className="text-2xl font-bold mb-8">設定</h1>

        <div className="space-y-12">
          {/* Nickname Form */}
          <form onSubmit={handleUpdateNickname} className="space-y-6 pb-8 border-b">
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
            </div>
            {nicknameMessage && <p className="text-sm text-green-600">{nicknameMessage}</p>}
            <Button type="submit" disabled={nicknameSaving}>
              {nicknameSaving ? '保存中...' : 'ニックネームを保存'}
            </Button>
          </form>

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

          {/* Display Settings Form */}
          <form onSubmit={handleDisplaySave} className="space-y-6 pb-8 border-b">
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
            {displayMessage && <p className="text-sm text-green-600">{displayMessage}</p>}
            <Button type="submit" disabled={displaySaving}>
              {displaySaving ? '保存中...' : '表示設定を保存'}
            </Button>
          </form>

          {/* API Keys Form */}
          <form onSubmit={handleApiKeysSave} className="space-y-6">
            <h2 className="text-lg font-semibold">AI設定</h2>

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
              <Label htmlFor="customPrompt">カスタムプロンプト（任意）</Label>
              <Textarea
                id="customPrompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="AIに特定の指示を与える場合はここに入力してください。空欄の場合はデフォルトプロンプトを使用します。"
                className="min-h-[150px] text-sm"
              />
              <p className="text-xs text-gray-500">
                例: 「レシピの場合は材料を箇条書きで、作り方を番号付きリストで抽出してください」
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
            {apiKeysMessage && <p className="text-sm text-green-600">{apiKeysMessage}</p>}
            <Button type="submit" disabled={apiKeysSaving}>
              {apiKeysSaving ? '保存中...' : 'AI設定を保存'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}