/**
 * InstagramのURLから画像URLを取得する
 * 注意：Instagramの非公式エンドポイントを使用しています。
 * 今後変更される可能性があります。
 */

export async function getInstagramImageUrl(url: string): Promise<string | null> {
  try {
    console.log('[Instagram] Fetching image from:', url)

    // InstagramのURLからショートコードを抽出
    const shortcodeMatch = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/)
    if (!shortcodeMatch) {
      console.log('[Instagram] Invalid URL format - no shortcode found')
      throw new Error('有効なInstagram URLではありません')
    }

    const shortcode = shortcodeMatch[1]
    console.log('[Instagram] Extracted shortcode:', shortcode)

    // 方法1: 公式oEmbed APIを試す（最も信頼性が高い）
    try {
      // URLをクリーンアップ（クエリパラメータを除去）
      const cleanUrl = url.split('?')[0]
      const encodedUrl = encodeURIComponent(cleanUrl)
      const oembedUrl = `https://www.instagram.com/p/oembed/?url=${encodedUrl}`
      console.log('[Instagram] Trying official oEmbed API for image (cleaned URL):', cleanUrl)

      const response = await fetch(oembedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })

      console.log('[Instagram] oEmbed API response status:', response.status, response.statusText)

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        console.log('[Instagram] oEmbed content-type:', contentType)

        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          console.log('[Instagram] oEmbed API response:', data)

          // thumbnail_urlフィールドから画像URLを取得
          if (data.thumbnail_url) {
            console.log('[Instagram] Found thumbnail_url:', data.thumbnail_url)
            return data.thumbnail_url
          }
        } else {
          console.log('[Instagram] oEmbed API returned non-JSON response')
          const text = await response.text()
          console.log('[Instagram] Response preview:', text.substring(0, 200))
        }
      } else {
        console.log('[Instagram] oEmbed API failed with status:', response.status)
      }
    } catch (error) {
      console.error('[Instagram] Official oEmbed method failed:', error)
    }

    // 方法2: HTMLから直接画像URLを抽出
    try {
      console.log('[Instagram] Trying HTML extraction for image')
      const cleanUrl = url.split('?')[0]
      const response = await fetch(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        },
      })

      console.log('[Instagram] HTML fetch status:', response.status, response.statusText)

      if (response.ok) {
        const html = await response.text()
        console.log('[Instagram] HTML length:', html.length)

        // 方法2-1: meta og:imageから画像URLを抽出（複数のパターンを試す）
        const ogImagePatterns = [
          /<meta property="og:image" content="([^"]+)"/,
          /<meta property='og:image' content='([^']+)'/,
          /<meta\s+property="og:image"\s+content="([^"]+)"/i,
        ]

        for (const pattern of ogImagePatterns) {
          const match = html.match(pattern)
          if (match) {
            console.log('[Instagram] Found og:image:', match[1])
            return match[1]
          }
        }
        console.log('[Instagram] No og:image meta tag found')

        // 方法2-2: 埋め込みJSONからdisplay_urlを探す
        try {
          // script タグ内のJSONデータを探す
          const scriptMatches = html.matchAll(/<script[^>]*>(.*?)<\/script>/gs)
          for (const scriptMatch of scriptMatches) {
            const scriptContent = scriptMatch[1]
            if (scriptContent.includes('display_url') || scriptContent.includes('display_resources')) {
              // display_urlパターンを探す
              const displayUrlMatch = scriptContent.match(/"display_url":"([^"]+)"/)
              if (displayUrlMatch) {
                const imageUrl = displayUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/')
                console.log('[Instagram] Found display_url in script:', imageUrl)
                return imageUrl
              }
            }
          }
          console.log('[Instagram] No display_url in script tags')
        } catch (error) {
          console.error('[Instagram] Error parsing script tags:', error)
        }

        // 方法2-3: thumbnail_urlを探す
        const thumbnailMatch = html.match(/"thumbnail_url":"([^"]+)"/)
        if (thumbnailMatch) {
          const imageUrl = thumbnailMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/')
          console.log('[Instagram] Found thumbnail_url:', imageUrl)
          return imageUrl
        }

        // 方法2-4: imgタグから画像URLを抽出（DOM内の画像）
        try {
          // Instagram Reelsの画像はclass="x5yr21d xu96u03 x10l6tqk x13vifvy x87ps6o xh8yej3"のようなimgタグにある
          const imgPatterns = [
            /<img[^>]*class="[^"]*x5yr21d[^"]*"[^>]*src="([^"]+)"/,
            /<img[^>]*src="(https:\/\/[^"]*cdninstagram[^"]+)"/,
            /<img[^>]*decoding="auto"[^>]*src="([^"]+)"/,
          ]

          for (const pattern of imgPatterns) {
            const imgMatch = html.match(pattern)
            if (imgMatch && imgMatch[1] && !imgMatch[1].includes('profile')) {
              console.log('[Instagram] Found image in img tag:', imgMatch[1])
              return imgMatch[1]
            }
          }
          console.log('[Instagram] No img tag with suitable src found')
        } catch (error) {
          console.error('[Instagram] Error parsing img tags:', error)
        }

        // デバッグ: "display_url"が含まれているか確認
        const hasDisplayUrl = html.includes('display_url')
        const hasImg = html.includes('<img')
        console.log('[Instagram] HTML contains display_url:', hasDisplayUrl)
        console.log('[Instagram] HTML contains img tag:', hasImg)
        console.log('[Instagram] No image URL found in HTML')
      } else {
        console.log('[Instagram] HTML fetch failed with status:', response.status)
      }
    } catch (error) {
      console.error('[Instagram] HTML image extraction failed:', error)
    }

    console.log('[Instagram] All image extraction methods failed')
    return null
  } catch (error) {
    console.error('[Instagram] Image extraction error:', error)
    return null
  }
}

/**
 * Instagramの投稿からキャプション（説明文）を取得
 */
export async function getInstagramCaption(url: string): Promise<string | null> {
  try {
    console.log('[Instagram] Fetching caption from:', url)

    // 方法1: Instagram公式oEmbed APIを使用
    try {
      // URLをクリーンアップ（クエリパラメータを除去）
      const cleanUrl = url.split('?')[0]
      const encodedUrl = encodeURIComponent(cleanUrl)
      const oembedUrl = `https://www.instagram.com/p/oembed/?url=${encodedUrl}`

      console.log('[Instagram] Trying oEmbed API (cleaned URL):', cleanUrl)
      const response = await fetch(oembedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })

      console.log('[Instagram] oEmbed API response status:', response.status, response.statusText)

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        console.log('[Instagram] oEmbed content-type:', contentType)

        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          console.log('[Instagram] oEmbed response:', data)

          // titleフィールドにキャプションが含まれることがある
          if (data.title) {
            console.log('[Instagram] Caption found in title:', data.title)
            return data.title
          }

          // author_nameとtitleを組み合わせる場合もある
          if (data.author_name) {
            console.log('[Instagram] Found author:', data.author_name)
          }
        } else {
          console.log('[Instagram] oEmbed API returned non-JSON response')
          const text = await response.text()
          console.log('[Instagram] Response preview:', text.substring(0, 200))
        }
      } else {
        console.log('[Instagram] oEmbed API failed with status:', response.status)
      }
    } catch (error) {
      console.error('[Instagram] oEmbed method failed:', error)
    }

    // 方法2: HTMLから直接キャプションを抽出
    try {
      console.log('[Instagram] Trying HTML extraction for caption')
      const cleanUrl = url.split('?')[0]
      const response = await fetch(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        },
      })

      console.log('[Instagram] HTML fetch status:', response.status, response.statusText)

      if (response.ok) {
        const html = await response.text()
        console.log('[Instagram] HTML length:', html.length)

        // 方法2-1: meta descriptionからキャプションを抽出（複数のパターンを試す）
        const ogDescPatterns = [
          /<meta property="og:description" content="([^"]+)"/,
          /<meta property='og:description' content='([^']+)'/,
          /<meta\s+property="og:description"\s+content="([^"]+)"/i,
        ]

        for (const pattern of ogDescPatterns) {
          const match = html.match(pattern)
          if (match) {
            const description = match[1]
            console.log('[Instagram] Found meta description:', description)

            // HTMLエンティティをデコード
            const decoded = description
              .replace(/&quot;/g, '"')
              .replace(/&#039;/g, "'")
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')

            // "X Likes, Y Comments - キャプション" の形式から抽出
            const captionMatch = decoded.match(/(?:Likes?,.*?Comments?\s*[-–—]\s*)?(.+?)(?:\s+on\s+Instagram)?$/i)
            if (captionMatch && captionMatch[1]) {
              console.log('[Instagram] Extracted caption:', captionMatch[1])
              return captionMatch[1].trim()
            }

            return decoded
          }
        }
        console.log('[Instagram] No og:description meta tag found')

        // 方法2-2: 埋め込みJSONからcaptionを探す
        try {
          // script タグ内のJSONデータを探す
          const scriptMatches = html.matchAll(/<script[^>]*>(.*?)<\/script>/gs)
          for (const scriptMatch of scriptMatches) {
            const scriptContent = scriptMatch[1]
            if (scriptContent.includes('edge_media_to_caption') || scriptContent.includes('"text"')) {
              // edge_media_to_caption構造を探す
              const captionPattern = /"edge_media_to_caption":\s*\{\s*"edges":\s*\[\s*\{\s*"node":\s*\{\s*"text":\s*"([^"]+)"/
              const captionMatch = scriptContent.match(captionPattern)
              if (captionMatch) {
                const caption = captionMatch[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"')
                  .replace(/\\\//g, '/')
                console.log('[Instagram] Found caption in script:', caption)
                return caption
              }
            }
          }
          console.log('[Instagram] No caption in script tags')
        } catch (error) {
          console.error('[Instagram] Error parsing script tags for caption:', error)
        }

        // 方法2-3: h1タグからキャプションを抽出（Instagram Reels用）
        try {
          // h1タグでdir="auto"のものを探す（Reelsのキャプション）
          const h1Pattern = /<h1[^>]*class="[^"]*_ap3a[^"]*"[^>]*dir="auto"[^>]*>(.*?)<\/h1>/s
          const h1Match = html.match(h1Pattern)
          if (h1Match) {
            let caption = h1Match[1]
            // HTMLタグを除去（<br>を改行に、<a>タグのテキストのみ抽出）
            caption = caption
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<a[^>]*>([^<]+)<\/a>/g, '$1')
              .replace(/<[^>]+>/g, '')
              .trim()

            console.log('[Instagram] Found caption in h1 tag:', caption.substring(0, 100))
            return caption
          }
          console.log('[Instagram] No h1 caption tag found')
        } catch (error) {
          console.error('[Instagram] Error parsing h1 tag:', error)
        }

        // デバッグ: "caption"や"text"が含まれているか確認
        const hasCaption = html.includes('edge_media_to_caption')
        const hasH1 = html.includes('<h1')
        console.log('[Instagram] HTML contains edge_media_to_caption:', hasCaption)
        console.log('[Instagram] HTML contains h1:', hasH1)
        console.log('[Instagram] No meta description found')
      } else {
        console.log('[Instagram] HTML fetch failed with status:', response.status)
      }
    } catch (error) {
      console.error('[Instagram] HTML caption extraction failed:', error)
    }

    console.log('[Instagram] All caption extraction methods failed')
    return null
  } catch (error) {
    console.error('[Instagram] Caption extraction error:', error)
    return null
  }
}

/**
 * Instagram画像をBase64エンコードして取得
 */
export async function getInstagramImageAsBase64(url: string): Promise<string | null> {
  try {
    const imageUrl = await getInstagramImageUrl(url)
    if (!imageUrl) {
      return null
    }

    const response = await fetch(imageUrl)
    if (!response.ok) {
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    return base64
  } catch (error) {
    console.error('Instagram image download error:', error)
    return null
  }
}

/**
 * Instagramの投稿から画像とキャプションの両方を取得
 */
export async function getInstagramContent(url: string): Promise<{
  imageBase64: string | null
  caption: string | null
}> {
  const [imageBase64, caption] = await Promise.all([
    getInstagramImageAsBase64(url),
    getInstagramCaption(url)
  ])

  return { imageBase64, caption }
}
