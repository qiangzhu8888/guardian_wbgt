import PublicDocsLayout from '../components/PublicDocsLayout';
import { HARDWARE_SPEC_DISCLAIMER, HARDWARE_SPEC_SECTIONS } from '../lib/hardwareSpec';

function sectionAnchorId(sectionIndex) {
  return `hardware-spec-${sectionIndex}`;
}

export default function ProductSpecsPage() {
  return (
    <PublicDocsLayout
      title="温湿度センサー仕様（参考）"
      description="BUILDICS® と連携する現場側の温湿度計測に用いる端末および周辺スペックの主要項目です。"
    >
      {/* ハードウェア写真 — ブラックボディに合わせたダーク枠 */}
      <div className="mb-12 rounded-[1.75rem] border border-slate-800 bg-gradient-to-b from-black via-slate-950 to-slate-950 p-8 sm:p-12 shadow-[0_36px_80px_-28px_rgb(0_0_0/0.55)] ring-1 ring-white/10">
        <figure className="mx-auto max-w-lg">
          <img
            src="/images/L5.png"
            alt="温湿度計測に連携して使う産業向け IoT 端末の外観。太陽光パネル付きブラック筐体。"
            className="w-full h-auto object-contain rounded-xl"
            decoding="async"
            loading="eager"
          />
          <figcaption className="mt-4 text-center text-xs text-slate-400 leading-relaxed">
            設置環境により外観・付属オプションは異なることがあります。
          </figcaption>
        </figure>
      </div>

      <nav
        aria-label="仕様セクション一覧"
        className="sticky top-[max(0px,env(safe-area-inset-top))] z-20 -mx-1 mb-10 flex gap-2 overflow-x-auto pb-3 no-scrollbar sm:flex-wrap sm:overflow-visible"
      >
        {HARDWARE_SPEC_SECTIONS.map((sec, idx) => {
          const anchor = `#${sectionAnchorId(idx)}`;
          return (
            <a
              key={sec.category}
              href={anchor}
              className="shrink-0 rounded-full border border-slate-200/90 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-sky-600 dark:hover:bg-sky-950 dark:hover:text-sky-50"
            >
              {sec.category}
            </a>
          );
        })}
      </nav>

      <div className="space-y-14">
        {HARDWARE_SPEC_SECTIONS.map((section, idx) => (
          <section
            key={section.category}
            id={sectionAnchorId(idx)}
            className="scroll-mt-36"
          >
            <h2 className="mb-5 border-b border-slate-200/95 pb-3 text-xl font-bold tracking-tight text-slate-900 dark:border-slate-700/90 dark:text-white">
              {section.category}
            </h2>
            <dl className="overflow-hidden rounded-2xl border border-slate-200/95 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
              {section.rows.map((row, rowIdx) => (
                <div
                  key={row.item}
                  className={`grid gap-1.5 sm:gap-4 sm:grid-cols-[minmax(11rem,0.42fr)_1fr] px-5 py-4 sm:py-5 ${
                    rowIdx > 0 ? 'border-t border-slate-100 dark:border-slate-700/80' : ''
                  }`}
                >
                  <dt className="text-sm font-bold leading-snug text-slate-800 dark:text-slate-100">{row.item}</dt>
                  <dd className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{row.detail}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <p className="mt-12 rounded-2xl border border-slate-200 bg-slate-50/95 p-5 text-xs text-slate-600 leading-relaxed dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
        {HARDWARE_SPEC_DISCLAIMER}
      </p>
    </PublicDocsLayout>
  );
}
