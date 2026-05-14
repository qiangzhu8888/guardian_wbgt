import { Link } from 'react-router-dom';
import PublicDocsLayout from '../components/PublicDocsLayout';
import { PRIVACY_PATH } from '../lib/productLandingCta';

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

export default function TermsPage() {
  return (
    <PublicDocsLayout
      title="利用規約"
      description={
        <>
          本ページは公開用の<strong>ひな型（サンプル）</strong>です。本番運用の前に、貴社の顧問等へ内容の確認・差し替えを行ってください。詳しくは{' '}
          <Link to={PRIVACY_PATH} className="text-sky-700 dark:text-sky-400 font-medium underline underline-offset-4">
            プライバシーポリシー
          </Link>{' '}
          もあわせてご確認ください。
        </>
      }
    >
      <div className="space-y-6 max-w-3xl">
        <ArticleSection title="第1条（適用）">
          <p>
            本規約は、本サービス（熱中症監視・関連する管理機能を含みます）の提供条件および当該サービスを利用するすべての方と運用主体との間の権利義務関係を定めることを目的とします。
          </p>
        </ArticleSection>
        <ArticleSection title="第2条（本サービスの内容）">
          <p>
            本サービスは、計測データに基づく暑さ指数（WBGT）等の可視化、管理者による施設・デバイス台帳の整備などを提供するものです。提供範囲・仕様は運用主体の判断により変更される場合があります。
          </p>
        </ArticleSection>
        <ArticleSection title="第3条（利用者の遵守事項）">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>法令および公序良俗に反する利用を行わないこと</li>
            <li>権限のないデータへのアクセス・改ざん・不正な自動取得を行わないこと</li>
            <li>管理者アカウントの認証情報を第三者と共有しないこと</li>
            <li>運用主体が定めるセキュリティ方針に従うこと</li>
          </ul>
        </ArticleSection>
        <ArticleSection title="第4条（知的財産）">
          <p>
            本サービスに関する画面構成、プログラム、ドキュメント等に関する権利は運用主体または正当な権利者に帰属します。利用者は、許可なく複製・改変・頒布してはなりません。
          </p>
        </ArticleSection>
        <ArticleSection title="第5条（免責）">
          <p>
            本サービスは「現状有姿」で提供されます。運用主体は、本サービスの正確性・完全性・有用性・中断の不存在などについて保証しません。利用者が本サービスを利用したことにより被った損害について、運用主体に故意または重過失がある場合を除き、責任を負いません。
          </p>
        </ArticleSection>
        <ArticleSection title="第6条（規約の変更）">
          <p>
            運用主体は、必要に応じて本規約を変更できます。変更後の規約は、本ページに掲載した時点または運用主体が定める効力発生日から効力を生じるものとします。
          </p>
        </ArticleSection>
        <ArticleSection title="お問い合わせ">
          <p>本規約に関するお問い合わせは、貴社・貴団体の本サービス運用窓口へご連絡ください。</p>
        </ArticleSection>
      </div>
    </PublicDocsLayout>
  );
}
