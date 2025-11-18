'use client'

import { Tweet } from 'react-tweet'
import YouTube from 'react-youtube'
import { extractTweetId, extractYouTubeId, isTwitterUrl, isYouTubeUrl } from '@/lib/embed-helpers'

interface EmbedPreviewProps {
  sourceUrl: string
}

export function EmbedPreview({ sourceUrl }: EmbedPreviewProps) {
  // X/Twitter埋め込み
  if (isTwitterUrl(sourceUrl)) {
    const tweetId = extractTweetId(sourceUrl)
    if (tweetId) {
      return (
        <div className="flex justify-center my-4 max-w-md mx-auto">
          <Tweet id={tweetId} />
        </div>
      )
    }
  }

  // YouTube埋め込み
  if (isYouTubeUrl(sourceUrl)) {
    const videoId = extractYouTubeId(sourceUrl)
    if (videoId) {
      return (
        <div className="flex justify-center my-4">
          <YouTube
            videoId={videoId}
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
      )
    }
  }

  return null
}
