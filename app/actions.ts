"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createRecipe, updateRecipe, deleteRecipe, type RecipeInput } from "@/lib/db"

export async function createRecipeAction(formData: FormData) {
  const recipe: RecipeInput = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    ingredients: formData.get("ingredients") as string,
    instructions: formData.get("instructions") as string,
    cost: formData.get("cost") ? Number.parseFloat(formData.get("cost") as string) : undefined,
    url: (formData.get("url") as string) || undefined,
    taste_notes: (formData.get("taste_notes") as string) || undefined,
    rating: formData.get("rating") ? Number.parseInt(formData.get("rating") as string) : undefined,
  }

  await createRecipe(recipe)
  revalidatePath("/")
  redirect("/")
}

export async function updateRecipeAction(id: number, formData: FormData) {
  const recipe: RecipeInput = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    ingredients: formData.get("ingredients") as string,
    instructions: formData.get("instructions") as string,
    cost: formData.get("cost") ? Number.parseFloat(formData.get("cost") as string) : undefined,
    url: (formData.get("url") as string) || undefined,
    taste_notes: (formData.get("taste_notes") as string) || undefined,
    rating: formData.get("rating") ? Number.parseInt(formData.get("rating") as string) : undefined,
  }

  await updateRecipe(id, recipe)
  revalidatePath("/")
  revalidatePath(`/recipe/${id}`)
  redirect("/")
}

export async function deleteRecipeAction(id: number) {
  await deleteRecipe(id)
  revalidatePath("/")
  redirect("/")
}
