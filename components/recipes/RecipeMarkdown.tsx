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
        className={`prose prose-sm max-w-none text-gray-700 leading-loose [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h2]:mt-0 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-gray-800 [&_h3]:mb-2 [&_h3]:mt-4 [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1.5 [&_p]:my-3 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 ${onDoubleClick ? 'cursor-text' : ''} ${className}`}
        onDoubleClick={onDoubleClick}
      >
        {content.trim() ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        ) : (
          onDoubleClick && <p className="text-gray-400 italic mt-0">ダブルクリックしてメモを追加...</p>
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
