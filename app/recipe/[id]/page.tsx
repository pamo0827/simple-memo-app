import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Trash2, Star, DollarSign, ExternalLink, Clock } from "lucide-react"
import { getRecipeById } from "@/lib/db"
import { deleteRecipeAction } from "@/app/actions"

interface PageProps {
  params: {
    id: string
  }
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const recipe = await getRecipeById(Number.parseInt(params.id))

  if (!recipe) {
    notFound()
  }

  const deleteRecipeWithId = deleteRecipeAction.bind(null, recipe.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              レシピ一覧に戻る
            </Link>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2">{recipe.name}</CardTitle>
                  {recipe.description && <p className="text-gray-600">{recipe.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Link href={`/recipe/${recipe.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      編集
                    </Button>
                  </Link>
                  <form action={deleteRecipeWithId}>
                    <Button variant="destructive" size="sm" type="submit">
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除
                    </Button>
                  </form>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {recipe.rating && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {recipe.rating}つ星
                  </Badge>
                )}
                {recipe.cost && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />¥{recipe.cost.toLocaleString()}
                  </Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(recipe.created_at).toLocaleDateString("ja-JP")}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">材料</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{recipe.ingredients}</pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">作り方</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{recipe.instructions}</pre>
                </div>
              </div>

              {recipe.taste_notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">味の感想</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm">{recipe.taste_notes}</p>
                  </div>
                </div>
              )}

              {recipe.url && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">参考URL</h3>
                  <a
                    href={recipe.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {recipe.url}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
