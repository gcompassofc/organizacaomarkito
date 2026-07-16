import { daysOfWeek, addDays, parseWeekKey, toDateKey, getWeekKeyAndDayId } from './dates';
import { profileMatchesFilter } from './tags';

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

// Agrupa a fila de edição (já ordenada por postDate) por semana, usando a
// semana da data de postar — ou a semana onde o item está guardado quando ele
// ainda não tem data. Preserva a ordem original (itens da mesma semana já vêm
// contíguos por causa da ordenação prévia).
export const groupEditarByWeek = (items) => {
  const groups = [];
  let current = null;

  items.forEach((item) => {
    const weekKey = item.postDate
      ? getWeekKeyAndDayId(item.postDate).weekKey
      : (item._sourceWeekKey || getWeekKeyAndDayId('').weekKey);
    const hasDate = Boolean(item.postDate);

    if (!current || current.weekKey !== weekKey) {
      current = { weekKey, hasDate, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  });

  return groups;
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

// Indexa todos os posts (etapa "postar", não-banco) por data ISO (YYYY-MM-DD),
// carregando junto onde o item vive (weekKey/dayId) para permitir editar, mover
// e remover. É a fonte do Cronograma visual (grid por mês/semana).
export const getPostsByDate = (planner, profileFilter = 'todos') => {
  const byDate = {};
  Object.entries(planner.weeks || {}).forEach(([weekKey, weekData]) => {
    daysOfWeek.forEach((d) => {
      (weekData.postar?.[d.id] || []).forEach((item) => {
        if (item.banco) return;
        if (!profileMatchesFilter(item.profile, profileFilter)) return;
        // A data do card é o postDate do item; se faltar, usa o dia da semana.
        const iso = item.postDate || toDateKey(addDays(parseWeekKey(weekKey), daysOfWeek.indexOf(d)));
        if (!byDate[iso]) byDate[iso] = [];
        byDate[iso].push({ item, weekKey, dayId: d.id });
      });
    });
  });
  return byDate;
};
