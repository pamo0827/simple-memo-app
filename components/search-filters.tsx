"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X, Filter } from "lucide-react"

export function SearchFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [name, setName] = useState(searchParams.get("name") || "")
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || "")
  const [maxCost, setMaxCost] = useState(searchParams.get("maxCost") || "")
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "created_at")
  const [sortOrder, setSortOrder] = useState(searchParams.get("sortOrder") || "desc")

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (name) params.set("name", name)
    if (minRating) params.set("minRating", minRating)
    if (maxCost) params.set("maxCost", maxCost)
    if (sortBy) params.set("sortBy", sortBy)
    if (sortOrder) params.set("sortOrder", sortOrder)

    router.push(`/?${params.toString()}`)
  }

  const handleClear = () => {
    setName("")
    setMinRating("")
    setMaxCost("")
    setSortBy("created_at")
    setSortOrder("desc")
    router.push("/")
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-0 rounded-3xl soft-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-primary-800">
          <div className="bg-primary/10 p-2 rounded-2xl">
            <Filter className="h-5 w-5 text-primary" />
          </div>
          検索・フィルター
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-primary-700 font-medium">
              料理名
            </Label>
            <Input
              id="name"
              placeholder="料理名で検索"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-2xl border-0 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minRating" className="text-primary-700 font-medium">
              最低評価
            </Label>
            <Select value={minRating} onValueChange={setMinRating}>
              <SelectTrigger className="rounded-2xl border-0 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/30">
                <SelectValue placeholder="評価を選択" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-0 bg-white/95 backdrop-blur-sm">
                <SelectItem value="0">指定なし</SelectItem>
                <SelectItem value="1">1つ星以上</SelectItem>
                <SelectItem value="2">2つ星以上</SelectItem>
                <SelectItem value="3">3つ星以上</SelectItem>
                <SelectItem value="4">4つ星以上</SelectItem>
                <SelectItem value="5">5つ星</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxCost" className="text-primary-700 font-medium">
              最大費用（円）
            </Label>
            <Input
              id="maxCost"
              type="number"
              placeholder="1000"
              value={maxCost}
              onChange={(e) => setMaxCost(e.target.value)}
              className="rounded-2xl border-0 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sortBy" className="text-primary-700 font-medium">
              並び順
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="rounded-2xl border-0 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-0 bg-white/95 backdrop-blur-sm">
                <SelectItem value="created_at">作成日時</SelectItem>
                <SelectItem value="name">料理名</SelectItem>
                <SelectItem value="rating">評価</SelectItem>
                <SelectItem value="cost">費用</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder" className="text-primary-700 font-medium">
              順序
            </Label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="rounded-2xl border-0 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-0 bg-white/95 backdrop-blur-sm">
                <SelectItem value="desc">降順</SelectItem>
                <SelectItem value="asc">昇順</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSearch}
            className="flex-1 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium hover-lift"
          >
            <Search className="h-4 w-4 mr-2" />
            検索
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            className="rounded-2xl border-primary/30 text-primary hover:bg-primary/10 font-medium"
          >
            <X className="h-4 w-4 mr-2" />
            クリア
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
