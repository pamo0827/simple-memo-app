import { supabase } from './supabase'
import type { UserSettings } from './supabase'

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
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
  userId: string,
  settings: {
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
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        ...settings,
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()

  if (error) {
    console.error('Settings upsert error:', error)
    return false
  }

  return true
}