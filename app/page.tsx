import Link from "next/link"
import { Suspense } from "react"
import { Plus, Cookie } from "lucide-react"
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
          <div className="mb-6">
            <img
              src="/placeholder.svg?height=200&width=200"
              alt="Empty state illustration"
              className="mx-auto rounded-full soft-shadow"
            />
          </div>
          <p className="text-secondary-foreground mb-4 text-lg">レシピが見つかりませんでした</p>
          <Link
            href="/recipe/new"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-2xl transition-all hover-lift soft-shadow font-medium"
          >
            <Plus className="h-5 w-5" />
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
    <div className="min-h-screen warm-gradient">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-white/80 p-4 rounded-3xl soft-shadow">
                <Cookie className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-primary-800 mb-2">Cookie</h1>
                <p className="text-secondary-foreground text-lg">あなたの特別なレシピを保存しよう</p>
              </div>
            </div>
            <Link
              href="/recipe/new"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-2xl transition-all hover-lift soft-shadow font-medium"
            >
              <Plus className="h-5 w-5" />
              新しいレシピ
            </Link>
          </div>

          <div className="mb-6">
            <img
              src="/placeholder.svg?height=300&width=800"
              alt="Delicious cookies and cooking"
              className="w-full h-48 object-cover rounded-3xl soft-shadow"
            />
          </div>

          <SearchFiltersComponent />
        </div>

        <Suspense
          fallback={
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-secondary-foreground">読み込み中...</p>
            </div>
          }
        >
          <RecipeList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
