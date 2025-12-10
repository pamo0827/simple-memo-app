import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// 無料枠用のデフォルトAPIキー（環境変数から取得）
const DEFAULT_API_KEY = process.env.GEMINI_DEFAULT_API_KEY || ''
export const FREE_TIER_DAILY_LIMIT = 10

export interface UsageCheckResult {
  allowed: boolean
  apiKey: string
  isFreeTier: boolean
  remainingUsage: number
  errorMessage?: string
}

/**
 * 無料枠の使用制限をチェックし、使用回数を更新する
 * @param userId ユーザーID
 * @returns 使用可否、使用するAPIキー、残り使用回数
 */
export async function checkAndUpdateUsage(userId: string): Promise<UsageCheckResult> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Use Atomic RPC to prevent race conditions and ensure data integrity
  const { data, error } = await supabase.rpc('increment_free_tier_usage', {
    p_user_id: userId,
    p_daily_limit: FREE_TIER_DAILY_LIMIT
  })

  if (error) {
    console.error('[Free Tier] RPC Error:', error)
    return {
      allowed: false,
      apiKey: '',
      isFreeTier: false,
      remainingUsage: 0,
      errorMessage: 'システムエラーが発生しました。しばらく待ってから再試行してください。'
    }
  }

  // Handle RPC response (single row)
  // Supabase returns data as T[] for RETURNS TABLE, or T if .single() is used (but .rpc doesn't support .single() chain in all versions properly, safe to treat as array or object)
  // In typical Supabase JS v2, rpc returns the data directly. If RETURNS TABLE, it's an array of objects.
  const result = Array.isArray(data) ? data[0] : data

  if (!result) {
    return {
      allowed: false,
      apiKey: '',
      isFreeTier: false,
      remainingUsage: 0,
      errorMessage: 'ユーザー設定が見つかりません。'
    }
  }

  if (!result.allowed) {
    return {
      allowed: false,
      apiKey: DEFAULT_API_KEY,
      isFreeTier: result.is_free_tier,
      remainingUsage: 0,
      errorMessage: result.error_message || '制限に達しました。'
    }
  }

  return {
    allowed: true,
    apiKey: result.api_key || DEFAULT_API_KEY,
    isFreeTier: result.is_free_tier,
    remainingUsage: result.remaining_usage
  }
}
