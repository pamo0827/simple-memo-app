import { notFound } from "next/navigation"
import { getRecipeById } from "@/lib/db"
import { updateRecipeAction } from "@/app/actions"
import { RecipeForm } from "@/components/recipe-form"

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditRecipePage({ params }: PageProps) {
  const recipe = await getRecipeById(Number.parseInt(params.id))

  if (!recipe) {
    notFound()
  }

  const updateRecipeWithId = updateRecipeAction.bind(null, recipe.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <RecipeForm recipe={recipe} action={updateRecipeWithId} title="レシピを編集" />
      </div>
    </div>
  )
}
