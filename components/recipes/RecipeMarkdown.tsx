import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tweet } from 'react-tweet'
import YouTube from 'react-youtube'
import {
  extractTweetId, extractYouTubeId, isTwitterUrl, isYouTubeUrl
} from '@/lib/embed-helpers'
import { memo } from 'react'

interface RecipeMarkdownProps {
  content: string
  url?: string | null
  onDoubleClick?: () => void
  className?: string
}

export const RecipeMarkdown = memo(function RecipeMarkdown({ 
  content, 
  url,
  onDoubleClick, 
  className 
}: RecipeMarkdownProps) {
  return (
    <div className="space-y-3">
      <div 
        className={`prose prose-xs max-w-none text-gray-500 text-xs leading-relaxed [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-gray-700 [&_h2]:mb-2 [&_h2]:mt-0 [&_h3]:text-xs [&_h3]:font-medium [&_h3]:text-gray-600 [&_h3]:mb-1.5 [&_h3]:mt-3 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_p]:my-2 [&_strong]:font-semibold [&_strong]:text-gray-700 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-4 [&_ol]:pl-4 ${onDoubleClick ? 'cursor-text' : ''} ${className}`}
        onDoubleClick={onDoubleClick}
      >
        {content.trim() ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        ) : (
          onDoubleClick && <p className="text-gray-400 italic text-xs mt-0">ダブルクリックしてメモを追加...</p>
        )}
      </div>

      {/* 埋め込みプレビュー */}
      {(() => {
        if (url) {
          const isTwitter = isTwitterUrl(url)
          const tweetId = extractTweetId(url)
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

      {url && isYouTubeUrl(url) && extractYouTubeId(url) && (
        <div className="flex justify-center my-4">
          <YouTube
            videoId={extractYouTubeId(url)!}
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
  )
})
