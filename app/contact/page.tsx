'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

export default function ContactPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user?.email) {
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
        }))
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          user_id: user?.id || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'お問い合わせの送信に失敗しました')
      }

      setMessage('お問い合わせを送信しました。ご連絡ありがとうございます。')
      setMessageType('success')
      setFormData({
        name: '',
        email: user?.email || '',
        subject: '',
        message: '',
      })
    } catch (error) {
      console.error('Contact form error:', error)
      setMessage(error instanceof Error ? error.message : 'エラーが発生しました')
      setMessageType('error')
    } finally {
      setSubmitting(false)
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
        <Button variant="ghost" onClick={() => router.back()} className="mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">お問い合わせ</h1>
          <p className="text-gray-600">
            バグ報告、パスワードの再設定、その他のお問い合わせはこちらからお送りください。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">お名前（任意）</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="山田 太郎"
              className="text-base h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@example.com"
              required
              className="text-base h-11"
            />
            <p className="text-xs text-gray-500">
              返信が必要な場合は、正確なメールアドレスを入力してください
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">件名</Label>
            <select
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              className="w-full h-11 px-3 rounded-md border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">選択してください</option>
              <option value="bug">バグ報告</option>
              <option value="password">パスワードの再設定</option>
              <option value="feature">機能要望</option>
              <option value="account">アカウント関連</option>
              <option value="other">その他</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">お問い合わせ内容</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="お問い合わせ内容をできるだけ詳しくご記入ください"
              required
              className="min-h-[200px] text-base"
            />
            <p className="text-xs text-gray-500">
              バグ報告の場合は、再現手順や発生時の状況を詳しくお書きください
            </p>
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                messageType === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message}
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-11"
          >
            {submitting ? '送信中...' : '送信する'}
          </Button>
        </form>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="font-semibold mb-2">よくある質問</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>
              <strong>パスワードを忘れた場合:</strong> 上記フォームの件名で「パスワードの再設定」を選択し、登録時のメールアドレスをお知らせください。
            </li>
            <li>
              <strong>バグを見つけた場合:</strong> 再現手順、発生時刻、使用ブラウザなどの情報を添えてご報告ください。
            </li>
            <li>
              <strong>返信について:</strong> 通常1-3営業日以内に返信いたします。
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
