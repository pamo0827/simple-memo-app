import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import {
  Link as LinkIcon,
  Camera,
  Edit,
  Crown,
  Layers,
  Share2,
  Fingerprint,
  Sliders,
  ChevronRight,
  Star,
  Zap,
} from 'lucide-react'
import type { Ranking } from './page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

type LandingPageClientProps = {
  rankingData: Ranking[]
}

export default function LandingPageClient({
  rankingData,
}: LandingPageClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.push('/recipes')
      } else {
        setLoading(false)
      }
    }
    checkUser()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FDF7F0]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-400 border-t-transparent"></div>
          <div className="text-orange-800 font-medium">読み込み中...</div>
        </div>
      </div>
    )
  }

  const getCrownColor = (rank: number) => {
    if (rank === 0) return 'text-yellow-400'
    if (rank === 1) return 'text-gray-400'
    if (rank === 2) return 'text-yellow-600'
    return 'text-orange-200'
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FDF7F0] text-stone-800">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32">
          <div className="container relative z-10 px-6 mx-auto text-center">

            <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-stone-900 sm:text-6xl md:text-7xl my-16 leading-tight">
              あらゆるURLを、<br className="hidden sm:block" />
              <span className="text-orange-500">AI</span>で整理する。
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-stone-600 mb-10 leading-relaxed">
              ブラウザメモアプリの最適解。　もっと、URLをメモしよう。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-orange-500 hover:bg-orange-600 text-white font-bold w-full sm:w-auto"
                onClick={() => router.push('/login')}
              >
                無料で始める
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Floating Elements Animation (Simplified for CSS) */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 opacity-10 pointer-events-none hidden lg:block">
              <div className="h-64 w-64 rounded-full bg-orange-400 blur-3xl"></div>
            </div>
            <div className="absolute bottom-0 right-0 translate-y-1/4 translate-x-1/4 opacity-10 pointer-events-none hidden lg:block">
              <div className="h-96 w-96 rounded-full bg-yellow-400 blur-3xl"></div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="features" className="py-24 bg-white/50 backdrop-blur-sm">
          <div className="container px-6 mx-auto">
            <div className="text-center mb-16">

              <h3 className="text-center text-xl font-bold text-stone-800 mb-10">
                便利な機能がもりだくさん
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1: AI Scraping */}
              <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                    <LinkIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>自動要約</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    レシピサイトやYouTube、技術ブログのURLを貼るだけ。AIが重要なポイントを抽出し、読みやすい形式で保存します。
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Feature 3: Organization */}
              <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                    <Layers className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>ページとカテゴリ</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    ドラック＆ドロップに完全対応。増え続けるメモも、直感的な階層構造でスッキリ管理できます。
                  </CardDescription>
                </CardContent>
              </Card>


              {/* Feature 5: Sharing */}
              <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                    <Share2 className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>かんたん共有</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    作成したページやレシピ集を、リンクひとつで友人にシェア。ログイン不要で閲覧できる美しいページが生成されます。
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Feature 6: Security */}
              <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                    <Fingerprint className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>パスキー認証</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    指紋認証や顔認証で、安全かつ瞬時にログイン。パスワードを覚える必要も、入力する手間もありません。
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Verified Sites Section */}
        <section className="py-20">
          <div className="container px-6 mx-auto">
            <h3 className="text-center text-xl font-bold text-stone-800 mb-10">
              多様なプラットフォームに対応
            </h3>
            <div className="flex flex-wrap justify-center gap-8 opacity-70 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100">
              {/* Logos represented by text/icons for simplicity if images aren't perfect, but reusing existing logic with better styling */}
              {['YouTube', 'Cookpad', 'クラシル', 'Qiita', 'Zenn', 'note'].map((site) => (
                <div key={site} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-orange-100">
                  <span className="font-semibold text-stone-600">{site}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 px-4 py-2 text-stone-500">
                <span>and more...</span>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-24 bg-stone-900 text-stone-50">
          <div className="container px-6 mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  あなたの生活に、<br />MEMOTTOを。
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🍳</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">料理のレパートリー管理に</h3>
                      <p className="text-stone-400">クックパッドやYouTubeのレシピ動画を一つに。自分だけのデジタルレシピブックを作成。</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">📚</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">学習の効率化に</h3>
                      <p className="text-stone-400">参考になった技術記事や解説動画をページごとに整理。後から検索するのも一瞬です。</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🎮</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">趣味のデータベースに</h3>
                      <p className="text-stone-400">ゲームの攻略情報や推し活の記録など、あらゆる情報を自由にスクラップ。</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                {/* Abstract visual for Use Cases */}
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-orange-500/20 to-stone-800 border border-stone-800 p-8 flex flex-col gap-4">
                  <div className="h-8 w-1/3 bg-stone-800 rounded-lg animate-pulse"></div>
                  <div className="h-32 w-full bg-stone-800 rounded-lg opacity-50"></div>
                  <div className="h-8 w-1/2 bg-stone-800 rounded-lg opacity-30"></div>
                  <div className="flex gap-2 mt-auto">
                    <div className="h-10 w-10 rounded-full bg-stone-700"></div>
                    <div className="h-10 w-10 rounded-full bg-stone-700"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ranking Section */}
        {rankingData && rankingData.length > 0 && (
          <section className="py-24 bg-[#FDF7F0]">
            <div className="container px-6 mx-auto max-w-2xl">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-yellow-100 rounded-full mb-4">
                  <Crown className="h-8 w-8 text-yellow-500" />
                </div>
                <h2 className="text-3xl font-bold text-stone-900">
                  活用ランキング
                </h2>
                <p className="mt-4 text-stone-600">
                  多くのレシピやメモをまとめているトップユーザー
                </p>
              </div>

              <div className="space-y-4">
                {rankingData.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-orange-50 transform hover:-translate-y-1 transition-transform duration-300"
                  >
                    <div className="flex-shrink-0 w-12 text-center font-bold text-xl">
                      #{index + 1}
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="font-bold text-stone-800">{user.nickname}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600 text-lg">
                        {user.recipe_count}
                      </p>
                      <p className="text-xs text-stone-500">Items</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="container px-6 mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12 text-stone-900">よくある質問</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>無料で使えますか？</AccordionTrigger>
                <AccordionContent>
                  はい。1日10回までのAI要約・生成機能は完全に無料でご利用いただけます。
                  それ以上ご利用になりたい場合は、ご自身のGoogle Gemini APIキー（無料）を設定することで、無制限にご利用いただけます。
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>どのサイトに対応していますか？</AccordionTrigger>
                <AccordionContent>
                  YouTube、主要なレシピサイト（Cookpad, クラシル等）、Qiita、Zennなどの技術ブログなど、
                  一般的なWebサイトであれば概ね対応しています。
                  また、サイト構造が複雑な場合でも、テキスト情報を抽出して要約を試みます。
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>共有したページは誰でも見られますか？</AccordionTrigger>
                <AccordionContent>
                  「共有」設定をオンにしたページは、そのURLを知っている人であれば誰でも閲覧可能です。
                  共有をオフにすれば、再びあなただけが見られる状態に戻ります。
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 bg-orange-500 text-white text-center">
          <div className="container px-6 mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8">
              あなたの知識を、整理整頓。
            </h2>
            <Button
              size="lg"
              variant="secondary"
              className="h-16 px-10 text-xl rounded-full shadow-lg bg-white text-orange-600 hover:bg-stone-100 font-bold"
              onClick={() => router.push('/login')}
            >
              無料でアカウント作成
            </Button>
            <p className="mt-6 opacity-80 text-sm">
              30秒で登録完了。まずは使い心地を試してみてください。
            </p>
          </div>
        </section>
      </main>


    </div>
  )
}