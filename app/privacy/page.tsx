import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">プライバシーポリシー</h1>
          
          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. はじめに</h2>
              <p>
                MEMOTTO（以下、「当サービス」といいます）は、ユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます）を定めます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. 収集する情報</h2>
              <p>当サービスは、以下の情報を収集します。</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>メールアドレス</li>
                <li>パスワード（暗号化して保存され、運営者も閲覧できません）</li>
                <li>ニックネーム</li>
                <li>ユーザーが保存したメモ、レシピ、画像データ</li>
                <li>外部サービス（Google, Twitter等）連携情報（連携を選択した場合）</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. 情報の利用目的</h2>
              <p className="mb-2">当サービスは、収集した情報を以下の目的で利用します。</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li className="font-bold text-red-600">メールアドレスは、以下の目的にのみ厳格に限定して使用します。</li>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-600">
                  <li>ユーザーの本人確認およびログイン認証</li>
                  <li>パスワード再設定などのセキュリティ関連の手続き</li>
                  <li>システム障害、規約変更、その他サービス運営上の重要なお知らせの通知</li>
                </ul>
                <li className="font-bold mt-2">当サービスは、メールアドレスを広告配信、マーケティング、勧誘、または第三者への提供に利用することは一切ありません。</li>
                <li className="mt-2">サービスの提供・運営のため</li>
                <li>ユーザーからのお問い合わせに対応するため</li>
                <li>不正アクセスやスパム行為の防止のため</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. 個人情報の第三者提供</h2>
              <p>
                当サービスは、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. 外部サービスの利用について</h2>
              <p>
                当サービスは、AIによる解析機能を提供するために、Google Gemini APIを利用しています。
                ユーザーが入力したテキストや画像データは、解析のためにGoogleのサーバーに送信されますが、
                API経由で送信されたデータは、GoogleのAIモデルの学習には使用されません（GoogleのAPI利用規約に基づく）。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. プライバシーポリシーの変更</h2>
              <p>
                本ポリシーの内容は、ユーザーに通知することなく、変更することができるものとします。
                当サービスが別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. お問い合わせ</h2>
              <p>
                本ポリシーに関するお問い合わせは、以下のコンタクトフォームよりお願いいたします。
              </p>
              <div className="mt-4">
                <Link href="/contact" className="text-blue-600 hover:underline">
                  お問い合わせフォーム
                </Link>
                <span className="mx-2">|</span>
                <Link href="/terms-of-service" className="text-blue-600 hover:underline">
                  利用規約
                </Link>
              </div>
            </section>
          </div>

          <div className="mt-12 text-center">
            <Link href="/">
              <Button variant="outline">トップページに戻る</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
