'use client'

import { useEffect, useState, useMemo, ChangeEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getRecipes, createRecipe, deleteRecipe, updateRecipe, updateRecipeOrder } from '@/lib/recipes'
import { getCategories, createCategory as dbCreateCategory, updateCategory as dbUpdateCategory, deleteCategory as dbDeleteCategory } from '@/lib/categories'
import { upsertUserSettings, getUserSettings } from '@/lib/user-settings'
import type { Recipe, Category } from '@/lib/supabase'
import { LogOut, Trash2, Settings, Search, Upload, Plus, GripVertical, CheckSquare, Square, X, Menu, ChevronLeft, ChevronRight, HelpCircle, Share2, Mail } from 'lucide-react'
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
import { useRecipeScrap } from '@/hooks/useRecipeScrap'

const getFaviconUrl = (url: string) => {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return null
  }
}

/**
 * Helper function to extract title from markdown content
 * Follows Single Responsibility Principle
 */
const extractTitleFromMarkdown = (content: string, fallback: string = 'メモ'): string => {
  const lines = content.split('\n').filter((line: string) => line.trim())

  // 1. マークダウン見出しを探す
  const headingLine = lines.find((line: string) => line.match(/^#{1,3}\s+(.+)/))
  if (headingLine) {
    return headingLine.replace(/^#{1,3}\s+/, '').trim()
  }

  // 2. 見出しがない場合、最初の実質的なテキスト行を使用
  const contentLine = lines.find((line: string) => !line.match(/^[#\-*•]/) && line.length > 3)
  if (contentLine) {
    let title = contentLine.substring(0, 50).trim()
    if (contentLine.length > 50) title += '...'
    return title
  }

  return fallback
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<CategoryHeader[]>([])
  const [listItems, setListItems] = useState<ListItem[]>([])
  const [listOrder, setListOrder] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [isAddDialogOpen, setAddDialogOpen] = useState(false)
  const [isSearchVisible, setSearchVisible] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [nickname, setNickname] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarEnabled, setSidebarEnabled] = useState(false)
  const [fontFamily, setFontFamily] = useState<'system' | 'serif' | 'mono'>('system')
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [isShareDialogOpen, setShareDialogOpen] = useState(false)
  const router = useRouter()

  // SOLID Refactored: Use custom hook for recipe scraping business logic
  const { isScraping, scrapeError, bulkProgress, scrapeUrl, scrapeMultipleUrls, scrapeYouTube, uploadFile } = useRecipeScrap()

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
      .select('nickname, list_order, gemini_api_key, sidebar_visible, font_family, font_size')
      .eq('user_id', user.id)
      .single()

    if (settings) {
      setNickname(settings.nickname)
      setListOrder(settings.list_order || [])

      // サイドバーの有効/無効と初期表示状態を設定
      const sidebarSetting = settings.sidebar_visible ?? false
      setSidebarEnabled(sidebarSetting)
      setIsSidebarOpen(sidebarSetting)

      // フォント設定
      setFontFamily(settings.font_family || 'system')
      setFontSize(settings.font_size || 'medium')
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

  /**
   * SOLID Refactored: Simplified handler using useRecipeScrap hook
   * Business logic delegated to custom hook
   */
  const handleAddFromFile = async (e: React.FormEvent, file: File, useAI: boolean = true) => {
    e.preventDefault()
    if (!file || !userId) return

    setUploadSuccess('')

    // Use custom hook for API call and state management
    const result = await uploadFile(file, useAI)

    if (!result) {
      // Error is already handled by the hook (scrapeError state)
      return
    }

    try {
      // Handle recipe creation based on result type
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
        const summaryData = (result.data || '').replace(/\\n/g, '\n')

        // Extract title using helper function
        const fileName = file.name.replace(/\.[^/.]+$/, '')
        const name = extractTitleFromMarkdown(summaryData, `${fileName} のメモ`)

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
      }

      setAddDialogOpen(false)
    } catch (error) {
      console.error('Recipe creation error:', error)
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

  /**
   * SOLID Refactored: Simplified handler using useRecipeScrap hook
   * Business logic delegated to custom hook
   */
  const handleAddMultipleUrls = async (e: React.FormEvent, urls: string[], useAI: boolean = true) => {
    e.preventDefault()
    if (urls.length === 0 || !userId) return

    // Use custom hook for bulk URL scraping
    const results = await scrapeMultipleUrls(urls, useAI)

    const newRecipes: Recipe[] = []
    let successCount = 0

    // Process each result and create recipes
    for (const { url, data } of results) {
      if (!data) continue

      try {
        if (data.type === 'recipe') {
          const recipeData = data.data
          const ingredients = (recipeData.ingredients || '').replace(/\\n/g, '\n')
          const instructions = (recipeData.instructions || '').replace(/\\n/g, '\n')
          const recipe = await createRecipe(userId, {
            name: recipeData.name || '名称未設定のレシピ',
            ingredients: ingredients,
            instructions: instructions,
            source_url: url,
          })
          if (recipe) {
            newRecipes.push(recipe)
            successCount++
          }
        } else if (data.type === 'summary') {
          const summaryData = (data.data || '').replace(/\\n/g, '\n')

          // Extract title using helper function
          let fallback = 'メモ'
          if (url) {
            try {
              const urlObj = new URL(url)
              const hostname = urlObj.hostname.replace('www.', '')
              fallback = `${hostname} のメモ`
            } catch {
              fallback = 'メモ'
            }
          }

          const name = extractTitleFromMarkdown(summaryData, fallback)

          const recipe = await createRecipe(userId, {
            name: name,
            ingredients: '',
            instructions: summaryData,
            source_url: url,
          })
          if (recipe) {
            newRecipes.push(recipe)
            successCount++
          }
        }
      } catch (error) {
        console.error(`Error creating recipe for URL ${url}:`, error)
      }
    }

    // 成功したレシピを一括で追加
    if (newRecipes.length > 0) {
      setRecipes([...newRecipes, ...recipes])
    }

    const errorCount = urls.length - successCount
    if (errorCount === 0) {
      setAddDialogOpen(false)
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
      <div className={`flex-1 overflow-x-hidden font-family-${fontFamily} font-size-${fontSize}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
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
                  <Button variant="ghost" size="icon" onClick={() => router.push('/contact')} title="お問い合わせ" className="hover:bg-gray-50"><Mail className="h-5 w-5" /></Button>
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
        onAddFromFile={handleAddFromFile}
        onAddBasic={handleAddBasic}
        onAddMultipleUrls={handleAddMultipleUrls}
        isScraping={isScraping}
        scrapeError={scrapeError}
        isUploading={isScraping}
        uploadError={scrapeError}
        uploadSuccess={uploadSuccess}
        isBulkProcessing={isScraping && !!bulkProgress}
        bulkProgress={bulkProgress || undefined}
        bulkError={scrapeError}
      />
      <ShareAllDialog
        open={isShareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </div>
  )
}
