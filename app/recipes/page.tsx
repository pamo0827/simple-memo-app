'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { getRecipes, createRecipe, deleteRecipe, updateRecipe, updateRecipeOrder } from '@/lib/recipes'
import { getCategories, createCategory as dbCreateCategory, updateCategory as dbUpdateCategory, deleteCategory as dbDeleteCategory } from '@/lib/categories'
import { getPages, createPage, updatePage, deletePage, updatePageOrder, type Page } from '@/lib/pages'
import type { Recipe } from '@/lib/supabase'
import { Trash2, Settings, Search, Upload, Plus, GripVertical, CheckSquare, Square, X, Menu, ChevronLeft, ChevronRight, HelpCircle, Share2, Mail, MoreHorizontal, Pencil, File } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { SortableRecipeItem } from '@/components/recipes/SortableRecipeItem'
import { SortableCategoryHeader, CategoryHeader } from '@/components/recipes/SortableCategoryHeader'
import { SharePageDialog } from '@/components/recipes/SharePageDialog'
import { Avatar } from '@/components/ui/avatar'
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

const extractTitleFromMarkdown = (content: string, fallback: string = 'メモ'): string => {
  const lines = content.split('\n').filter((line: string) => line.trim())
  const headingLine = lines.find((line: string) => line.match(/^#{1,3}\s+(.+)/))
  if (headingLine) {
    return headingLine.replace(/^#{1,3}\s+/, '').trim()
  }
  const contentLine = lines.find((line: string) => !line.match(/^[#\-*•]/) && line.length > 3)
  if (contentLine) {
    let title = contentLine.substring(0, 50).trim()
    if (contentLine.length > 50) title += '...'
    return title
  }
  return fallback
}

export default function HomePage() {
  const supabase = createClientComponentClient()
  const [pages, setPages] = useState<Page[]>([])
  const [currentPageId, setCurrentPageId] = useState<string | null>(null)

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<CategoryHeader[]>([])
  const [listItems, setListItems] = useState<ListItem[]>([])
  const [listOrder, setListOrder] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [isSearchVisible, setSearchVisible] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [nickname, setNickname] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isShareDialogOpen, setShareDialogOpen] = useState(false)
  const [autoAiSummary, setAutoAiSummary] = useState(true)

  // Page Dialog States
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false)
  const [isRenameDialogOpen, setRenameDialogOpen] = useState(false)
  const [newPageName, setNewPageName] = useState('')
  const [editingPage, setEditingPage] = useState<Page | null>(null)

  const router = useRouter()

  const { isScraping, scrapeError, bulkProgress, scrapeUrl, scrapeMultipleUrls, scrapeYouTube } = useRecipeScrap()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

    // Add any items not in the order list to the end
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
      .select('nickname, avatar_url, gemini_api_key, sidebar_visible, auto_ai_summary')
      .eq('user_id', user.id)
      .single()

    if (settings) {
      setNickname(settings.nickname)
      setAvatarUrl(settings.avatar_url || null)
      setAutoAiSummary(settings.auto_ai_summary ?? true)
    } else {
      setAutoAiSummary(true)
    }

    const handlePageSelect = async (pageId: string) => {
      if (!userId || pageId === currentPageId) return
      setCurrentPageId(pageId)
      await loadPageData(userId, pageId)
    }

    const handleCreatePage = async (name: string) => {
      if (!userId) return
      const newPage = await createPage(userId, name, supabase)
      if (newPage) {
        setPages([...pages, newPage])
        handlePageSelect(newPage.id)
      }
    }

    const handleCreatePageSubmit = () => {
      if (newPageName.trim()) {
        handleCreatePage(newPageName.trim())
        setNewPageName('')
        setCreateDialogOpen(false)
      }
    }

    const handleUpdatePage = async (pageId: string, name: string) => {
      const updated = await updatePage(pageId, { name }, supabase)
      if (updated) {
        setPages(pages.map(p => p.id === pageId ? updated : p))
      }
    }

    const handleRenamePageSubmit = () => {
      if (editingPage && newPageName.trim()) {
        handleUpdatePage(editingPage.id, newPageName.trim())
        setNewPageName('')
        setEditingPage(null)
        setRenameDialogOpen(false)
      }
    }

    const openRenameDialog = (page: Page) => {
      setEditingPage(page)
      setNewPageName(page.name)
      setRenameDialogOpen(true)
    }

    const handleDeletePage = async (pageId: string) => {
      if (pages.length <= 1) {
        alert("最後のページは削除できません")
        return
      }
      const success = await deletePage(pageId, supabase)
      if (success) {
        const newPages = pages.filter(p => p.id !== pageId)
        setPages(newPages)
        if (currentPageId === pageId) {
          handlePageSelect(newPages[0].id)
        }
      }
    }

    const handleDeletePageClick = (page: Page) => {
      if (confirm(`ページ「${page.name}」を削除しますか？\n含まれるメモもすべて削除されます。`)) {
        handleDeletePage(page.id)
      }
    }


    // Load pages first
    const userPages = await getPages(user.id)
    setPages(userPages)
    if (userPages.length > 0) {
      // Default to first page if no saved state (could save last visited page in user_settings later)
      setCurrentPageId(userPages[0].id)
      loadPageData(user.id, userPages[0].id)
    } else {
      // Should not happen due to migration, but handle gracefully
      setLoading(false)
    }
  }

  const loadPageData = async (uid: string, pageId: string) => {
    setLoading(true)
    const [recipeData, categoryData] = await Promise.all([
      getRecipes(uid, pageId, supabase),
      getCategories(uid, pageId) // getCategories defined in lib/categories needs update too? Let's check imports.
    ])

    // ...
    const currentPage = pages.find(p => p.id === pageId) || await getPages(uid, supabase).then(ps => ps.find(p => p.id === pageId))
    // ...
  }

  // ...

  const handleRecipeUpdate = async (id: string, updates: Partial<Recipe>) => {
    const updatedRecipe = await updateRecipe(id, updates, supabase)
    // ...
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

    if (currentPageId) {
      // Update page order in DB
      await updatePageOrder(currentPageId, newOrder, supabase)
      // Update local pages state to reflect order change
      setPages(pages.map(p => p.id === currentPageId ? { ...p, list_order: newOrder } : p))
    }

    const recipeIds = newListItems.filter(item => item.type === 'recipe').map(item => item.id)
    await updateRecipeOrder(recipeIds, supabase)
  }

  const handleAddCategory = async () => {
    if (!userId || !currentPageId) return
    const newCategory = await dbCreateCategory(userId, '新しいカテゴリー', currentPageId, supabase)
    if (newCategory) {
      setCategories([...categories, { ...newCategory, type: 'category' }])
      setMenuOpen(false)
    }
  }

  const handleEditCategory = async (id: string, newName: string) => {
    const updatedCategory = await dbUpdateCategory(id, newName, supabase)
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

    const recipeDeletePromises = recipeIdsToDelete.map(id => deleteRecipe(id, supabase))
    const categoryDeletePromises = categoryIdsToDelete.map(id => dbDeleteCategory(id, supabase))

    await Promise.all([...recipeDeletePromises, ...categoryDeletePromises])

    setRecipes(recipes.filter(r => !selectedIds.has(r.id)))
    setCategories(categories.filter(c => !selectedIds.has(c.id)))
    setSelectedIds(new Set())
    setIsSelectionMode(false)
  }

  const handleCreateEmptyMemo = async () => {
    if (!userId || !currentPageId) return
    setMenuOpen(false)

    try {
      const recipe = await createRecipe(userId, {
        name: 'タイトル',
        ingredients: '',
        instructions: '',
        source_url: undefined,
      }, currentPageId, supabase)

      if (recipe) {
        setRecipes([recipe, ...recipes])
      }
    } catch (error) {
      console.error('Empty memo creation error:', error)
    }
  }

  const handleDropUrl = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId || !currentPageId) return;

    const url = e.dataTransfer.getData('text/plain');
    if (!url || !url.startsWith('http')) {
      alert('無効なURLがドロップされました。');
      return;
    }

    try {
      const recipe = await createRecipe(userId, {
        name: '新しいメモ',
        ingredients: '',
        instructions: '',
        source_url: url,
      }, currentPageId);

      if (recipe) {
        setRecipes([recipe, ...recipes]);
        alert('URLからメモが作成されました！');
      }
    } catch (error) {
      console.error('Failed to create memo from URL drop:', error);
      alert('URLからメモの作成に失敗しました。');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

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



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-white"
      onDrop={handleDropUrl}
      onDragOver={handleDragOver}
    >
      {/* メインコンテンツ */}
      <div className="flex-1 overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {nickname && (
                <div className="flex items-center gap-2">
                  <Avatar src={avatarUrl} nickname={nickname} size="sm" />
                  <p className="fluid-text-base font-bold">{nickname}さん</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isSelectionMode && (
                <>
                  <Button variant="ghost" size="icon" onClick={toggleSelectionMode} title="削除" className="hover:bg-gray-50"><Trash2 className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => router.push('/help')} title="ヘルプ" className="hover:bg-gray-50"><HelpCircle className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setShareDialogOpen(true)} title="共有" className="hover:bg-gray-50"><Share2 className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => router.push('/settings')} title="設定" className="hover:bg-gray-50"><Settings className="h-5 w-5" /></Button>
                </>
              )}
            </div>
          </div>

          {/* ページ一覧 (水平スクロール) */}
          <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
            {pages.map(page => (
              <div key={page.id} className="group relative flex-shrink-0">
                <Button
                  variant={currentPageId === page.id ? "secondary" : "ghost"}
                  onClick={() => handlePageSelect(page.id)}
                  className={`rounded-full px-4 h-10 ${currentPageId === page.id
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <File className="h-4 w-4 mr-2" />
                  <span className="truncate max-w-[120px]">{page.name}</span>
                </Button>

                <div className="absolute top-1 right-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200/50">
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openRenameDialog(page); }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        名前を変更
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeletePageClick(page); }} className="text-red-600 focus:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        削除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 flex-shrink-0 border-dashed border-gray-300 hover:border-amber-400 hover:text-amber-600"
              onClick={() => setCreateDialogOpen(true)}
              title="新しいページを作成"
            >
              <Plus className="h-5 w-5" />
            </Button>
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
                          autoAiSummary={autoAiSummary}
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

      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 transition-opacity duration-300"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className={`fixed bottom-24 right-6 flex flex-col gap-3 z-40 transition-all duration-300 ease-in-out ${isMenuOpen
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
          className="h-12 px-6 shadow-lg rounded-full transition-transform duration-200 hover:scale-110"
          onClick={handleCreateEmptyMemo}
        >
          メモを追加
        </Button>
      </div>

      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 rounded-full h-16 w-16 shadow-lg z-50 transition-transform duration-300 hover:scale-110"
        aria-label="メニューを開く"
        onClick={() => setMenuOpen(!isMenuOpen)}
      >
        <Plus className={`h-8 w-8 transition-transform duration-300 ${isMenuOpen ? 'rotate-45' : 'rotate-0'}`} />
      </Button>


      <SharePageDialog
        open={isShareDialogOpen}
        onOpenChange={setShareDialogOpen}
        pageId={currentPageId}
        pageName={pages.find(p => p.id === currentPageId)?.name || 'ページ'}
      />

      {/* Create Page Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新しいページを作成</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="ページ名"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePageSubmit()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleCreatePageSubmit}>作成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Page Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ページ名の変更</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="ページ名"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenamePageSubmit()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleRenamePageSubmit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}