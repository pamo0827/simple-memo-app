import { useState } from 'react'
import type { Recipe } from '@/lib/supabase'
import { GripVertical, CheckSquare, Square, FileText, Pencil, RotateCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tweet } from 'react-tweet'
import YouTube from 'react-youtube'
import {
  extractTweetId, extractYouTubeId, isTwitterUrl, isYouTubeUrl
} from '@/lib/embed-helpers'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRecipeScrap } from '@/hooks/useRecipeScrap'

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
  const [hasUsedAI, setHasUsedAI] = useState(false)

  const { scrapeUrl, isScraping, scrapeError } = useRecipeScrap()

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
    if (tempIngredients !== recipe.ingredients) {
      onUpdateRecipe(recipe.id, { ingredients: tempIngredients })
    }
    setEditingIngredients(false)
  }

  const handleSaveInstructions = () => {
    if (tempInstructions !== recipe.instructions) {
      onUpdateRecipe(recipe.id, { instructions: tempInstructions })
    }
    setEditingInstructions(false)
  }

  const handleRunAI = async () => {
    if (!tempUrl) return
    const result = await scrapeUrl(tempUrl, true)
    setHasUsedAI(true)

    if (result && result.type === 'recipe') {
      const data = result.data
      const ingredients = (data.ingredients || '').replace(/\\n/g, '\n')
      const instructions = (data.instructions || '').replace(/\\n/g, '\n')
      const name = data.name || tempName

      setTempName(name)
      setTempIngredients(ingredients)
      setTempInstructions(instructions)

      onUpdateRecipe(recipe.id, {
        name: name,
        ingredients: ingredients,
        instructions: instructions
      })
    } else if (result && result.type === 'summary') {
      // Handle both old format (string) and new format (object with title and content)
      let title = tempName
      let content = ''

      if (typeof result.data === 'string') {
        // Old format: extract title from markdown
        content = result.data.replace(/\\n/g, '\n')
        // Extract title from first heading
        const lines = content.split('\n')
        const headingLine = lines.find(line => line.match(/^#{1,3}\s+(.+)/))
        if (headingLine) {
          title = headingLine.replace(/^#{1,3}\s+/, '').trim()
        }
      } else if (result.data && typeof result.data === 'object') {
        // New format: use title and content separately
        title = result.data.title || tempName
        content = (result.data.content || '').replace(/\\n/g, '\n')
      }

      setTempName(title)
      setTempInstructions(content)

      onUpdateRecipe(recipe.id, {
        name: title,
        instructions: content
      })
    }
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
                {faviconUrl && (
                  <img src={faviconUrl} alt="" className="h-6 w-6 rounded" />
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
      <AccordionContent className="px-8 pt-0 pb-6">
        <div className="space-y-6">
          <div className="space-y-2">
            {(recipe.source_url || editingUrl) || !recipe.source_url ? (
                editingUrl || !recipe.source_url ? (
                <div className="flex gap-2">
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
                        className="text-sm bg-white border-gray-300 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="URL (オプション)"
                    />
                </div>
                ) : (
                <div className="flex items-center gap-2">
                    <a
                    href={recipe.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 hover:underline bg-gray-100 px-3 py-1.5 rounded-md transition-colors truncate max-w-md"
                    title={recipe.source_url}
                    >
                    {recipe.source_url}
                    </a>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-gray-600 flex-shrink-0"
                        onClick={() => setEditingUrl(true)}
                        title="URLを編集"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    {/* AI抽出ボタン */}
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
                </div>
                )
            ) : null}

            {/* AIエラーメッセージ */}
            {scrapeError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{scrapeError}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="pl-5 py-1">
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
                  className="text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[250px] bg-white border-gray-300 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              ) : (
                <div
                  className="prose prose-sm max-w-none cursor-text text-gray-700 leading-loose [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h2]:mt-0 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-gray-800 [&_h3]:mb-2 [&_h3]:mt-4 [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1.5 [&_p]:my-3 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 min-h-[40px]"
                  onDoubleClick={() => setEditingIngredients(true)}
                >
                  {recipe.ingredients.trim() ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipe.ingredients}</ReactMarkdown>
                  ) : (
                    <p className="text-gray-400 italic">ダブルクリックして食材を追加...</p>
                  )}
                </div>
              )}
            </div>
            <div className="pl-5 py-1">
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
                  className="text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[300px] bg-white border-gray-300 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              ) : (
                <div
                  className="prose prose-sm max-w-none cursor-text text-gray-700 leading-loose [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h2]:mt-0 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-gray-800 [&_h3]:mb-2 [&_h3]:mt-4 [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1.5 [&_p]:my-3 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 min-h-[40px]"
                  onDoubleClick={() => setEditingInstructions(true)}
                >
                  {recipe.instructions.trim() ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipe.instructions}</ReactMarkdown>
                  ) : (
                    <p className="text-gray-400 italic">ダブルクリックして手順を追加...</p>
                  )}
                </div>
              )}
            </div>

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

          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}