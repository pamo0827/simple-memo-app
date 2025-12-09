import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})

export type RecipeSection = {
  title: string
  content: string
}

export type Recipe = {
  id: string
  user_id: string
  name: string
  description?: string
  ingredients: string
  instructions: string
  sections?: RecipeSection[]
  source_url?: string
  display_order?: number
  created_at: string
  updated_at: string
}

export type RecipeInput = Omit<Recipe, 'id' | 'created_at' | 'updated_at' | 'user_id'>

export type UserSettings = {
  id: string
  user_id: string
  nickname: string | null
  gemini_api_key: string | null
  gemini_model_name: string | null
  list_order: string[] | null
  public_share_id: string | null
  are_recipes_public: boolean
  ai_summary_enabled: boolean
  custom_prompt: string | null
  sidebar_visible: boolean
  is_using_free_tier: boolean
  daily_usage_count: number
  last_usage_date: string
  summary_length: number
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  user_id: string
  name: string
  created_at: string
}