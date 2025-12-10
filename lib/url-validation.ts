/**
 * URLが安全かどうかを検証
 * SSRF (Server-Side Request Forgery) 攻撃を防ぐ
 */
export function isAllowedUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)

    // プロトコルチェック（HTTPとHTTPSのみ許可）
    if (!['https:', 'http:'].includes(urlObj.protocol)) {
      return false
    }

    const hostname = urlObj.hostname.toLowerCase()

    // ローカルホストをブロック
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
      return false
    }

    // プライベートIPレンジをブロック
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    const match = hostname.match(ipv4Regex)
    if (match) {
      const octets = match.slice(1, 5).map(Number)

      // 各オクテットが0-255の範囲内であることを確認
      if (octets.some(octet => octet < 0 || octet > 255)) {
        return false
      }

      // 10.0.0.0/8 (プライベートネットワーク)
      if (octets[0] === 10) return false

      // 172.16.0.0/12 (プライベートネットワーク)
      if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return false

      // 192.168.0.0/16 (プライベートネットワーク)
      if (octets[0] === 192 && octets[1] === 168) return false

      // 169.254.0.0/16 (Link-local)
      if (octets[0] === 169 && octets[1] === 254) return false

      // 127.0.0.0/8 (ループバック)
      if (octets[0] === 127) return false

      // 0.0.0.0/8 (現在のネットワーク)
      if (octets[0] === 0) return false

      // 255.255.255.255 (ブロードキャスト)
      if (octets.every(octet => octet === 255)) return false
    }

    // IPv6のローカルアドレスをブロック
    if (
      hostname.startsWith('fe80:') ||  // Link-local
      hostname.startsWith('fc00:') ||  // Unique local address
      hostname.startsWith('fd00:') ||  // Unique local address
      hostname.startsWith('::1') ||    // Loopback
      hostname === '::' ||             // Unspecified
      hostname.startsWith('ff00:')     // Multicast
    ) {
      return false
    }

    // 危険なポートをブロック
    const dangerousPorts = [
      22,    // SSH
      23,    // Telnet
      25,    // SMTP
      3306,  // MySQL
      5432,  // PostgreSQL
      6379,  // Redis
      27017, // MongoDB
      9200,  // Elasticsearch
    ]

    if (urlObj.port && dangerousPorts.includes(parseInt(urlObj.port))) {
      return false
    }

    return true
  } catch (error) {
    // URL解析エラー
    return false
  }
}

/**
 * URLリストから安全なURLのみをフィルタリング
 */
export function filterAllowedUrls(urls: string[]): string[] {
  return urls.filter(url => isAllowedUrl(url))
}
