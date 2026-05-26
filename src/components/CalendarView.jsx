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
  getContentTypeTag
} from '../lib/tags';
import { stageLabel } from '../lib/selectors';

const PROFILE_DOT = {
  marco: 'bg-emerald-500',
  opa: 'bg-blue-500',
  collab: 'bg-gradient-to-r from-blue-500 to-emerald-500'
};

const dotForItem = (item) => PROFILE_DOT[item.profile] || 'bg-slate-400';

const itemDateKey = (item, dateField) => {
  if (dateField === 'recordingDate') return item.recordingDate || '';
  return item.postDate || '';
};

const DayPopover = ({ day, items, dateField, onClose, onAddClick, onItemClick }) => {
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
              {formatDateShort(day)} · {items.length} {items.length === 1 ? 'tarefa' : 'tarefas'}
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

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-8">
              Nada planejado para esse dia ainda
            </p>
          ) : (
            items.map(item => (
              <button
                key={`${item._stage}-${item._sourceWeekKey}-${item._sourceDayId}-${item.id}`}
                type="button"
                onClick={() => onItemClick(item)}
                className={`w-full text-left flex flex-col gap-2 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors ${item.completed ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full ${dotForItem(item)} flex-shrink-0 mt-1.5`} />
                  <span className={`text-sm font-medium text-slate-800 min-w-0 ${item.completed ? 'line-through italic text-slate-400' : ''}`}>
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
            ))
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
  onItemClick
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
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    map.forEach(arr => arr.sort((a, b) => (a.time || '').localeCompare(b.time || '')));
    return map;
  }, [items, dateField]);

  const todayKey = toDateKey(new Date());

  const weekdayHeaders = daysOfWeek.map(d => d.label.slice(0, 3));

  const dayIdFromDate = (date) => {
    const idx = date.getDay() === 0 ? 6 : date.getDay() - 1;
    return daysOfWeek[idx].id;
  };

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
  const openDayItems = openDayKey ? (itemsByDay.get(openDayKey) || []) : [];

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 bg-slate-50/60 border-b border-slate-100">
        {weekdayHeaders.map((label, idx) => (
          <div
            key={label}
            className={`text-center py-2 text-[10px] font-semibold tracking-wider uppercase ${idx >= 5 ? 'text-slate-400' : 'text-slate-500'}`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {grid.map((date, idx) => {
          const key = toDateKey(date);
          const inMonth = date.getMonth() === viewMonth;
          const isToday = key === todayKey;
          const dayItems = itemsByDay.get(key) || [];
          const dayId = dayIdFromDate(date);
          const dayPilarsHere = ['marco', 'opa']
            .map(p => ({ profile: p, pilar: dayPilars?.[p]?.[dayId] || '' }))
            .filter(x => x.pilar);

          return (
            <div
              key={`${key}-${idx}`}
              className={`group relative min-h-[110px] border-r border-b border-slate-100 last:border-r-0 p-2 flex flex-col ${inMonth ? 'bg-white' : 'bg-slate-50/40'} ${isToday ? 'ring-2 ring-inset ring-emerald-300 bg-emerald-50/30' : ''}`}
            >
              <button
                type="button"
                onClick={() => setOpenDayKey(key)}
                className="flex items-start justify-between gap-1 text-left"
              >
                <span className={`text-[11px] font-semibold ${inMonth ? (isToday ? 'text-emerald-700' : 'text-slate-700') : 'text-slate-300'}`}>
                  {date.getDate()}
                </span>
                {dayPilarsHere.length > 0 && (
                  <span className="flex items-center gap-0.5 flex-wrap justify-end">
                    {dayPilarsHere.map(({ profile, pilar }) => (
                      <span
                        key={profile}
                        className={`inline-block w-1.5 h-3 rounded-sm ${getPilarBadgeClass(pilar).split(' ').find(c => c.startsWith('bg-')) || 'bg-slate-200'}`}
                        title={`${getProfileTag(profile)} · ${getPilarLabel(pilar)}`}
                      />
                    ))}
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
          items={openDayItems}
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
