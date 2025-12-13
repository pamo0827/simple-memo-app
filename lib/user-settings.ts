import { supabase as defaultClient } from './supabase'
import type { UserSettings } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getUserSettings(userId: string, supabaseClient?: SupabaseClient): Promise<UserSettings | null> {
  const supabase = supabaseClient || defaultClient
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Settings fetch error:', error)
    return null
  }

  return data
}

export async function upsertUserSettings(
  clientOrUserId: SupabaseClient | string,
  userIdOrSettings: string | {
    nickname?: string | null
    avatar_url?: string | null
    avatar_provider?: 'twitter' | 'manual' | null
    avatar_storage_path?: string | null
    gemini_api_key?: string | null
    summary_length?: 'short' | 'medium' | 'long' | null
    ai_summary_enabled?: boolean | null
    auto_ai_summary?: boolean | null
    custom_prompt?: string | null
    sidebar_visible?: boolean | null
    font_family?: 'system' | 'serif' | 'mono' | null
    font_size?: 'small' | 'medium' | 'large' | null
  },
  settings?: {
    nickname?: string | null
    avatar_url?: string | null
    avatar_provider?: 'twitter' | 'manual' | null
    avatar_storage_path?: string | null
    gemini_api_key?: string | null
    list_order?: string[] | null
    summary_length?: 'short' | 'medium' | 'long' | null
    ai_summary_enabled?: boolean | null
    auto_ai_summary?: boolean | null
    custom_prompt?: string | null
    sidebar_visible?: boolean | null
    font_family?: 'system' | 'serif' | 'mono' | null
    font_size?: 'small' | 'medium' | 'large' | null
  }
): Promise<boolean> {
  let supabase = defaultClient
  let uid: string
  let dataToUpsert: any

  // Overload handling
  if (typeof clientOrUserId === 'object' && 'from' in clientOrUserId) {
    supabase = clientOrUserId as SupabaseClient
    uid = userIdOrSettings as string
    dataToUpsert = settings
  } else {
    uid = clientOrUserId as string
    dataToUpsert = userIdOrSettings
  }

  console.log('upsertUserSettings: Upserting for user:', uid)

  try {
    // API経由で保存（RLS回避のため）
    const response = await fetch('/api/user/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        settings: dataToUpsert
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('upsertUserSettings: API Error:', errorData)

      // フォールバック: APIが失敗した場合は直接Supabaseを試す
      console.log('upsertUserSettings: Falling back to direct Supabase call')
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: uid,
            ...dataToUpsert,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id',
          }
        )

      if (error) {
        console.error('upsertUserSettings: Direct call error:', error)
        return false
      }
    }

    console.log('upsertUserSettings: Success')
    return true
  } catch (e) {
    console.error('upsertUserSettings: Exception:', e)
    return false
  }
}