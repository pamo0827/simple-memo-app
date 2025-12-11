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
        <p className="text-gray-600 mb-8">MEMOTTOの使い方を説明します。レシピだけでなく、SNSの投稿、動画の内容、勉強メモなど、あらゆる情報を一箇所にまとめて管理できます。</p>

        <div className="space-y-6">
          {/* ページ機能 */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-900">📂 ページ機能</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">複数のページで整理</h3>
                <p className="text-amber-800 text-sm mb-2">
                  サイドバーから複数のページを作成・管理できます。用途別に分けて整理しましょう。
                </p>
                <div className="bg-white rounded-lg p-3 text-sm">
                  <p className="font-medium text-gray-900 mb-1">活用例：</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li><strong>料理レシピ</strong> - お気に入りのレシピを集める</li>
                    <li><strong>勉強メモ</strong> - 学習内容や参考記事をまとめる</li>
                    <li><strong>ゲーム攻略</strong> - 攻略情報を整理する</li>
                    <li><strong>気になる記事</strong> - 後で読みたい記事を保存</li>
                    <li><strong>SNSアーカイブ</strong> - お気に入りの投稿を保存</li>
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">ページの操作</h3>
                <ul className="list-disc list-inside text-amber-800 text-sm space-y-1">
                  <li>サイドバーの「＋」ボタンで新しいページを作成</li>
                  <li>ページ名をクリックで編集、ゴミ箱アイコンで削除</li>
                  <li>ドラッグ＆ドロップでページの順番を変更</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          {/* コンテンツの追加 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                メモの追加
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  URLから追加
                </h3>
                <p className="text-gray-700 text-sm mb-2">
                  右下の「＋」ボタンをクリックし、「URLから追加」タブでURLを貼り付けます。AIが自動で内容を解析してまとめます。
                </p>
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-gray-900 mb-1">対応サイト：</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li><strong>YouTube</strong> - 字幕・概要欄から内容を抽出</li>
                    <li><strong>レシピサイト</strong> - Cookpad、クラシル、DELISH KITCHEN、白ごはん.com など</li>
                    <li><strong>勉強系サイト</strong> - マナピタイムズ、パスナビ、STUDY HACKER など</li>
                    <li><strong>ゲーム攻略サイト</strong> - GameWith、Game8、神ゲー攻略 など</li>
                    <li><strong>技術記事サイト</strong> - Qiita、Zenn、note など</li>
                    <li><strong>その他</strong> - ほとんどのウェブページに対応</li>
                  </ul>
                  <p className="mt-3 text-gray-600">
                    ※ X（旧Twitter）やInstagramは技術的な制約により、AI要約はできません。
                    URLと基本情報として保存されます。
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">AI抽出機能</h3>
                <p className="text-gray-700 text-sm mb-2">
                  保存済みのメモでも、後からAIで内容を抽出できます。
                </p>
                <ol className="list-decimal list-inside text-gray-700 text-sm space-y-1">
                  <li>メモを開いてURLの右側にある✨（Sparkles）アイコンをクリック</li>
                  <li>AIが自動でURLの内容を解析して、タイトルと内容を抽出</li>
                  <li>一度抽出した後は、🔄（リロード）アイコンで再抽出可能</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  何もなしで追加
                </h3>
                <p className="text-gray-700 text-sm">
                  URLや画像なしで、手軽にメモを作成できます。マークダウン形式で書くことができます。
                </p>
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
                  AI要約機能に使用します。<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>から無料で取得できます。
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm mt-2">
                  <p className="text-blue-900">
                    <strong>無料枠について</strong><br />
                    APIキーなしでも1日10回まで無料でAI要約を利用できます。無制限に使いたい場合は、APIキーを設定してください。
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">パスキー</h3>
                <p className="text-gray-700 text-sm mb-2">
                  生体認証（顔認証、指紋認証）や画面ロックで簡単にログインできる機能です。
                </p>
                <p className="text-gray-700 text-sm">
                  設定ページから登録すると、次回から「パスキーでログイン」ボタンで素早くログインできます。
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">ニックネーム</h3>
                <p className="text-gray-700 text-sm">
                  ページ上部に表示される名前を設定できます。
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">AI設定のカスタマイズ</h3>
                <p className="text-gray-700 text-sm">
                  要約の長さ（短い・普通・詳しい）や、カスタムプロンプトを設定して、AIの動作をカスタマイズできます。
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
              <p>• ページ機能で「料理」「勉強」「ゲーム」など用途別に分けて管理できます</p>
              <p>• カテゴリーを使って各ページ内でさらに細かく整理できます</p>
              <p>• XやYouTubeの内容も簡単に保存できます</p>
              <p>• URLをブラウザからドラッグ＆ドロップで素早く追加できます</p>
              <p>• 複数のURLを一度に貼り付けて、一括で追加できます</p>
              <p>• パスキーを登録すると、次回から生体認証で素早くログインできます</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
