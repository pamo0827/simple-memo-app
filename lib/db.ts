import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface Recipe {
  id: number
  name: string
  description?: string
  ingredients: string
  instructions: string
  cost?: number
  url?: string
  taste_notes?: string
  rating?: number
  created_at: string
  updated_at: string
}

export interface RecipeInput {
  name: string
  description?: string
  ingredients: string
  instructions: string
  cost?: number
  url?: string
  taste_notes?: string
  rating?: number
}

export interface SearchFilters {
  name?: string
  minRating?: number
  maxCost?: number
  sortBy?: "name" | "rating" | "cost" | "created_at"
  sortOrder?: "asc" | "desc"
}

export async function getRecipes(filters: SearchFilters = {}): Promise<Recipe[]> {
  const sortBy = filters.sortBy || "created_at"
  const sortOrder = filters.sortOrder || "desc"

  // Build conditions
  const hasName = !!filters.name
  const hasMinRating = !!filters.minRating
  const hasMaxCost = !!filters.maxCost

  // All three filters
  if (hasName && hasMinRating && hasMaxCost) {
    if (sortBy === "name" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY name ASC`) as Recipe[]
    } else if (sortBy === "name" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY name DESC`) as Recipe[]
    } else if (sortBy === "rating" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY rating ASC`) as Recipe[]
    } else if (sortBy === "rating" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY rating DESC`) as Recipe[]
    } else if (sortBy === "cost" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY cost ASC`) as Recipe[]
    } else if (sortBy === "cost" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY cost DESC`) as Recipe[]
    } else if (sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY created_at ASC`) as Recipe[]
    } else {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY created_at DESC`) as Recipe[]
    }
  }

  // Name and rating filters
  if (hasName && hasMinRating) {
    if (sortBy === "name" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} ORDER BY name ASC`) as Recipe[]
    } else if (sortBy === "name" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} ORDER BY name DESC`) as Recipe[]
    } else if (sortBy === "rating" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} ORDER BY rating ASC`) as Recipe[]
    } else if (sortBy === "rating" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} ORDER BY rating DESC`) as Recipe[]
    } else if (sortBy === "cost" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} ORDER BY cost ASC`) as Recipe[]
    } else if (sortBy === "cost" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} ORDER BY cost DESC`) as Recipe[]
    } else if (sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} ORDER BY created_at ASC`) as Recipe[]
    } else {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND rating >= ${filters.minRating} ORDER BY created_at DESC`) as Recipe[]
    }
  }

  // Name and cost filters
  if (hasName && hasMaxCost) {
    if (sortBy === "name" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND cost <= ${filters.maxCost} ORDER BY name ASC`) as Recipe[]
    } else if (sortBy === "name" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND cost <= ${filters.maxCost} ORDER BY name DESC`) as Recipe[]
    } else if (sortBy === "rating" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND cost <= ${filters.maxCost} ORDER BY rating ASC`) as Recipe[]
    } else if (sortBy === "rating" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND cost <= ${filters.maxCost} ORDER BY rating DESC`) as Recipe[]
    } else if (sortBy === "cost" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND cost <= ${filters.maxCost} ORDER BY cost ASC`) as Recipe[]
    } else if (sortBy === "cost" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND cost <= ${filters.maxCost} ORDER BY cost DESC`) as Recipe[]
    } else if (sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND cost <= ${filters.maxCost} ORDER BY created_at ASC`) as Recipe[]
    } else {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} AND cost <= ${filters.maxCost} ORDER BY created_at DESC`) as Recipe[]
    }
  }

  // Rating and cost filters
  if (hasMinRating && hasMaxCost) {
    if (sortBy === "name" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY name ASC`) as Recipe[]
    } else if (sortBy === "name" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY name DESC`) as Recipe[]
    } else if (sortBy === "rating" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY rating ASC`) as Recipe[]
    } else if (sortBy === "rating" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY rating DESC`) as Recipe[]
    } else if (sortBy === "cost" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY cost ASC`) as Recipe[]
    } else if (sortBy === "cost" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY cost DESC`) as Recipe[]
    } else if (sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY created_at ASC`) as Recipe[]
    } else {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} AND cost <= ${filters.maxCost} ORDER BY created_at DESC`) as Recipe[]
    }
  }

  // Only name filter
  if (hasName) {
    if (sortBy === "name" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} ORDER BY name ASC`) as Recipe[]
    } else if (sortBy === "name" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} ORDER BY name DESC`) as Recipe[]
    } else if (sortBy === "rating" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} ORDER BY rating ASC`) as Recipe[]
    } else if (sortBy === "rating" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} ORDER BY rating DESC`) as Recipe[]
    } else if (sortBy === "cost" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} ORDER BY cost ASC`) as Recipe[]
    } else if (sortBy === "cost" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} ORDER BY cost DESC`) as Recipe[]
    } else if (sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} ORDER BY created_at ASC`) as Recipe[]
    } else {
      return (await sql`SELECT * FROM recipes WHERE name ILIKE ${"%" + filters.name + "%"} ORDER BY created_at DESC`) as Recipe[]
    }
  }

  // Only rating filter
  if (hasMinRating) {
    if (sortBy === "name" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} ORDER BY name ASC`) as Recipe[]
    } else if (sortBy === "name" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} ORDER BY name DESC`) as Recipe[]
    } else if (sortBy === "rating" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} ORDER BY rating ASC`) as Recipe[]
    } else if (sortBy === "rating" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} ORDER BY rating DESC`) as Recipe[]
    } else if (sortBy === "cost" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} ORDER BY cost ASC`) as Recipe[]
    } else if (sortBy === "cost" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} ORDER BY cost DESC`) as Recipe[]
    } else if (sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} ORDER BY created_at ASC`) as Recipe[]
    } else {
      return (await sql`SELECT * FROM recipes WHERE rating >= ${filters.minRating} ORDER BY created_at DESC`) as Recipe[]
    }
  }

  // Only cost filter
  if (hasMaxCost) {
    if (sortBy === "name" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE cost <= ${filters.maxCost} ORDER BY name ASC`) as Recipe[]
    } else if (sortBy === "name" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE cost <= ${filters.maxCost} ORDER BY name DESC`) as Recipe[]
    } else if (sortBy === "rating" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE cost <= ${filters.maxCost} ORDER BY rating ASC`) as Recipe[]
    } else if (sortBy === "rating" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE cost <= ${filters.maxCost} ORDER BY rating DESC`) as Recipe[]
    } else if (sortBy === "cost" && sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE cost <= ${filters.maxCost} ORDER BY cost ASC`) as Recipe[]
    } else if (sortBy === "cost" && sortOrder === "desc") {
      return (await sql`SELECT * FROM recipes WHERE cost <= ${filters.maxCost} ORDER BY cost DESC`) as Recipe[]
    } else if (sortOrder === "asc") {
      return (await sql`SELECT * FROM recipes WHERE cost <= ${filters.maxCost} ORDER BY created_at ASC`) as Recipe[]
    } else {
      return (await sql`SELECT * FROM recipes WHERE cost <= ${filters.maxCost} ORDER BY created_at DESC`) as Recipe[]
    }
  }

  // No filters
  if (sortBy === "name" && sortOrder === "asc") {
    return (await sql`SELECT * FROM recipes ORDER BY name ASC`) as Recipe[]
  } else if (sortBy === "name" && sortOrder === "desc") {
    return (await sql`SELECT * FROM recipes ORDER BY name DESC`) as Recipe[]
  } else if (sortBy === "rating" && sortOrder === "asc") {
    return (await sql`SELECT * FROM recipes ORDER BY rating ASC`) as Recipe[]
  } else if (sortBy === "rating" && sortOrder === "desc") {
    return (await sql`SELECT * FROM recipes ORDER BY rating DESC`) as Recipe[]
  } else if (sortBy === "cost" && sortOrder === "asc") {
    return (await sql`SELECT * FROM recipes ORDER BY cost ASC`) as Recipe[]
  } else if (sortBy === "cost" && sortOrder === "desc") {
    return (await sql`SELECT * FROM recipes ORDER BY cost DESC`) as Recipe[]
  } else if (sortOrder === "asc") {
    return (await sql`SELECT * FROM recipes ORDER BY created_at ASC`) as Recipe[]
  } else {
    return (await sql`SELECT * FROM recipes ORDER BY created_at DESC`) as Recipe[]
  }
}

export async function getRecipeById(id: number): Promise<Recipe | null> {
  const result = await sql`SELECT * FROM recipes WHERE id = ${id}`
  return (result[0] as Recipe) || null
}

export async function createRecipe(recipe: RecipeInput): Promise<Recipe> {
  const result = await sql`
    INSERT INTO recipes (name, description, ingredients, instructions, cost, url, taste_notes, rating)
    VALUES (${recipe.name}, ${recipe.description || null}, ${recipe.ingredients}, ${recipe.instructions}, ${recipe.cost || null}, ${recipe.url || null}, ${recipe.taste_notes || null}, ${recipe.rating || null})
    RETURNING *
  `
  return result[0] as Recipe
}

export async function updateRecipe(id: number, recipe: RecipeInput): Promise<Recipe> {
  const result = await sql`
    UPDATE recipes 
    SET name = ${recipe.name}, description = ${recipe.description || null}, ingredients = ${recipe.ingredients}, instructions = ${recipe.instructions}, 
        cost = ${recipe.cost || null}, url = ${recipe.url || null}, taste_notes = ${recipe.taste_notes || null}, rating = ${recipe.rating || null}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `
  return result[0] as Recipe
}

export async function deleteRecipe(id: number): Promise<void> {
  await sql`DELETE FROM recipes WHERE id = ${id}`
}
