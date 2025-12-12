'use client'

import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  Link as LinkIcon,
  Image,
  GripVertical,
  Layers,
  Share2,
  Fingerprint,
  Sliders,
  User,
  Zap,
  Globe,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export default function HelpPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#FDF7F0] text-stone-800">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/')} 
          className="mb-8 hover:bg-orange-100 text-stone-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          トップへ戻る
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-stone-900">使い方ガイド</h1>
          <p className="text-lg text-stone-600">
            MEMOTTOの全機能をマスターして、あなたの知識管理を最適化しましょう。
          </p>
        </div>

        <div className="space-y-12">
          
          {/* Section 1: 基本的な使い方 */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-stone-800 border-b border-orange-200 pb-2">
              <Zap className="h-6 w-6 text-orange-500" />
              まずはここから
            </h2>
            <div className="grid gap-6 md:grid-cols-1">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <LinkIcon className="h-5 w-5 text-orange-500" />
                    URLから追加
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-stone-600 space-y-2">
                  <p>Webサイト、YouTube動画、技術記事などのURLを貼り付けるだけで、AIが自動的に内容を要約して保存します。</p>
                  <p className="text-sm text-stone-500 bg-stone-100 p-2 rounded">
                    ※ 複数のURLを一度に貼り付けて、一括追加することも可能です。
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section 2: 整理・整頓 */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-stone-800 border-b border-orange-200 pb-2">
              <Layers className="h-6 w-6 text-orange-500" />
              整理・整頓
            </h2>
            <Card className="border-none shadow-md mb-6">
              <CardContent className="pt-6 space-y-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600 font-bold">1</div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">ページ（大分類）</h3>
                    <p className="text-stone-600 mb-2">
                      サイドバーで「ページ」を作成し、大きなジャンルで分けます。
                    </p>
                    <div className="flex gap-2 text-sm text-stone-500 flex-wrap">
                      <span className="bg-stone-100 px-2 py-1 rounded">🍳 料理レシピ</span>
                      <span className="bg-stone-100 px-2 py-1 rounded">📚 学習メモ</span>
                      <span className="bg-stone-100 px-2 py-1 rounded">🎮 ゲーム攻略</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600 font-bold">2</div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">カテゴリー（中分類）</h3>
                    <p className="text-stone-600 mb-2">
                      ページの中でさらに「カテゴリー」を作って整理。アイテムはドラッグ＆ドロップで自由に並べ替えられます。
                    </p>
                    <div className="flex gap-2 text-sm text-stone-500 flex-wrap">
                      <span className="bg-stone-100 px-2 py-1 rounded">和食</span>
                      <span className="bg-stone-100 px-2 py-1 rounded">洋食</span>
                      <span className="bg-stone-100 px-2 py-1 rounded">デザート</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 3: 共有機能 */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-stone-800 border-b border-orange-200 pb-2">
              <Share2 className="h-6 w-6 text-orange-500" />
              共有する
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">ページを共有</CardTitle>
                  <CardDescription>特定のテーマだけを友人に</CardDescription>
                </CardHeader>
                <CardContent className="text-stone-600">
                  <p>特定の「ページ」単位で公開リンクを発行できます。「おすすめレシピ集」だけを友人に送りたい時に便利です。</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">すべて共有</CardTitle>
                  <CardDescription>あなたの知識ベースを公開</CardDescription>
                </CardHeader>
                <CardContent className="text-stone-600">
                  <p>全ページ・全カテゴリーを含むあなたの全てのメモを閲覧できるリンクを発行します。ポートフォリオやWikiのように使えます。</p>
                </CardContent>
              </Card>
            </div>
            <p className="mt-4 text-sm text-stone-500 text-center">
              ※ 共有リンクを知っている人のみが閲覧できます。閲覧者はログイン不要です。
            </p>
          </section>

          {/* Section 4: 高度な設定 */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-stone-800 border-b border-orange-200 pb-2">
              <Sliders className="h-6 w-6 text-orange-500" />
              カスタマイズ設定
            </h2>
            <Accordion type="single" collapsible className="w-full bg-white rounded-xl shadow-md px-4">
              <AccordionItem value="item-1">
                <AccordionTrigger className="font-semibold text-stone-800">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-orange-500" />
                    Gemini APIキー (無制限利用)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-stone-600">
                  <p className="mb-2">
                    デフォルトでは1日10回までの制限がありますが、ご自身のGoogle Gemini APIキーを設定することで、<strong>無制限</strong>に利用可能になります。
                  </p>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline font-medium">
                    Google AI Studioでキーを取得 (無料) &rarr;
                  </a>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="font-semibold text-stone-800">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-500" />
                    AIプロンプト & 要約設定
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-stone-600">
                  <p className="mb-2">要約の長さ（短い・普通・詳しい）を選択できます。</p>
                  <p>また、システムプロンプトを直接編集することで、「関西弁で要約して」「小学生にもわかるように」といった細かい指示が可能です。</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="font-semibold text-stone-800">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-orange-500" />
                    パスキー設定 (生体認証)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-stone-600">
                  <p>
                    Touch ID、Face ID、Windows Helloなどの生体認証を登録できます。
                    次回からパスワード入力なしで、安全かつ瞬時にログインできます。
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="font-semibold text-stone-800">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-orange-500" />
                    プロフィール設定
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-stone-600">
                  <p>ニックネームの変更や、アバター画像のアップロードが可能です。自分らしいプロフィールにカスタマイズしましょう。</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {/* Section 5: よくある質問 */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-stone-800 border-b border-orange-200 pb-2">
              <Search className="h-6 w-6 text-orange-500" />
              困ったときは
            </h2>
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-stone-800 mb-2">Q. うまく読み込めないサイトがあります</h3>
                <p className="text-stone-600">
                  A. 一部のサイト（InstagramやXなど）は技術的な制限により、内容の自動抽出ができない場合があります。その場合は、URLとタイトルのみが保存されます。手動でメモを追記してご利用ください。
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-stone-800 mb-2">Q. AIの要約がおかしいです</h3>
                <p className="text-stone-600">
                  A. 設定ページの「カスタムプロンプト」を調整してみてください。「箇条書きでまとめて」などを追記すると改善することがあります。また、動画の場合は字幕データがないと精度が落ちることがあります。
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}