import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">利用規約</h1>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. サービス内容</h2>
              <p className="mb-2">
                本サービスは、ユーザーがレシピを保存、管理、共有するためのメモアプリケーションです。
              </p>
              <p>
                ユーザーは、テキスト入力、画像からのOCR、外部ウェブサイトからのスクレイピング、YouTube動画からの情報抽出など、様々な方法でレシピを登録できます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. 利用条件</h2>
              <p className="mb-2">
                本サービスは、個人の非営利目的に限り利用可能です。
              </p>
              <p className="mb-2">
                ユーザーは、本サービスの利用にあたり、関連する法令および本規約を遵守するものとします。
              </p>
              <p>
                未成年者が本サービスを利用する場合、保護者の同意を得る必要があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. 禁止事項</h2>
              <p className="mb-2">
                ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>他のユーザーまたは第三者の著作権、商標権、プライバシー権、肖像権、名誉権その他の権利を侵害する行為</li>
                <li>他のユーザーまたは第三者に不利益、損害、不快感を与える行為</li>
                <li>本サービスの運営を妨害するおそれのある行為</li>
                <li>不正アクセスまたはこれを試みる行為</li>
                <li>本サービスを商用目的で利用する行為（ただし、別途弊社が許諾した場合を除く）</li>
                <li>その他、弊社が不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. ユーザーコンテンツ</h2>
              <p className="mb-2">
                ユーザーが本サービスに登録するレシピ、画像、テキストその他のコンテンツ（以下「ユーザーコンテンツ」といいます）の著作権は、ユーザーまたは正当な権利者に帰属します。
              </p>
              <p className="mb-2">
                ユーザーは、弊社に対し、本サービスの運営、プロモーション、改善に必要な範囲で、ユーザーコンテンツを無償で利用（複製、公衆送信、翻案等を含みます）することを許諾するものとします。
              </p>
              <p>
                ユーザーは、ユーザーコンテンツが第三者の権利を侵害していないことを保証するものとします。万一、第三者との間で紛争が発生した場合、ユーザーの費用と責任において解決するものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. 免責事項</h2>
              <p className="mb-2">
                弊社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます）がないことを明示的にも黙示的にも保証しておりません。
              </p>
              <p className="mb-2">
                弊社は、本サービスに起因してユーザーに生じたあらゆる損害について、一切の責任を負いません。ただし、本サービスに関する弊社とユーザーとの間の契約（本規約を含みます）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。
              </p>
              <p>
                上記ただし書きに定める場合であっても、弊社は、弊社の過失（重過失を除きます）による債務不履行または不法行為によりユーザーに生じた損害のうち、特別な事情から生じた損害（弊社またはユーザーが損害発生につき予見し、または予見し得た場合を含みます）について一切の責任を負いません。また、弊社の過失（重過失を除きます）による債務不履行または不法行為によりユーザーに生じた損害の賠償は、当該損害が発生した月にユーザーが弊社に支払った利用料金を上限とします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. 規約の変更</h2>
              <p>
                弊社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の利用規約は、本ウェブサイトに掲載された時点から効力を生じるものとします。本規約変更後にユーザーが本サービスを利用した場合、変更後の規約に同意したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. 準拠法・裁判管轄</h2>
              <p className="mb-2">
                本規約の解釈にあたっては、日本法を準拠法とします。
              </p>
              <p>
                本サービスに関して紛争が生じた場合には、弊社の本店所在地を管轄する裁判所を専属的合意管轄裁判所とします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. お問い合わせ</h2>
              <p>
                本規約に関するお問い合わせは、以下のコンタクトフォームよりお願いいたします。
              </p>
              <div className="mt-4">
                <Link href="/contact" className="text-blue-600 hover:underline">
                  お問い合わせフォーム
                </Link>
                <span className="mx-2">|</span>
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  プライバシーポリシー
                </Link>
              </div>
            </section>
            
            <div className="mt-8 text-sm text-gray-500 border-t pt-4">
              <p>最終更新日: 2025年12月12日</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/">
              <Button variant="outline">トップページに戻る</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}