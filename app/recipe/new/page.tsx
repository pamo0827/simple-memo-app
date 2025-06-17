import { createRecipeAction } from "@/app/actions"
import { RecipeForm } from "@/components/recipe-form"

export default function NewRecipePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <RecipeForm action={createRecipeAction} title="新しいレシピを追加" />
      </div>
    </div>
  )
}
