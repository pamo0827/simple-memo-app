import type { Recipe, Category } from '@/lib/supabase'
import type { CategoryHeader } from '@/components/recipes/SortableCategoryHeader'

export type RecipeItem = Recipe & {
  type: 'recipe'
}

export type ListItem = CategoryHeader | RecipeItem
