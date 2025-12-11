'use client'

import { useState, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
// Upload icon import removed as it's no longer used

interface AddRecipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // onAddFromFile removed
  onAddBasic: (e: React.FormEvent, title: string, content: string) => Promise<void>
  onAddMultipleUrls: (e: React.FormEvent, urls: string[], useAI: boolean) => Promise<void>
  isScraping: boolean
  scrapeError: string
  // isUploading removed
  // uploadError removed
  // uploadSuccess removed
  isBulkProcessing?: boolean
  bulkProgress?: { current: number; total: number }
  bulkError?: string
  autoAiSummary?: boolean
}

export function AddRecipeDialog({
  open,
  onOpenChange,
  // onAddFromFile removed
  onAddBasic,
  onAddMultipleUrls,
  isScraping,
  scrapeError,
  // isUploading removed
  // uploadError removed
  // uploadSuccess removed
  isBulkProcessing = false,
  bulkProgress,
  bulkError,
  autoAiSummary = true,
}: AddRecipeDialogProps) {
  const [urlInputText, setUrlInputText] = useState('') // Renamed from recipeUrl
  // const [selectedFile, setSelectedFile] = useState<File | null>(null) // Removed
  const [useAI, setUseAI] = useState(true)
  const [basicTitle, setBasicTitle] = useState('')
  const [basicContent, setBasicContent] = useState('')
  const [basicUrl, setBasicUrl] = useState('')

  // handleFileChange removed
  // handleFileSubmit removed

  // URLを抽出する関数（通常のテキストとCSV形式の両方に対応）
  const extractUrls = (text: string): string[] => {
    // URLの正規表現パターン（http/https）
    const urlPattern = /https?:\[^\s,\n"'<>()]+/gi
    const urls = text.match(urlPattern) || []

    // 重複を削除
    return Array.from(new Set(urls))
  }

  const handleUrlSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!urlInputText.trim()) return

    const urls = extractUrls(urlInputText)
    if (urls.length === 0) {
      return
    }

    const mockEvent = e || { preventDefault: () => {} } as React.FormEvent
    await onAddMultipleUrls(mockEvent, urls, useAI)
    setUrlInputText('')
  }

  // Handle paste event for auto-submission
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!autoAiSummary || !useAI) return

    const pastedText = e.clipboardData.getData('text')
    const urls = extractUrls(pastedText)

    if (urls.length > 0) {
      // Wait for the state to update
      setTimeout(() => {
        handleUrlSubmit()
      }, 100)
    }
  }

  // Handle Enter key for auto-submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && autoAiSummary && useAI) {
      e.preventDefault()
      handleUrlSubmit()
    }
  }

  // handleFileSubmit removed

  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!basicTitle.trim()) return
    // URLがある場合は内容に追加
    const contentWithUrl = basicUrl.trim()
      ? `${basicContent}${basicContent ? '\n\n' : ''}${basicUrl}`
      : basicContent
    await onAddBasic(e, basicTitle, contentWithUrl)
    setBasicTitle('')
    setBasicContent('')
    setBasicUrl('')
  }

  const isProcessingUrls = isScraping || isBulkProcessing; // Consolidate processing states for URL input

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-center">メモの追加</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="url" className="mt-4">
          <TabsList className="grid w-full grid-cols-2"> {/* Changed from 3 to 2 columns */}
            <TabsTrigger value="url">URLから追加</TabsTrigger>
            {/* "写真から追加"タブを削除 */}
            <TabsTrigger value="basic">何もなしで追加</TabsTrigger>
          </TabsList>
          <TabsContent value="url">
            <Card className="border-none shadow-none">
              <CardContent className="pt-6">
                <form onSubmit={handleUrlSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url-input">URLを入力</Label>
                    <div className="text-sm text-gray-600 mb-2 p-3 rounded-md">
                      <p className="mb-1">URLを1つ、または複数入力してください。</p>
                      <p className="mb-2">改行、カンマ、スペースで区切られたURLや、文章中のURLまで自動検出します。</p>
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                        X（Twitter）とInstagramはAI要約機能が使用できません。
                      </p>
                    </div>
                    <Textarea
                      id="url-input"
                      value={urlInputText}
                      onChange={(e) => setUrlInputText(e.target.value)}
                      onPaste={handlePaste}
                      onKeyDown={handleKeyDown}
                      placeholder="例: https://cookpad.com/recipe/123"
                      required
                      disabled={isProcessingUrls}
                      className="min-h-[120px] text-base"
                    />
                    <p className="text-xs text-gray-500">
                      {urlInputText.trim() && `検出されたURL: ${extractUrls(urlInputText).length}件`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 py-2">
                    <Switch
                      id="use-ai-url"
                      checked={useAI}
                      onCheckedChange={setUseAI}
                    />
                    <Label htmlFor="use-ai-url" className="cursor-pointer text-sm">
                      AI要約を使用する
                    </Label>
                  </div>
                  {(scrapeError || bulkError) && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">{scrapeError || bulkError}</div>}
                  {isProcessingUrls && bulkProgress && ( // Show progress for multiple URLs
                    <div className="p-3 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg">
                      処理中: {bulkProgress.current} / {bulkProgress.total} 件
                    </div>
                  )}
                  <Button type="submit" disabled={isProcessingUrls || !urlInputText.trim() || extractUrls(urlInputText).length === 0} className="w-full h-9 text-sm">
                    {isProcessingUrls
                      ? `処理中... (${bulkProgress?.current || 0}/${bulkProgress?.total || 0})`
                      : (useAI ? '内容を解析' : 'URLを保存')}
                  </Button>
                </form>
                
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="basic">
            <Card className="border-none shadow-none">
              <CardContent className="pt-6">
                <form onSubmit={handleBasicSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="basic-title">タイトル</Label>
                    <Input
                      id="basic-title"
                      type="text"
                      value={basicTitle}
                      onChange={(e) => setBasicTitle(e.target.value)}
                      placeholder="メモのタイトルを入力"
                      required
                      className="text-base h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basic-url">URL（任意）</Label>
                    <Input
                      id="basic-url"
                      type="url"
                      value={basicUrl}
                      onChange={(e) => setBasicUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="text-base h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basic-content">内容（任意）</Label>
                    <Textarea
                      id="basic-content"
                      value={basicContent}
                      onChange={(e) => setBasicContent(e.target.value)}
                      placeholder="メモの内容を入力（マークダウン対応）"
                      className="min-h-[150px] text-base"
                    />
                  </div>
                  <Button type="submit" disabled={!basicTitle.trim()} className="w-full h-11">
                    メモを作成
                  </Button>
                </form>
                <div className="text-xs text-gray-500 text-center mt-6">
                  <p>URLや画像なしで、手軽にメモを作成できます。</p>
                  <p className="mt-1">内容はマークダウン形式で記述できます。</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
