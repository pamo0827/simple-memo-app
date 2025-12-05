'use client'

import { useEffect, useState, useMemo, ChangeEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getRecipes, createRecipe, deleteRecipe, updateRecipe, updateRecipeOrder } from '@/lib/recipes'
import { getCategories, createCategory as dbCreateCategory, updateCategory as dbUpdateCategory, deleteCategory as dbDeleteCategory } from '@/lib/categories'
import { upsertUserSettings, getUserSettings } from '@/lib/user-settings'
import type { Recipe, Category } from '@/lib/supabase'
import { LogOut, Trash2, Settings, Search, Upload, Plus, GripVertical, CheckSquare, Square, X, Menu, ChevronLeft, ChevronRight, HelpCircle, Share2 } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Tweet } from 'react-tweet'
import YouTube from 'react-youtube'

import { extractTweetId, extractYouTubeId, isTwitterUrl, isYouTubeUrl } from '@/lib/embed-helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { SortableRecipeItem } from '@/components/recipes/SortableRecipeItem'
import { SortableCategoryHeader, CategoryHeader } from '@/components/recipes/SortableCategoryHeader'
import { AddRecipeDialog } from '@/components/recipes/AddRecipeDialog'
import { Sidebar } from '@/components/recipes/Sidebar'
import { ShareAllDialog } from '@/components/recipes/ShareAllDialog' // この行は後でShareAllDialogにリネームします
import { RecipeItem, ListItem } from '@/types'

const getFaviconUrl = (url: string) => {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return null
  }
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<CategoryHeader[]>([])
  const [listItems, setListItems] = useState<ListItem[]>([])
  const [listOrder, setListOrder] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [isAddDialogOpen, setAddDialogOpen] = useState(false)
  const [isSearchVisible, setSearchVisible] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [nickname, setNickname] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarEnabled, setSidebarEnabled] = useState(false)
  const [isShareDialogOpen, setShareDialogOpen] = useState(false) // このstateは残します
  const [hasApiKey, setHasApiKey] = useState<boolean>(true)
  const [showApiKeyWarning, setShowApiKeyWarning] = useState<boolean>(false)
  const router = useRouter()

  // カテゴリーへのrefを保持
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Rebuild listItems when recipes, categories, or DB listOrder change
  useEffect(() => {
    const order = listOrder || []
    
    const itemsMap = new Map<string, ListItem>()
    categories.forEach(cat => itemsMap.set(cat.id, { ...cat, type: 'category' }))
    recipes.forEach(recipe => itemsMap.set(recipe.id, { ...recipe, type: 'recipe' }))

    const orderedItems: ListItem[] = []
    order.forEach(id => {
      const item = itemsMap.get(id)
      if (item) {
        orderedItems.push(item)
        itemsMap.delete(id)
      }
    })

    itemsMap.forEach(item => orderedItems.push(item))

    setListItems(orderedItems)
  }, [recipes, categories, listOrder])

  useEffect(() => { checkUser() }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      router.push('/login')
      return
    }
    setUserId(user.id)

    const { data: settings } = await supabase
      .from('user_settings')
      .select('nickname, list_order, gemini_api_key, sidebar_visible')
      .eq('user_id', user.id)
      .single()

    if (settings) {
      setNickname(settings.nickname)
      setListOrder(settings.list_order || [])

      // サイドバーの有効/無効と初期表示状態を設定
      const sidebarSetting = settings.sidebar_visible ?? false
      setSidebarEnabled(sidebarSetting)
      setIsSidebarOpen(sidebarSetting)

      // Gemini APIキーの状態をチェック
      const hasKey = !!settings.gemini_api_key
      setHasApiKey(hasKey)
      setShowApiKeyWarning(!hasKey)
    } else {
      // 設定がない場合は警告を表示
      setHasApiKey(false)
      setShowApiKeyWarning(true)
    }

    loadInitialData(user.id)
  }

  const loadInitialData = async (uid: string) => {
    setLoading(true)
    const [recipeData, categoryData] = await Promise.all([
      getRecipes(uid),
      getCategories(uid)
    ])
    setRecipes(recipeData)
    setCategories(categoryData.map(c => ({ ...c, type: 'category' })))
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleRecipeUpdate = async (id: string, updates: Partial<Recipe>) => {
    const updatedRecipe = await updateRecipe(id, updates)
    if (updatedRecipe) {
      setRecipes(recipes.map(r => r.id === id ? updatedRecipe : r))
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = listItems.findIndex((item) => item.id === active.id)
    const newIndex = listItems.findIndex((item) => item.id === over.id)

    const newListItems = arrayMove(listItems, oldIndex, newIndex)
    setListItems(newListItems)

    const newOrder = newListItems.map(item => item.id)
    setListOrder(newOrder)

    if (userId) {
      await upsertUserSettings(userId, { list_order: newOrder })
    }
    
    const recipeIds = newListItems.filter(item => item.type === 'recipe').map(item => item.id)
    await updateRecipeOrder(recipeIds)
  }

  const handleAddCategory = async () => {
    if (!userId) return
    const newCategory = await dbCreateCategory(userId, '新しいカテゴリー')
    if (newCategory) {
      setCategories([...categories, { ...newCategory, type: 'category' }])
    }
  }

  const handleEditCategory = async (id: string, newName: string) => {
    const updatedCategory = await dbUpdateCategory(id, newName)
    if (updatedCategory) {
      setCategories(categories.map(c => c.id === id ? { ...updatedCategory, type: 'category' } : c))
    }
  }

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    if (isSelectionMode) {
      setSelectedIds(new Set())
    }
  }

  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    const allIds = listItems.map(item => item.id)
    setSelectedIds(new Set(allIds))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`${selectedIds.size}件のメモを削除しますか？`)) return

    const recipeIdsToDelete = Array.from(selectedIds).filter(id => listItems.find(item => item.id === id && item.type === 'recipe'))
    const categoryIdsToDelete = Array.from(selectedIds).filter(id => listItems.find(item => item.id === id && item.type === 'category'))

    const recipeDeletePromises = recipeIdsToDelete.map(id => deleteRecipe(id))
    const categoryDeletePromises = categoryIdsToDelete.map(id => dbDeleteCategory(id))
    
    await Promise.all([...recipeDeletePromises, ...categoryDeletePromises])

    setRecipes(recipes.filter(r => !selectedIds.has(r.id)))
    setCategories(categories.filter(c => !selectedIds.has(c.id)))
    setSelectedIds(new Set())
    setIsSelectionMode(false)
  }

  const handleAddFromUrl = async (e: React.FormEvent, url: string, useAI: boolean = true) => {
    e.preventDefault()
    if (!url || !userId) return
    setIsScraping(true)
    setScrapeError('')
    try {
      // URLの種類を判定
      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')

      let apiEndpoint = '/api/scrape-recipe'
      if (isYouTube) {
        apiEndpoint = '/api/scrape-youtube'
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url, userId, skipAI: !useAI }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        setScrapeError(errorData.error || 'レシピの取得に失敗しました')
        return
      }
      const result = await response.json()

      if (result.type === 'recipe') {
        const recipeData = result.data
        const ingredients = (recipeData.ingredients || '').replace(/\\n/g, '\n')
        const instructions = (recipeData.instructions || '').replace(/\\n/g, '\n')
        const recipe = await createRecipe(userId, {
          name: recipeData.name || '名称未設定のレシピ',
          ingredients: ingredients,
          instructions: instructions,
          source_url: url,
        })
        if (recipe) {
          setRecipes([recipe, ...recipes])
        }
      } else if (result.type === 'summary') {
        const summaryData = (result.data || '').replace(/\\n/g, '\n')
        console.log('[Summary] Creating memo from URL:', url)
        console.log('[Summary] Summary data:', summaryData)

        // タイトルを抽出（より適切な方法で）
        let name = ''
        const lines = summaryData.split('\n').filter((line: string) => line.trim())

        // 1. マークダウン見出しを探す
        const headingLine = lines.find((line: string) => line.match(/^#{1,3}\s+(.+)/))
        if (headingLine) {
          name = headingLine.replace(/^#{1,3}\s+/, '').trim()
        }

        // 2. 見出しがない場合、最初の実質的なテキスト行を使用
        if (!name) {
          const contentLine = lines.find((line: string) => !line.match(/^[#\-*•]/) && line.length > 3)
          if (contentLine) {
            name = contentLine.substring(0, 50).trim()
            if (contentLine.length > 50) name += '...'
          }
        }

        // 3. それでもない場合、URLからサイト名を抽出
        if (!name && url) {
          try {
            const urlObj = new URL(url)
            const hostname = urlObj.hostname.replace('www.', '')
            name = `${hostname} のメモ`
          } catch {
            name = 'メモ'
          }
        }

        // 4. 最後の手段
        if (!name) {
          name = 'メモ'
        }

        console.log('[Summary] Creating recipe with:', { name, source_url: url })
        const recipe = await createRecipe(userId, {
          name: name,
          ingredients: '', // サマリーの場合は材料なし
          instructions: summaryData,
          source_url: url,
        })
        console.log('[Summary] Created recipe:', recipe)
        if (recipe) {
          setRecipes([recipe, ...recipes])
        }
      } else {
        setScrapeError(result.data || '解析できませんでした。')
        return
      }

      setAddDialogOpen(false)
    } catch (error) {
      console.error('Scrape error:', error)
      setScrapeError('レシピの取得に失敗しました')
    } finally {
      setIsScraping(false)
    }
  }



  const handleAddFromFile = async (e: React.FormEvent, file: File, useAI: boolean = true) => {
    e.preventDefault()
    if (!file || !userId) return

    setIsUploading(true)
    setUploadError('')
    setUploadSuccess('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)
    formData.append('skipAI', (!useAI).toString())

    try {
      const response = await fetch('/api/ocr-recipe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        setUploadError(errorData.error || 'レシピの解析に失敗しました')
        return
      }

      const result = await response.json()

      if (result.type === 'recipe') {
        const recipeData = result.data
        const ingredients = (recipeData.ingredients || '').replace(/\\n/g, '\n')
        const instructions = (recipeData.instructions || '').replace(/\\n/g, '\n')
        const recipe = await createRecipe(userId, {
          name: recipeData.name || '名称未設定のレシピ',
          ingredients: ingredients,
          instructions: instructions,
          source_url: `file://${file.name}`,
        })
        if (recipe) {
          setRecipes([recipe, ...recipes])
          setUploadSuccess('1件のメモを追加しました。')
        }
      } else if (result.type === 'summary') {
        if (typeof result.data === 'object' && result.data.message) {
          setUploadSuccess(result.data.message)
          if (userId) await loadInitialData(userId)
        } else if (typeof result.data === 'string') {
          const summaryData = (result.data || '').replace(/\\n/g, '\n')

          // タイトルを抽出（URL版と同じロジック）
          let name = ''
          const lines = summaryData.split('\n').filter((line: string) => line.trim())

          // 1. マークダウン見出しを探す
          const headingLine = lines.find((line: string) => line.match(/^#{1,3}\s+(.+)/))
          if (headingLine) {
            name = headingLine.replace(/^#{1,3}\s+/, '').trim()
          }

          // 2. 見出しがない場合、最初の実質的なテキスト行を使用
          if (!name) {
            const contentLine = lines.find((line: string) => !line.match(/^[#\-*•]/) && line.length > 3)
            if (contentLine) {
              name = contentLine.substring(0, 50).trim()
              if (contentLine.length > 50) name += '...'
            }
          }

          // 3. ファイル名から抽出
          if (!name && file.name) {
            const fileName = file.name.replace(/\.[^/.]+$/, '') // 拡張子を削除
            name = `${fileName} のメモ`
          }

          // 4. 最後の手段
          if (!name) {
            name = 'メモ'
          }

          const recipe = await createRecipe(userId, {
            name: name,
            ingredients: '',
            instructions: summaryData,
            source_url: `file://${file.name}`,
          })
          if (recipe) {
            setRecipes([recipe, ...recipes])
            setUploadSuccess('1件のメモを追加しました。')
          }
        } else {
          throw new Error('Invalid summary data format.')
        }
      } else {
        throw new Error(result.data || 'Invalid response type from server.')
      }

      setAddDialogOpen(false)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('レシピの解析中にエラーが発生しました。')
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddBasic = async (e: React.FormEvent, title: string, content: string) => {
    e.preventDefault()
    if (!title.trim() || !userId) return

    try {
      const recipe = await createRecipe(userId, {
        name: title.trim(),
        ingredients: '',
        instructions: content.trim() || '',
        source_url: undefined,
      })
      if (recipe) {
        setRecipes([recipe, ...recipes])
        setAddDialogOpen(false)
      }
    } catch (error) {
      console.error('Basic memo creation error:', error)
    }
  }

  const filteredListItems = useMemo(() => {
    if (!searchTerm) return listItems
    const lowercasedTerm = searchTerm.toLowerCase()
    return listItems.filter(item => {
      if (item.type === 'category') {
        return item.name.toLowerCase().includes(lowercasedTerm)
      } else {
        return item.name.toLowerCase().includes(lowercasedTerm) ||
          item.ingredients.toLowerCase().includes(lowercasedTerm) ||
          (item.description && item.description.toLowerCase().includes(lowercasedTerm))
      }
    })
  }, [listItems, searchTerm])

  // カテゴリーへスクロール
  const scrollToCategory = (categoryId: string) => {
    const element = categoryRefs.current.get(categoryId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // モバイルでサイドバーを閉じる
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {sidebarEnabled && (
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          categories={categories}
          onCategoryClick={scrollToCategory}
        />
      )}

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Gemini APIキー未設定の警告 */}
          {showApiKeyWarning && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-amber-800 font-semibold mb-2">Gemini APIキーの設定が必要です</h3>
                  <p className="text-amber-700 text-sm mb-3">
                    メモの自動抽出機能を使用するには、Gemini APIキーを設定してください。
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline ml-1"
                    >
                      Google AI Studio
                    </a>
                    から無料で取得できます。
                  </p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/settings')}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    設定ページへ
                  </Button>
                </div>
                <button
                  onClick={() => setShowApiKeyWarning(false)}
                  className="text-amber-600 hover:text-amber-800 ml-4"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {sidebarEnabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="md:hidden hover:bg-gray-50"
                  title="メニュー"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              {nickname && <p className="fluid-text-base font-bold">{nickname}さん</p>}
            </div>
            <div className="flex items-center gap-2">
              {!isSelectionMode && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => setSearchVisible(!isSearchVisible)} title="検索" className="hover:bg-gray-50"><Search className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon" onClick={toggleSelectionMode} title="削除" className="hover:bg-gray-50"><Trash2 className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => router.push('/help')} title="ヘルプ" className="hover:bg-gray-50"><HelpCircle className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setShareDialogOpen(true)} title="共有" className="hover:bg-gray-50"><Share2 className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => router.push('/settings')} title="設定" className="hover:bg-gray-50"><Settings className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout} title="ログアウト" className="hover:bg-gray-50"><LogOut className="h-5 w-5" /></Button>
                </>
              )}
            </div>
          </div>

        {isSelectionMode && (
          <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="fluid-text-sm font-medium text-amber-900">{selectedIds.size}件選択中</span>
              <Button variant="ghost" size="sm" onClick={selectAll} className="h-8">全選択</Button>
              <Button variant="ghost" size="sm" onClick={deselectAll} className="h-8">選択解除</Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="destructive" size="sm" onClick={deleteSelected} disabled={selectedIds.size === 0} className="h-8 px-3">
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">削除</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleSelectionMode} className="h-8 px-3">
                <X className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">キャンセル</span>
              </Button>
            </div>
          </div>
        )}

        {isSearchVisible && (
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input type="text" placeholder="タイトルや内容で検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-11 text-base" />
            </div>
          </div>
        )}

        {filteredListItems.length === 0 ? (
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="text-center py-20">
              <img src="/sleep2_memotto.png" alt="メモがありません" className="w-48 h-auto mx-auto mb-8" />
              <p className="text-gray-500 fluid-text-lg mb-2 font-medium">{searchTerm ? '一致するメモがありません' : 'メモがありません'}</p>
              <p className="text-gray-400 fluid-text-sm">{searchTerm ? '検索ワードを変えてみてください' : '右下の「＋」ボタンから追加してみましょう'}</p>
            </CardContent>
          </Card>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredListItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
              <Accordion type="single" collapsible className="w-full space-y-4">
                {filteredListItems.map((item) => {
                  if (item.type === 'category') {
                    return (
                      <SortableCategoryHeader
                        key={item.id}
                        category={item}
                        onEdit={handleEditCategory}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedIds.has(item.id)}
                        onToggleSelect={toggleItemSelection}
                        categoryRef={(el) => {
                          if (el) {
                            categoryRefs.current.set(item.id, el)
                          } else {
                            categoryRefs.current.delete(item.id)
                          }
                        }}
                      />
                    )
                  } else {
                    const faviconUrl = item.source_url ? getFaviconUrl(item.source_url) : null
                    return (
                      <SortableRecipeItem
                        key={item.id}
                        recipe={item}
                        faviconUrl={faviconUrl}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedIds.has(item.id)}
                        onToggleSelect={toggleItemSelection}
                        onUpdateRecipe={handleRecipeUpdate}
                      />
                    )
                  }
                })}
              </Accordion>
            </SortableContext>
            <DragOverlay>
              {activeId ? (() => {
                const item = listItems.find(i => i.id === activeId)
                if (!item) return null
                if (item.type === 'category') {
                  return (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg px-3 py-1.5 flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="h-4 w-4 text-amber-600" />
                        <h2 className="fluid-text-sm font-bold text-amber-900">{item.name}</h2>
                      </div>
                    </div>
                  )
                } else {
                  const faviconUrl = item.source_url ? getFaviconUrl(item.source_url) : null
                  return (
                    <div className="border border-gray-200 rounded-lg shadow-lg bg-white">
                      <div className="flex items-center justify-between pr-2">
                        <div className="flex items-center flex-1">
                          <div className="px-3 py-4">
                            <GripVertical className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="flex-1 pr-6 py-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {faviconUrl && (
                                <img src={faviconUrl} alt="" className="h-6 w-6 rounded flex-shrink-0" />
                              )}
                              <span className="fluid-text-base font-semibold text-left truncate line-clamp-1">{item.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
              })() : null}
            </DragOverlay>
          </DndContext>
        )}
        </div>
      </div>

      {/* オーバーレイ */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 transition-opacity duration-300"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* メニューボタン */}
      <div className={`fixed bottom-24 right-6 flex flex-col gap-3 z-40 transition-all duration-300 ease-in-out ${ 
        isMenuOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <Button
          variant="default"
          className="h-12 px-6 shadow-lg rounded-full transition-transform duration-200 hover:scale-105"
          onClick={handleAddCategory}
        >
          カテゴリーを追加
        </Button>
        <Button
          variant="default"
          className="h-12 px-6 shadow-lg rounded-full transition-transform duration-200 hover:scale-105"
          onClick={() => {
            setMenuOpen(false)
            setAddDialogOpen(true)
          }}
        >
          メモを追加
        </Button>
      </div>

      {/* 右下の＋ボタン */}
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 rounded-full h-16 w-16 shadow-lg z-50 transition-transform duration-300 hover:scale-110"
        aria-label="メニューを開く"
        onClick={() => setMenuOpen(!isMenuOpen)}
      >
        <Plus className={`h-8 w-8 transition-transform duration-300 ${isMenuOpen ? 'rotate-45' : 'rotate-0'}`} />
      </Button>


      <AddRecipeDialog
        open={isAddDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAddFromUrl={handleAddFromUrl}
        onAddFromFile={handleAddFromFile}
        onAddBasic={handleAddBasic}
        isScraping={isScraping}
        scrapeError={scrapeError}
        isUploading={isUploading}
        uploadError={uploadError}
        uploadSuccess={uploadSuccess}
      />
      <ShareAllDialog
        open={isShareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </div>
  )
}
