import { useState } from 'react';
import { Check, Copy, Download, Lock } from 'lucide-react';
import {
  LOCKED_INVARIANTS,
  STARTER_PATCH_VALUES,
  UPSTREAM_DEFAULT_VALUES,
  buildPatchedBuildGradle,
  buildUnifiedPatch,
  formatDefaultConfigBlock,
} from '../data/patchSpec';
import { Lang, TRANSLATIONS } from '../i18n/translations';
import { copyToClipboard, downloadTextFile } from '../utils/fileActions';

type DiffTab = 'unified' | 'split' | 'full';

interface PatchDiffPanelProps {
  lang: Lang;
}

export function PatchDiffPanel({ lang }: PatchDiffPanelProps) {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<DiffTab>('unified');
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);

  const unifiedPatch = buildUnifiedPatch(STARTER_PATCH_VALUES);
  const fullGradle = buildPatchedBuildGradle(STARTER_PATCH_VALUES);
  const beforeBlock = formatDefaultConfigBlock(UPSTREAM_DEFAULT_VALUES);
  const afterBlock = formatDefaultConfigBlock(STARTER_PATCH_VALUES);

  const handleCopy = async (key: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedTarget(key);
      window.setTimeout(() => setCopiedTarget((prev) => (prev === key ? null : prev)), 1800);
    }
  };

  const diffLines = unifiedPatch.split('\n');

  return (
    <section id="patch" className="scroll-mt-24 py-10 border-t border-slate-200">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            {t.sectionPatchTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.sectionPatchDesc}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => downloadTextFile('build.gradle', fullGradle)}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.btnDownloadGradle}</span>
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile('dilink4-starter.patch', unifiedPatch)}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.btnDownloadPatch}</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('unified')}
              className={`h-8 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'unified'
                  ? 'bg-white text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.tabUnifiedDiff}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`h-8 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'split'
                  ? 'bg-white text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.tabSideBySide}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('full')}
              className={`h-8 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'full'
                  ? 'bg-white text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.tabFullGradle}
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              handleCopy(
                activeTab,
                activeTab === 'full' ? fullGradle : activeTab === 'split' ? afterBlock : unifiedPatch
              )
            }
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {copiedTarget === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                <span>{t.btnCopied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.btnCopy}</span>
              </>
            )}
          </button>
        </div>

        {activeTab === 'unified' && (
          <div dir="ltr" className="bg-slate-950 text-slate-100 font-mono text-xs leading-6 overflow-x-auto py-3">
            {diffLines.map((line, idx) => {
              const isRemoved = line.startsWith('-') && !line.startsWith('---');
              const isAdded = line.startsWith('+') && !line.startsWith('+++');
              const isHeader = line.startsWith('@@') || line.startsWith('diff ') || line.startsWith('---') || line.startsWith('+++');
              return (
                <div
                  key={idx}
                  className={`px-4 flex gap-4 ${
                    isRemoved
                      ? 'bg-rose-950/60 text-rose-200'
                      : isAdded
                      ? 'bg-emerald-950/60 text-emerald-200'
                      : isHeader
                      ? 'text-sky-300 bg-slate-900/80'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="w-7 text-right select-none text-slate-500 shrink-0 tabular-nums">
                    {idx + 1}
                  </span>
                  <span className="whitespace-pre">{line || ' '}</span>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200" dir="ltr">
            <div>
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600 flex items-center justify-between">
                <span>{t.beforeLabel}</span>
                <span className="font-mono text-slate-500 tabular-nums">minSdk 31 · v2.0</span>
              </div>
              <pre className="p-4 bg-slate-950 text-rose-100 font-mono text-xs leading-6 overflow-x-auto">
                {beforeBlock}
              </pre>
            </div>
            <div>
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-900 flex items-center justify-between">
                <span>{t.afterLabel}</span>
                <span className="font-mono text-emerald-700 tabular-nums">minSdk 29 · v2.1</span>
              </div>
              <pre className="p-4 bg-slate-950 text-emerald-100 font-mono text-xs leading-6 overflow-x-auto">
                {afterBlock}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'full' && (
          <pre
            dir="ltr"
            className="p-4 bg-slate-950 text-slate-200 font-mono text-xs leading-6 overflow-x-auto max-h-[460px] overflow-y-auto"
          >
            {fullGradle}
          </pre>
        )}

        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-3">
            <Lock className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
            <span>{t.lockedTitle}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-xs text-slate-600">
            <div>
              <span className="text-slate-500">applicationId: </span>
              <code dir="ltr" className="font-mono text-slate-900">{LOCKED_INVARIANTS.applicationId}</code>
            </div>
            <div>
              <span className="text-slate-500">namespace: </span>
              <code dir="ltr" className="font-mono text-slate-900">{LOCKED_INVARIANTS.namespace}</code>
            </div>
            <div>
              <span className="text-slate-500">compileSdk / targetSdk: </span>
              <code dir="ltr" className="font-mono text-slate-900 tabular-nums">
                {LOCKED_INVARIANTS.compileSdk} / {STARTER_PATCH_VALUES.targetSdk}
              </code>
            </div>
            <div>
              <span className="text-slate-500">autoservice: </span>
              <code dir="ltr" className="font-mono text-slate-900 tabular-nums">5 · 6 (1038)</code>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
