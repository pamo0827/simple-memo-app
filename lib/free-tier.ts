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

  // ユーザー設定を取得
  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('gemini_api_key, is_using_free_tier, daily_usage_count, last_usage_date')
    .eq('user_id', userId)
    .single()

  if (settingsError || !settings) {
    return {
      allowed: false,
      apiKey: '',
      isFreeTier: false,
      remainingUsage: 0,
      errorMessage: 'ユーザー設定が見つかりません。'
    }
  }

  // 独自のAPIキーを持っている場合は無制限
  if (settings.gemini_api_key && settings.gemini_api_key.trim() !== '') {
    return {
      allowed: true,
      apiKey: settings.gemini_api_key,
      isFreeTier: false,
      remainingUsage: -1 // 無制限
    }
  }

  // デフォルトAPIキーが設定されていない場合のエラー
  if (!DEFAULT_API_KEY) {
    return {
      allowed: false,
      apiKey: '',
      isFreeTier: true,
      remainingUsage: 0,
      errorMessage: 'デフォルトAPIキーが設定されていません。管理者に連絡してください。'
    }
  }

  // 無料枠を使用している場合
  const today = new Date().toISOString().split('T')[0]
  const lastUsageDate = settings.last_usage_date

  let currentUsageCount = settings.daily_usage_count || 0

  // 日付が変わっていたらカウントをリセット
  if (lastUsageDate !== today) {
    currentUsageCount = 0
  }

  // 使用制限チェック
  if (currentUsageCount >= FREE_TIER_DAILY_LIMIT) {
    return {
      allowed: false,
      apiKey: DEFAULT_API_KEY,
      isFreeTier: true,
      remainingUsage: 0,
      errorMessage: `無料枠の1日の上限（${FREE_TIER_DAILY_LIMIT}回）に達しました。独自のGemini APIキーを設定すると、制限なく使用できます。`
    }
  }

  // カウントをインクリメント
  const newCount = currentUsageCount + 1
  const { error: updateError } = await supabase
    .from('user_settings')
    .update({
      daily_usage_count: newCount,
      last_usage_date: today,
      is_using_free_tier: true
    })
    .eq('user_id', userId)

  if (updateError) {
    console.error('[Free Tier] Failed to update usage count:', updateError)
  }

  return {
    allowed: true,
    apiKey: DEFAULT_API_KEY,
    isFreeTier: true,
    remainingUsage: FREE_TIER_DAILY_LIMIT - newCount
  }
}
