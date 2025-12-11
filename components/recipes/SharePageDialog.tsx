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
} from "@/components/ui/dialog"
import { Copy, Check } from 'lucide-react'

interface SharePageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pageId: string | null
  pageName: string
}

export function SharePageDialog({ open, onOpenChange, pageId, pageName }: SharePageDialogProps) {
  const [isPublic, setIsPublic] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [justCopied, setJustCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [publicShareId, setPublicShareId] = useState<string | null>(null)

  useEffect(() => {
    const fetchPageSettings = async () => {
      if (!pageId) {
        setError('ページが選択されていません。')
        return
      }

      const { data: page, error: pageError } = await supabase
        .from('pages')
        .select('is_public, public_share_id')
        .eq('id', pageId)
        .single()

      if (pageError) {
        console.error('Failed to fetch page settings:', pageError)
        setError('共有設定の取得に失敗しました。')
        return
      }

      if (page) {
        setIsPublic(page.is_public || false)
        setPublicShareId(page.public_share_id)
        if (page.is_public && page.public_share_id) {
          setShareUrl(`${window.location.origin}/share/${page.public_share_id}`)
        } else {
          setShareUrl('')
        }
      } else {
        setIsPublic(false)
        setPublicShareId(null)
        setShareUrl('')
      }
    }

    if (open && pageId) {
      fetchPageSettings()
    }
  }, [open, pageId])

  const handleTogglePublic = async (checked: boolean) => {
    if (!pageId) {
      setError('ページが選択されていません。')
      return
    }
    setError(null)

    let currentPublicShareId = publicShareId
    if (checked && !currentPublicShareId) {
      // public_share_id がない場合は新しく生成
      const { data, error: uuidError } = await supabase.rpc('generate_uuid')
      if (uuidError) {
        console.error('Failed to generate UUID:', uuidError)
        setError('共有IDの生成に失敗しました。')
        return
      }
      currentPublicShareId = data
      setPublicShareId(currentPublicShareId)
    }

    const { error: dbError } = await supabase
      .from('pages')
      .update({
        is_public: checked,
        public_share_id: currentPublicShareId,
      })
      .eq('id', pageId)

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
          <DialogTitle>「{pageName}」ページを共有</DialogTitle>
          <DialogDescription>
            この設定をオンにすると、このページのすべてのメモが公開URLを通じて閲覧可能になります。ただし、メモの内容を編集できるのはあなただけです。
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
            <Label htmlFor="public-switch">URLを知っている全員にこのページを公開する</Label>
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
