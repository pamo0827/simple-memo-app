import { supabase as defaultClient } from './supabase'
import type { Recipe, RecipeInput } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getRecipes(userId: string, pageId?: string, client?: SupabaseClient): Promise<Recipe[]> {
  const supabase = client || defaultClient
  let query = supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (pageId) {
    query = query.eq('page_id', pageId)
  }

  const { data, error } = await query

  if (error) {
    console.error('レシピ取得エラー:', error)
    return []
  }

  return data || []
}


export async function createRecipe(userId: string, recipe: RecipeInput, pageId?: string, client?: SupabaseClient): Promise<Recipe | null> {
  const supabase = client || defaultClient
  const { data, error } = await supabase
    .from('recipes')
    .insert([{ ...recipe, user_id: userId, page_id: pageId }])
    .select()
    .single()

  if (error) {
    console.error('レシピ作成エラー:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return null
  }

  return data
}

export async function deleteRecipe(id: string, client?: SupabaseClient): Promise<boolean> {
  const supabase = client || defaultClient
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('レシピ削除エラー:', error)
    return false
  }

  return true
}

export async function updateRecipe(id: string, updates: Partial<RecipeInput>, client?: SupabaseClient): Promise<Recipe | null> {
  const supabase = client || defaultClient
  const { data, error } = await supabase
    .from('recipes')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    console.error('レシピ更新エラー:', JSON.stringify(error, null, 2))
    return null
  }

  return data
}

export async function updateRecipeOrder(recipeIds: string[], client?: SupabaseClient): Promise<boolean> {
  const supabase = client || defaultClient
  // Update display_order for each recipe
  const updates = recipeIds.map((id, index) => ({
    id,
    display_order: index + 1,
  }))

  const { error } = await supabase
    .from('recipes')
    .upsert(updates, { onConflict: 'id' })

  if (error) {
    console.error('レシピ順序の更新エラー:', error)
    return false
  }

  return true
}

export async function getPublicRecipesByUserPublicId(userPublicId: string): Promise<{ recipes: Recipe[], nickname: string | null } | null> {
  // Use the secure View to find the user profile.
  console.log('[getPublicRecipesByUserPublicId] Looking for public_share_id:', userPublicId)

  const { data: userProfile, error: userError } = await defaultClient
    .from('public_user_profiles')
    .select('nickname')
    .eq('public_share_id', userPublicId)
    .single()

  console.log('[getPublicRecipesByUserPublicId] userProfile result:', { userProfile, userError })

  if (userError || !userProfile) {
    console.error('ユーザー設定取得エラーまたは公開設定がオフ:', {
      userError,
      userPublicId,
      message: 'public_user_profilesビューでユーザーが見つかりませんでした。are_recipes_publicがfalseか、public_share_idが一致していない可能性があります。'
    })
    return null
  }

  // public_share_idに紐づく公開レシピをuser_settings経由で取得
  const { data: recipes, error: recipesError } = await defaultClient
    .from('recipes')
    .select(`
      *,
      user_settings!inner(public_share_id, are_recipes_public)
    `)
    .eq('user_settings.public_share_id', userPublicId)
    .eq('user_settings.are_recipes_public', true)
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (recipesError) {
    console.error('公開レシピ取得エラー:', recipesError)
    return null
  }

  // user_settingsの情報を除去してRecipe型に整形
  const cleanRecipes = recipes?.map(({ user_settings, ...recipe }: any) => recipe as Recipe) || []

  return { recipes: cleanRecipes, nickname: userProfile.nickname }
}

export async function getPublicRecipesByPageShareId(pageShareId: string): Promise<{ recipes: Recipe[], pageName: string, nickname: string | null } | null> {
  console.log('[getPublicRecipesByPageShareId] Looking for page with public_share_id:', pageShareId)

  // ページ情報を取得
  const { data: page, error: pageError } = await defaultClient
    .from('pages')
    .select('id, name, user_id, is_public')
    .eq('public_share_id', pageShareId)
    .eq('is_public', true)
    .single()

  console.log('[getPublicRecipesByPageShareId] page result:', { page, pageError })

  if (pageError || !page) {
    console.error('ページ取得エラーまたは公開設定がオフ:', {
      pageError,
      pageShareId,
      message: 'pagesテーブルでページが見つかりませんでした。is_publicがfalseか、public_share_idが一致していない可能性があります。'
    })
    return null
  }

  // ユーザー情報を取得（ニックネーム用）
  const { data: settings } = await defaultClient
    .from('user_settings')
    .select('nickname')
    .eq('user_id', page.user_id)
    .single()

  // ページに紐づくレシピとカテゴリーを取得
  const { data: recipes, error: recipesError } = await defaultClient
    .from('recipes')
    .select('*')
    .eq('page_id', page.id)
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (recipesError) {
    console.error('公開レシピ取得エラー:', recipesError)
    return null
  }

  return {
    recipes: recipes || [],
    pageName: page.name,
    nickname: settings?.nickname || null
  }
}