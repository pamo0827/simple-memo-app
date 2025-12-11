'use client'

import type { Recipe } from '@/lib/supabase'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useMemo } from 'react'
import { RecipeMarkdown } from './RecipeMarkdown'

export function SharedRecipeItem({
  recipe,
  faviconUrl,
}: {
  recipe: Recipe;
  faviconUrl: string | null;
}) {
  const combinedContent = useMemo(() => {
    return [recipe.ingredients, recipe.instructions]
      .filter(s => s && s.trim())
      .join('\n\n')
  }, [recipe.ingredients, recipe.instructions])

  return (
    <AccordionItem key={recipe.id} value={`item-${recipe.id}`} className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-white">
      <div className="flex items-center justify-between pr-2">
        <div className="flex items-center flex-1 min-w-0">
          <div className="pl-4 py-4 pr-0">
          </div>
          <AccordionTrigger className="flex-1 pr-6 py-4 hover:no-underline w-full text-left pl-2">
            <div className="w-full table table-fixed">
              <div className="table-cell w-8">
                {faviconUrl && (
                  <img src={faviconUrl} alt="" className="h-6 w-6 rounded" />
                )}
              </div>
              <div className="table-cell align-middle">
                <p className="truncate font-semibold fluid-text-base">
                  {recipe.name}
                </p>
              </div>
            </div>
          </AccordionTrigger>
        </div>
      </div>
      <AccordionContent className="px-8 pt-0 pb-6">
        <div className="space-y-6">
          {recipe.source_url && (
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 hover:underline bg-gray-100 px-3 py-1.5 rounded-md transition-colors break-all"
            >
              {recipe.source_url}
            </a>
          )}

          <div className="pl-5 py-1">
            <RecipeMarkdown 
              content={combinedContent}
              url={recipe.source_url}
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
