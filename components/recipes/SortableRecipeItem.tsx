'use client'

import { useState } from 'react'
import type { Recipe } from '@/lib/supabase'
import { GripVertical, CheckSquare, Square, FileText } from 'lucide-react' // FileText をインポート
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tweet } from 'react-tweet'
import YouTube from 'react-youtube'
import {
  extractTweetId, extractYouTubeId, isTwitterUrl, isYouTubeUrl,
  isInstagramUrl, getInstagramEmbedUrl
} from '@/lib/embed-helpers'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
  const [editingIngredients, setEditingIngredients] = useState(false)
  const [editingInstructions, setEditingInstructions] = useState(false)
  const [tempName, setTempName] = useState(recipe.name)
  const [tempUrl, setTempUrl] = useState(recipe.source_url || '')
  const [tempIngredients, setTempIngredients] = useState(recipe.ingredients)
  const [tempInstructions, setTempInstructions] = useState(recipe.instructions)

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

  const handleSaveIngredients = () => {
    if (tempIngredients !== recipe.ingredients && tempIngredients.trim()) {
      onUpdateRecipe(recipe.id, { ingredients: tempIngredients })
    }
    setEditingIngredients(false)
  }

  const handleSaveInstructions = () => {
    if (tempInstructions !== recipe.instructions && tempInstructions.trim()) {
      onUpdateRecipe(recipe.id, { instructions: tempInstructions })
    }
    setEditingInstructions(false)
  }

  return (
    <AccordionItem ref={setNodeRef} style={style} key={recipe.id} value={`item-${recipe.id}`} className={`border rounded-lg shadow-sm transition-all duration-200 ${isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:shadow-md'}`}>
      <div className="flex items-center justify-between pr-2">
        <div className="flex items-center flex-1 min-w-0">
          {isSelectionMode ? (
            <div className="px-3 py-4 cursor-pointer" onClick={() => onToggleSelect(recipe.id)}>
              {isSelected ? (
                <CheckSquare className="h-5 w-5 text-amber-600" />
              ) : (
                <Square className="h-5 w-5 text-gray-400" />
              )}
            </div>
          ) : (
            <div {...attributes} {...listeners} className="px-3 py-4 cursor-grab active:cursor-grabbing">
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <AccordionTrigger className="flex-1 pr-6 py-4 hover:no-underline w-full text-left">
            <div className="w-full table table-fixed">
              <div className="table-cell w-8">
                {faviconUrl ? (
                  <img src={faviconUrl} alt="" className="h-6 w-6 rounded" />
                ) : (
                  <FileText className="h-6 w-6 text-orange-500" />
                )}
              </div>
              <div className="table-cell align-middle">
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
                  <p
                    className="truncate font-semibold fluid-text-base cursor-text"
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      setEditingName(true)
                    }}
                  >
                    {recipe.name}
                  </p>
                )}
              </div>
            </div>
          </AccordionTrigger>
        </div>
      </div>
      <AccordionContent className="px-6 pt-0 pb-6">
        <div className="space-y-6">
          {(recipe.source_url || editingUrl) && (
            editingUrl ? (
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
                autoFocus
                className="text-sm bg-white border-gray-300 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="URL"
              />
            ) : (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 hover:underline bg-gray-100 px-3 py-1.5 rounded-md transition-colors break-all cursor-text"
                onDoubleClick={(e) => {
                  e.preventDefault()
                  setEditingUrl(true)
                }}
              >
                {recipe.source_url}
              </a>
            )
          )}

          <div className="space-y-6">
            {(recipe.ingredients.trim() || editingIngredients) && (
              <div className="border-l-4 border-yellow-500 pl-5 py-1">
                {editingIngredients ? (
                  <Textarea
                    value={tempIngredients}
                    onChange={(e) => setTempIngredients(e.target.value)}
                    onBlur={handleSaveIngredients}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setTempIngredients(recipe.ingredients)
                        setEditingIngredients(false)
                      }
                    }}
                    autoFocus
                    className="text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[100px] bg-white border-gray-300 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                ) : (
                  <div
                    className="prose prose-sm max-w-none cursor-text text-gray-700 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-2 [&_h2]:mt-0 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-gray-800 [&_h3]:mb-1 [&_h3]:mt-3 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5"
                    onDoubleClick={() => setEditingIngredients(true)}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipe.ingredients}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
            {(recipe.instructions.trim() || editingInstructions) && (
              <div className="border-l-4 border-amber-500 pl-5 py-1">
                {editingInstructions ? (
                  <Textarea
                    value={tempInstructions}
                    onChange={(e) => setTempInstructions(e.target.value)}
                    onBlur={handleSaveInstructions}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setTempInstructions(recipe.instructions)
                        setEditingInstructions(false)
                      }
                    }}
                    autoFocus
                    className="text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[150px] bg-white border-gray-300 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                ) : (
                  <div
                    className="prose prose-sm max-w-none cursor-text text-gray-700 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-2 [&_h2]:mt-0 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-gray-800 [&_h3]:mb-1 [&_h3]:mt-3 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5"
                    onDoubleClick={() => setEditingInstructions(true)}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipe.instructions}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {/* 埋め込みプレビュー */}
            {(() => {
              if (recipe.source_url) {
                const isTwitter = isTwitterUrl(recipe.source_url)
                const tweetId = extractTweetId(recipe.source_url)
                console.log('[Embed Debug]', {
                  recipeName: recipe.name,
                  url: recipe.source_url,
                  isTwitter,
                  tweetId
                })
                if (isTwitter && tweetId) {
                  return (
                    <div className="flex justify-center my-4 max-w-md mx-auto">
                      <Tweet id={tweetId} />
                    </div>
                  )
                }
              }
              return null
            })()}

            {recipe.source_url && isYouTubeUrl(recipe.source_url) && extractYouTubeId(recipe.source_url) && (
              <div className="flex justify-center my-4">
                <YouTube
                  videoId={extractYouTubeId(recipe.source_url)!}
                  opts={{
                    width: '100%',
                    maxWidth: '400',
                    playerVars: {
                      modestbranding: 1,
                      rel: 0,
                    },
                  }}
                  className="max-w-full"
                />
              </div>
            )}

            {/* Instagram埋め込み */}
            {recipe.source_url && isInstagramUrl(recipe.source_url) && getInstagramEmbedUrl(recipe.source_url) && (
              <div className="flex justify-center my-4">
                <iframe
                  src={getInstagramEmbedUrl(recipe.source_url)!}
                  width="400"
                  height="600"
                  allowTransparency={true}
                  className="max-w-full border-0"
                  style={{ overflow: 'hidden' }}
                />
              </div>
            )}

          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}