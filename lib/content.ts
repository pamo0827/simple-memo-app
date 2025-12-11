import { Innertube } from 'youtubei.js'
import { isAllowedUrl } from './url-validation'

function isYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
  return youtubeRegex.test(url)
}

function getVideoId(url: string): string | null {
  const patterns = [
    /(?:v=|\/)([a-zA-Z0-9_-]{11})/, // Standard `?v=` or `/`
    /^([a-zA-Z0-9_-]{11})$/         // Just the ID
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export async function getContentText(url: string): Promise<string> {
  // SSRF対策: URLの安全性を検証
  if (!isAllowedUrl(url)) {
    throw new Error('Invalid or forbidden URL')
  }

  if (isYouTubeUrl(url)) {
    const videoId = getVideoId(url)
    if (!videoId) {
      throw new Error('Invalid YouTube URL: Could not extract video ID.')
    }
    const youtube = await Innertube.create()
    const info = await youtube.getBasicInfo(videoId)
    return info?.basic_info?.short_description || ''
  } else {
    // タイムアウトとブラウザ風のヘッダーを設定
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10秒でタイムアウト
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
    }
    const html = await response.text()
    // Basic HTML cleaning
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000) // Limit content size to avoid overly large payloads
  }
}
