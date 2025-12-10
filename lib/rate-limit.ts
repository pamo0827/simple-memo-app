import { NextRequest, NextResponse } from 'next/server'

/**
 * シンプルなインメモリレート制限
 * 本番環境では Redis や Upstash Rate Limit の使用を推奨
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// クリーンアップ: 1時間ごとに期限切れエントリを削除
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60 * 60 * 1000) // 1時間

/**
 * IPアドレスを取得（Cloudflare, Vercel, その他のプロキシに対応）
 */
export function getClientIp(request: NextRequest): string {
  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp

  // Vercel
  const xRealIp = request.headers.get('x-real-ip')
  if (xRealIp) return xRealIp

  // 一般的なプロキシ
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }

  // フォールバック（開発環境など）
  return 'unknown'
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  errorMessage?: string
}

/**
 * レート制限をチェック
 * @param identifier - 通常はIPアドレス、オプションでユーザーIDと組み合わせ
 * @param maxRequests - 時間窓内の最大リクエスト数
 * @param windowMs - 時間窓（ミリ秒）
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // デフォルト: 15分
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || entry.resetAt < now) {
    // 新しいエントリまたは期限切れ
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs
    })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs
    }
  }

  if (entry.count >= maxRequests) {
    // 制限超過
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      errorMessage: `レート制限に達しました。${Math.ceil((entry.resetAt - now) / 1000 / 60)
}分後に再試行してください。`
    }
  }

  // カウントを増やす
  entry.count++
  rateLimitStore.set(identifier, entry)

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt
  }
}

/**
 * リクエストのレート制限をチェック（ヘルパー関数）
 */
export function checkRequestRateLimit(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000
): RateLimitResult {
  const ip = getClientIp(request)
  return checkRateLimit(ip, maxRequests, windowMs)
}

/**
 * API Route Handler用の高階関数（Decorator Pattern）
 * SOLID: Open/Closed Principle - 既存のハンドラーを変更せずにレート制限機能を追加可能
 */
type RouteHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse>

export function withRateLimit(
  handler: RouteHandler, 
  maxRequests: number = 100, 
  windowMs: number = 15 * 60 * 1000
): RouteHandler {
  return async (req: NextRequest, ...args: any[]) => {
    const result = checkRequestRateLimit(req, maxRequests, windowMs)
    
    if (!result.allowed) {
      return NextResponse.json(
        { error: result.errorMessage || 'Too Many Requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) } }
      )
    }
    
    return handler(req, ...args)
  }
}

