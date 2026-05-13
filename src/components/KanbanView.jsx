import React from 'react';
import { AlertTriangle, Calendar } from 'lucide-react';
import { addDays, parseWeekKey, toDateKey, formatDateShort, formatWeekRange } from '../lib/dates';
import { STATUS_META, KANBAN_COLUMNS, deriveStatus, statusToKanbanColumn } from '../lib/status';
import { getAllItemsFlat } from '../lib/planner';
import { getProfileTag, getProfileBadgeClass } from '../lib/tags';

const KanbanView = ({
  planner,
  currentWeekKey,
  matchesPanoramaFilters,
  todayKey,
  openItemFromPanorama
}) => {
  const weekStart = parseWeekKey(currentWeekKey);
  const weekEnd = addDays(weekStart, 6);
  const weekStartKey = toDateKey(weekStart);
  const weekEndKey = toDateKey(weekEnd);

  const grouped = { atrasado: [], para_gravar: [], em_edicao: [], pronto_postar: [], postado: [] };

  getAllItemsFlat(planner).forEach(({ item, weekKey, dayId }) => {
    if (!matchesPanoramaFilters(item)) return;
    const status = deriveStatus(item, todayKey);
    const col = statusToKanbanColumn(status);
    const refDate = item.postDate || item.recordingDate;
    const inWeek = refDate && refDate >= weekStartKey && refDate <= weekEndKey;
    if (col === 'atrasado') {
      grouped.atrasado.push({ item, weekKey, dayId, status });
    } else if (col === 'postado') {
      if (inWeek) grouped.postado.push({ item, weekKey, dayId, status });
    } else if (inWeek) {
      grouped[col].push({ item, weekKey, dayId, status });
    }
  });

  Object.keys(grouped).forEach(k => {
    grouped[k].sort((a, b) => {
      const da = a.item.postDate || a.item.recordingDate || '';
      const db = b.item.postDate || b.item.recordingDate || '';
      return da.localeCompare(db);
    });
  });

  return (
    <div className="bg-white border border-slate-100 rounded-[32px] p-4 md:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Kanban — {formatWeekRange(currentWeekKey)}</p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase">Panorama da semana</h2>
          <p className="text-[10px] font-black text-slate-400 mt-1">Atrasados aparecem aqui mesmo se forem de outras semanas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {KANBAN_COLUMNS.map(col => {
          const items = grouped[col.id];
          return (
            <div key={col.id} className={`rounded-2xl border-2 ${col.accent} p-3 min-h-[200px]`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-black text-slate-700 uppercase">{col.label}</h3>
                <span className="text-[10px] font-black text-slate-500 bg-white/70 px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.length === 0 && (
                  <p className="text-[10px] font-black text-slate-300 uppercase text-center py-6">Vazio</p>
                )}
                {items.map(({ item, weekKey, dayId, status }) => {
                  const meta = STATUS_META[status];
                  const overdue = status.startsWith('atrasado_');
                  return (
                    <div
                      key={`${weekKey}-${dayId}-${item.id}`}
                      onClick={() => openItemFromPanorama(item, dayId, weekKey)}
                      className={`bg-white p-2.5 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition ${overdue ? 'border-rose-300' : 'border-slate-100'}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${meta.dot} ${overdue ? 'animate-pulse' : ''}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-black text-slate-800 line-clamp-2 ${item.completed ? 'line-through opacity-60' : ''}`}>{item.objective}</p>
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            {item.profile && (
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${getProfileBadgeClass(item.profile)}`}>{getProfileTag(item.profile)}</span>
                            )}
                            {item.postDate && (
                              <span className="text-[8px] font-black uppercase text-slate-400 flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                {formatDateShort(item.postDate)}
                              </span>
                            )}
                            {overdue && (
                              <span className="text-[8px] font-black uppercase text-rose-600 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {meta.label.replace('Atrasado: ', '')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanView;
