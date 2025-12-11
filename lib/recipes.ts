import { supabase } from './supabase'
import type { Recipe, RecipeInput } from './supabase'

export async function getRecipes(userId: string, pageId?: string): Promise<Recipe[]> {
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

export async function createRecipe(userId: string, recipe: RecipeInput, pageId?: string): Promise<Recipe | null> {
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

export async function deleteRecipe(id: string): Promise<boolean> {
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

export async function updateRecipe(id: string, updates: Partial<RecipeInput>): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('レシピ更新エラー:', error)
    return null
  }

  return data
}

export async function updateRecipeOrder(recipeIds: string[]): Promise<boolean> {
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
  // Use the secure View to find the user.
  // This avoids direct access to user_settings which is restricted by RLS.
  console.log('[getPublicRecipesByUserPublicId] Looking for public_share_id:', userPublicId)

  const { data: userProfile, error: userError } = await supabase
    .from('public_user_profiles')
    .select('user_id, nickname')
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

  // user_idに紐づく公開レシピを取得
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userProfile.user_id)
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (recipesError) {
    console.error('公開レシピ取得エラー:', recipesError)
    return null
  }

  return { recipes, nickname: userProfile.nickname }
}

export async function getPublicRecipesByPageShareId(pageShareId: string): Promise<{ recipes: Recipe[], pageName: string, nickname: string | null } | null> {
  console.log('[getPublicRecipesByPageShareId] Looking for page with public_share_id:', pageShareId)

  // ページ情報を取得
  const { data: page, error: pageError } = await supabase
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
  const { data: settings } = await supabase
    .from('user_settings')
    .select('nickname')
    .eq('user_id', page.user_id)
    .single()

  // ページに紐づくレシピとカテゴリーを取得
  const { data: recipes, error: recipesError } = await supabase
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