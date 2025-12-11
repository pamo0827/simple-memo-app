import { notFound } from 'next/navigation'
import { getPublicRecipesByPageShareId } from '@/lib/recipes'
import { SharedRecipeItem } from '@/components/recipes/SharedRecipeItem'
import { Accordion } from "@/components/ui/accordion"

interface SharePageProps {
  params: Promise<{
    page_share_id: string
  }>
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
  const { page_share_id } = await params
  const result = await getPublicRecipesByPageShareId(page_share_id)

  if (!result) {
    notFound()
  }

  const { recipes, pageName, nickname } = result

  if (!recipes || recipes.length === 0) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
             <p className="text-base sm:text-lg font-bold text-gray-800">
               {nickname ? `${nickname}さん` : '共有された'}の「{pageName}」
             </p>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {recipes.map((recipe) => {
            const faviconUrl = recipe.source_url ? getFaviconUrl(recipe.source_url) : null
            return (
              <SharedRecipeItem
                key={recipe.id}
                recipe={recipe}
                faviconUrl={faviconUrl}
              />
            )
          })}
        </Accordion>
      </div>
    </div>
  )
}
