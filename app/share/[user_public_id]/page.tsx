import { notFound } from 'next/navigation'
import { getPublicRecipesByUserPublicId } from '@/lib/recipes'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { EmbedPreview } from '@/components/share/EmbedPreview'

interface SharePageProps {
  params: {
    user_public_id: string // パラメータ名を変更
  }
}

const getFaviconUrl = (url: string) => {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return null
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { user_public_id } = params // パラメータ名を変更
  const recipes = await getPublicRecipesByUserPublicId(user_public_id) // 複数のレシピを取得

  if (!recipes || recipes.length === 0) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">共有レシピ一覧</h1>
      <div className="w-full max-w-2xl space-y-8">
        {recipes.map((recipe, index) => {
          const faviconUrl = recipe.source_url ? getFaviconUrl(recipe.source_url) : null
          return (
            <Card key={recipe.id} className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {faviconUrl ? (
                    <img src={faviconUrl} alt="" className="h-6 w-6 rounded" />
                  ) : (
                    <FileText className="h-6 w-6 text-orange-500" />
                  )}
                  {recipe.name}
                </CardTitle>
                {recipe.source_url && (
                  <a
                    href={recipe.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 hover:underline mt-2"
                  >
                    {recipe.source_url}
                  </a>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 埋め込みプレビュー */}
                {recipe.source_url && <EmbedPreview sourceUrl={recipe.source_url} />}

                {recipe.ingredients && (
                  <div className="border-l-4 border-yellow-500 pl-5 py-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">材料</h2>
                    <div className="prose prose-sm max-w-none text-gray-700 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-2 [&_h2]:mt-0 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-gray-800 [&_h3]:mb-1 [&_h3]:mt-3 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipe.ingredients}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {recipe.instructions && (
                  <div className="border-l-4 border-amber-500 pl-5 py-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">作り方</h2>
                    <div className="prose prose-sm max-w-none text-gray-700 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-2 [&_h2]:mt-0 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-gray-800 [&_h3]:mb-1 [&_h3]:mt-3 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipe.instructions}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* カスタムセクション */}
                {recipe.sections && recipe.sections.length > 0 && recipe.sections.map((section, sectionIndex) => {
                  const sectionColors = [
                    'border-blue-500',
                    'border-green-500',
                    'border-purple-500',
                    'border-pink-500',
                    'border-indigo-500',
                    'border-cyan-500',
                    'border-teal-500',
                    'border-rose-500',
                  ]
                  const colorClass = sectionColors[sectionIndex % sectionColors.length]

                  return (
                    <div key={sectionIndex} className={`border-l-4 ${colorClass} pl-5 py-1`}>
                      <div className="prose prose-sm max-w-none text-gray-700 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-2 [&_h2]:mt-0 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-gray-800 [&_h3]:mb-1 [&_h3]:mt-3 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
