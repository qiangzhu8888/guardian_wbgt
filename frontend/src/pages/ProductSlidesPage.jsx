import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeFullscreenControls from '../components/ThemeFullscreenControls';
import { ProductSlideFigure } from '../components/ProductSlideFigures';
import {
  IconArrowDown,
  IconArrowUp,
  IconClipboardList,
  IconCloud,
  IconLayoutGrid,
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
import { productLandingCtaPaths, PRODUCT_LANDING_PATH } from '../lib/productLandingCta';

const slides = [
  {
    id: 'intro',
    theme: 'hero',
    eyebrow: 'このサービスについて',
    title: '施設の「暑さ」を、ひと目で。',
    subtitle: APP_DISPLAY_NAME,
    body: '校庭やグラウンド、工場・倉庫の一角など、計測している場所ごとに暑さの目安（WBGT＝暑さ指数とよばれる指標）を画面に表示します。普段パソコンやスマホを使う方なら、説明なしでも「どこがいま厳しそうか」が伝わりやすいレイアウトにしています。',
    bodyExtra: '見るだけの画面と、登録・設定を行うための管理者向け画面を分けています。保護者や来館者には見せたい情報だけ、職員の方には運用に必要な操作だけ、と役割に合わせやすい構成です。',
    Icon: IconThermometer,
  },
  {
    id: 'wbgt',
    theme: 'light',
    eyebrow: '暑さ指数（WBGT）とは',
    title: '気温だけでは足りない「まわりの暑さ」',
    body: '暑さ指数は、気温に加えて湿度や日なたの強さなどを踏まえた、「その場の暑さ」の目安です。熱中症への注意喚起の資料などでもよく使われています。運動場と屋内、倉庫入口など、場所が違えば数字も変わるので、並べて見る意味があります。',
    bodyExtra: '画面に出る数値はセンサーに基づく参考情報です。体調が心配なときは医療機関に相談し、作業や外出を続けるかどうかは学校・職場などのルールに従ってください。',
    bullets: [
      '「どの場所が今、いちばん厳しそうか」を一覧で比較しやすい',
      'パソコンの大きな画面でも、外出先のスマホでも同じ情報を確認できる',
      '複数の拠点がある場合も、同じ見方で状況を把握できる',
    ],
    Icon: IconThermometer,
  },
  {
    id: 'hook',
    theme: 'light',
    eyebrow: '画面でわかること',
    title: '場所ごとのカードで、全体をざっと把握',
    body: 'トップの一覧では、場所ごとにカードが並び、暑さの目安と注意レベルが色や文字で示されます。気になる場所だけタップして詳しく見る、という流れなので、初めての方でも迷いにくいです。',
    bodyExtra: '詳細画面では、より細かい説明や注意の文言を読みやすく配置しています。職員の方が巡回しながら確認する、といった使い方を想定した文字の大きさと余白です。',
    bullets: [
      '一覧では、どの場所が注意・警戒レベルかがひと目でわかる',
      '気になる場所だけ開いて、説明文や補足を読めばよい',
      'スマホの狭い画面でも、つまみ読みしやすい並びになっている',
    ],
    Icon: IconLayoutGrid,
  },
  {
    id: 'levels',
    theme: 'accent',
    eyebrow: '注意レベルの見方',
    title: '「危険」「注意」など、国の案内に沿った表示',
    body: '環境省の熱中症予防に関する案内で使われている区分に沿って、「危険」「厳重警戒」「警戒」「注意」「ほぼ安全」といった段階で色分け表示します。全員が同じ言葉を見れば、職員室や現場での声かけも言い違いが少なくなります。',
    bullets: [
      '一覧では、色と短いラベルで今の段階がすぐわかる',
      '詳細でも同じ言葉を使うので、「さっきの画面と同じ意味」と説明しやすい',
      '計測機器の不調や通信の遅れのときは「通信異常」など、別の表示になり見落としにくい',
    ],
    Icon: IconShieldCheck,
  },
  {
    id: 'problem',
    theme: 'dark',
    eyebrow: 'こんなことで困っていませんか',
    title: '口頭やチャットだけだと、いま誰が何を見ているかわかりにくい',
    body: '温度計やセンサーの数値はあっても、写真やメモを転送し合うだけでは、「何分前のどこの数字か」がすれ違いやすいです。また、職員向けの設定画面と、来館者向けの見せ方が同じだと、説明が複雑になりがちです。',
    bodyExtra: '拠点が増えるほど、「全校・全工場を一望したい」というニーズと、「見せたい場所だけに絞りたい」というニーズが同時に出てきます。',
    bullets: [
      '「今いちばん暑そうな場所はどこ？」をすばやく知りたい',
      '職員が使う画面と、一般向けに見せる画面を分けたい',
      '見せる場所の並びや名前を、学校や会社の呼び方に合わせたい',
    ],
    Icon: null,
  },
  {
    id: 'solution',
    theme: 'light',
    eyebrow: 'このサービスの考え方',
    title: 'まず一覧で全体、気になる場所だけ詳しく',
    body: 'トップでは多くの場所の状態をざっと確認し、必要なところだけ詳細を開きます。学校や会社の名前・ロゴ、画面上の並び順などは、運営側がまとめて設定できるので、利用する方は「決められたアドレスを開く」だけで同じ見え方になります。',
    bodyExtra: '登録や設定は管理者向けの画面から行い、日々の確認は閲覧用の画面から、と役割を分けることで、説明の手間やまちがい操作を減らせます。',
    bullets: [
      '一覧の並びや表示名は、運営側がまとめて調整できる',
      '「この建物」「この校庭」のように、現場で使っている呼び方に寄せられる',
      '別の学校・別の会社のデータは、原則として混ざらない運用を想定している',
    ],
    Icon: IconMonitor,
  },
  {
    id: 'data',
    theme: 'accent',
    eyebrow: 'しくみのイメージ（やさしく）',
    title: '現場の計測 → インターネット経由 → いつものブラウザで表示',
    body: '屋外や屋内に設置した計測機器が暑さに関するデータを送り、クラウド（インターネット上の受け口）に届きます。利用者の方は、普段お使いのブラウザからURLを開くだけで、最新に近い状態を確認できます。裏側では、必要な通信だけを行うよう整理されています。',
    bodyExtra: '画面に載せる場所と機器の対応は、あらかじめ運営側で登録したものに限る考え方なので、「知らない試運転の機械の数値がふいに出てきた」といったことを避けやすくしています。',
    bullets: [
      '現場のセンサーで測った内容が、安全な形でサーバーに集まる',
      '閲覧はブラウザから（アプリのインストールは必須ではありません）',
      '複数拠点でも、同じ種類の画面で見比べやすい',
    ],
    Icon: IconLink,
  },
  {
    id: 'ops',
    theme: 'light',
    eyebrow: 'はじめるとき（運営の方へ）',
    title: '名前・ロゴ・並び順を整えて、場所を登録',
    body: '運営・管理者の方が最初にやるのは、学校名や会社名、ロゴ、画面の雰囲気（色など）を整えることです。続いて、「グラウンド」「北校舎前」など、見せたい場所を登録し、それぞれに計測機器をひも付けます。すでに一覧表がある場合は、まとめて取り込める手順もあります。',
    bodyExtra: '一覧での並びを「職員室の近い順」「体育館の次にプール」など、実際の運用に合わせて決められると、現場の方が迷いません。',
    bullets: [
      '組織の名前やロゴで、画面が「自校・自社らしく」見える',
      '場所の呼び名・表示順を、利用者にとってわかりやすいように並べ替えられる',
      'あとから追加・修正・不要になった場所の整理もできる',
    ],
    Icon: IconCloud,
  },
  {
    id: 'ledger',
    theme: 'light',
    eyebrow: '記録と運用（運営の方へ）',
    title: 'どの機器がどの場所か／いつ変更したか、あとから確認しやすい',
    body: '登録した計測機器と場所の対応は一覧で管理され、変更した日時や内容をあとから追いかけられる運用ができます。「いつ、誰が、どの登録を直したか」をたどれると、引き継ぎや説明が楽になります。',
    bullets: [
      '画面に出す機器は、登録済みのものにそろえやすくなっている',
      '一覧表からまとめて登録したあとでも、個別に修正できる',
      '運営の方だけが登録を変更する、という使い分けがしやすい',
    ],
    Icon: IconClipboardList,
  },
  {
    id: 'mobile',
    theme: 'dark',
    eyebrow: 'いつ・どこで見るか',
    title: '屋外の白天下でも、夜間の控室でも見やすく',
    body: 'スマホから開いたときも、文字と余白を組み替えて読みやすくしています。明るい屋外では画面全体をくっきり、暗い部屋では目に優しい暗めの配色に切り替えることもできます（画面上部のボタンから）。',
    bullets: [
      'スマホ・タブレット・パソコンのどれでも同じ内容を確認できる',
      '画面を大きく表示する（全画面）モードにも対応',
      '日射の強い現場や、夜間の当直室など、場面に合わせて見やすさを選べる',
    ],
    Icon: IconSmartphone,
  },
  {
    id: 'usecases',
    theme: 'dark',
    eyebrow: 'こんな現場で',
    title: '学校・施設・工場・イベントなど',
    body: '子どもや生徒が外で活動する学校、体育館や公共施設の職員の方、工場や倉庫で暑さ対策をするチーム、期間限定の屋外イベントなど、暑さが気になる場所なら用途を選びません。細かく「棟ごと」「コートごと」に分けるかは、現場の運用に合わせて決められます。',
    bullets: [
      '学校・幼稚園：校庭、プール周り、登下校の動線など',
      '体育館・公民館など：来館者向けの掲示と、職員の確認',
      '工場・倉庫：稼働中のラインや荷さばき場の近く',
      'イベント：開催期間だけ仮設の見える化に使う、など',
    ],
    Icon: IconSchool,
  },
  {
    id: 'trust',
    theme: 'light',
    eyebrow: '安心して使うために',
    title: '見る人と、設定する人を分けて考えています',
    body: '日々の暑さを確認する画面は、なるべくシンプルに。設備の登録や組織の設定は、ログインできる担当者だけが触る、という分担を前提にしています。細かいルールや個人情報の取り扱いは、利用規約とプライバシーポリシーにまとめています。',
    bodyExtra: 'スライドでは要点だけお伝えしています。契約内容や免責の詳細は、必ずサイト上の規約類をご確認ください。',
    bullets: [
      '一般の方には閲覧しやすい画面、運営の方には管理画面、と役割を分けやすい',
      '学校や会社ごとにデータが混ざらないよう、役割設計の前提になっている',
      '公開してよい情報に絞って見せる、という設計を意識している',
    ],
    Icon: IconShieldCheck,
  },
  {
    id: 'cta',
    theme: 'hero',
    eyebrow: 'つぎにおすすめ',
    title: 'まずはデモ画面をのぞいてみてください',
    body: '実際の一覧や色分けが、説明なしでイメージできるか試せます。導入を検討される場合は、「何カ所を見せるか」「場所の呼び方はどうするか」など、運営側で話し合える材料になるはずです。',
    bodyExtra: 'もう少し製品の詳細や更新内容を知りたい方は、製品案内ページや変更履歴もご覧ください。',
    Icon: IconSparkles,
    isCta: true,
  },
];

function SlideFrame({ children, theme, slideIndex }) {
  const bg =
    theme === 'hero'
      ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-white'
      : theme === 'dark'
        ? 'bg-slate-900 text-slate-100'
        : theme === 'accent'
          ? 'bg-gradient-to-b from-sky-500/15 via-white to-violet-500/10 dark:from-sky-500/20 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100'
          : 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100';
  return (
    <section
      data-slide-index={slideIndex}
      className={`min-h-[calc(100dvh-7rem)] md:min-h-[calc(100dvh-5rem)] snap-start snap-always flex flex-col justify-center px-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] py-12 sm:py-16 border-b border-slate-200/60 dark:border-slate-800/80 ${bg}`}
    >
      <div className="max-w-2xl mx-auto w-full space-y-5 sm:space-y-6">{children}</div>
    </section>
  );
}

function slideIconWrapClass(theme) {
  if (theme === 'light' || theme === 'accent')
    return 'shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 border border-sky-500/35 text-sky-700 dark:bg-white/10 dark:border-white/20 dark:text-sky-300 shadow-inner';
  return 'shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 border border-white/25 text-white shadow-inner';
}

export default function ProductSlidesPage() {
  const { monitorPath, adminLoginPath, termsPath, privacyPath, changelogPath } = productLandingCtaPaths();
  const version = getAppReleaseVersion();
  const scrollerRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  activeRef.current = active;

  const scrollToSlide = useCallback((index) => {
    const root = scrollerRef.current;
    if (!root) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    const el = root.querySelector(`section[data-slide-index="${clamped}"]`);
    if (el instanceof HTMLElement) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToFooter = useCallback(() => {
    const root = scrollerRef.current;
    const el = root?.querySelector('[data-slide-footer]');
    if (el instanceof HTMLElement) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const goPrevSlide = useCallback(() => {
    scrollToSlide(activeRef.current - 1);
  }, [scrollToSlide]);

  const goNextSlide = useCallback(() => {
    const a = activeRef.current;
    if (a >= slides.length - 1) scrollToFooter();
    else scrollToSlide(a + 1);
  }, [scrollToSlide, scrollToFooter]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const els = root.querySelectorAll('[data-slide-index]');
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (visible?.target) {
          const i = Number(visible.target.getAttribute('data-slide-index'));
          if (!Number.isNaN(i)) setActive(i);
        }
      },
      { root, rootMargin: '-12% 0px -40% 0px', threshold: [0.08, 0.2, 0.35, 0.5, 0.65, 0.8] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented) return;
      const t = e.target;
      if (t instanceof HTMLElement && t.closest('input, textarea, select, [contenteditable="true"]')) return;

      const root = scrollerRef.current;
      if (!root) return;
      const atBottom = root.scrollHeight - root.scrollTop - root.clientHeight < 12;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        const a = activeRef.current;
        if (a >= slides.length - 1) scrollToFooter();
        else scrollToSlide(a + 1);
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        const a = activeRef.current;
        if (atBottom) {
          scrollToSlide(slides.length - 1);
          return;
        }
        if (a > 0) scrollToSlide(a - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scrollToSlide, scrollToFooter]);

  const navBtnClass =
    'inline-flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-[11px] sm:text-xs font-semibold text-white/90 hover:bg-white/12 disabled:opacity-35 disabled:pointer-events-none transition-colors';

  const navBtnClassMobile =
    'inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-600 bg-slate-800/90 px-2 py-2 text-[11px] font-semibold text-slate-100 hover:bg-slate-700 disabled:opacity-35 disabled:pointer-events-none min-w-0';

  const floatNavBtnClass =
    'inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-slate-900/90 text-white shadow-lg backdrop-blur-sm hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none';

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      <header className="shrink-0 z-20 border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 pt-[max(0.25rem,env(safe-area-inset-top))] shadow-header">
        <div className="max-w-5xl mx-auto px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link to={PRODUCT_LANDING_PATH} className="flex items-center gap-2 shrink-0" title="製品案内へ">
              <img
                src={DEFAULT_APP_LOGO_URL}
                alt=""
                className="h-8 w-auto max-w-[110px] sm:max-w-[130px] object-contain rounded bg-white/10 p-0.5"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </Link>
            <div className="min-w-0 hidden sm:block">
              <p className="text-xs font-bold truncate">{APP_DISPLAY_NAME}</p>
              <p className="text-[10px] text-white/60 truncate">かんたんスライド</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            <span className="text-[10px] tabular-nums text-white/50 mr-0.5 hidden sm:inline" aria-live="polite">
              {active + 1} / {slides.length}
            </span>
            <div className="hidden sm:flex items-center gap-1" role="group" aria-label="スライドの前後移動">
              <button type="button" className={navBtnClass} aria-label="前のスライドへ" disabled={active <= 0} onClick={goPrevSlide}>
                <IconArrowUp className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden lg:inline">前へ</span>
              </button>
              <button
                type="button"
                className={navBtnClass}
                aria-label={active >= slides.length - 1 ? 'ページ末尾の情報へ' : '次のスライドへ'}
                onClick={goNextSlide}
              >
                <span className="hidden lg:inline">次へ</span>
                <IconArrowDown className="h-3.5 w-3.5 shrink-0" />
              </button>
            </div>
            <ThemeFullscreenControls variant="monitor" />
            <Link to={PRODUCT_LANDING_PATH} className="btn-ghost-header text-[11px] sm:text-xs px-2 sm:px-3">
              詳細ページ
            </Link>
            <Link to={monitorPath} className="btn-ghost-header text-[11px] sm:text-xs px-2 sm:px-3">
              監視(デモ)
            </Link>
            <Link to={adminLoginPath} className="btn-ghost-header text-[11px] sm:text-xs px-2 sm:px-3">
              管理
            </Link>
          </div>
        </div>
      </header>

      <div
        ref={scrollerRef}
        className="flex-1 min-h-0 overflow-y-auto snap-y snap-mandatory scroll-smooth overscroll-y-contain"
        tabIndex={0}
        aria-label="製品紹介スライド。スクロールのほか、ヘッダーまたは画面右下の前へ・次へ、矢印キー・Page キーでも移動できます。"
      >
        {slides.map((slide, i) => (
          <SlideFrame key={slide.id} theme={slide.theme} slideIndex={i}>
            {slide.eyebrow ? (
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-sky-400/90 dark:text-sky-300/90">
                {slide.eyebrow}
              </p>
            ) : null}
            <div className="flex items-start gap-3">
              {slide.Icon ? (
                <div className={slideIconWrapClass(slide.theme)}>
                  <slide.Icon className="h-6 w-6" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1 space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">{slide.title}</h1>
                {slide.subtitle ? (
                  <p className="text-sm font-medium text-sky-200/90 dark:text-sky-300/90">{slide.subtitle}</p>
                ) : null}
              </div>
            </div>
            <ProductSlideFigure slideId={slide.id} theme={slide.theme} />
            {slide.body ? (
              <p
                className={`text-sm sm:text-base leading-relaxed ${
                  slide.theme === 'hero' || slide.theme === 'dark'
                    ? 'text-slate-200/95'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {slide.body}
              </p>
            ) : null}
            {'bodyExtra' in slide && slide.bodyExtra ? (
              <p
                className={`text-sm leading-relaxed ${
                  slide.theme === 'hero' || slide.theme === 'dark'
                    ? 'text-slate-300/90'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {slide.bodyExtra}
              </p>
            ) : null}
            {slide.bullets ? (
              <ul
                className={`space-y-2.5 text-sm sm:text-[15px] leading-relaxed ${
                  slide.theme === 'hero' || slide.theme === 'dark'
                    ? 'text-slate-100/95'
                    : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                {slide.bullets.map((line, bi) => (
                  <li key={`${slide.id}-${bi}`} className="flex gap-2">
                    <span className="text-sky-500 dark:text-sky-400 shrink-0 font-bold" aria-hidden>
                      ✓
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {slide.isCta ? (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to={monitorPath}
                    className="btn-primary-solid justify-center px-6 py-3 text-center inline-flex items-center gap-2"
                  >
                    <IconMonitor className="h-5 w-5" />
                    監視画面(デモ)を開く
                  </Link>
                  <Link
                    to={adminLoginPath}
                    className="btn-secondary-outline justify-center px-6 py-3 text-center bg-white/10 border-white/30 text-white hover:bg-white/15"
                  >
                    管理ログイン
                  </Link>
                </div>
                <p className="text-xs text-sky-100/85">
                  <Link to={PRODUCT_LANDING_PATH} className="font-medium underline underline-offset-4 hover:text-white">
                    製品案内
                  </Link>
                  {' / '}
                  <Link to={changelogPath} className="font-medium underline underline-offset-4 hover:text-white">
                    変更履歴
                  </Link>
                  <span className="text-sky-200/70"> も合わせてご確認ください。</span>
                </p>
              </div>
            ) : null}
            <div
              className={`flex flex-wrap items-center justify-between gap-2 pt-6 mt-1 border-t ${
                slide.theme === 'light'
                  ? 'border-slate-200/60 dark:border-slate-600/50'
                  : slide.theme === 'accent'
                    ? 'border-slate-200/50 dark:border-slate-600/40'
                    : 'border-white/15'
              }`}
            >
              <button
                type="button"
                className={`text-xs font-semibold underline-offset-4 hover:underline disabled:opacity-30 disabled:hover:no-underline disabled:cursor-not-allowed ${
                  slide.theme === 'light' || slide.theme === 'accent'
                    ? 'text-sky-700 dark:text-sky-400'
                    : 'text-sky-300'
                }`}
                disabled={i === 0}
                onClick={() => scrollToSlide(i - 1)}
              >
                ↑ 前のスライド
              </button>
              <button
                type="button"
                className={`text-xs font-semibold underline-offset-4 hover:underline ${
                  slide.theme === 'light' || slide.theme === 'accent'
                    ? 'text-sky-700 dark:text-sky-400'
                    : 'text-sky-300'
                }`}
                onClick={() => (i >= slides.length - 1 ? scrollToFooter() : scrollToSlide(i + 1))}
              >
                {i >= slides.length - 1 ? '↓ サイト情報へ' : '↓ 次のスライド'}
              </button>
            </div>
            <p className={`text-[10px] ${slide.theme === 'light' ? 'text-slate-400' : 'text-slate-500'} pt-4`}>
              {version ? `v${version} · ` : null}
              <Link to={termsPath} className="underline underline-offset-2">
                利用規約
              </Link>
              {' · '}
              <Link to={privacyPath} className="underline underline-offset-2">
                プライバシー
              </Link>
            </p>
          </SlideFrame>
        ))}
        <footer
          data-slide-footer
          className="snap-start min-h-[30vh] flex flex-col items-center justify-center px-4 py-10 bg-slate-950 text-slate-500 text-center text-xs border-t border-slate-800"
        >
          <p className="text-slate-400 mb-1">{APP_DISPLAY_NAME}</p>
          <p className="text-[11px]">制作・開発：{PRODUCTION_COMPANY_NAME}</p>
          <p className="mt-3">
            <Link to={PRODUCT_LANDING_PATH} className="text-sky-400 hover:underline underline-offset-4">
              製品案内トップへ戻る
            </Link>
          </p>
        </footer>
      </div>

      {/* モバイル: 前へ・ドット・次へ */}
      <div
        className="shrink-0 sm:hidden flex items-stretch gap-2 px-2 py-2 bg-slate-950/95 border-t border-slate-800 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        role="navigation"
        aria-label="スライドの前後移動"
      >
        <button
          type="button"
          className={navBtnClassMobile}
          disabled={active <= 0}
          onClick={goPrevSlide}
          aria-label="前のスライドへ"
        >
          <IconArrowUp className="h-4 w-4 shrink-0 opacity-90" />
          前へ
        </button>
        <div className="flex flex-1 items-center justify-center gap-1.5 min-w-0 px-1" aria-hidden="true">
          {slides.map((s, dotI) => (
            <span
              key={s.id}
              className={`h-1.5 shrink-0 rounded-full transition-all ${dotI === active ? 'w-4 bg-sky-400' : 'w-1.5 bg-slate-600'}`}
            />
          ))}
        </div>
        <button
          type="button"
          className={navBtnClassMobile}
          onClick={goNextSlide}
          aria-label={active >= slides.length - 1 ? 'ページ末尾の情報へ' : '次のスライドへ'}
        >
          次へ
          <IconArrowDown className="h-4 w-4 shrink-0 opacity-90" />
        </button>
      </div>

      {/* タブレット・デスクトップ: 右下フローティング */}
      <div
        className="hidden sm:flex fixed z-30 flex-col gap-2 right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))]"
        role="navigation"
        aria-label="スライドの前後移動"
      >
        <button
          type="button"
          className={floatNavBtnClass}
          aria-label="前のスライドへ"
          disabled={active <= 0}
          onClick={goPrevSlide}
        >
          <IconArrowUp className="h-5 w-5" />
        </button>
        <button
          type="button"
          className={floatNavBtnClass}
          aria-label={active >= slides.length - 1 ? 'ページ末尾の情報へ' : '次のスライドへ'}
          onClick={goNextSlide}
        >
          <IconArrowDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
