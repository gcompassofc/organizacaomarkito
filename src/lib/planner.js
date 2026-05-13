import { daysOfWeek, getWeekKey, getNextDayOfWeek, toDateKey } from './dates';

export const emptyTabData = () => ({ segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [], domingo: [] });

export const emptyWeekData = () => ({
  gravar: emptyTabData(),
  editar: { geral: [] },
  postar: emptyTabData()
});

export const newId = () => (
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
);

export const defaultItem = () => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    objective: '',
    summary: '',
    primaryLink: '',
    secondaryLink: '',
    editedVideoLink: '',
    postCaption: '',
    firstComment: '',
    contentType: 'video_curto',
    recordingType: 'sozinho',
    profile: 'opa',
    storyMode: 'aovivo',
    time: '',
    editor: 'allyson',
    recordingDate: toDateKey(today),
    postDate: toDateKey(tomorrow),
    status: 'gravar',
    initialStage: 'gravar'
  };
};

export const createPlanner = (currentWeekKey = getWeekKey()) => ({
  version: 4,
  currentWeekKey,
  weeks: {
    [currentWeekKey]: emptyWeekData()
  }
});

export const normalizeUrl = (value) => {
  if (!value || !value.trim()) return '';
  return value.startsWith('http') ? value : `https://${value}`;
};

export const normalizeItem = (item = {}, tabKey = 'gravar', forcedContentType, weekKeyStr, fallbackDayId) => {
  const norm = {
    id: item.id || newId(),
    objective: item.objective || '',
    summary: item.summary || '',
    primaryLink: item.primaryLink || item.uploadLink || item.folderLink || item.link || '',
    secondaryLink: item.secondaryLink || item.contentLink || item.editedVideoLink || '',
    editedVideoLink: item.editedVideoLink || '',
    postCaption: item.postCaption || '',
    firstComment: item.firstComment || '',
    editor: item.editor || 'allyson',
    contentType: forcedContentType || item.contentType || 'video_curto',
    recordingType: item.recordingType || 'sozinho',
    profile: item.profile || 'opa',
    storyMode: item.storyMode || 'aovivo',
    time: item.time || '',
    completed: Boolean(item.completed),
    tabKey,
    _gravarOrigin: item._gravarOrigin || null,
    _editarOrigin: item._editarOrigin || null
  };

  if (!item.recordingDate && weekKeyStr) {
    norm.recordingDate = getNextDayOfWeek(weekKeyStr, item.recordingDayId || fallbackDayId || 'segunda');
  } else {
    norm.recordingDate = item.recordingDate || toDateKey(new Date());
  }

  if (!item.postDate && weekKeyStr) {
    norm.postDate = getNextDayOfWeek(weekKeyStr, item.postDayId || fallbackDayId || 'segunda');
  } else {
    norm.postDate = item.postDate || toDateKey(new Date());
  }

  return norm;
};

export const mergeLegacyStoriesIntoGravar = (weekData = {}, weekKeyStr) => {
  const base = emptyWeekData();
  const gravarSource = weekData.gravar || base.gravar;
  const postarSource = weekData.postar || base.postar;
  const storiesSource = weekData.stories || base.gravar;
  const editarSource = weekData.editar || base.editar;

  const gravar = {};
  const postar = {};
  const editar = { geral: (editarSource.geral || []).map((item) => normalizeItem(item, 'editar', undefined, weekKeyStr, 'segunda')) };

  daysOfWeek.forEach((day) => {
    gravar[day.id] = [
      ...(gravarSource[day.id] || []).map((item) => normalizeItem(item, 'gravar', item.contentType || 'video_curto', weekKeyStr, day.id)),
      ...(storiesSource[day.id] || []).map((item) => normalizeItem(item, 'gravar', 'stories', weekKeyStr, day.id))
    ];
    postar[day.id] = (postarSource[day.id] || []).map((item) => normalizeItem(item, 'postar', undefined, weekKeyStr, day.id));
  });

  return { gravar, editar, postar };
};

export const normalizePlanner = (cloudData) => {
  const currentWeekKey = getWeekKey();

  if (!cloudData) return createPlanner(currentWeekKey);

  if (cloudData.weeks) {
    const weeks = Object.entries(cloudData.weeks).reduce((acc, [weekKey, weekData]) => {
      acc[weekKey] = mergeLegacyStoriesIntoGravar(weekData, weekKey);
      return acc;
    }, {});

    return {
      version: 4,
      currentWeekKey: cloudData.currentWeekKey || currentWeekKey,
      weeks: Object.keys(weeks).length ? weeks : { [currentWeekKey]: emptyWeekData() }
    };
  }

  if (cloudData.segunda && !cloudData.gravar) {
    return {
      version: 4,
      currentWeekKey,
      weeks: {
        [currentWeekKey]: mergeLegacyStoriesIntoGravar({
          gravar: cloudData,
          postar: emptyTabData()
        }, currentWeekKey)
      }
    };
  }

  return {
    version: 4,
    currentWeekKey,
    weeks: {
      [currentWeekKey]: mergeLegacyStoriesIntoGravar(cloudData, currentWeekKey)
    }
  };
};

export const getAllItemsFlat = (planner) => {
  const out = [];
  Object.entries(planner.weeks || {}).forEach(([weekKey, week]) => {
    daysOfWeek.forEach(d => {
      (week.gravar?.[d.id] || []).forEach(item => out.push({ item, weekKey, dayId: d.id, tab: 'gravar' }));
      (week.postar?.[d.id] || []).forEach(item => out.push({ item, weekKey, dayId: d.id, tab: 'postar' }));
    });
    (week.editar?.geral || []).forEach(item => out.push({ item, weekKey, dayId: 'geral', tab: 'editar' }));
  });
  return out;
};

export const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};
