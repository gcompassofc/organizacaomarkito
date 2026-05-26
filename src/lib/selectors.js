import { daysOfWeek, addDays, parseWeekKey, toDateKey } from './dates';
import { profileMatchesFilter } from './tags';

export const stageLabel = (item) => {
  if (item._stage === 'gravar') return 'Gravar';
  if (item._stage === 'editar') return 'Em edição';
  if (item._stage === 'postar') return item.completed ? 'Postado' : 'Pra postar';
  return '—';
};

export const getAllItems = (planner, profileFilter, editorFilter, search) => {
  const out = [];
  Object.entries(planner.weeks).forEach(([weekKey, weekData]) => {
    daysOfWeek.forEach(d => {
      (weekData.gravar?.[d.id] || []).forEach(item => {
        out.push({ ...item, _stage: 'gravar', _sourceWeekKey: weekKey, _sourceDayId: d.id });
      });
    });
    (weekData.editar?.geral || []).forEach(item => {
      out.push({ ...item, _stage: 'editar', _sourceWeekKey: weekKey, _sourceDayId: 'geral' });
    });
    Object.entries(weekData.postar || {}).forEach(([dayId, items]) => {
      (items || []).forEach(item => {
        out.push({ ...item, _stage: 'postar', _sourceWeekKey: weekKey, _sourceDayId: dayId });
      });
    });
  });

  const sortDate = (item) =>
    new Date((item.postDate || item.recordingDate || item._sourceWeekKey) + 'T12:00:00');
  out.sort((a, b) => sortDate(a) - sortDate(b));

  const term = (search || '').trim().toLowerCase();
  return out.filter(item => {
    if (!profileMatchesFilter(item.profile, profileFilter)) return false;
    if (editorFilter && editorFilter !== 'todos' && (item.editor || 'allyson') !== editorFilter) return false;
    if (term && !(item.objective || '').toLowerCase().includes(term)) return false;
    return true;
  });
};

const dateOrFallback = (dateStr, fallbackWeekKey) =>
  new Date((dateStr || fallbackWeekKey) + 'T12:00:00');

const notBanco = (item) => !item.banco;

export const getRepostablePosts = (planner) => {
  const out = [];
  Object.entries(planner.weeks || {}).forEach(([weekKey, weekData]) => {
    daysOfWeek.forEach(d => {
      (weekData.gravar?.[d.id] || []).forEach(item => {
        if (item.contentType === 'stories' || item.contentType === 'repost_stories') return;
        out.push({ ...item, _stage: 'gravar', _sourceWeekKey: weekKey, _sourceDayId: d.id });
      });
    });
    (weekData.editar?.geral || []).forEach(item => {
      if (item.contentType === 'stories' || item.contentType === 'repost_stories') return;
      out.push({ ...item, _stage: 'editar', _sourceWeekKey: weekKey, _sourceDayId: 'geral' });
    });
    Object.entries(weekData.postar || {}).forEach(([dayId, items]) => {
      (items || []).forEach(item => {
        if (item.contentType === 'stories' || item.contentType === 'repost_stories') return;
        out.push({ ...item, _stage: 'postar', _sourceWeekKey: weekKey, _sourceDayId: dayId });
      });
    });
  });
  out.sort((a, b) => {
    const da = (a.postDate || a.recordingDate || a._sourceWeekKey);
    const db = (b.postDate || b.recordingDate || b._sourceWeekKey);
    return db.localeCompare(da);
  });
  return out;
};

export const getEditarQueue = (planner, profileFilter, editorFilter) => {
  const items = Object.entries(planner.weeks).flatMap(([weekKey, weekData]) =>
    (weekData.editar?.geral || [])
      .filter(notBanco)
      .map(item => ({ ...item, _sourceWeekKey: weekKey }))
  );

  items.sort((a, b) =>
    dateOrFallback(a.postDate, a._sourceWeekKey) - dateOrFallback(b.postDate, b._sourceWeekKey)
  );

  return items.filter(item =>
    profileMatchesFilter(item.profile, profileFilter) &&
    (editorFilter === 'todos' || (item.editor || 'allyson') === editorFilter)
  );
};

export const getGravarQueue = (planner, profileFilter) => {
  const items = Object.entries(planner.weeks).flatMap(([weekKey, weekData]) =>
    daysOfWeek.flatMap(d =>
      (weekData.gravar?.[d.id] || [])
        .filter(notBanco)
        .filter(item => profileMatchesFilter(item.profile, profileFilter))
        .map(item => ({ ...item, _sourceWeekKey: weekKey, _sourceDayId: d.id }))
    )
  );

  items.sort((a, b) =>
    dateOrFallback(a.recordingDate, a._sourceWeekKey) - dateOrFallback(b.recordingDate, b._sourceWeekKey)
  );

  return items;
};

export const getGravarConcluidos = (planner, profileFilter) => {
  const out = [];
  Object.entries(planner.weeks).forEach(([weekKey, weekData]) => {
    (weekData.editar?.geral || []).forEach(item => {
      if (item._gravarOrigin && !item.banco && profileMatchesFilter(item.profile, profileFilter)) {
        out.push({ item, livesIn: { weekKey, dayId: 'geral' }, stageLabel: 'Em edição' });
      }
    });
    Object.entries(weekData.postar || {}).forEach(([livesDayId, items]) => {
      (items || []).forEach(item => {
        if (item._gravarOrigin && !item.banco && profileMatchesFilter(item.profile, profileFilter)) {
          out.push({
            item,
            livesIn: { weekKey, dayId: livesDayId },
            stageLabel: item.completed ? 'Postado' : 'Para postar'
          });
        }
      });
    });
  });
  return out;
};

export const getGravarSlimEchoes = (planner, currentWeekKey) => {
  const byDay = {};
  daysOfWeek.forEach(day => { byDay[day.id] = []; });

  Object.entries(planner.weeks).forEach(([weekKey, weekData]) => {
    (weekData.editar?.geral || []).forEach(item => {
      const origin = item._gravarOrigin;
      if (item.banco) return;
      if (origin && origin.weekKey === currentWeekKey && byDay[origin.dayId]) {
        byDay[origin.dayId].push({
          item,
          livesIn: { weekKey, dayId: 'geral' },
          stageLabel: 'Em edição'
        });
      }
    });
    Object.entries(weekData.postar || {}).forEach(([livesDayId, items]) => {
      (items || []).forEach(item => {
        const origin = item._gravarOrigin;
        if (item.banco) return;
        if (origin && origin.weekKey === currentWeekKey && byDay[origin.dayId]) {
          byDay[origin.dayId].push({
            item,
            livesIn: { weekKey, dayId: livesDayId },
            stageLabel: item.completed ? 'Postado' : 'Para postar'
          });
        }
      });
    });
  });

  return byDay;
};

export const getEditarSlimEchoes = (planner) => {
  const out = [];
  Object.entries(planner.weeks).forEach(([weekKey, weekData]) => {
    Object.entries(weekData.postar || {}).forEach(([livesDayId, items]) => {
      (items || []).forEach(item => {
        if (item._editarOrigin && !item.banco) {
          out.push({
            item,
            livesIn: { weekKey, dayId: livesDayId },
            stageLabel: item.completed ? 'Postado' : 'Para postar'
          });
        }
      });
    });
  });
  return out;
};

export const getEditarPreviewsByDay = (planner, currentWeekKey) => {
  const byDay = {};
  daysOfWeek.forEach(d => { byDay[d.id] = []; });

  const weekDayKeys = daysOfWeek.map((_, idx) =>
    toDateKey(addDays(parseWeekKey(currentWeekKey), idx))
  );

  Object.entries(planner.weeks).forEach(([weekKey, weekData]) => {
    (weekData.editar?.geral || []).forEach(item => {
      if (item.banco) return;
      if (!item.postDate) return;
      const idx = weekDayKeys.indexOf(item.postDate);
      if (idx >= 0) {
        byDay[daysOfWeek[idx].id].push({ item, sourceWeekKey: weekKey });
      }
    });
  });

  return byDay;
};
