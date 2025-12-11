'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, ChevronLeft, ChevronRight, Plus, File, MoreHorizontal, Pencil, Trash2, List } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import type { CategoryHeader } from '@/components/recipes/SortableCategoryHeader'
import type { Page } from '@/lib/pages'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  categories: CategoryHeader[]
  onCategoryClick: (categoryId: string) => void
  pages: Page[]
  currentPageId: string | null
  onPageSelect: (pageId: string) => void
  onCreatePage: (name: string) => void
  onUpdatePage: (pageId: string, name: string) => void
  onDeletePage: (pageId: string) => void
  nickname?: string | null
  avatarUrl?: string | null
}

export function Sidebar({
  isOpen,
  onToggle,
  categories,
  onCategoryClick,
  pages,
  currentPageId,
  onPageSelect,
  onCreatePage,
  onUpdatePage,
  onDeletePage,
  nickname,
  avatarUrl
}: SidebarProps) {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false)
  const [isRenameDialogOpen, setRenameDialogOpen] = useState(false)
  const [newPageName, setNewPageName] = useState('')
  const [editingPage, setEditingPage] = useState<Page | null>(null)

  const handleCreatePage = () => {
    if (newPageName.trim()) {
      onCreatePage(newPageName.trim())
      setNewPageName('')
      setCreateDialogOpen(false)
    }
  }

  const handleRenamePage = () => {
    if (editingPage && newPageName.trim()) {
      onUpdatePage(editingPage.id, newPageName.trim())
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

  const handleDeletePage = (page: Page) => {
    if (confirm(`ページ「${page.name}」を削除しますか？\n含まれるメモもすべて削除されます。`)) {
      onDeletePage(page.id)
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Pages Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-gray-900 text-sm">ページ</h2>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ul className="space-y-1">
          {pages.map(page => (
            <li key={page.id} className="group flex items-center justify-between rounded-lg hover:bg-gray-100 pr-1">
              <button
                onClick={() => onPageSelect(page.id)}
                className={`flex-1 text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                  currentPageId === page.id 
                    ? 'bg-amber-100 text-amber-900 font-medium' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{page.name}</span>
                </div>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openRenameDialog(page)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    名前を変更
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeletePage(page)} className="text-red-600 focus:text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      </div>

      {/* Categories / TOC Section */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
          <List className="h-4 w-4" />
          目次
        </h2>
        {categories.length === 0 ? (
          <p className="text-xs text-gray-400 pl-2">カテゴリーがありません</p>
        ) : (
          <ul className="space-y-1">
            {categories.map(category => (
              <li key={category.id}>
                <button
                  onClick={() => onCategoryClick(category.id)}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors text-sm truncate"
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-gray-200 bg-gray-50 transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 h-14">
          {isOpen && <span className="font-bold text-gray-900 truncate">メニュー</span>}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="hover:bg-gray-200 ml-auto"
          >
            {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </div>
        {isOpen && <SidebarContent />}
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={onToggle}
          />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-lg flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              {nickname ? (
                <div className="flex items-center gap-3">
                  <Avatar src={avatarUrl} nickname={nickname} size="sm" />
                  <h2 className="font-bold text-gray-900">{nickname}さん</h2>
                </div>
              ) : (
                <h2 className="font-bold text-gray-900">メニュー</h2>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}

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
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleCreatePage}>作成</Button>
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
              onKeyDown={(e) => e.key === 'Enter' && handleRenamePage()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleRenamePage}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
