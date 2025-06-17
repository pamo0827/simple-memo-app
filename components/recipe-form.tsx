"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Save, ArrowLeft, Cookie } from "lucide-react"
import Link from "next/link"
import type { Recipe } from "@/lib/db"

interface RecipeFormProps {
  recipe?: Recipe
  action: (formData: FormData) => Promise<void>
  title: string
}

export function RecipeForm({ recipe, action, title }: RecipeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      await action(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen warm-gradient">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              レシピ一覧に戻る
            </Link>
          </div>

          <Card className="bg-card/80 backdrop-blur-sm border-0 rounded-3xl soft-shadow">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <Cookie className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl text-primary-800">{title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form action={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-primary-700 font-medium">
                      料理名 *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      defaultValue={recipe?.name}
                      placeholder="チキンカレー"
                      className="rounded-2xl border-0 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rating" className="text-primary-700 font-medium">
                      評価
                    </Label>
                    <Select name="rating" defaultValue={recipe?.rating?.toString()}>
                      <SelectTrigger className="rounded-2xl border-0 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/30">
                        <SelectValue placeholder="評価を選択" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-0 bg-white/95 backdrop-blur-sm">
                        <SelectItem value="0">未評価</SelectItem>
                        <SelectItem value="1">1つ星</SelectItem>
                        <SelectItem value="2">2つ星</SelectItem>
                        <SelectItem value="3">3つ星</SelectItem>
                        <SelectItem value="4">4つ星</SelectItem>
                        <SelectItem value="5">5つ星</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-primary-700 font-medium">
                    説明
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={recipe?.description}
                    placeholder="本格的なスパイスを使った美味しいチキンカレー"
                    className="rounded-2xl border-0 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ingredients" className="text-primary-700 font-medium">
                    材料 *
                  </Label>
                  <Textarea
                    id="ingredients"
                    name="ingredients"
                    required
                    rows={4}
                    defaultValue={recipe?.ingredients}
                    placeholder="鶏肉 500g, 玉ねぎ 2個, トマト 2個..."
                    className="rounded-2xl border-0 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions" className="text-primary-700 font-medium">
                    作り方 *
                  </Label>
                  <Textarea
                    id="instructions"
                    name="instructions"
                    required
                    rows={6}
                    defaultValue={recipe?.instructions}
                    placeholder="1. 玉ねぎを炒める&#10;2. 鶏肉を加えて炒める..."
                    className="rounded-2xl border-0 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost" className="text-primary-700 font-medium">
                      費用（円）
                    </Label>
                    <Input
                      id="cost"
                      name="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={recipe?.cost}
                      placeholder="800"
                      className="rounded-2xl border-0 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="url" className="text-primary-700 font-medium">
                      参考URL
                    </Label>
                    <Input
                      id="url"
                      name="url"
                      type="url"
                      defaultValue={recipe?.url}
                      placeholder="https://example.com/recipe"
                      className="rounded-2xl border-0 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taste_notes" className="text-primary-700 font-medium">
                    味の感想
                  </Label>
                  <Textarea
                    id="taste_notes"
                    name="taste_notes"
                    rows={3}
                    defaultValue={recipe?.taste_notes}
                    placeholder="スパイスが効いていて本格的な味。少し辛めだが美味しい。"
                    className="rounded-2xl border-0 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 hover-lift soft-shadow"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {isSubmitting ? "保存中..." : "レシピを保存"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
