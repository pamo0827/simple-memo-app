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
    // Called with (client, userId, settings)
    supabase = clientOrUserId as SupabaseClient
    uid = userIdOrSettings as string
    dataToUpsert = settings
    console.log('upsertUserSettings: Using provided client')
  } else {
    // Called with (userId, settings) - Legacy
    uid = clientOrUserId as string
    dataToUpsert = userIdOrSettings
    console.log('upsertUserSettings: Using default client')
  }

  console.log('upsertUserSettings: Upserting for user:', uid)
  console.log('upsertUserSettings: Data keys:', Object.keys(dataToUpsert))

  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: uid,
        ...dataToUpsert,
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()

  if (error) {
    console.error('upsertUserSettings: Upsert error:', error)
    console.error('upsertUserSettings: Error details:', JSON.stringify(error))
    return false
  }

  console.log('upsertUserSettings: Success, rows affected:', data?.length || 0)
  return true
}