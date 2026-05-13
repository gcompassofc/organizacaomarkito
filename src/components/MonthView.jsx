import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES, toDateKey, buildMonthGrid } from '../lib/dates';
import { STATUS_META, deriveStatus } from '../lib/status';
import { getAllItemsFlat } from '../lib/planner';

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const MonthView = ({
  planner,
  panoramaMonth,
  setPanoramaMonth,
  calendarDateField,
  setCalendarDateField,
  matchesPanoramaFilters,
  todayKey,
  openItemFromPanorama
}) => {
  const cells = buildMonthGrid(panoramaMonth);
  const monthIdx = panoramaMonth.getMonth();
  const yearLabel = panoramaMonth.getFullYear();

  const itemsByDate = {};
  getAllItemsFlat(planner).forEach(({ item, weekKey, dayId }) => {
    if (!matchesPanoramaFilters(item)) return;
    const dateKey = calendarDateField === 'recordingDate'
      ? (item.recordingDate || null)
      : (item.postDate || item.recordingDate || null);
    if (!dateKey) return;
    if (!itemsByDate[dateKey]) itemsByDate[dateKey] = [];
    itemsByDate[dateKey].push({ item, weekKey, dayId });
  });

  const goPrev = () => setPanoramaMonth(new Date(yearLabel, monthIdx - 1, 1));
  const goNext = () => setPanoramaMonth(new Date(yearLabel, monthIdx + 1, 1));
  const goToday = () => { const d = new Date(); setPanoramaMonth(new Date(d.getFullYear(), d.getMonth(), 1)); };

  return (
    <div className="bg-white border border-slate-100 rounded-[32px] p-4 md:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Visão mensal</p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase">{MONTH_NAMES[monthIdx]} {yearLabel}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-50 p-1 rounded-xl flex items-center">
            <button onClick={() => setCalendarDateField('postDate')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${calendarDateField === 'postDate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Por postagem</button>
            <button onClick={() => setCalendarDateField('recordingDate')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${calendarDateField === 'recordingDate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Por gravação</button>
          </div>
          <button onClick={goPrev} className="w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={goToday} className="px-3 h-9 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-black text-[10px] uppercase">Hoje</button>
          <button onClick={goNext} className="w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cellDate, idx) => {
          const cellKey = toDateKey(cellDate);
          const inMonth = cellDate.getMonth() === monthIdx;
          const isToday = cellKey === todayKey;
          const dayItems = itemsByDate[cellKey] || [];
          const hasOverdue = dayItems.some(({ item }) => deriveStatus(item, todayKey).startsWith('atrasado_'));
          return (
            <div
              key={idx}
              className={`min-h-[88px] md:min-h-[110px] p-1.5 rounded-xl border ${inMonth ? 'bg-white' : 'bg-slate-50/40'} ${isToday ? 'border-blue-500 ring-2 ring-blue-200' : hasOverdue ? 'border-rose-300' : 'border-slate-100'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-black ${inMonth ? (isToday ? 'text-blue-600' : 'text-slate-700') : 'text-slate-300'}`}>{cellDate.getDate()}</span>
                {dayItems.length > 0 && (
                  <span className="text-[8px] font-black text-slate-400">{dayItems.length}</span>
                )}
              </div>
              <div className="space-y-1">
                {dayItems.slice(0, 3).map(({ item, weekKey, dayId }) => {
                  const status = deriveStatus(item, todayKey);
                  const meta = STATUS_META[status];
                  const overdue = status.startsWith('atrasado_');
                  return (
                    <div
                      key={`${weekKey}-${dayId}-${item.id}`}
                      onClick={() => openItemFromPanorama(item, dayId, weekKey)}
                      className={`text-[9px] font-black uppercase truncate px-1.5 py-1 rounded cursor-pointer ${meta.chip} ${overdue ? 'ring-1 ring-rose-400 animate-pulse' : ''} ${item.completed ? 'line-through opacity-60' : ''}`}
                      title={`${item.objective} — ${meta.label}`}
                    >
                      {item.objective}
                    </div>
                  );
                })}
                {dayItems.length > 3 && (
                  <div className="text-[8px] font-black text-slate-400 px-1">+{dayItems.length - 3} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
        {Object.entries(STATUS_META).map(([k, m]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${m.dot}`} />
            <span className="text-[10px] font-black text-slate-500 uppercase">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthView;
