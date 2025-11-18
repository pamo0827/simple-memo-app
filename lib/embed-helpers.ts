/**
 * XのツイートIDをURLから抽出する
 * 対応形式:
 * - https://x.com/username/status/1234567890
 * - https://twitter.com/username/status/1234567890
 */
export function extractTweetId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const match = urlObj.pathname.match(/\/status\/(\d+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * YouTube動画IDをURLから抽出する
 * 対応形式:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  try {
    const urlObj = new URL(url)

    // youtu.be形式
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1).split('?')[0]
    }

    // youtube.com/watch?v=形式
    if (urlObj.pathname === '/watch') {
      return urlObj.searchParams.get('v')
    }

    // youtube.com/embed/形式 または /shorts/形式
    const match = urlObj.pathname.match(/\/(embed|shorts)\/([^/?]+)/)
    if (match) {
      return match[2]
    }

    return null
  } catch {
    return null
  }
}

/**
 * URLがXのツイートURLかどうかを判定
 */
export function isTwitterUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return (urlObj.hostname === 'x.com' || urlObj.hostname === 'twitter.com') &&
           urlObj.pathname.includes('/status/')
  } catch {
    return false
  }
}

/**
 * URLがYouTubeのURLかどうかを判定
 */
export function isYouTubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return (urlObj.hostname === 'youtube.com' ||
            urlObj.hostname === 'www.youtube.com' ||
            urlObj.hostname === 'youtu.be' ||
            urlObj.hostname === 'm.youtube.com')
  } catch {
    return false
  }
}

/**
 * URLがInstagramのURLかどうかを判定
 */
export function isInstagramUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === 'instagram.com' ||
           urlObj.hostname === 'www.instagram.com'
  } catch {
    return false
  }
}

/**
 * Instagram投稿のURLを埋め込み用URLに変換
 */
export function getInstagramEmbedUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    if (!isInstagramUrl(url)) return null

    // /p/ または /reel/ のパスを探す
    const match = urlObj.pathname.match(/\/(p|reel)\/([^/?]+)/)
    if (!match) return null

    return `https://www.instagram.com/${match[1]}/${match[2]}/embed`
  } catch {
    return null
  }
}

