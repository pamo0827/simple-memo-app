'use client'

import { useState, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload } from 'lucide-react'

const siteGroups = [
  {
    genre: '動画',
    sites: [
      { name: 'YouTube', url: 'https://www.youtube.com/', favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64', note: '※字幕・概要欄を解析' },
    ]
  },
  {
    genre: 'レシピ',
    sites: [
      { name: 'Cookpad', url: 'https://cookpad.com/jp/', favicon: 'https://www.google.com/s2/favicons?domain=cookpad.com&sz=64' },
      { name: 'クラシル', url: 'https://www.kurashiru.com/', favicon: 'https://www.google.com/s2/favicons?domain=www.kurashiru.com&sz=64' },
      { name: 'DELISH KITCHEN', url: 'https://delishkitchen.tv/', favicon: 'https://www.google.com/s2/favicons?domain=delishkitchen.tv&sz=64' },
      { name: '白ごはん.com', url: 'https://www.sirogohan.com/', favicon: 'https://www.google.com/s2/favicons?domain=sirogohan.com&sz=64' }
    ]
  },
  {
    genre: '勉強',
    sites: [
      { name: 'マナピタイムズ', url: 'https://manabitimes.jp/', favicon: 'https://www.google.com/s2/favicons?domain=manabitimes.jp&sz=64' },
      { name: 'パスナビ', url: 'https://passnavi.obunsha.co.jp/', favicon: 'https://www.google.com/s2/favicons?domain=passnavi.obunsha.co.jp&sz=64' },
      { name: 'STUDY HACKER', url: 'https://studyhacker.net/', favicon: 'https://www.google.com/s2/favicons?domain=studyhacker.net&sz=64' }
    ]
  },
  {
    genre: 'ゲーム',
    sites: [
      { name: 'GameWith', url: 'https://gamewith.jp/switch-2/', favicon: 'https://www.google.com/s2/favicons?domain=gamewith.jp&sz=64' },
      { name: 'Game8', url: 'https://game8.jp/', favicon: 'https://www.google.com/s2/favicons?domain=game8.jp&sz=64' },
      { name: '神ゲー攻略', url: 'https://kamigame.jp/', favicon: 'https://www.google.com/s2/favicons?domain=kamigame.jp&sz=64' }
    ]
  },
  {
    genre: '技術記事',
    sites: [
      { name: 'Qiita', url: 'https://qiita.com/', favicon: 'https://www.google.com/s2/favicons?domain=qiita.com&sz=64' },
      { name: 'Zenn', url: 'https://zenn.dev/', favicon: 'https://www.google.com/s2/favicons?domain=zenn.dev&sz=64' },
      { name: 'note', url: 'https://note.com/', favicon: 'https://www.google.com/s2/favicons?domain=note.com&sz=64' }
    ]
  }
];

interface AddRecipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddFromUrl: (e: React.FormEvent, url: string) => Promise<void>
  onAddFromFile: (e: React.FormEvent, file: File) => Promise<void>
  isScraping: boolean
  scrapeError: string
  isUploading: boolean
  uploadError: string
  uploadSuccess: string
}

export function AddRecipeDialog({
  open,
  onOpenChange,
  onAddFromUrl,
  onAddFromFile,
  isScraping,
  scrapeError,
  isUploading,
  uploadError,
  uploadSuccess,
}: AddRecipeDialogProps) {
  const [recipeUrl, setRecipeUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipeUrl) return
    await onAddFromUrl(e, recipeUrl)
    setRecipeUrl('')
  }

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return
    await onAddFromFile(e, selectedFile)
    setSelectedFile(null)
    const fileInput = document.getElementById('file-upload-dialog') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-center">メモの追加</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="url" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">URLから追加</TabsTrigger>
            <TabsTrigger value="file">写真から追加</TabsTrigger>
          </TabsList>
          <TabsContent value="url">
            <Card className="border-none shadow-none">
              <CardContent className="pt-6">
                <form onSubmit={handleUrlSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Input id="url-input" type="url" value={recipeUrl} onChange={(e) => setRecipeUrl(e.target.value)} placeholder="https://cookpad.com/recipe/..." required disabled={isScraping} className="text-base h-11" />
                  </div>
                  {scrapeError && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">{scrapeError}</div>}
                  <Button type="submit" disabled={isScraping || !recipeUrl} className="w-full h-11">{isScraping ? '解析中...' : '内容を解析'}</Button>
                </form>
                <div className="mt-6 space-y-4">
                  <h2 className="text-xs font-semibold text-gray-500 text-center">動作確認済みサイト</h2>
                  {siteGroups.map((group) => (
                    <div key={group.genre}>
                      <h3 className="text-xs font-medium text-gray-500 mb-2 text-center">{group.genre}</h3>
                      <div className="flex items-center gap-x-5 gap-y-3 flex-wrap justify-center">
                        {group.sites.map((site) => (
                          <a key={site.name} href={site.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group">
                            <img src={site.favicon} alt={`${site.name} favicon`} className="h-4 w-4 rounded-full" />
                            <span className="text-xs font-medium group-hover:underline">{site.name}</span>
                            {site.note && <span className="text-xs text-gray-400">{site.note}</span>}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 text-xs text-gray-500 text-center">
                    <p>※ 内容を読み取れない場合やAPIキーが未設定の場合は、</p>
                    <p>URLのみを保存した基本メモが作成されます。</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="file">
            <Card className="border-none shadow-none">
              <CardContent className="pt-6">
                <form onSubmit={handleFileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Input id="file-upload-dialog" type="file" onChange={handleFileChange} accept="image/jpeg,image/png,application/pdf" required disabled={isUploading} />
                  </div>
                  {uploadError && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">{uploadError}</div>}
                  {uploadSuccess && <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg">{uploadSuccess}</div>}
                  <Button type="submit" disabled={isUploading || !selectedFile} className="w-full h-11"><Upload className="mr-2 h-4 w-4" />{isUploading ? '解析中...' : '内容を解析'}</Button>
                </form>
                <div className="text-xs text-gray-500 text-center mt-6">
                  <p>画像やPDFをアップロードすれば、</p>
                  <p>文字やURLを解析して自動で追加します。</p>
                  <p className="mt-1">対応形式：JPEG、PNG、PDF</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}