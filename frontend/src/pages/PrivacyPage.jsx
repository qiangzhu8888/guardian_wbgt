import { Link } from 'react-router-dom';
import PublicDocsLayout from '../components/PublicDocsLayout';
import { TERMS_PATH } from '../lib/productLandingCta';

function ArticleSection({ title, children }) {
  return (
    <section className="surface-card p-5 sm:p-6 space-y-3">
      <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
        {title}
      </h2>
      <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <PublicDocsLayout
      title="プライバシーポリシー"
      description={
        <>
          本ページは個人情報の取扱いに関する<strong>ひな型（サンプル）</strong>です。実際に取得する項目・委託先・保管期間等はシステム構成と運用に合わせて必ず改稿し、法務確認を行ってください。サービス利用条件は{' '}
          <Link to={TERMS_PATH} className="text-sky-700 dark:text-sky-400 font-medium underline underline-offset-4">
            利用規約
          </Link>{' '}
          をご覧ください。
        </>
      }
    >
      <div className="space-y-6 max-w-3xl">
        <ArticleSection title="1. 取得する情報の例">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>本サービスへのアクセスに伴うログ（IP アドレス、ブラウザ種別、日時など）</li>
            <li>管理者ログインに用いるメールアドレスおよび認証に関連する情報</li>
            <li>施設名・デバイス ID 等の運用ために入力・登録される業務情報</li>
          </ul>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ※ 実際の取得項目は実装・設定により異なります。リポジトリの README / DEPLOY と整合するよう本文を更新してください。
          </p>
        </ArticleSection>
        <ArticleSection title="2. 利用目的">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>本サービスの提供・稼働維持・セキュリティ確保</li>
            <li>監視データの表示・履歴管理・問い合わせ対応</li>
            <li>利用規約等に違反する行為への対応</li>
            <li>法令に基づく対応</li>
          </ul>
        </ArticleSection>
        <ArticleSection title="3. 第三者提供・委託">
          <p>
            運用主体は、法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。クラウドインフラやメール送信等の業務委託に伴い処理を外部事業者に委託する場合があります。その際は委託先の監督に必要な契約・措置を講じます（委託先名・再委託方針は運用文書に記載してください）。
          </p>
        </ArticleSection>
        <ArticleSection title="4. 保管期間">
          <p>
            取得した情報は、利用目的の達成に必要な期間を上限として保管し、不要となった場合は削除または匿名化します。具体的な保存期間は内部規程に従います。
          </p>
        </ArticleSection>
        <ArticleSection title="5. 開示・訂正・利用停止等">
          <p>
            個人情報保護法その他の法令に基づき、保有個人データの開示・訂正・利用停止等の請求に応じる手続きを定めます。請求窓口は運用主体が別途案内します。
          </p>
        </ArticleSection>
        <ArticleSection title="6. セキュリティ">
          <p>
            運用主体は、不正アクセス・漏えい等を防止するために、通信の暗号化、アクセス制御、権限管理など合理的な安全管理措置を講じます。
          </p>
        </ArticleSection>
        <ArticleSection title="7. 本ポリシーの変更">
          <p>
            運用主体は、法令の改正や事業内容の変更に応じて本ポリシーを改定できます。改定後の内容は本ページへの掲載または運用主体が定める方法により周知します。
          </p>
        </ArticleSection>
        <ArticleSection title="お問い合わせ">
          <p>個人情報の取扱いに関するお問い合わせは、貴社・貴団体の本サービス運用窓口（または社内の個人情報保護担当）へご連絡ください。</p>
        </ArticleSection>
      </div>
    </PublicDocsLayout>
  );
}
