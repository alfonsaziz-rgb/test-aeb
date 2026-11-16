import { useEffect, useState } from 'react';
import { Check, CheckSquare, Copy, Download, RotateCcw, Square, Terminal } from 'lucide-react';
import {
  LOCKED_INVARIANTS,
  STARTER_PATCH_VALUES,
  VERIFICATION_CHECKLIST,
  buildGithubWorkflow,
  buildUnixScript,
  buildWindowsScript,
} from '../data/patchSpec';
import { Lang, TRANSLATIONS } from '../i18n/translations';
import { copyToClipboard, downloadTextFile } from '../utils/fileActions';

interface BuildAndTestPanelProps {
  lang: Lang;
}

type TargetOs = 'windows' | 'unix' | 'github';

const STORAGE_KEY = 'byd_aeb_dilink4_checklist_v1';

export function BuildAndTestPanel({ lang }: BuildAndTestPanelProps) {
  const t = TRANSLATIONS[lang];
  const [os, setOs] = useState<TargetOs>('windows');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [checkedIds]);

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    }
  };

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = VERIFICATION_CHECKLIST.filter((item) => Boolean(checkedIds[item.id])).length;

  const steps =
    os === 'github'
      ? [
          {
            id: 'gh-1',
            num: '01',
            title: t.ghStep1Title,
            command: 'https://github.com/EngMohamedKhamis/BYD-AEB-Manager/fork',
          },
          {
            id: 'gh-2',
            num: '02',
            title: t.ghStep2Title,
            command: '.github/workflows/build-dilink4-debug.yml',
          },
          {
            id: 'gh-3',
            num: '03',
            title: t.ghStep3Title,
            command: 'Actions -> Build BYD AEB Manager (DiLink 4.0 Debug APK) -> Run workflow -> Artifacts: byd-aeb-dilink4-debug-apk',
          },
          {
            id: 'gh-4',
            num: '04',
            title: t.ghStep4Title,
            command: 'adb install -r app-debug.apk',
          },
        ]
      : [
          {
            id: 'step-1',
            num: '01',
            title: t.step1Title,
            command: `git clone ${LOCKED_INVARIANTS.repoUrl}\ncd BYD-AEB-Manager`,
          },
          {
            id: 'step-2',
            num: '02',
            title: t.step2Title,
            command:
              os === 'windows'
                ? 'git apply ..\\dilink4-starter.patch'
                : 'git apply ../dilink4-starter.patch',
          },
          {
            id: 'step-3',
            num: '03',
            title: t.step3Title,
            command:
              os === 'windows'
                ? 'gradlew.bat :app:assembleDebug'
                : './gradlew :app:assembleDebug',
          },
          {
            id: 'step-4',
            num: '04',
            title: t.step4Title,
            command: LOCKED_INVARIANTS.apkOutputPath,
          },
        ];

  return (
    <section id="build" className="scroll-mt-24 py-10 border-t border-slate-200">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            {t.sectionBuildTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.sectionBuildDesc}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => setOs('windows')}
              className={`h-8 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                os === 'windows' ? 'bg-white text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.osWindows}
            </button>
            <button
              type="button"
              onClick={() => setOs('unix')}
              className={`h-8 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                os === 'unix' ? 'bg-white text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.osUnix}
            </button>
            <button
              type="button"
              onClick={() => setOs('github')}
              className={`h-8 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                os === 'github' ? 'bg-white text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.osGithub}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (os === 'windows') {
                downloadTextFile('build-dilink4-debug.ps1', buildWindowsScript(STARTER_PATCH_VALUES));
              } else if (os === 'unix') {
                downloadTextFile('build-dilink4-debug.sh', buildUnixScript(STARTER_PATCH_VALUES));
              } else {
                downloadTextFile('build-dilink4-debug.yml', buildGithubWorkflow(STARTER_PATCH_VALUES));
              }
            }}
            className="inline-flex items-center gap-2 h-10 px-4 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{os === 'github' ? t.btnDownloadWorkflow : t.btnDownloadScript}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          {steps.map((step) => (
            <div key={step.id} className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5 text-sm font-medium text-slate-900">
                  <span className="font-mono text-xs text-slate-500 tabular-nums">{step.num}.</span>
                  <span>{step.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(step.id, step.command)}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedId === step.id ? (
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
              <pre
                dir="ltr"
                className="px-3.5 py-2.5 bg-slate-950 text-slate-100 rounded-lg font-mono text-xs leading-relaxed overflow-x-auto text-left"
              >
                {step.command}
              </pre>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t.checklistTitle}</h3>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {completedCount} / {VERIFICATION_CHECKLIST.length} {t.checklistProgress}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCheckedIds({})}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.checklistReset}</span>
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {VERIFICATION_CHECKLIST.map((item) => {
              const checked = Boolean(checkedIds[item.id]);
              return (
                <div key={item.id} className="p-4">
                  <button
                    type="button"
                    onClick={() => toggleCheck(item.id)}
                    className="w-full text-start flex items-start gap-3 cursor-pointer group"
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600 mt-0.5 shrink-0" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-slate-500 mb-0.5">
                        {item.phase === 'pc' ? t.phasePc : t.phaseHeadunit}
                      </div>
                      <div
                        className={`text-sm leading-snug ${
                          checked ? 'text-slate-400 line-through' : 'text-slate-900 font-medium'
                        }`}
                      >
                        {lang === 'ar' ? item.titleAr : item.titleEn}
                      </div>
                    </div>
                  </button>

                  {item.command && (
                    <div className="mt-2.5 ms-7 flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-100 rounded-md">
                      <code dir="ltr" className="font-mono text-xs text-slate-800 truncate text-left">
                        <Terminal className="w-3 h-3 inline me-1.5 text-slate-500" aria-hidden="true" />
                        {item.command}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.command ?? '')}
                        aria-label={t.btnCopy}
                        className="text-xs text-slate-600 hover:text-slate-900 px-1.5 py-0.5 cursor-pointer shrink-0"
                      >
                        {copiedId === item.id ? t.btnCopied : t.btnCopy}
                      </button>
                    </div>
                  )}

                  {(item.warningAr || item.warningEn) && (
                    <p className="mt-2 ms-7 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                      {lang === 'ar' ? item.warningAr : item.warningEn}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
