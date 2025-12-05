import { supabase } from './supabase'
import type { Recipe, RecipeInput } from './supabase'

export async function getRecipes(userId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('レシピ取得エラー:', error)
    return []
  }

  return data || []
}

export async function createRecipe(userId: string, recipe: RecipeInput): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .insert([{ ...recipe, user_id: userId }])
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

export async function getPublicRecipesByUserPublicId(userPublicId: string): Promise<Recipe[] | null> {
  // user_settingsからuser_idを取得
  const { data: userSettings, error: userSettingsError } = await supabase
    .from('user_settings')
    .select('user_id, are_recipes_public')
    .eq('public_share_id', userPublicId)
    .single()

  if (userSettingsError || !userSettings || !userSettings.are_recipes_public) {
    console.error('ユーザー設定取得エラーまたは公開設定がオフ:', userSettingsError)
    return null
  }

  // user_idに紐づく公開レシピを取得
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id, name, description, ingredients, instructions, sections, source_url, created_at')
    .eq('user_id', userSettings.user_id)
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (recipesError) {
    console.error('公開レシピ取得エラー:', recipesError)
    return null
  }

  return recipes
}