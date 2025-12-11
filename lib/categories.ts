import { supabase } from './supabase'
import type { Category } from './supabase'

export async function getCategories(userId: string, pageId?: string): Promise<Category[]> {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (pageId) {
    query = query.eq('page_id', pageId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Categories fetch error:', error)
    return []
  }
  return data || []
}

export async function createCategory(userId: string, name: string, pageId?: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: userId, name, page_id: pageId })
    .select()
    .single()

  if (error) {
    console.error('Category creation error:', error)
    return null
  }
  return data
}

export async function updateCategory(id: string, name: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Category update error:', error)
    return null
  }
  return data
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Category deletion error:', error)
    return false
  }
  return true
}
