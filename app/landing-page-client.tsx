'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import Link from 'next/link' // next/link をインポート
import { Link as LinkIcon, Camera, Edit, Crown } from 'lucide-react' // Linkアイコンをエイリアス付きでインポート
import type { Ranking } from './page'

type LandingPageClientProps = {
  rankingData: Ranking[]
}

export default function LandingPageClient({
  rankingData,
}: LandingPageClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

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
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-orange-50">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  const getCrownColor = (rank: number) => {
    if (rank === 0) return 'text-yellow-400'
    if (rank === 1) return 'text-gray-400'
    if (rank === 2) return 'text-yellow-600'
    return 'text-gray-300'
  }

  return (
    <div className="flex min-h-screen flex-col bg-orange-50">
      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative flex flex-col items-center justify-center px-6 text-center"
          style={{
            backgroundImage: 'url(/back.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            paddingBottom: '8rem', // 128px
          }}
        >
          <div className="absolute inset-0 bg-white opacity-70"></div> {/* 半透明のオーバーレイ */}
          <div className="relative z-10 flex flex-col items-center"> {/* コンテンツを前面に */}
            <div className="h-32"></div> {/* 上の余白 */}
            <h1 className="inline-block border-b-4 border-orange-400 pb-6 text-4xl font-bold tracking-normal text-stone-800 sm:text-5xl">
              MEMOTTO
            </h1>
            <p className="mt-12 text-lg text-gray-700">
              Geminiによるシンプルなメモ管理アプリ
            </p>
            <Button
              size="lg"
              className="mt-16 h-auto px-10 py-4 text-lg"
              onClick={() => router.push('/login')}
            >
              無料で始める
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-12 sm:py-20">
          <div className="mx-auto max-w-xl">
            <div className="mt-12 space-y-10">
              <div className="flex items-start">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100">
                  <LinkIcon className="h-7 w-7 text-orange-600" />
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-semibold">どんなサイトでも、まとめる。</h3>
                  <p className="mt-2 text-base text-gray-600">
                    SNSやWebサイトのURLを貼るだけで、内容を自動で抽出します。
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100">
                  <Camera className="h-7 w-7 text-orange-600" />
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-semibold">どんな画像でも、まとめる。</h3>
                  <p className="mt-2 text-base text-gray-600">
                    画像やPDFの文章やURLを解析します。
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100">
                  <Edit className="h-7 w-7 text-orange-600" />
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-semibold">自分なりに、まとめる。</h3>
                  <p className="mt-2 text-base text-gray-600">
                    取り込んだ内容は、いつでも自由に見やすく編集できます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How to Use Section */}
        <section className="bg-orange-50 px-6 py-12 sm:py-20">
          <div className="mx-auto max-w-xl">
            <h2 className="text-center text-3xl font-bold text-gray-800">
              使い方
            </h2>
            <p className="mt-4 text-center text-gray-600">
              3つのステップで、簡単にメモを作成できます
            </p>
            <div className="mt-12 space-y-8">
              <div className="flex items-start">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-orange-500 font-bold text-lg shadow-md">
                  1
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-semibold text-gray-800">アカウント登録</h3>
                  <p className="mt-2 text-base text-gray-600">
                    メールアドレスとパスワードで無料登録。
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-orange-500 font-bold text-lg shadow-md">
                  2
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-semibold text-gray-800">APIキーを追加</h3>
                  <p className="mt-2 text-base text-gray-600">
                    Google AI StudioからGemini APIキーを取得して入力してください。
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-orange-500 font-bold text-lg shadow-md">
                  3
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-semibold text-gray-800">URLまたは画像を追加</h3>
                  <p className="mt-2 text-base text-gray-600">
                    Webサイト、YouTube、Instagram、X（Twitter）などのURLを貼り付けるか、
                    本の写真やPDFをアップロードすると、AIが自動で内容を抽出します。
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-20 rounded-lg bg-white px-6 pt-10 pb-16 shadow-md">
              <h3 className="text-center text-lg font-semibold text-gray-800">
                こんな使い方もできます
              </h3>
              <ul className="mt-6 space-y-3 text-gray-700 flex flex-col items-start pl-16">
                <li className="flex items-start">
                  <span className="mr-2 text-orange-500 font-bold">料理好き：</span>
                  <span>レシピサイトを横断してお気に入りをまとめる</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-orange-500 font-bold">推し活：</span>
                  <span>SNSの投稿や動画をアーカイブして永久保存</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-orange-500 font-bold">ゲーマー：</span>
                  <span>複数の攻略サイトの情報を一箇所に集約</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-orange-500 font-bold">学生：</span>
                  <span>参考資料やリンクを科目別に整理して学習効率UP</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Ranking Section */}
        {rankingData && rankingData.length > 0 && (
          <section className="px-6 py-12 sm:py-20">
            <div className="mx-auto max-w-xl">
              <h2 className="text-center text-3xl font-bold text-gray-800">
                ユーザーランキング
              </h2>
              <div className="mt-12 space-y-4">
                {rankingData.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center rounded-lg bg-white p-4 shadow-sm"
                  >
                    <div className="flex w-10 flex-shrink-0 items-center justify-center">
                      <Crown
                        className={`h-7 w-7 ${getCrownColor(index)}`}
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="font-bold text-gray-800">
                        {user.nickname}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">
                        {user.recipe_count}
                      </p>
                      <p className="text-xs text-gray-500">レシピ</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-48">
                <div className="flex flex-col items-center justify-center p-4 bg-orange-100 rounded-lg shadow-md w-40 h-40">
                  <img src="/sleep_memotto.png" alt="MEMOTTO" className="w-24 h-24" />
                  <p className="mt-2 text-sm text-gray-600">メモット</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4">
        <div className="mx-auto max-w-xl px-6 text-center text-sm text-gray-500">
          <p>© 2025 MEMOTTO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}