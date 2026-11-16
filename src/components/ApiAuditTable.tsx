import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Lock, Search } from 'lucide-react';
import { AUDIT_ITEMS, AuditStatus } from '../data/patchSpec';
import { Lang, TRANSLATIONS } from '../i18n/translations';

interface ApiAuditTableProps {
  lang: Lang;
}

type FilterMode = 'all' | AuditStatus;

export function ApiAuditTable({ lang }: ApiAuditTableProps) {
  const t = TRANSLATIONS[lang];
  const [filter, setFilter] = useState<FilterMode>('all');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('gradle-sdk');

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AUDIT_ITEMS.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (!q) return true;
      return (
        item.file.toLowerCase().includes(q) ||
        item.apiSymbol.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q) ||
        item.titleAr.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  const counts = useMemo(
    () => ({
      all: AUDIT_ITEMS.length,
      compatible: AUDIT_ITEMS.filter((i) => i.status === 'compatible').length,
      unverified: AUDIT_ITEMS.filter((i) => i.status === 'unverified').length,
      locked: AUDIT_ITEMS.filter((i) => i.status === 'locked').length,
    }),
    []
  );

  const renderStatus = (status: AuditStatus) => {
    if (status === 'compatible') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{t.statusCompatible}</span>
        </span>
      );
    }
    if (status === 'unverified') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{t.statusUnverified}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 whitespace-nowrap">
        <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{t.statusLocked}</span>
      </span>
    );
  };

  return (
    <section id="audit" className="scroll-mt-24 py-10 border-t border-slate-200">
      <div className="max-w-2xl mb-6">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
          {t.sectionAuditTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.sectionAuditDesc}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50 border-b border-slate-200">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            {(
              [
                ['all', t.filterAll, counts.all],
                ['compatible', t.filterCompatible, counts.compatible],
                ['unverified', t.filterUnverified, counts.unverified],
                ['locked', t.filterLocked, counts.locked],
              ] as const
            ).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`h-8 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                  filter === key ? 'bg-white text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search
              className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
              className="w-full h-10 ps-9 pe-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">{t.emptyAudit}</div>
        ) : (
          <div className="divide-y divide-slate-200">
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-5 py-3 text-xs font-medium text-slate-500 bg-white">
              <div className="col-span-3">{t.colFile}</div>
              <div className="col-span-5">{t.colApi}</div>
              <div className="col-span-2">{t.colMinApi}</div>
              <div className="col-span-2">{t.colStatus}</div>
            </div>

            {filteredItems.map((item) => {
              const isOpen = expandedId === item.id;
              return (
                <div key={item.id} className="bg-white">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                    className="w-full text-start px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 items-center"
                  >
                    <div className="lg:col-span-3 min-w-0">
                      <div dir="ltr" className="font-mono text-xs font-medium text-slate-900 truncate text-left">
                        {item.file}
                      </div>
                      <div className="text-xs text-slate-500 font-mono tabular-nums">L{item.lines}</div>
                    </div>

                    <div className="lg:col-span-5 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {lang === 'ar' ? item.titleAr : item.titleEn}
                      </div>
                      <div dir="ltr" className="font-mono text-xs text-slate-500 truncate text-left">
                        {item.apiSymbol}
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <span dir="ltr" className="font-mono text-xs text-slate-700 tabular-nums">
                        {item.requiredApi}
                      </span>
                    </div>

                    <div className="lg:col-span-2 flex items-center justify-between gap-2">
                      {renderStatus(item.status)}
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 bg-slate-50/70 border-t border-slate-100 space-y-2.5">
                      <p className="text-xs leading-relaxed text-slate-700">
                        {lang === 'ar' ? item.detailAr : item.detailEn}
                      </p>
                      <pre
                        dir="ltr"
                        className="px-3 py-2 bg-slate-950 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto text-left"
                      >
                        {item.snippet}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
