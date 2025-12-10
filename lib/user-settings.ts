import { supabase } from './supabase'
import type { UserSettings } from './supabase'

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  console.log('Fetching settings for user:', userId)

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  console.log('getUserSettings result:', { data, error })

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
    gemini_api_key?: string | null
    list_order?: string[] | null
    summary_length?: 'short' | 'medium' | 'long' | null
    ai_summary_enabled?: boolean | null
    custom_prompt?: string | null
    sidebar_visible?: boolean | null
    font_family?: 'system' | 'serif' | 'mono' | null
    font_size?: 'small' | 'medium' | 'large' | null
  }
): Promise<boolean> {
  console.log('Upserting settings for user:', userId, 'with settings:', settings)

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

  console.log('upsertUserSettings result:', { data, error })

  if (error) {
    console.error('Settings upsert error:', error)
    return false
  }

  return true
}