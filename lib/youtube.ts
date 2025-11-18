import { Innertube } from 'youtubei.js'

/**
 * YouTube URLから動画IDを抽出
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting YouTube video ID:', error)
    return null
  }
}

/**
 * YouTube動画が短い動画（Shorts）かどうか判定
 */
export function isYouTubeShorts(url: string): boolean {
  return url.includes('/shorts/')
}

/**
 * YouTube動画の字幕を取得
 */
export async function getYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    const youtube = await Innertube.create()
    const info = await youtube.getInfo(videoId)

    // 字幕を取得
    const transcriptData = await info.getTranscript()

    if (!transcriptData) {
      return null
    }

    // 字幕テキストを結合
    const transcript = transcriptData.transcript?.content?.body?.initial_segments
      ?.map((segment: any) => segment.snippet?.text || '')
      .join(' ')
      .trim()

    return transcript || null
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error)
    return null
  }
}

/**
 * YouTube動画の情報を取得（タイトル、説明文など）
 */
export async function getYouTubeVideoInfo(videoId: string): Promise<{
  title: string
  description: string
  transcript: string | null
} | null> {
  try {
    const youtube = await Innertube.create()
    const info = await youtube.getInfo(videoId)

    const title = info.basic_info.title || ''
    const description = info.basic_info.short_description || ''
    const transcript = await getYouTubeTranscript(videoId)

    return {
      title,
      description,
      transcript,
    }
  } catch (error) {
    console.error('Error fetching YouTube video info:', error)
    return null
  }
}

/**
 * YouTube動画の全テキスト（タイトル、説明文、字幕）を結合
 */
export async function getYouTubeFullText(videoId: string): Promise<string | null> {
  try {
    const info = await getYouTubeVideoInfo(videoId)
    if (!info) {
      return null
    }

    const parts: string[] = []

    if (info.title) {
      parts.push(`タイトル: ${info.title}`)
    }

    if (info.description) {
      parts.push(`説明: ${info.description}`)
    }

    if (info.transcript) {
      parts.push(`字幕: ${info.transcript}`)
    }

    return parts.length > 0 ? parts.join('\n\n') : null
  } catch (error) {
    console.error('Error fetching YouTube full text:', error)
    return null
  }
}
