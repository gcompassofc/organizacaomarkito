import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  buildMonthGrid,
  toDateKey,
  formatDateShort,
  daysOfWeek
} from '../lib/dates';
import {
  getPilarBadgeClass,
  getPilarLabel,
  getProfileBadgeClass,
  getProfileTag,
  getContentTypeTag,
  pilaresForProfile,
  isStoriesLike
} from '../lib/tags';
import { stageLabel } from '../lib/selectors';

const PROFILE_DOT = {
  marco: 'bg-emerald-500',
  opa: 'bg-blue-500',
  collab: 'bg-gradient-to-r from-blue-500 to-emerald-500'
};

const dotForItem = (item) => PROFILE_DOT[item.profile] || 'bg-slate-400';

const pilarBgOnly = (id) => getPilarBadgeClass(id).split(' ').find(c => c.startsWith('bg-')) || 'bg-slate-200';

const HeaderPilarChip = ({ profile, dayId, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const options = pilaresForProfile(profile);
  const profileShort = profile === 'marco' ? 'M' : 'O';

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase leading-none transition-colors ${value ? `${pilarBgOnly(value)} text-slate-700 hover:opacity-80` : 'bg-white text-slate-400 border border-dashed border-slate-300 hover:border-slate-400'}`}
        title={value ? `${getProfileTag(profile)} · ${getPilarLabel(value)} — clique para trocar` : `Definir pilar de ${getProfileTag(profile)} para essa coluna`}
      >
        <span className="opacity-60">{profileShort}</span>
        <span>{value ? getPilarLabel(value) : '—'}</span>
      </button>

      {open && (
        <div
          className="absolute z-30 left-1/2 -translate-x-1/2 top-5 min-w-[190px] bg-white border border-slate-200 rounded-xl shadow-lg p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
            {getProfileTag(profile)} · pilar do dia
          </div>
          <button
            type="button"
            onClick={() => { onChange(profile, dayId, ''); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wider uppercase text-slate-400 hover:bg-slate-50"
          >
            <X className="w-3 h-3" /> Sem pilar
          </button>
          <div className="h-px bg-slate-100 my-1" />
          {options.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onChange(profile, dayId, p.id); setOpen(false); }}
              className={`w-full text-left flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wider uppercase hover:bg-slate-50 ${value === p.id ? 'bg-slate-100' : ''}`}
            >
              <span>{p.label}</span>
              <span className={`px-1.5 py-0.5 rounded ${pilarBgOnly(p.id)}`}>&nbsp;</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const itemDateKey = (item, dateField) => {
  if (dateField === 'recordingDate') return item.recordingDate || '';
  return item.postDate || '';
};

const DayItemRow = ({ item, onClick, muted = false }) => (
  <button
    type="button"
    onClick={() => onClick(item)}
    className={`w-full text-left flex flex-col gap-2 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors ${item.completed ? 'opacity-60' : ''} ${muted ? 'bg-slate-50/60' : ''}`}
  >
    <div className="flex items-start gap-2 min-w-0">
      <span className={`w-2 h-2 rounded-full ${dotForItem(item)} flex-shrink-0 mt-1.5`} />
      <span className={`text-sm font-medium min-w-0 ${muted ? 'text-slate-600' : 'text-slate-800'} ${item.completed ? 'line-through italic text-slate-400' : ''}`}>
        {item.objective || <span className="text-slate-300">Sem título</span>}
      </span>
    </div>
    <div className="flex flex-wrap items-center gap-1.5">
      {item.profile && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${getProfileBadgeClass(item.profile)}`}>
          {getProfileTag(item.profile)}
        </span>
      )}
      {item.pilar && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${getPilarBadgeClass(item.pilar)}`}>
          {getPilarLabel(item.pilar)}
        </span>
      )}
      {item.contentType && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-slate-100 text-slate-600">
          {getContentTypeTag(item.contentType)}
        </span>
      )}
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-slate-50 text-slate-500">
        {stageLabel(item)}
      </span>
      {item.time && (
        <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
          {item.time}
        </span>
      )}
    </div>
  </button>
);

const DayPopover = ({ day, mainItems, storiesItems, dateField, onClose, onAddClick, onItemClick }) => {
  const total = mainItems.length + storiesItems.length;
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        ref={ref}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
              {dateField === 'recordingDate' ? 'Gravar' : 'Postar'}
            </p>
            <h3 className="text-lg font-semibold text-slate-800 mt-0.5">
              {formatDateShort(day)} · {total} {total === 1 ? 'tarefa' : 'tarefas'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {total === 0 && (
            <p className="text-sm text-slate-400 italic text-center py-8">
              Nada planejado para esse dia ainda
            </p>
          )}
          {mainItems.length > 0 && (
            <div className="space-y-2">
              {mainItems.map(item => (
                <DayItemRow
                  key={`${item._stage}-${item._sourceWeekKey}-${item._sourceDayId}-${item.id}`}
                  item={item}
                  onClick={onItemClick}
                />
              ))}
            </div>
          )}
          {storiesItems.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="w-1 h-1 rounded-full bg-rose-400" />
                <span className="text-[10px] font-semibold tracking-wider uppercase text-rose-500/80">
                  Stories ({storiesItems.length})
                </span>
              </div>
              <div className="space-y-2">
                {storiesItems.map(item => (
                  <DayItemRow
                    key={`s-${item._stage}-${item._sourceWeekKey}-${item._sourceDayId}-${item.id}`}
                    item={item}
                    onClick={onItemClick}
                    muted
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => onAddClick(day)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar tarefa neste dia
          </button>
        </div>
      </div>
    </div>
  );
};

export const CalendarView = ({
  items,
  viewYear,
  viewMonth,
  dateField,
  dayPilars,
  onAddAtDate,
  onItemClick,
  onSetDayPilar
}) => {
  const [openDayKey, setOpenDayKey] = useState(null);

  const grid = useMemo(
    () => buildMonthGrid(new Date(viewYear, viewMonth, 1)),
    [viewYear, viewMonth]
  );

  const itemsByDay = useMemo(() => {
    const map = new Map();
    items.forEach(item => {
      if (item.banco) return;
      const key = itemDateKey(item, dateField);
      if (!key) return;
      if (!map.has(key)) map.set(key, { main: [], stories: [] });
      const bucket = map.get(key);
      if (isStoriesLike(item.contentType)) bucket.stories.push(item);
      else bucket.main.push(item);
    });
    map.forEach(b => {
      b.main.sort((a, b2) => (a.time || '').localeCompare(b2.time || ''));
      b.stories.sort((a, b2) => (a.time || '').localeCompare(b2.time || ''));
    });
    return map;
  }, [items, dateField]);

  const todayKey = toDateKey(new Date());

  const weekdayHeaders = daysOfWeek.map(d => ({ id: d.id, label: d.label.slice(0, 3) }));

  const renderCellPills = (dayItems) => {
    if (dayItems.length === 0) return null;
    const max = 4;
    const shown = dayItems.slice(0, max);
    const extra = dayItems.length - shown.length;
    return (
      <div className="mt-1.5 space-y-0.5">
        {shown.map(item => (
          <div
            key={`${item._stage}-${item._sourceWeekKey}-${item._sourceDayId}-${item.id}`}
            className="flex items-center gap-1 min-w-0"
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotForItem(item)}`} />
            <span
              className={`flex-shrink-0 w-2 h-2 rounded-sm ${item.pilar ? getPilarBadgeClass(item.pilar).split(' ').find(c => c.startsWith('bg-')) || 'bg-slate-200' : 'bg-slate-200'}`}
              title={item.pilar ? getPilarLabel(item.pilar) : 'Sem pilar'}
            />
            <span className={`text-[10px] truncate min-w-0 ${item.completed ? 'line-through text-slate-300' : 'text-slate-600'}`}>
              {item.objective || '—'}
            </span>
          </div>
        ))}
        {extra > 0 && (
          <p className="text-[10px] font-semibold text-slate-400">+{extra}</p>
        )}
      </div>
    );
  };

  const openDate = openDayKey ? new Date(openDayKey + 'T12:00:00') : null;
  const openDayBucket = openDayKey ? (itemsByDay.get(openDayKey) || { main: [], stories: [] }) : { main: [], stories: [] };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 bg-slate-50/60 border-b border-slate-100">
        {weekdayHeaders.map(({ id, label }, idx) => {
          const marcoPilar = dayPilars?.marco?.[id] || '';
          const opaPilar = dayPilars?.opa?.[id] || '';
          return (
            <div
              key={id}
              className={`flex flex-col items-center gap-1 py-2 px-1 ${idx >= 5 ? 'text-slate-400' : 'text-slate-500'}`}
            >
              <span className="text-[10px] font-semibold tracking-wider uppercase">
                {label}
              </span>
              {onSetDayPilar && (
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  <HeaderPilarChip
                    profile="marco"
                    dayId={id}
                    value={marcoPilar}
                    onChange={onSetDayPilar}
                  />
                  <HeaderPilarChip
                    profile="opa"
                    dayId={id}
                    value={opaPilar}
                    onChange={onSetDayPilar}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7">
        {grid.map((date, idx) => {
          const key = toDateKey(date);
          const inMonth = date.getMonth() === viewMonth;
          const isToday = key === todayKey;
          const bucket = itemsByDay.get(key) || { main: [], stories: [] };
          const dayItems = bucket.main;
          const storiesCount = bucket.stories.length;

          return (
            <div
              key={`${key}-${idx}`}
              className={`group relative min-h-[110px] border-r border-b border-slate-100 last:border-r-0 p-2 flex flex-col ${inMonth ? 'bg-white' : 'bg-slate-50/40'} ${isToday ? 'ring-2 ring-inset ring-emerald-300 bg-emerald-50/30' : ''}`}
            >
              <button
                type="button"
                onClick={() => setOpenDayKey(key)}
                className="flex items-center justify-between gap-1 text-left"
              >
                <span className={`text-[11px] font-semibold ${inMonth ? (isToday ? 'text-emerald-700' : 'text-slate-700') : 'text-slate-300'}`}>
                  {date.getDate()}
                </span>
                {storiesCount > 0 && (
                  <span
                    className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-rose-500/80"
                    title={`${storiesCount} ${storiesCount === 1 ? 'story' : 'stories'}`}
                  >
                    <span className="w-1 h-1 rounded-full bg-rose-400" />
                    {storiesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setOpenDayKey(key)}
                className="flex-1 text-left -mx-1 px-1 rounded hover:bg-slate-50 transition-colors"
              >
                {renderCellPills(dayItems)}
              </button>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAddAtDate(date); }}
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all flex items-center justify-center"
                aria-label="Adicionar tarefa neste dia"
                title="Adicionar tarefa neste dia"
              >
                <Plus className="w-3 h-3" strokeWidth={3} />
              </button>
            </div>
          );
        })}
      </div>

      {openDate && (
        <DayPopover
          day={openDate}
          mainItems={openDayBucket.main}
          storiesItems={openDayBucket.stories}
          dateField={dateField}
          onClose={() => setOpenDayKey(null)}
          onAddClick={(date) => { setOpenDayKey(null); onAddAtDate(date); }}
          onItemClick={(item) => { setOpenDayKey(null); onItemClick(item); }}
        />
      )}
    </div>
  );
};

export default CalendarView;
