import Link from "next/link"
import { Suspense } from "react"
import { Plus } from "lucide-react"
import { getRecipes, type SearchFilters } from "@/lib/db"
import { RecipeCard } from "@/components/recipe-card"
import { SearchFilters as SearchFiltersComponent } from "@/components/search-filters"

interface PageProps {
  searchParams: {
    name?: string
    minRating?: string
    maxCost?: string
    sortBy?: string
    sortOrder?: string
  }
}

async function RecipeList({ searchParams }: PageProps) {
  const filters: SearchFilters = {
    name: searchParams.name,
    minRating: searchParams.minRating ? Number.parseInt(searchParams.minRating) : undefined,
    maxCost: searchParams.maxCost ? Number.parseFloat(searchParams.maxCost) : undefined,
    sortBy: searchParams.sortBy as any,
    sortOrder: searchParams.sortOrder as any,
  }

  const recipes = await getRecipes(filters)

  return (
    <div className="space-y-6">
      {recipes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">レシピが見つかりませんでした</p>
          <Link
            href="/recipe/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            最初のレシピを追加
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function HomePage({ searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">レシピ管理アプリ</h1>
            <Link
              href="/recipe/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              新しいレシピ
            </Link>
          </div>

          <SearchFiltersComponent />
        </div>

        <Suspense fallback={<div className="text-center py-8">読み込み中...</div>}>
          <RecipeList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
