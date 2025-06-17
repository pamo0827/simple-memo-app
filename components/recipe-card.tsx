import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, DollarSign, ExternalLink, ChefHat } from "lucide-react"
import type { Recipe } from "@/lib/db"

interface RecipeCardProps {
  recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Card className="h-full hover-lift soft-shadow bg-card/80 backdrop-blur-sm border-0 rounded-3xl overflow-hidden">
      <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 relative overflow-hidden">
        <img src="/placeholder.svg?height=200&width=300" alt={recipe.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute top-4 right-4">
          {recipe.rating && (
            <div className="flex items-center gap-1 bg-white/90 px-3 py-1 rounded-full">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{recipe.rating}</span>
            </div>
          )}
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-primary-800">{recipe.name}</CardTitle>
          </div>
        </div>
        {recipe.description && (
          <CardDescription className="text-secondary-foreground">{recipe.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {recipe.cost && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 bg-secondary/50 text-secondary-foreground border-0 rounded-full"
            >
              <DollarSign className="h-3 w-3" />¥{recipe.cost.toLocaleString()}
            </Badge>
          )}
          {recipe.url && (
            <Badge variant="outline" className="flex items-center gap-1 border-primary/30 text-primary rounded-full">
              <ExternalLink className="h-3 w-3" />
              参考URL
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-primary-700 mb-1">材料</h4>
            <p className="text-sm text-secondary-foreground line-clamp-2">{recipe.ingredients}</p>
          </div>

          {recipe.taste_notes && (
            <div>
              <h4 className="text-sm font-medium text-primary-700 mb-1">感想</h4>
              <p className="text-sm text-secondary-foreground line-clamp-2">{recipe.taste_notes}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Link
            href={`/recipe/${recipe.id}`}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-3 px-4 rounded-2xl text-center transition-all hover-lift font-medium"
          >
            詳細を見る
          </Link>
          <Link
            href={`/recipe/${recipe.id}/edit`}
            className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm py-3 px-4 rounded-2xl text-center transition-all hover-lift font-medium"
          >
            編集
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
