'use client'

import { useState, useMemo, useRef } from 'react'
import type { Recipe } from '@/lib/supabase'
import { GripVertical, CheckSquare, Square, Pencil, RotateCw, X, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRecipeScrap } from '@/hooks/useRecipeScrap'
import { RecipeMarkdown } from './RecipeMarkdown'

export function SortableRecipeItem({
  recipe,
  faviconUrl,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onUpdateRecipe,
}: {
  recipe: Recipe;
  faviconUrl: string | null;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onUpdateRecipe: (id: string, updates: Partial<Recipe>) => void;
}) {
  const [editingName, setEditingName] = useState(false)
  const [editingUrl, setEditingUrl] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  
  const [tempName, setTempName] = useState(recipe.name)
  const [tempUrl, setTempUrl] = useState(recipe.source_url || '')
  
  const initialCombinedContent = useMemo(() => {
    return [recipe.ingredients, recipe.instructions]
      .filter(s => s && s.trim())
      .join('\n\n')
  }, [recipe.ingredients, recipe.instructions])

  const [tempContent, setTempContent] = useState(initialCombinedContent)
  const [hasUsedAI, setHasUsedAI] = useState(false)

  const { scrapeUrl, isScraping, scrapeError } = useRecipeScrap()
  const triggerRef = useRef<HTMLButtonElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: recipe.id, disabled: isSelectionMode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSaveName = () => {
    if (tempName !== recipe.name && tempName.trim()) {
      onUpdateRecipe(recipe.id, { name: tempName })
    }
    setEditingName(false)
  }

  const handleSaveUrl = () => {
    if (tempUrl !== recipe.source_url) {
      onUpdateRecipe(recipe.id, { source_url: tempUrl || undefined })
    }
    setEditingUrl(false)
  }

  const handleSaveContent = () => {
    const currentCombined = [recipe.ingredients, recipe.instructions]
      .filter(s => s && s.trim())
      .join('\n\n')
      
    if (tempContent !== currentCombined) {
      onUpdateRecipe(recipe.id, { 
        ingredients: '', 
        instructions: tempContent 
      })
    }
    setEditingContent(false)
  }

  const handleRunAI = async () => {
    if (!tempUrl) return
    const result = await scrapeUrl(tempUrl, true)
    setHasUsedAI(true)

    if (!result) return

    let name = tempName
    let content = ''

    if (result.type === 'recipe') {
      const data = result.data as any
      const ingredients = (data.ingredients || '').replace(/\\n/g, '\n')
      const instructions = (data.instructions || '').replace(/\\n/g, '\n')
      content = [ingredients, instructions].filter(s => s && s.trim()).join('\n\n')
      name = data.name || tempName
    } else if (result.type === 'summary') {
      const data = result.data
      if (typeof data === 'string') {
        content = data.replace(/\\n/g, '\n')
        const lines = content.split('\n')
        const headingLine = lines.find((line: string) => line.match(/^#{1,3}\s+(.+)/))
        if (headingLine) {
          name = headingLine.replace(/^#{1,3}\s+/, '').trim()
        }
      } else if (typeof data === 'object') {
        name = data.title || tempName
        content = (data.content || '').replace(/\\n/g, '\n')
      }
    }

    setTempName(name)
    setTempContent(content)

    onUpdateRecipe(recipe.id, {
      name: name,
      ingredients: '',
      instructions: content
    })
  }

  return (
    <AccordionItem ref={setNodeRef} style={style} key={recipe.id} value={`item-${recipe.id}`} className={`group border rounded-lg shadow-sm transition-all duration-200 ${isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:shadow-md'}`}>
      <div className="flex items-center w-full relative">
        {isSelectionMode ? (
          <div className="px-3 py-4 cursor-pointer" onClick={() => onToggleSelect(recipe.id)}>
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-amber-600" />
            ) : (
              <Square className="h-5 w-5 text-gray-400" />
            )}
          </div>
        ) : (
          <div {...attributes} {...listeners} className="px-3 py-2 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <AccordionTrigger ref={triggerRef} hideChevron className="flex-1 pt-4 pb-2 hover:no-underline text-left">
          <div className="flex items-center gap-3 flex-shrink min-w-0">
            <div className="flex-shrink-0">
              {faviconUrl && (
                <img src={faviconUrl} alt="" className="h-6 w-6 rounded" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              {editingName ? (
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') {
                      setTempName(recipe.name)
                      setEditingName(false)
                    }
                  }}
                  autoFocus
                  className="fluid-text-base font-semibold bg-white border-gray-300 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                recipe.name === 'タイトル' ? (
                  <p
                    className="truncate font-normal text-gray-400 italic fluid-text-base cursor-text"
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      setEditingName(true)
                    }}
                  >
                    ダブルクリックでタイトルを追加...
                  </p>
                ) : (
                  <p
                    className="truncate font-semibold fluid-text-base cursor-text"
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      setEditingName(true)
                    }}
                  >
                    {recipe.name}
                  </p>
                )
              )}
            </div>
          </div>
        </AccordionTrigger>
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
          onClick={() => triggerRef.current?.click()}
          aria-label="展開/折りたたみ"
        >
          <ChevronDown className="h-6 w-6 text-gray-500 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </div>

      {/* URL Input and AI Section (Always visible) */}
      <div className="px-8 pt-2 pb-4">
        {editingUrl ? (
          <div className="flex gap-2 items-center">
            <Input
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              onBlur={handleSaveUrl}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveUrl()
                if (e.key === 'Escape') {
                  setTempUrl(recipe.source_url || '')
                  setEditingUrl(false)
                }
              }}
              autoFocus={editingUrl}
              className="text-sm bg-white border-gray-300 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-grow"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-gray-600 flex-shrink-0"
              onClick={() => setEditingUrl(false)}
              title="編集をキャンセル"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {recipe.source_url ? (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 hover:underline bg-gray-100 px-3 py-1.5 rounded-md transition-colors truncate max-w-md"
                title={recipe.source_url}
                onDoubleClick={() => setEditingUrl(true)}
              >
                {recipe.source_url}
              </a>
            ) : (
              <p
                className="text-gray-400 italic text-sm cursor-pointer py-1.5"
                onDoubleClick={() => setEditingUrl(true)}
              >
                ダブルクリックでURLを追加...
              </p>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-gray-600 flex-shrink-0"
              onClick={() => setEditingUrl(true)}
              title="URLを編集"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {recipe.source_url && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRunAI}
                disabled={isScraping}
                className="h-8 w-8 hover:bg-amber-50 flex-shrink-0"
                title={hasUsedAI ? 'AI再取得' : 'AIで情報を取得'}
              >
                {hasUsedAI ? (
                  <RotateCw className={`h-4 w-4 ${isScraping ? 'animate-spin' : ''}`} />
                ) : (
                  <img src="/gemini.png" alt="Gemini AI" className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}
        {scrapeError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{scrapeError}</p>
          </div>
        )}
      </div>

      <AccordionContent className="px-8 pt-0 pb-6">
        <div className="space-y-6">
          <div className="pl-">
            {editingContent ? (
              <Textarea
                value={tempContent}
                onChange={(e) => setTempContent(e.target.value)}
                onBlur={handleSaveContent}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setTempContent(initialCombinedContent)
                    setEditingContent(false)
                  }
                }}
                autoFocus
                className="text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[300px] bg-white border-gray-300 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            ) : (
              <RecipeMarkdown 
                content={initialCombinedContent}
                url={recipe.source_url}
                onDoubleClick={() => setEditingContent(true)}
              />
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}