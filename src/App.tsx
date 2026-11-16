import { useEffect, useState } from 'react';
import { AlertTriangle, Download, Languages, ShieldAlert } from 'lucide-react';
import { ApiAuditTable } from './components/ApiAuditTable';
import { BuildAndTestPanel } from './components/BuildAndTestPanel';
import { PatchDiffPanel } from './components/PatchDiffPanel';
import {
  LOCKED_INVARIANTS,
  STARTER_PATCH_VALUES,
  UPSTREAM_DEFAULT_VALUES,
  buildUnifiedPatch,
} from './data/patchSpec';
import { Lang, TRANSLATIONS } from './i18n/translations';
import { downloadTextFile } from './utils/fileActions';

export default function App() {
  const [lang, setLang] = useState<Lang>('ar');
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const handleDownloadPatch = () => {
    downloadTextFile('dilink4-starter.patch', buildUnifiedPatch(STARTER_PATCH_VALUES));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#overview"
            className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            {t.brand}
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#overview"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              {t.navOverview}
            </a>
            <a
              href="#patch"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              {t.navPatch}
            </a>
            <a
              href="#audit"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              {t.navAudit}
            </a>
            <a
              href="#build"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              {t.navBuild}
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleDownloadPatch}
              className="inline-flex items-center gap-2 h-10 px-4 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.primaryDownload}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <section id="overview" className="pt-10 pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <p className="text-xs font-medium text-slate-500">{t.heroKicker}</p>
            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'ar' ? 'en' : 'ar'))}
              className="inline-flex items-center gap-2 h-9 px-3.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Languages className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
              <span>{t.langSwitchLabel}</span>
            </button>
          </div>

          <div className="max-w-3xl">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
              {t.heroTitle}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600">{t.heroSubtitle}</p>
            <p dir="ltr" className="mt-3 font-mono text-xs text-slate-500 tabular-nums text-start">
              {t.metaLine}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="p-5">
              <div className="text-xs text-slate-500">{t.statOriginalSdk}</div>
              <div dir="ltr" className="mt-1.5 font-mono text-xl font-semibold text-slate-900 tabular-nums text-start">
                minSdk {UPSTREAM_DEFAULT_VALUES.minSdk}
              </div>
              <div className="mt-1 text-xs text-slate-500">Android 12 · DiLink 5.0</div>
            </div>

            <div className="p-5">
              <div className="text-xs text-slate-500">{t.statPatchedSdk}</div>
              <div dir="ltr" className="mt-1.5 font-mono text-xl font-semibold text-blue-700 tabular-nums text-start">
                minSdk {STARTER_PATCH_VALUES.minSdk}
              </div>
              <div className="mt-1 text-xs text-slate-500">Android 10 · DiLink 4.0</div>
            </div>

            <div className="p-5">
              <div className="text-xs text-slate-500">{t.statVersionChange}</div>
              <div dir="ltr" className="mt-1.5 font-mono text-xl font-semibold text-slate-900 tabular-nums text-start">
                {UPSTREAM_DEFAULT_VALUES.versionName} → {STARTER_PATCH_VALUES.versionName}
              </div>
              <div dir="ltr" className="mt-1 font-mono text-xs text-slate-500 tabular-nums text-start">
                code {UPSTREAM_DEFAULT_VALUES.versionCode} → {STARTER_PATCH_VALUES.versionCode}
              </div>
            </div>

            <div className="p-5">
              <div className="text-xs text-slate-500">{t.statLockedScope}</div>
              <div dir="ltr" className="mt-1.5 font-mono text-lg font-semibold text-slate-900 text-start">
                {t.statLockedValue}
              </div>
              <div dir="ltr" className="mt-1 font-mono text-xs text-slate-500 text-start">
                {LOCKED_INVARIANTS.applicationId}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-amber-50/80 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-amber-950">{t.safetyTitle}</h2>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-amber-900">
                  {t.safetyBody}
                </p>
                <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-amber-900">
                  {t.uncertifiedList.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <PatchDiffPanel lang={lang} />
        <ApiAuditTable lang={lang} />
        <BuildAndTestPanel lang={lang} />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <p>{t.footerNote}</p>
          <a
            href="/assets/aistudio/BYD_AEB_Manager_DiLink4_Source_Instructions_62343b31.txt"
            download="BYD_AEB_Manager_DiLink4_Source_Instructions.txt"
            className="font-medium text-slate-700 hover:text-slate-900 underline underline-offset-4 whitespace-nowrap shrink-0"
          >
            {t.sourceRefLabel}
          </a>
        </div>
      </footer>
    </div>
  );
}
