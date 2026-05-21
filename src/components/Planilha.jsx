import React, { useMemo, useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, ChevronDown, Archive, Trash2, X } from 'lucide-react';
import {
  getContentTypeTag,
  getContentTypeBadgeClass,
  getProfileTag,
  getProfileBadgeClass,
  getPilarLabel,
  getPilarBadgeClass
} from '../lib/tags';
import {
  MONTH_NAMES,
  addDays,
  daysOfWeek,
  getMonday,
  toDateKey,
  formatDateShort
} from '../lib/dates';
import { stageLabel } from '../lib/selectors';
import { text } from '../lib/ui';

const stageClass = (item) => {
  if (item._stage === 'gravar') return 'bg-blue-100 text-blue-700';
  if (item._stage === 'editar') return 'bg-amber-100 text-amber-700';
  if (item._stage === 'postar') return item.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700';
  return 'bg-slate-100 text-slate-500';
};

const anchorDate = (item) => item.postDate || item.recordingDate || null;

const weekdayIndex = (date) => {
  const jsDay = date.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
};

const groupByDay = (weekItems, weekMonday) => {
  const buckets = daysOfWeek.map((d, idx) => ({
    dayId: d.id,
    label: d.label,
    color: d.color,
    date: addDays(weekMonday, idx),
    items: []
  }));
  weekItems.forEach(item => {
    const anchor = anchorDate(item);
    if (!anchor) return;
    const date = new Date(anchor + 'T12:00:00');
    buckets[weekdayIndex(date)].items.push(item);
  });
  buckets.forEach(b =>
    b.items.sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  );
  return buckets.filter(b => b.items.length > 0);
};

const buildMonthGroups = (items, year, month) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startMonday = getMonday(first);
  const lastMonday = getMonday(last);

  const weeks = [];
  let cursor = new Date(startMonday);
  let n = 1;
  while (cursor <= lastMonday) {
    weeks.push({
      key: toDateKey(cursor),
      monday: new Date(cursor),
      sunday: addDays(cursor, 6),
      n,
      items: []
    });
    cursor = addDays(cursor, 7);
    n++;
  }

  const banco = [];
  items.forEach(item => {
    if (item.banco || !anchorDate(item)) {
      banco.push(item);
      return;
    }
    const date = new Date(anchorDate(item) + 'T12:00:00');
    if (date.getFullYear() !== year || date.getMonth() !== month) return;
    const itemMondayKey = toDateKey(getMonday(date));
    const week = weeks.find(w => w.key === itemMondayKey);
    if (week) week.items.push(item);
  });

  weeks.forEach(w => { w.days = groupByDay(w.items, w.monday); });

  return { weeks, banco };
};

const Th = ({ children, className = '' }) => (
  <th className={`px-4 py-3 ${text.badge} text-slate-400 tracking-wider whitespace-nowrap ${className}`}>{children}</th>
);

const Td = ({ children, className = '' }) => (
  <td className={`px-4 py-3 whitespace-nowrap ${className}`}>{children}</td>
);

const Row = ({ item, onClick, onDeleteRequest }) => (
  <tr
    onClick={() => onClick(item)}
    className={`group/row border-b border-slate-50 last:border-b-0 hover:bg-slate-50 cursor-pointer transition-colors ${item.completed ? 'opacity-60' : ''}`}
  >
    <Td>
      {item.code ? (
        <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md tracking-wider">
          {item.code}
        </span>
      ) : (
        <span className="text-xs text-slate-300">—</span>
      )}
    </Td>
    <Td className="font-semibold text-slate-800 max-w-[420px]">
      <span className={`truncate block ${item.completed ? 'line-through italic text-slate-400' : ''}`}>
        {item.objective || <span className="text-slate-300">Sem título</span>}
      </span>
    </Td>
    <Td>
      <span className={`inline-flex px-2 py-0.5 rounded ${text.badge} ${stageClass(item)}`}>
        {stageLabel(item)}
      </span>
    </Td>
    <Td>
      {item.contentType && (
        <span className={`inline-flex px-2 py-0.5 rounded ${text.badge} ${getContentTypeBadgeClass(item.contentType, 'bg-slate-100 text-slate-700')}`}>
          {getContentTypeTag(item.contentType)}
        </span>
      )}
    </Td>
    <Td>
      {item.profile && (
        <span className={`inline-flex px-2 py-0.5 rounded ${text.badge} ${getProfileBadgeClass(item.profile)}`}>
          {getProfileTag(item.profile)}
        </span>
      )}
    </Td>
    <Td>
      {item.pilar ? (
        <span className={`inline-flex px-2 py-0.5 rounded ${text.badge} ${getPilarBadgeClass(item.pilar)}`}>
          {getPilarLabel(item.pilar)}
        </span>
      ) : (
        <span className="text-xs text-slate-300">—</span>
      )}
    </Td>
    <Td>
      {item.editor === 'indefinido' ? (
        <span className={`inline-flex items-center px-2 py-0.5 rounded ${text.badge} bg-slate-100 text-slate-500 italic`}>
          Indefinido
        </span>
      ) : item.editor ? (
        item.editor === 'torres' ? (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${text.badge} bg-violet-600 text-white`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Torres
          </span>
        ) : (
          <span className="text-xs text-slate-600 capitalize">{item.editor}</span>
        )
      ) : (
        <span className="text-xs text-slate-300">—</span>
      )}
    </Td>
    <Td className="text-xs text-slate-500">{item.recordingDate ? formatDateShort(item.recordingDate) : <span className="text-slate-300">—</span>}</Td>
    <Td className="text-xs text-slate-500">{item.postDate ? formatDateShort(item.postDate) : <span className="text-slate-300">—</span>}</Td>
    <Td className="text-xs text-slate-500">{item.time || <span className="text-slate-300">—</span>}</Td>
    <Td className="text-right">
      <button
        onClick={(e) => { e.stopPropagation(); onDeleteRequest(item); }}
        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover/row:opacity-100 transition-opacity"
        title="Excluir"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </Td>
  </tr>
);

const SectionTbody = ({ icon, title, subtitle, count, tone, expanded, onToggle, isEmpty, children }) => {
  const toneClass = tone === 'amber'
    ? 'bg-amber-50/40 hover:bg-amber-50/70'
    : tone === 'violet'
      ? 'bg-violet-50/40 hover:bg-violet-50/70'
      : 'bg-slate-50/40 hover:bg-slate-100/60';
  const titleColor = tone === 'amber'
    ? 'text-amber-700'
    : tone === 'violet'
      ? 'text-violet-700'
      : 'text-slate-700';

  return (
    <tbody>
      <tr className="border-b border-slate-100">
        <td colSpan={11} className="p-0">
          <button
            type="button"
            onClick={onToggle}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${toneClass}`}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0 ${expanded ? '' : '-rotate-90'}`}
              strokeWidth={3}
            />
            {icon}
            <span className={`text-[11px] font-black uppercase tracking-wider ${titleColor}`}>{title}</span>
            {subtitle && (
              <span className="text-[10px] font-bold text-slate-400 uppercase truncate">{subtitle}</span>
            )}
            <span className="ml-auto inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full bg-white border border-slate-200 text-[10px] font-black text-slate-500">
              {count}
            </span>
          </button>
        </td>
      </tr>
      {expanded && !isEmpty && children}
      {expanded && isEmpty && (
        <tr>
          <td colSpan={11} className="text-center py-3 text-[10px] font-black text-slate-300 uppercase italic">
            Sem itens nesta semana
          </td>
        </tr>
      )}
    </tbody>
  );
};

export const Planilha = ({ items, search, onSearchChange, onRowClick, onAddClick, onDelete }) => {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [expanded, setExpanded] = useState(() => new Set());
  const [pendingDelete, setPendingDelete] = useState(null);

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const groups = useMemo(
    () => buildMonthGroups(items, viewYear, viewMonth),
    [items, viewYear, viewMonth]
  );

  const totalVisible =
    groups.banco.length + groups.weeks.reduce((sum, w) => sum + w.items.length, 0);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
    setExpanded(new Set());
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
    setExpanded(new Set());
  };
  const goToCurrent = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setExpanded(new Set());
  };
  const toggle = (key) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
  const allSectionKeys = useMemo(() => {
    const out = [];
    if (groups.banco.length > 0) out.push('banco');
    groups.weeks.forEach(w => {
      out.push(w.key);
      w.days.forEach(d => out.push(`${w.key}__${d.dayId}`));
    });
    return out;
  }, [groups]);
  const expandAll = () => setExpanded(new Set(allSectionKeys));
  const collapseAll = () => setExpanded(new Set());
  const allExpanded = expanded.size === allSectionKeys.length && allSectionKeys.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-full pl-1 pr-2 py-1 shadow-sm">
          <button
            onClick={prevMonth}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={3} />
          </button>
          <span className="text-[12px] font-black uppercase text-slate-800 px-2 min-w-[120px] text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
            title="Próximo mês"
          >
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
          </button>
          {!isCurrentMonth && (
            <button
              onClick={goToCurrent}
              className="ml-1 text-[9px] font-black uppercase text-blue-600 hover:text-blue-700 px-2 py-1 rounded-full hover:bg-blue-50 transition-colors"
            >
              Hoje
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por título..."
              className="pl-8 pr-3 py-2 w-60 bg-white border border-slate-100 rounded-full text-xs font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-300"
            />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">
            {totalVisible} {totalVisible === 1 ? 'item' : 'itens'}
          </span>
          <button
            onClick={allExpanded ? collapseAll : expandAll}
            className="text-[10px] font-black uppercase text-slate-500 hover:text-slate-800 hover:bg-slate-50 px-3 py-2 rounded-full border border-slate-100 transition-colors whitespace-nowrap"
            title={allExpanded ? 'Recolher todas as seções' : 'Expandir todas as seções'}
          >
            {allExpanded ? 'Recolher tudo' : 'Expandir tudo'}
          </button>
          <button
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-4 h-9 bg-blue-600 text-white rounded-full font-black text-[11px] uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={3} />
            Adicionar conteúdo
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                <Th className="w-[90px]">ID</Th>
                <Th className="min-w-[260px]">Título</Th>
                <Th>Estágio</Th>
                <Th>Tipo</Th>
                <Th>Perfil</Th>
                <Th>Pilar</Th>
                <Th>Editor</Th>
                <Th>Gravar</Th>
                <Th>Postar</Th>
                <Th>Hora</Th>
                <Th className="w-[60px]"></Th>
              </tr>
            </thead>

            {groups.banco.length > 0 && (
              <SectionTbody
                icon={<Archive className="w-3.5 h-3.5 text-violet-500" strokeWidth={2.5} />}
                title="Banco"
                subtitle="pronto pra encaixar"
                count={groups.banco.length}
                tone="violet"
                expanded={expanded.has('banco')}
                onToggle={() => toggle('banco')}
                isEmpty={false}
              >
                {groups.banco.map(item => (
                  <Row
                    key={`b-${item._stage}-${item._sourceWeekKey}-${item._sourceDayId}-${item.id}`}
                    item={item}
                    onClick={onRowClick}
                    onDeleteRequest={setPendingDelete}
                  />
                ))}
              </SectionTbody>
            )}

            {groups.weeks.map(w => {
              const isWeekExpanded = expanded.has(w.key);
              return (
                <React.Fragment key={w.key}>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td colSpan={11} className="p-0">
                        <button
                          type="button"
                          onClick={() => toggle(w.key)}
                          className="w-full flex items-center gap-3 pl-4 pr-4 py-2.5 text-left bg-slate-50/40 hover:bg-slate-100/60 transition-colors"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0 ${isWeekExpanded ? '' : '-rotate-90'}`}
                            strokeWidth={3}
                          />
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                            Semana {w.n}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase truncate">
                            {formatDateShort(w.monday)} - {formatDateShort(w.sunday)}
                          </span>
                          <span className="ml-auto inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full bg-white border border-slate-200 text-[10px] font-black text-slate-500">
                            {w.items.length}
                          </span>
                        </button>
                      </td>
                    </tr>
                  </tbody>

                  {isWeekExpanded && w.days.map(d => {
                    const dayKey = `${w.key}__${d.dayId}`;
                    const isDayExpanded = expanded.has(dayKey);
                    return (
                      <tbody key={dayKey}>
                        <tr className="border-b border-slate-100">
                          <td colSpan={11} className="p-0">
                            <button
                              type="button"
                              onClick={() => toggle(dayKey)}
                              className="w-full flex items-center gap-3 pl-12 pr-4 py-2 text-left bg-white hover:bg-slate-50 transition-colors"
                            >
                              <ChevronDown
                                className={`w-3 h-3 text-slate-400 transition-transform flex-shrink-0 ${isDayExpanded ? '' : '-rotate-90'}`}
                                strokeWidth={3}
                              />
                              <span className={`w-1.5 h-1.5 rounded-full ${d.color} flex-shrink-0`} />
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                                {d.label}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {formatDateShort(d.date)}
                              </span>
                              <span className="ml-auto inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-500">
                                {d.items.length}
                              </span>
                            </button>
                          </td>
                        </tr>
                        {isDayExpanded && d.items.map(item => (
                          <Row
                            key={`${dayKey}-${item._stage}-${item._sourceWeekKey}-${item._sourceDayId}-${item.id}`}
                            item={item}
                            onClick={onRowClick}
                          />
                        ))}
                      </tbody>
                    );
                  })}

                  {isWeekExpanded && w.days.length === 0 && (
                    <tbody>
                      <tr>
                        <td colSpan={11} className="text-center py-3 text-[10px] font-black text-slate-300 uppercase italic">
                          Sem itens nesta semana
                        </td>
                      </tr>
                    </tbody>
                  )}
                </React.Fragment>
              );
            })}

            {totalVisible === 0 && (
              <tbody>
                <tr>
                  <td colSpan={11} className={`text-center py-10 ${text.badge} text-slate-300`}>
                    Nenhum item neste mês — clique em "Nova página" pra começar
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
        <button
          onClick={onAddClick}
          className="w-full flex items-center gap-2 px-4 py-3 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-50"
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs font-medium">Nova página</span>
        </button>
      </div>

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="bg-white rounded-[24px] max-w-md w-full shadow-2xl shadow-slate-900/30 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Excluir conteúdo?</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">
                  Esta ação não pode ser desfeita
                </p>
              </div>
              <button
                onClick={() => setPendingDelete(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-full transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5">
              {pendingDelete.code && (
                <span className="inline-block font-mono text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md tracking-wider mb-2">
                  {pendingDelete.code}
                </span>
              )}
              <p className="text-sm font-semibold text-slate-800">
                {pendingDelete.objective || <span className="text-slate-400 italic">Sem título</span>}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-5 bg-white border border-slate-200 text-slate-600 font-black py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-xs uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { onDelete(pendingDelete); setPendingDelete(null); }}
                className="flex-1 bg-rose-600 text-white font-black py-2.5 rounded-xl hover:bg-rose-700 text-xs uppercase tracking-wider transition-colors shadow-lg shadow-rose-600/20"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
