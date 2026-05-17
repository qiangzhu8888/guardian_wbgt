import { Link } from 'react-router-dom';
import ThemeFullscreenControls from '../components/ThemeFullscreenControls';
import {
  FeatureIconWrap,
  IconArrowDown,
  IconArrowRight,
  IconCalendarFold,
  IconClipboardList,
  IconCloud,
  IconCpu,
  IconFactory,
  IconLandmark,
  IconLayoutGrid,
  IconLayers,
  IconLink,
  IconMonitor,
  IconSchool,
  IconShieldCheck,
  IconSmartphone,
  IconSparkles,
  IconThermometer,
} from '../components/ProductLandingIcons';
import { APP_DISPLAY_NAME, DEFAULT_APP_LOGO_URL, PRODUCTION_COMPANY_NAME } from '../lib/appBranding';
import { getAppReleaseVersion } from '../lib/appRelease';
import { productLandingCtaPaths } from '../lib/productLandingCta';

const featureItems = [
  {
    title: '施設単位のダッシュボード',
    body: '敷地や建物ごとに暑さ指数（WBGT）推定値を一覧し、状況を素早く把握できます。',
    Icon: IconLayoutGrid,
    tone: 'sky',
  },
  {
    title: '詳細ビューとモバイル表示',
    body: '施設詳細画面やプレビュー表示で、現場・携帯端末からも確認しやすいレイアウトを用意しています。',
    Icon: IconSmartphone,
    tone: 'violet',
  },
  {
    title: '公開設定とフォールバック',
    body: 'サーバーから公開設定を取得し、取得に失敗した場合は静的な既定設定へフォールバックできます。',
    Icon: IconCloud,
    tone: 'emerald',
  },
  {
    title: 'BUILDICS® API 連携',
    body: 'GUARDIAN アプリクラウドから BUILDICS® API を呼び出し、パスのホワイトリストや JSON サイズ制限などの安全策を適用します。',
    Icon: IconLink,
    tone: 'amber',
  },
  {
    title: 'デバイス台帳とスコープ',
    body: 'クラウド上の台帳に登録されたデバイスだけが対象となり、deviceId の整合をサーバー側で検証します。',
    Icon: IconClipboardList,
    tone: 'rose',
  },
  {
    title: '監査ログ',
    body: 'デバイスの登録・一括取り込み・更新・論理削除などの操作を監査ログに残し、運用上の追跡性を高めます。',
    Icon: IconShieldCheck,
    tone: 'slate',
  },
];

const useCaseItems = [
  {
    title: '学校・幼稚園',
    body: '校舎・グラウンド・プール周辺の熱中症リスクを職員が共有します。',
    Icon: IconSchool,
    tone: 'sky',
  },
  {
    title: '体育館・官公庁施設',
    body: '来館者や職員向けに、館内・屋外エリアの見える化を行います。',
    Icon: IconLandmark,
    tone: 'violet',
  },
  {
    title: '工場・倉庫',
    body: '作人業ラインや搬入口付近など、局所的高温環境を定点で把握します。',
    Icon: IconFactory,
    tone: 'amber',
  },
  {
    title: '屋外イベント',
    body: '仮設会場や屋外ステージなど、短期的な監視が必要な現場向けに活用できます。',
    Icon: IconCalendarFold,
    tone: 'emerald',
  },
];

/** 用途例カード左アクセント（tone に連動） */
const useCaseLeftBorderClass = {
  sky: 'border-l-sky-500/55 dark:border-l-sky-400/45',
  violet: 'border-l-violet-500/55 dark:border-l-violet-400/45',
  amber: 'border-l-amber-500/55 dark:border-l-amber-400/45',
  emerald: 'border-l-emerald-500/55 dark:border-l-emerald-400/45',
};

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-10 max-w-2xl">
      {eyebrow ? (
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
          <IconSparkles className="h-3.5 w-3.5 opacity-85 text-sky-600 dark:text-sky-400" aria-hidden />
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-[1.35rem] sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">{title}</h2>
      {description ? (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}

function ArchitectureBlock({ label, detail, accent, Icon, className: blockClassName = '' }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 text-center shadow-sm transition-shadow hover:shadow-md ${
        accent
          ? 'border-sky-400/60 bg-gradient-to-b from-sky-500/12 to-sky-500/5 dark:border-sky-500/45 dark:from-sky-500/20 dark:to-sky-500/8'
          : 'surface-card'
      } ${blockClassName}`.trim()}
    >
      {Icon ? (
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-sky-600 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-sky-400">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">{detail}</p>
    </div>
  );
}

function FlowArrow({ label }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-1 text-sky-500/70 dark:text-sky-400/80 shrink-0"
      aria-hidden
    >
      <IconArrowDown className="h-5 w-5" />
      {label ? (
        <span className="text-[10px] font-semibold tracking-wide uppercase mt-0.5 text-slate-500 dark:text-slate-400">
          {label}
        </span>
      ) : null}
    </div>
  );
}

function FlowArrowHorizontal({ label }) {
  return (
    <div className="flex flex-col items-center justify-center px-0.5 text-sky-500/75 dark:text-sky-400/85 shrink-0 w-11 sm:w-14" aria-hidden>
      {label ? (
        <span className="text-[9px] font-bold uppercase tracking-wide text-center leading-tight text-slate-500 dark:text-slate-400 mb-1 max-w-[4.25rem]">
          {label}
        </span>
      ) : null}
      <IconArrowRight className="h-5 w-5 opacity-90" />
    </div>
  );
}

export default function ProductLandingPage() {
  const { monitorPath, adminLoginPath, changelogPath, manualPath, termsPath, privacyPath, slidesPath, specsPath } =
    productLandingCtaPaths();
  const version = getAppReleaseVersion();

  const heroPills = [
    { label: 'WBGT 可視化', Icon: IconThermometer },
    { label: '施設ダッシュボード', Icon: IconLayoutGrid },
    { label: 'クラウド連携', Icon: IconCloud },
    { label: '安全な API', Icon: IconShieldCheck },
  ];

  const lpAnchorNav = [
    { href: '#lp-features', label: '製品の特徴' },
    { href: '#lp-architecture', label: 'システム構成' },
    { href: '#lp-data-flow', label: 'データの流れ' },
    { href: '#lp-use-cases', label: '用途例' },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-neutral-50 flex flex-col relative overflow-x-hidden dark:bg-slate-950">
      <a href="#lp-main-content" className="skip-link">
        メインコンテンツへスキップ
      </a>
      {/* ヒーロー背景 */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_80%_52%_at_50%_-8%,rgba(56,189,248,0.16),transparent)] dark:bg-[radial-gradient(ellipse_80%_52%_at_50%_-8%,rgba(56,189,248,0.1),transparent)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[min(88vh,920px)] bg-landing-dot bg-[length:22px_22px] dark:bg-landing-dot-dark opacity-55 dark:opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute right-[max(-5%,-80px)] top-28 h-80 w-80 rounded-full bg-violet-400/12 blur-3xl dark:bg-violet-500/08"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[max(-5%,-60px)] top-44 h-64 w-64 rounded-full bg-sky-400/14 blur-3xl dark:bg-sky-500/08"
        aria-hidden
      />
      {/* 下部へのソフトフェード */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[min(72vh,800px)] h-48 bg-gradient-to-t from-neutral-50 to-transparent dark:from-slate-950 dark:to-transparent"
        aria-hidden
      />

      <header className="relative z-30 text-white shrink-0 border-b border-white/10 pt-[max(0.25rem,env(safe-area-inset-top))] shadow-header backdrop-blur-md bg-gradient-to-r from-slate-950/95 via-slate-900/96 to-slate-950/95 supports-[backdrop-filter]:bg-slate-950/88">
        <div className="max-w-6xl mx-auto px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={DEFAULT_APP_LOGO_URL}
              alt=""
              className="h-9 w-auto max-w-[130px] sm:h-10 sm:max-w-[150px] object-contain shrink-0 drop-shadow-md rounded-md bg-white/10 p-0.5"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="min-w-0 relative">
              <p className="text-sm font-bold tracking-tight leading-snug truncate">{APP_DISPLAY_NAME}</p>
              <div className="mt-1 text-[11px] text-white/75 space-y-1.5">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>製品案内・システム概要</span>
                  {version ? (
                    <span className="tabular-nums rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white shrink-0">
                      v{version}
                    </span>
                  ) : null}
                </p>
                <div className="hidden sm:flex flex-wrap items-center gap-x-2 gap-y-1 leading-snug">
                  <Link
                    to={changelogPath}
                    className="text-white/90 hover:text-white hover:underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 rounded-sm shrink-0"
                  >
                    更新履歴
                  </Link>
                  <span className="text-white/35" aria-hidden>
                    ·
                  </span>
                  <Link
                    to={manualPath}
                    className="text-white/90 hover:text-white hover:underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 rounded-sm shrink-0"
                  >
                    管理マニュアル
                  </Link>
                  <span className="text-white/35" aria-hidden>
                    ·
                  </span>
                  <Link
                    to={slidesPath}
                    className="text-white/90 hover:text-white hover:underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 rounded-sm shrink-0"
                  >
                    スライド紹介
                  </Link>
                  <span className="text-white/35" aria-hidden>
                    ·
                  </span>
                  <Link
                    to={specsPath}
                    className="text-white/90 hover:text-white hover:underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 rounded-sm shrink-0"
                  >
                    温湿度センサー仕様
                  </Link>
                  <span className="text-white/35" aria-hidden>
                    ·
                  </span>
                  <Link
                    to={termsPath}
                    className="text-white/90 hover:text-white hover:underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 rounded-sm shrink-0"
                  >
                    利用規約
                  </Link>
                  <span className="text-white/35" aria-hidden>
                    ·
                  </span>
                  <Link
                    to={privacyPath}
                    className="text-white/90 hover:text-white hover:underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 rounded-sm shrink-0"
                  >
                    プライバシー
                  </Link>
                </div>
                <details className="group sm:hidden [&_summary::-webkit-details-marker]:hidden">
                  <summary className="cursor-pointer select-none inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm hover:bg-white/15">
                    資料・規約
                    <span className="text-white/65 group-open:rotate-180 transition-transform duration-150 text-[10px]" aria-hidden>
                      ▾
                    </span>
                  </summary>
                  <nav
                    aria-label="ヘッダー補助リンク"
                    className="relative z-40 mt-2 max-h-[min(60vh,20rem)] overflow-y-auto rounded-xl border border-white/15 bg-slate-950/95 p-3 shadow-xl backdrop-blur-md max-w-[min(100vw-2rem,20rem)]"
                  >
                    <ul className="flex flex-col gap-2">
                      {[
                        { to: changelogPath, label: '更新履歴' },
                        { to: manualPath, label: '管理マニュアル' },
                        { to: slidesPath, label: 'スライド紹介' },
                        { to: specsPath, label: '温湿度センサー仕様' },
                        { to: termsPath, label: '利用規約' },
                        { to: privacyPath, label: 'プライバシー' },
                      ].map(({ to, label }) => (
                        <li key={to}>
                          <Link
                            to={to}
                            className="block rounded-lg px-3 py-2 text-sm font-medium text-white/95 hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
                          >
                            {label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </details>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
            <ThemeFullscreenControls variant="monitor" />
            <Link to={monitorPath} className="btn-ghost-header">
              監視画面(デモ)
            </Link>
            <Link to={adminLoginPath} className="btn-ghost-header">
              管理ログイン
            </Link>
          </div>
        </div>
      </header>

      <main
        id="lp-main-content"
        tabIndex={-1}
        className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-11 sm:py-16 space-y-[4.25rem] sm:space-y-24 pb-[max(2.5rem,env(safe-area-inset-bottom))] outline-none"
      >
        {/* ヒーロー */}
        <section id="lp-hero" className="text-center space-y-7 sm:space-y-9 scroll-mt-28">
          <p className="inline-flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-slate-200/95 bg-white/95 px-3.5 py-1 text-[11px] sm:text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-black/[0.04] dark:border-slate-600 dark:bg-slate-900/85 dark:text-slate-100 dark:ring-white/10">
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500 align-middle animate-pulse motion-reduce:animate-none"
                aria-hidden
              />{' '}
              BUILDICS® IoT × GUARDIAN クラウド
            </span>
          </p>

          <div className="mx-auto inline-flex flex-wrap justify-center gap-2 sm:gap-2.5 rounded-2xl border border-slate-200/85 bg-white/70 p-3 shadow-sm backdrop-blur-md dark:border-slate-700/85 dark:bg-slate-900/55">
            {heroPills.map(({ label, Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-100/95 bg-white/95 px-3 py-2 text-[11px] sm:text-xs font-medium text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700 shadow-inner dark:bg-sky-950/80 dark:text-sky-400">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {label}
              </span>
            ))}
          </div>

          <h1 className="flex flex-col items-center gap-y-2 text-center font-bold text-slate-900 dark:text-white tracking-tight leading-[1.12] mx-auto px-3 sm:px-0">
            <div className="flex w-full max-w-[100vw] justify-center overflow-x-auto no-scrollbar sm:max-w-none sm:overflow-visible">
              <span className="inline-block shrink-0 whitespace-nowrap text-[clamp(0.9375rem,0.82rem+2.1vw,2.75rem)]">
                暑さ指数（WBGT）を施設単位で見える化し、
              </span>
            </div>
            <span className="text-[clamp(0.9375rem,0.82rem+2.1vw,2.75rem)] text-pretty break-keep max-w-[22rem] sm:max-w-3xl px-2 sm:px-0">
              熱中症リスクの早期把握を支援します。
            </span>
          </h1>
          <p className="text-[0.9375rem] sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed text-pretty">
            現場の環境センサーから取得したデータをもとに、Web ブラウザでダッシュボード表示できる監視システムです。公開向けの監視画面と、管理者向けの台帳・設定を分離し、安全に運用できます。
          </p>

          <nav aria-label="ページ内セクションへ移動" className="flex flex-wrap justify-center gap-2 px-1">
            {lpAnchorNav.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="inline-flex items-center rounded-full border border-slate-200/90 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur-sm hover:border-sky-300/80 hover:bg-sky-50/90 hover:text-sky-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-sky-600 dark:hover:bg-sky-950/60 dark:hover:text-sky-100"
              >
                {label}
              </a>
            ))}
          </nav>

          <figure className="mx-auto max-w-5xl w-full px-0 sm:px-1 pt-1 text-left">
            <div className="relative rounded-[1.625rem] border border-white/85 bg-gradient-to-b from-white to-slate-50/98 p-[10px] sm:p-3 shadow-[0_42px_80px_-24px_rgb(15_23_42/0.2),0_2px_4px_-1px_rgb(15_23_42/0.06)] ring-1 ring-slate-950/[0.04] dark:border-slate-700/85 dark:from-slate-900 dark:to-slate-950 dark:shadow-[0_42px_80px_-24px_rgb(0_0_0/0.45)] dark:ring-white/[0.06]">
              <span className="pointer-events-none absolute right-4 top-4 z-[1] rounded-lg bg-slate-900/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md ring-1 ring-white/15 dark:bg-slate-950/90 dark:text-sky-100">
                デモ画面
              </span>
              <img
                src="/images/dashboard.png"
                alt="監視ダッシュボードの画面例。施設別に暑さ指数（WBGT）と要注意レベルが一覧表示されています。"
                className="w-full h-auto rounded-[1.125rem] object-contain"
                loading="eager"
                decoding="async"
              />
            </div>
            <figcaption className="mt-3 text-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-snug">
              監視画面（デモ）の一覧表示イメージ
            </figcaption>
          </figure>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center pt-2">
            <Link
              to={monitorPath}
              className="btn-primary-solid px-7 py-3.5 text-[0.9375rem] inline-flex items-center justify-center gap-2 shadow-lg shadow-slate-900/15 dark:shadow-sky-950/35 sm:min-w-[14rem]"
            >
              <IconMonitor className="h-5 w-5 opacity-95" />
              監視画面(デモ)を開く
            </Link>
            <Link
              to={adminLoginPath}
              className="btn-secondary-outline px-7 py-3.5 text-[0.9375rem] inline-flex items-center justify-center gap-2 sm:min-w-[14rem]"
            >
              <IconLayers className="h-5 w-5 opacity-90" />
              管理者ログイン
            </Link>
          </div>
          <p className="pt-2 flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
            <Link
              to={slidesPath}
              className="text-sm font-semibold text-sky-700 dark:text-sky-400 hover:underline underline-offset-4 inline-flex items-center gap-1.5 justify-center"
            >
              <IconSparkles className="h-4 w-4 opacity-90" />
              スライド形式で概要を見る
            </Link>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-600 select-none" aria-hidden>
              |
            </span>
            <Link
              to={specsPath}
              className="text-sm font-semibold text-sky-700 dark:text-sky-400 hover:underline underline-offset-4 inline-flex items-center gap-1.5 justify-center"
            >
              <IconCpu className="h-4 w-4 opacity-90 shrink-0" />
              温湿度センサー仕様
            </Link>
          </p>
        </section>

        {/* 特徴 */}
        <section id="lp-features" className="scroll-mt-28">
          <SectionHeading
            eyebrow="機能ハイライト"
            title="製品の特徴"
            description="本リポジトリで提供される機能に基づく、主な価値です。"
          />
          <div className="grid sm:grid-cols-2 gap-4 lg:gap-5">
            {featureItems.map((item) => (
              <div
                key={item.title}
                className="group surface-card p-5 sm:p-6 flex gap-4 rounded-2xl border border-slate-100/90 dark:border-slate-700/80 shadow-soft hover:border-sky-300/65 dark:hover:border-sky-800/65 hover:shadow-[0_8px_32px_-12px_rgb(15_23_42/0.12)] dark:hover:shadow-slate-950/50 hover:-translate-y-0.5 duration-300 ease-out transition-[box-shadow,border-color,transform]"
              >
                <FeatureIconWrap tone={item.tone}>
                  <item.Icon />
                </FeatureIconWrap>
                <div className="min-w-0 space-y-2 pt-0.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{item.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 構成 */}
        <section id="lp-architecture" className="scroll-mt-28">
          <SectionHeading
            eyebrow="アーキテクチャ"
            title="システム構成（概要）"
            description="現場のセンサーから BUILDICS® に計測データが集約され、GUARDIAN アプリクラウドを介して台帳・公開設定・API が提供されます。利用者はブラウザ上のアプリからダッシュボード等を利用します。"
          />
          {/* モバイル・タブレット: 縦フロー */}
          <div className="surface-card rounded-2xl border border-slate-100 dark:border-slate-700 p-6 sm:p-10 max-w-lg mx-auto shadow-soft bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm lg:hidden">
            <div className="flex flex-col items-stretch">
              <ArchitectureBlock label="現場" detail="環境センサー・ゲートウェイ" Icon={IconCpu} />
              <FlowArrow label="計測データ" />
              <ArchitectureBlock label="IoT プラットフォーム" detail="BUILDICS® クラウド" accent Icon={IconCloud} />
              <FlowArrow label="API 連携" />
              <ArchitectureBlock label="サービス層" detail="GUARDIAN アプリクラウド" accent Icon={IconLayers} />
              <FlowArrow label="HTTPS" />
              <ArchitectureBlock label="利用者" detail="Web アプリ（監視・管理）" Icon={IconMonitor} />
            </div>
          </div>
          {/* 大画面: 横並びステップ */}
          <div className="hidden lg:block surface-card rounded-2xl border border-slate-100 dark:border-slate-700 p-8 xl:p-10 max-w-[72rem] mx-auto shadow-soft bg-white/85 dark:bg-slate-900/45 backdrop-blur-sm">
            <div className="flex flex-row flex-nowrap items-stretch justify-between gap-1 xl:gap-2">
              <ArchitectureBlock label="現場" detail="センサー・GW" Icon={IconCpu} className="flex-1 min-w-0 max-w-[9.25rem] py-5 xl:py-6" />
              <FlowArrowHorizontal label="データ" />
              <ArchitectureBlock
                label="プラットフォーム"
                detail="BUILDICS®"
                accent
                Icon={IconCloud}
                className="flex-1 min-w-0 max-w-[9.25rem] py-5 xl:py-6"
              />
              <FlowArrowHorizontal label="API" />
              <ArchitectureBlock
                label="アプリ側"
                detail="GUARDIAN"
                accent
                Icon={IconLayers}
                className="flex-1 min-w-0 max-w-[9.25rem] py-5 xl:py-6"
              />
              <FlowArrowHorizontal label="HTTPS" />
              <ArchitectureBlock label="利用者" detail="監視・管理" Icon={IconMonitor} className="flex-1 min-w-0 max-w-[9.25rem] py-5 xl:py-6" />
            </div>
            <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-4">
              大画面では用語を短く表示しています。全文は説明文と、この上の縦並び表示（〜1024px 未満）をご覧ください。
            </p>
          </div>
        </section>

        {/* データの流れ */}
        <section id="lp-data-flow" className="scroll-mt-28">
          <SectionHeading eyebrow="データ経路" title="センサーとデータの流れ" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-soft dark:border-slate-700 dark:bg-slate-900/50 flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                1
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <IconLink className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  収集とガードレール
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  BUILDICS® プラットフォーム側のゲートウェイやセンサーから計測データが収集され、GUARDIAN
                  アプリクラウド経由でアプリから参照します。
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-soft dark:border-slate-700 dark:bg-slate-900/50 flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                2
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <IconShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  台帳によるスコープ検証
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  デバイス ID はクラウド上の台帳に登録されたものに限定され、サーバー側でスコープが検証されるため、意図しないデバイスへのアクセスを抑止しやすくなります。
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-soft md:col-span-2 dark:border-slate-700 dark:bg-slate-900/50 flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-900 dark:bg-violet-950 dark:text-violet-300">
                3
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <IconLayoutGrid className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  画面への反映
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  暑さ指数の推定・閾値表示などは、取得データと公開設定の組み合わせにより画面へ反映されます。施設ごとの表示名やテーマ色などは、組織単位の公開設定で調整できる想定です。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 用途 */}
        <section id="lp-use-cases" className="scroll-mt-28">
          <SectionHeading
            eyebrow="ユースケース"
            title="用途例"
            description="導入イメージの一例です。現場のガイドラインに合わせて運用してください。"
          />
          <ul className="grid sm:grid-cols-2 gap-4 lg:gap-5">
            {useCaseItems.map((uc) => (
              <li
                key={uc.title}
                className={`surface-card p-5 sm:p-6 rounded-2xl flex gap-4 items-start border border-slate-100/90 border-l-[3px] dark:border-slate-700/80 ${useCaseLeftBorderClass[uc.tone] ?? useCaseLeftBorderClass.sky} pl-[1.125rem] shadow-soft hover:shadow-md transition-[box-shadow,transform] hover:-translate-y-0.5 duration-300 ease-out`}
              >
                <FeatureIconWrap tone={uc.tone}>
                  <uc.Icon />
                </FeatureIconWrap>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{uc.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{uc.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/95 bg-gradient-to-br from-white via-sky-50/40 to-violet-50/50 px-6 py-10 sm:px-10 sm:py-12 text-center shadow-[0_4px_32px_-8px_rgb(15_23_42/0.1)] ring-1 ring-slate-950/[0.04] dark:border-slate-700/90 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/30 dark:ring-white/[0.05] dark:shadow-none">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-sky-400/25 blur-2xl dark:bg-sky-500/20"
            aria-hidden
          />
          <div className="relative space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-lg shadow-sky-600/30">
              <IconSparkles className="h-7 w-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">まずは監視画面(デモ)で状態を確認</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
              既定の組織向け URL から公開ダッシュボードを表示します。管理者は台帳・設定からデバイスを整備してください。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link to={monitorPath} className="btn-primary-solid px-8 py-3 inline-flex items-center justify-center gap-2">
                <IconMonitor className="h-5 w-5" />
                監視画面(デモ)へ
              </Link>
              <Link
                to={adminLoginPath}
                className="btn-secondary-outline px-8 py-3 inline-flex items-center justify-center gap-2 bg-white/60 dark:bg-slate-900/60"
              >
                <IconLayers className="h-5 w-5" />
                管理コンソールへ
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200/90 dark:border-slate-800 py-10 mt-auto bg-white/85 dark:bg-slate-950/80 backdrop-blur-sm pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-2">
            <IconThermometer className="h-4 w-4 text-sky-600 dark:text-sky-500 shrink-0 opacity-80" />
            <span>
              {APP_DISPLAY_NAME}
              {version ? <span className="ml-2 tabular-nums text-slate-400">v{version}</span> : null}
            </span>
          </span>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-5 gap-y-2">
            <Link
              to={changelogPath}
              className="font-medium text-sky-700 dark:text-sky-400 hover:underline underline-offset-4 inline-flex items-center gap-1.5"
            >
              <IconSparkles className="h-3.5 w-3.5 opacity-70" />
              更新履歴
            </Link>
            <Link to={manualPath} className="font-medium text-sky-700 dark:text-sky-400 hover:underline underline-offset-4">
              管理マニュアル
            </Link>
            <Link to={slidesPath} className="font-medium text-sky-700 dark:text-sky-400 hover:underline underline-offset-4">
              スライド紹介
            </Link>
            <Link to={specsPath} className="font-medium text-sky-700 dark:text-sky-400 hover:underline underline-offset-4">
              温湿度センサー仕様
            </Link>
            <Link to={termsPath} className="font-medium text-sky-700 dark:text-sky-400 hover:underline underline-offset-4">
              利用規約
            </Link>
            <Link to={privacyPath} className="font-medium text-sky-700 dark:text-sky-400 hover:underline underline-offset-4">
              プライバシー
            </Link>
            <Link
              to={monitorPath}
              className="font-medium text-sky-700 dark:text-sky-400 hover:underline underline-offset-4 inline-flex items-center gap-1.5"
            >
              <IconMonitor className="h-3.5 w-3.5 opacity-70" />
              監視画面(デモ)を開く
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-[11px] text-slate-500 dark:text-slate-500">
          制作・開発：{PRODUCTION_COMPANY_NAME}
        </p>
      </footer>
    </div>
  );
}
