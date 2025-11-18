'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Copy, Check } from 'lucide-react'

interface ShareAllDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareAllDialog({ open, onOpenChange }: ShareAllDialogProps) {
  const [isPublic, setIsPublic] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [justCopied, setJustCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userPublicShareId, setUserPublicShareId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('ユーザーが認証されていません。')
        return
      }
      setUserId(user.id)

      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('are_recipes_public, public_share_id')
        .eq('user_id', user.id)
        .single()

      if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Failed to fetch user settings:', settingsError)
        setError('共有設定の取得に失敗しました。')
        return
      }

      if (settings) {
        setIsPublic(settings.are_recipes_public || false)
        setUserPublicShareId(settings.public_share_id)
        if (settings.are_recipes_public && settings.public_share_id) {
          setShareUrl(`${window.location.origin}/share/${settings.public_share_id}`)
        } else {
          setShareUrl('')
        }
      } else {
        setIsPublic(false)
        setUserPublicShareId(null)
        setShareUrl('')
      }
    }

    if (open) {
      fetchUserSettings()
    }
  }, [open])

  const handleTogglePublic = async (checked: boolean) => {
    if (!userId) {
      setError('ユーザーが認証されていません。')
      return
    }
    setError(null)

    let currentPublicShareId = userPublicShareId
    if (checked && !currentPublicShareId) {
      // public_share_id がない場合は新しく生成
      const { data, error: uuidError } = await supabase.rpc('generate_uuid')
      if (uuidError) {
        console.error('Failed to generate UUID:', uuidError)
        setError('共有IDの生成に失敗しました。')
        return
      }
      currentPublicShareId = data
      setUserPublicShareId(currentPublicShareId)
    }

    const { error: dbError } = await supabase
      .from('user_settings')
      .upsert(
        { 
          user_id: userId,
          are_recipes_public: checked,
          public_share_id: currentPublicShareId,
        },
        { onConflict: 'user_id' }
      )

    if (dbError) {
      console.error('Failed to update sharing settings:', dbError)
      setError('共有設定の更新に失敗しました。')
      return
    }

    setIsPublic(checked)
    if (checked && currentPublicShareId) {
      setShareUrl(`${window.location.origin}/share/${currentPublicShareId}`)
    } else {
      setShareUrl('')
    }
  }

  const handleCopyToClipboard = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setJustCopied(true)
    setTimeout(() => setJustCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>すべてのメモを共有</DialogTitle>
          <DialogDescription>
            この設定をオンにすると、あなたのすべてのメモが公開URLを通じてアクセス可能になります。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex items-center space-x-2">
            <Switch
              id="public-switch"
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
            />
            <Label htmlFor="public-switch">URLを知っている全員にすべてのメモを公開する</Label>
          </div>
          {isPublic && shareUrl && (
            <div className="space-y-2">
              <Label htmlFor="share-url">共有URL</Label>
              <div className="flex items-center space-x-2">
                <Input id="share-url" value={shareUrl} readOnly />
                <Button size="icon" variant="outline" onClick={handleCopyToClipboard}>
                  {justCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}