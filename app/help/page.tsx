'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Search, Trash2, Upload, Link, Image, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function HelpPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.push('/')} className="mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>

        <h1 className="text-3xl font-bold mb-2">使い方ガイド</h1>
        <p className="text-gray-600 mb-8">MEMOTTOの使い方を説明します。レシピだけでなく、SNSの投稿や動画の内容保存にも活用できます。</p>

        <div className="space-y-6">
          {/* コンテンツの追加 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                コンテンツの追加
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  URLから追加
                </h3>
                <p className="text-gray-700 text-sm mb-2">
                  右下の「＋」ボタンをクリックし、「URLから追加」タブでURLを入力します。
                </p>
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-gray-900 mb-1">対応サイト：</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li><strong>YouTube</strong> - 字幕・概要欄から内容を抽出</li>
                    <li><strong>Cookpad、クラシル、DELISH KITCHEN、白ごはん.com</strong> などレシピサイト</li>
                    <li><strong>マナピタイムズ、パスナビ、STUDY HACKER</strong>など勉強系サイト</li>
                    <li><strong>GameWith、Game8、神ゲー攻略</strong>などゲーム攻略サイト</li>
                    <li><strong>Qiita、Zenn、note</strong>など技術記事サイト</li>
                  </ul>
                  <p className="mt-3 text-gray-600">
                    ※ X（旧Twitter）やInstagramは技術的な制約により、内容の自動抽出はできません。
                    URLと基本的なメモとして保存されます。
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  写真から追加
                </h3>
                <p className="text-gray-700 text-sm mb-2">
                  画像やPDFをアップロードすると、AIが自動で解析して内容を抽出します。
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <p className="text-amber-900">
                    <strong>※ Gemini APIキーが必要です</strong><br />
                    設定ページでAPIキーを登録してください。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* カテゴリー機能 */}
          <Card>
            <CardHeader>
              <CardTitle>カテゴリー機能</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">カテゴリーの追加</h3>
                <p className="text-gray-700 text-sm">
                  右下の「＋」ボタンをクリックし、「カテゴリーを追加」を選択します。レシピを整理するためのラベルとして使えます。
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">編集と削除</h3>
                <p className="text-gray-700 text-sm">
                  カテゴリー名をクリックすると編集できます。右側のゴミ箱アイコンで削除できます。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 並べ替え */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GripVertical className="h-5 w-5" />
                並べ替え
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-sm mb-2">
                レシピとカテゴリーは自由に並べ替えができます。
              </p>
              <p className="text-gray-700 text-sm">
                左側の<GripVertical className="h-4 w-4 inline" />アイコンをドラッグして、好きな順番に並べ替えてください。順番は自動で保存されます。
              </p>
            </CardContent>
          </Card>

          {/* 目次機能 */}
          <Card>
            <CardHeader>
              <CardTitle>目次機能</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">デスクトップ</h3>
                <p className="text-gray-700 text-sm">
                  画面左側に目次が表示されます。カテゴリー名をクリックすると、そのカテゴリーまでスクロールします。
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">モバイル</h3>
                <p className="text-gray-700 text-sm">
                  左上のメニューアイコンをタップすると目次が開きます。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 検索機能 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                検索機能
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-sm">
                右上の検索アイコンをクリックすると、タイトルや内容で検索できます。カテゴリー名でも検索可能です。
              </p>
            </CardContent>
          </Card>

          {/* 削除機能 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                削除機能
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">一括削除</h3>
                <ol className="list-decimal list-inside text-gray-700 text-sm space-y-1">
                  <li>右上のゴミ箱アイコンをクリックして選択モードに入る</li>
                  <li>削除したいコンテンツやカテゴリーにチェックを入れる</li>
                  <li>「削除」ボタンをクリック</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* コンテンツの編集 */}
          <Card>
            <CardHeader>
              <CardTitle>コンテンツの編集</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-sm mb-2">
                各項目（タイトル、URL、内容）をダブルクリックすると編集できます。
              </p>
              <p className="text-gray-700 text-sm">
                編集後は自動で保存されます。
              </p>
            </CardContent>
          </Card>

          {/* 設定 */}
          <Card>
            <CardHeader>
              <CardTitle>設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Gemini APIキー</h3>
                <p className="text-gray-700 text-sm mb-2">
                  コンテンツの自動解析に使用します。<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>から無料で取得できます。
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">ニックネーム</h3>
                <p className="text-gray-700 text-sm">
                  ページ上部に表示される名前を設定できます。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">💡 Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-900">
              <p>• 内容は<strong>マークダウン形式</strong>で整形されます（見出し、箇条書き、太字など）</p>
              <p>• カテゴリーを使って「レシピ」「SNS」「動画メモ」などジャンル分けができます</p>
              <p>• XやYouTubeの内容も簡単に保存できます</p>
              <p>• 画像から内容を読み取る機能は、手書きのメモにも対応しています</p>
              <p>• レシピだけでなく、気になったツイートや動画の要約保存にも便利です</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
