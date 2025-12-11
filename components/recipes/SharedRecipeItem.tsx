'use client'

import type { Recipe } from '@/lib/supabase'
import { FileText } from 'lucide-react'
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

export function SharedRecipeItem({
  recipe,
  faviconUrl,
}: {
  recipe: Recipe;
  faviconUrl: string | null;
}) {
  return (
    <AccordionItem key={recipe.id} value={`item-${recipe.id}`} className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-white">
      <div className="flex items-center justify-between pr-2">
        <div className="flex items-center flex-1 min-w-0">
          <div className="pl-4 py-4 pr-0">
            {/* GripVertical icon placeholder or just empty space to align with main app if needed, 
                but since it's read-only, we might not need the extra padding/icon space on the left 
                unless we want exact visual parity. Let's keep it simple for now but keep structure similar. */}
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

          <div className="space-y-6">
            {recipe.ingredients.trim() && (
              <div className="pl-5 py-1">
                <div className="prose prose-sm max-w-none text-gray-700 leading-loose [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h2]:mt-0 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-gray-800 [&_h3]:mb-2 [&_h3]:mt-4 [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1.5 [&_p]:my-3 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipe.ingredients}</ReactMarkdown>
                </div>
              </div>
            )}
            {recipe.instructions.trim() && (
              <div className="pl-5 py-1">
                <div className="prose prose-sm max-w-none text-gray-700 leading-loose [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h2]:mt-0 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-gray-800 [&_h3]:mb-2 [&_h3]:mt-4 [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1.5 [&_p]:my-3 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipe.instructions}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* 埋め込みプレビュー */}
            {(() => {
              if (recipe.source_url) {
                const isTwitter = isTwitterUrl(recipe.source_url)
                const tweetId = extractTweetId(recipe.source_url)
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
