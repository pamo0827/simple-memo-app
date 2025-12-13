import { supabase as defaultClient, type SupabaseClient } from './supabase'

export interface Page {
  id: string
  user_id: string
  name: string
  list_order: string[]
  created_at: string
  updated_at: string
}

export async function getPages(userId: string, supabaseClient?: SupabaseClient): Promise<Page[]> {
  const supabase = supabaseClient || defaultClient
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('ページ取得エラー:', error)
    return []
  }

  return data || []
}

export async function createPage(userId: string, name: string, supabaseClient?: SupabaseClient): Promise<Page | null> {
  const supabase = supabaseClient || defaultClient
  const { data, error } = await supabase
    .from('pages')
    .insert([{ user_id: userId, name }])
    .select()
    .single()

  if (error) {
    console.error('ページ作成エラー:', error)
    return null
  }

  return data
}

export async function updatePage(id: string, updates: Partial<Page>, supabaseClient?: SupabaseClient): Promise<Page | null> {
  const supabase = supabaseClient || defaultClient
  const { data, error } = await supabase
    .from('pages')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('ページ更新エラー:', error)
    return null
  }

  return data
}

export async function deletePage(id: string, supabaseClient?: SupabaseClient): Promise<boolean> {
  const supabase = supabaseClient || defaultClient
  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('ページ削除エラー:', error)
    return false
  }

  return true
}

export async function updatePageOrder(pageId: string, listOrder: string[], supabaseClient?: SupabaseClient): Promise<boolean> {
  const supabase = supabaseClient || defaultClient
  const { error } = await supabase
    .from('pages')
    .update({ list_order: listOrder })
    .eq('id', pageId)

  if (error) {
    console.error('ページ順序更新エラー:', error)
    return false
  }

  return true
}
