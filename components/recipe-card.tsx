import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, DollarSign, ExternalLink } from "lucide-react"
import type { Recipe } from "@/lib/db"

interface RecipeCardProps {
  recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{recipe.name}</CardTitle>
          {recipe.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{recipe.rating}</span>
            </div>
          )}
        </div>
        {recipe.description && <CardDescription>{recipe.description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {recipe.cost && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />¥{recipe.cost.toLocaleString()}
            </Badge>
          )}
          {recipe.url && (
            <Badge variant="outline" className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              参考URL
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-medium text-gray-700">材料</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{recipe.ingredients}</p>
          </div>

          {recipe.taste_notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-700">感想</h4>
              <p className="text-sm text-gray-600 line-clamp-2">{recipe.taste_notes}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Link
            href={`/recipe/${recipe.id}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-md text-center transition-colors"
          >
            詳細を見る
          </Link>
          <Link
            href={`/recipe/${recipe.id}/edit`}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 px-3 rounded-md text-center transition-colors"
          >
            編集
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
