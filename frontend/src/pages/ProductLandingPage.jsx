import { Link } from 'react-router-dom';
import ThemeFullscreenControls from '../components/ThemeFullscreenControls';
import {
  FeatureIconWrap,
  IconArrowDown,
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
import { APP_DISPLAY_NAME, DEFAULT_APP_LOGO_URL } from '../lib/appBranding';
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

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-8 max-w-2xl">
      {eyebrow ? (
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-800 dark:border-sky-500/35 dark:bg-sky-500/15 dark:text-sky-200">
          <IconSparkles className="h-3.5 w-3.5 opacity-90" />
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}

function ArchitectureBlock({ label, detail, accent, Icon }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 text-center shadow-sm transition-shadow hover:shadow-md ${
        accent
          ? 'border-sky-400/60 bg-gradient-to-b from-sky-500/12 to-sky-500/5 dark:border-sky-500/45 dark:from-sky-500/20 dark:to-sky-500/8'
          : 'surface-card'
      }`}
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

export default function ProductLandingPage() {
  const { monitorPath, adminLoginPath, changelogPath, manualPath } = productLandingCtaPaths();
  const version = getAppReleaseVersion();

  const heroPills = [
    { label: 'WBGT 可視化', Icon: IconThermometer },
    { label: '施設ダッシュボード', Icon: IconLayoutGrid },
    { label: 'クラウド連携', Icon: IconCloud },
    { label: '安全な API', Icon: IconShieldCheck },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-200/45 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col relative overflow-x-hidden">
      {/* ヒーロー背景のソフトグロー */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(56,189,248,0.22),transparent)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(56,189,248,0.12),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[max(-5%,-80px)] top-32 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[max(-5%,-60px)] top-48 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/10"
        aria-hidden
      />

      <header className="relative text-white shadow-header shrink-0 pt-[max(0.25rem,env(safe-area-inset-top))] bg-gradient-to-r from-slate-950 via-slate-800 to-slate-900">
        <div className="max-w-5xl mx-auto px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={DEFAULT_APP_LOGO_URL}
              alt=""
              className="h-9 w-auto max-w-[130px] sm:h-10 sm:max-w-[150px] object-contain shrink-0 drop-shadow-md rounded-md bg-white/10 p-0.5"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight leading-snug truncate">{APP_DISPLAY_NAME}</p>
              <p className="text-[11px] text-white/75 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>製品案内・システム概要</span>
                {version ? (
                  <span className="tabular-nums rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white shrink-0">
                    v{version}
                  </span>
                ) : null}
                <span className="text-white/40 hidden sm:inline" aria-hidden>
                  ·
                </span>
                <Link to={changelogPath} className="text-white/90 hover:underline underline-offset-2 shrink-0">
                  更新履歴
                </Link>
                <Link to={manualPath} className="text-white/90 hover:underline underline-offset-2 shrink-0">
                  管理マニュアル
                </Link>
              </p>
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

      <main className="relative flex-1 max-w-5xl mx-auto w-full px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-10 sm:py-14 space-y-16 sm:space-y-20 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {/* ヒーロー */}
        <section className="text-center space-y-6 sm:space-y-8">
          <p className="inline-flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-sky-500/35 bg-sky-500/12 px-3 py-1 text-xs font-semibold text-sky-900 dark:text-sky-100 shadow-sm">
              BUILDICS® IoT × GUARDIAN クラウド
            </span>
          </p>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {heroPills.map(({ label, Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-200"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {label}
              </span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-[2.125rem] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.2] max-w-3xl mx-auto">
            暑さ指数（WBGT）を施設単位で見える化し、
            <br className="hidden sm:block" />
            熱中症リスクの早期把握を支援します。
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            現場の環境センサーから取得したデータをもとに、Web ブラウザでダッシュボード表示できる監視システムです。公開向けの監視画面と、管理者向けの台帳・設定を分離し、安全に運用できます。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
            <Link to={monitorPath} className="btn-primary-solid px-7 py-3.5 text-base inline-flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20">
              <IconMonitor className="h-5 w-5 opacity-95" />
              監視画面(デモ)を開く
            </Link>
            <Link
              to={adminLoginPath}
              className="btn-secondary-outline px-7 py-3.5 text-base inline-flex items-center justify-center gap-2"
            >
              <IconLayers className="h-5 w-5 opacity-90" />
              管理者ログイン
            </Link>
          </div>
        </section>

        {/* 特徴 */}
        <section>
          <SectionHeading
            eyebrow="機能ハイライト"
            title="製品の特徴"
            description="本リポジトリで提供される機能に基づく、主な価値です。"
          />
          <div className="grid sm:grid-cols-2 gap-4 lg:gap-5">
            {featureItems.map((item) => (
              <div
                key={item.title}
                className="group surface-card p-5 sm:p-6 flex gap-4 rounded-2xl border border-slate-100/90 dark:border-slate-700/80 shadow-soft hover:border-sky-200/80 dark:hover:border-sky-800/60 hover:shadow-md transition-all"
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
        <section>
          <SectionHeading
            eyebrow="アーキテクチャ"
            title="システム構成（概要）"
            description="現場のセンサーから BUILDICS® に計測データが集約され、GUARDIAN アプリクラウドを介して台帳・公開設定・API が提供されます。利用者はブラウザ上のアプリからダッシュボード等を利用します。"
          />
          <div className="surface-card rounded-2xl border border-slate-100 dark:border-slate-700 p-6 sm:p-10 max-w-lg mx-auto shadow-soft bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm">
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
        </section>

        {/* データの流れ */}
        <section>
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
        <section>
          <SectionHeading
            eyebrow="ユースケース"
            title="用途例"
            description="導入イメージの一例です。現場のガイドラインに合わせて運用してください。"
          />
          <ul className="grid sm:grid-cols-2 gap-4 lg:gap-5">
            {useCaseItems.map((uc) => (
              <li
                key={uc.title}
                className="surface-card p-5 sm:p-6 rounded-2xl flex gap-4 items-start border border-slate-100/90 dark:border-slate-700/80 hover:shadow-md transition-shadow"
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
        <section className="relative overflow-hidden rounded-3xl border-2 border-sky-400/30 bg-gradient-to-br from-sky-500/12 via-white to-violet-500/10 px-6 py-10 sm:px-10 sm:py-12 text-center shadow-soft dark:from-sky-500/15 dark:via-slate-900/80 dark:to-violet-500/10 dark:border-sky-500/25">
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

      <footer className="relative border-t border-slate-200/90 dark:border-slate-800 py-8 mt-auto bg-slate-50/80 dark:bg-slate-950/50 backdrop-blur-sm pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-5xl mx-auto px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
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
            <Link
              to={monitorPath}
              className="font-medium text-sky-700 dark:text-sky-400 hover:underline underline-offset-4 inline-flex items-center gap-1.5"
            >
              <IconMonitor className="h-3.5 w-3.5 opacity-70" />
              監視画面(デモ)を開く
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
