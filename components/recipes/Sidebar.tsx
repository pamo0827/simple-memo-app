'use client'

import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { CategoryHeader } from '@/components/recipes/SortableCategoryHeader'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  categories: CategoryHeader[]
  onCategoryClick: (categoryId: string) => void
}

export function Sidebar({ isOpen, onToggle, categories, onCategoryClick }: SidebarProps) {
  return (
    <>
      {/* サイドバー（デスクトップ） */}
      <aside className={`hidden md:flex flex-col border-r border-gray-200 bg-gray-50 transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {isOpen && <h2 className="font-bold text-gray-900">目次</h2>}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="hover:bg-gray-200"
          >
            {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </div>
        {isOpen && (
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {categories.map(category => (
                <li key={category.id}>
                  <button
                    onClick={() => onCategoryClick(category.id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-100 text-gray-700 hover:text-amber-900 transition-colors text-sm"
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </aside>

      {/* モバイル用サイドバー */}
      {isOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={onToggle}
          />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-white z-50 shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">目次</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="overflow-y-auto p-4 h-full">
              <ul className="space-y-2">
                {categories.map(category => (
                  <li key={category.id}>
                    <button
                      onClick={() => onCategoryClick(category.id)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-100 text-gray-700 hover:text-amber-900 transition-colors text-sm"
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </>
      )}
    </>
  )
}
