'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ChevronRight } from 'lucide-react'

export default function LandingPageClient() {
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

  return (
    <div className="flex min-h-screen flex-col bg-[#FDF7F0] text-stone-800">
      <main className="relative flex-1 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[300px] h-[300px] rounded-full border border-orange-300/30 -top-24 -left-12" />
          <div className="absolute w-[200px] h-[200px] rounded-full border border-orange-300/30 top-[25%] right-[5%]" />
          <div className="absolute w-[250px] h-[250px] rounded-full border border-orange-300/30 top-[55%] left-[20%]" />
          <div className="absolute w-[180px] h-[180px] rounded-full border border-orange-300/30 bottom-[15%] right-[25%]" />
          <div className="absolute w-[150px] h-[150px] rounded-full border border-orange-300/20 top-[40%] left-[60%]" />
        </div>

        {/* Hero Section */}
        <section className="relative flex items-center">
          <div className="container relative z-10 px-6 mx-auto text-center py-16">

            <h1 className="mx-auto max-w-4xl text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl md:text-5xl mt-8 mb-6 leading-tight">
              MEMOTTO
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-stone-600 mb-8 leading-relaxed">
              シンプルなURLメモアプリ
            </p>

            <div className="flex flex-col items-center justify-center gap-3 max-w-xs mx-auto">
              <Button
                size="lg"
                className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-stone-900 text-white hover:bg-stone-800 font-bold w-full"
                onClick={async () => {
                  await supabase.auth.signInWithOAuth({
                    provider: 'twitter',
                    options: {
                      redirectTo: `${window.location.origin}/api/auth/callback`,
                      scopes: 'users.read tweet.read',
                    },
                  })
                }}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitterで登録
              </Button>
              <Button
                size="lg"
                className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-orange-500 hover:bg-orange-600 text-white font-bold w-full"
                onClick={() => router.push('/login')}
              >
                メールアドレスで登録
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section id="features" className="relative pt-4 pb-16">
          <div className="container px-6 mx-auto max-w-2xl">
            <h3 className="text-xl font-bold text-stone-800 mb-12">機能</h3>

            <div className="space-y-8">
              <div className="border-b border-stone-200 pb-8">
                <h4 className="font-semibold text-stone-900 mb-2">1. geminiがURLを自動で要約します。</h4>
                <p className="text-stone-600 leading-relaxed">
                  レシピサイトやYouTube、技術ブログのURLを貼るだけ。AIが重要なポイントを抽出し、読みやすい形式で保存します。
                </p>
              </div>

              <div className="border-b border-stone-200 pb-8">
                <h4 className="font-semibold text-stone-900 mb-2">2. ドラッグ＆ドロップに対応しています。</h4>
                <p className="text-stone-600 leading-relaxed">
                  ドラッグ＆ドロップに完全対応。増え続けるメモも、直感的な階層構造でスッキリ管理できます。
                </p>
              </div>

              <div className="pb-8">
                <h4 className="font-semibold text-stone-900 mb-2">3. 自分のメモを共有できます。</h4>
                <p className="text-stone-600 leading-relaxed">
                  作成したページやレシピ集を、リンクひとつで友人にシェア。ログイン不要で閲覧できる美しいページが生成されます。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How to Use Section */}
        <section className="relative pt-4 pb-16">
          <div className="container px-6 mx-auto max-w-2xl">
            <h3 className="text-xl font-bold text-stone-800 mb-12">使い方</h3>

            <div className="space-y-8">
              <div className="border-b border-stone-200 pb-8">
                <h4 className="font-semibold text-stone-900 mb-2">1. URLをコピー</h4>
                <p className="text-stone-600 leading-relaxed">
                  気になるWebページ、YouTube動画、レシピサイトなどのURLをコピーします。
                </p>
              </div>

              <div className="border-b border-stone-200 pb-8">
                <h4 className="font-semibold text-stone-900 mb-2">2. MEMOTTOに貼り付け</h4>
                <p className="text-stone-600 leading-relaxed">
                  メモを作成してURLを貼り付けるだけ。AIが自動で内容を要約・整理します。
                </p>
              </div>

              <div className="pb-8">
                <h4 className="font-semibold text-stone-900 mb-2">3. 整理して共有</h4>
                <p className="text-stone-600 leading-relaxed">
                  ページやカテゴリで自由に整理。必要に応じてリンク1つで他の人と共有できます。
                </p>
              </div>
            </div>
          </div>
        </section>


      </main>


    </div>
  )
}