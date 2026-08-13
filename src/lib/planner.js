import { daysOfWeek, getWeekKey } from './dates';

export const emptyTabData = () => ({ segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [], domingo: [] });

export const emptyDayMap = () => ({ segunda: '', terca: '', quarta: '', quinta: '', sexta: '', sabado: '', domingo: '' });

export const emptyDayPilars = () => ({
  marco: emptyDayMap(),
  opa: emptyDayMap(),
  collab: emptyDayMap()
});

export const normalizeDayPilars = (raw) => {
  const base = emptyDayPilars();
  if (!raw || typeof raw !== 'object') return base;
  ['marco', 'opa', 'collab'].forEach((p) => {
    const slice = raw[p];
    if (slice && typeof slice === 'object') {
      Object.keys(base[p]).forEach((d) => {
        if (typeof slice[d] === 'string') base[p][d] = slice[d];
      });
    }
  });
  return base;
};

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

const CODE_PREFIX = { marco: 'M', collab: 'C', opa: 'O' };

export const codePrefix = (profile) => CODE_PREFIX[profile] || CODE_PREFIX.opa;

export const formatCode = (profile, seq) => `${codePrefix(profile)}-${String(seq).padStart(3, '0')}`;

const emptyCounters = () => ({ marco: 0, opa: 0, collab: 0 });

const parseSeqFromCode = (code) => {
  if (!code) return null;
  const m = String(code).match(/-(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
};

const backfillCodes = (planner) => {
  const itemsByProfile = { marco: [], opa: [], collab: [] };
  const collect = (item) => {
    const p = item.profile || 'opa';
    if (itemsByProfile[p]) itemsByProfile[p].push(item);
  };

  Object.values(planner.weeks || {}).forEach((week) => {
    daysOfWeek.forEach((d) => {
      (week.gravar?.[d.id] || []).forEach(collect);
      (week.postar?.[d.id] || []).forEach(collect);
    });
    (week.editar?.geral || []).forEach(collect);
  });

  const counters = { ...emptyCounters(), ...(planner.counters || {}) };

  Object.entries(itemsByProfile).forEach(([profile, items]) => {
    let max = counters[profile] || 0;
    items.forEach((it) => {
      const s = parseSeqFromCode(it.code);
      if (s !== null && s > max) max = s;
    });

    const missing = items.filter((it) => !it.code);
    missing.sort((a, b) => {
      const da = a.postDate || a.recordingDate || '';
      const db = b.postDate || b.recordingDate || '';
      if (da !== db) return da.localeCompare(db);
      return (a.id || '').localeCompare(b.id || '');
    });
    missing.forEach((it) => {
      max += 1;
      it.code = formatCode(profile, max);
    });
    counters[profile] = max;
  });

  planner.counters = counters;
  return planner;
};

export const defaultItem = () => ({
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
  pilar: '',
  banco: false,
  storyMode: 'aovivo',
  time: '',
  editor: 'allyson',
  recordingDate: '',
  postDate: '',
  status: 'gravar',
  initialStage: 'gravar',
  repostOfId: '',
  repostOfCode: '',
  repostOfObjective: '',
  forAllBrokers: false,
  brokersPostLink: '',
  brokersNote: 'Enviar no grupo da equipe',
  responsavel: '',
  casaId: '',
  observacao: ''
});

export const createPlanner = (currentWeekKey = getWeekKey()) => ({
  version: 5,
  currentWeekKey,
  counters: emptyCounters(),
  dayPilars: emptyDayPilars(),
  gavetas: [],
  people: [],
  casas: [],
  gravacoes: [],
  weeks: {
    [currentWeekKey]: emptyWeekData()
  }
});

// Normaliza a lista de gavetas (grupos por imóvel com itens de material editado).
export const normalizeGavetas = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.map((g) => ({
    id: g.id || newId(),
    name: g.name || 'Sem nome',
    code: g.code || '',
    items: Array.isArray(g.items) ? g.items.map((it) => ({
      id: it.id || newId(),
      type: it.type || 'Pasta',
      title: it.title || '',
      link: normalizeUrl(it.link || ''),
      linkLabel: it.linkLabel || 'Ver materiais',
      legenda: it.legenda || ''
    })) : []
  }));
};

// Normaliza a lista de casas (imóveis com código, nome, link do site,
// descrição e a marca de "Lançamento OPA").
export const normalizeCasas = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => ({
    id: c.id || newId(),
    code: c.code || '',
    name: c.name || 'Sem nome',
    siteLink: normalizeUrl(c.siteLink || ''),
    description: c.description || '',
    // Casas cadastradas antes deste campo existir voltam como false.
    lancamentoOpa: Boolean(c.lancamentoOpa)
  }));
};

// Normaliza a lista de gravações do Marco — a aba "Marco" é uma lista simples,
// independente do cronograma: título, roteiro do vídeo, link de upload e um
// check de concluído.
export const normalizeGravacoes = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.map((g) => ({
    id: g.id || newId(),
    title: g.title || '',
    script: g.script || '',
    uploadLink: normalizeUrl(g.uploadLink || ''),
    done: Boolean(g.done)
  }));
};

// Normaliza a lista de responsáveis (nome + foto em data URL).
export const normalizePeople = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => ({
    id: p.id || newId(),
    name: p.name || 'Responsável',
    photo: p.photo || ''
  }));
};

export const normalizeUrl = (value) => {
  if (!value || !value.trim()) return '';
  return value.startsWith('http') ? value : `https://${value}`;
};

export const normalizeItem = (item = {}, tabKey = 'gravar', forcedContentType, weekKeyStr, fallbackDayId) => {
  const norm = {
    id: item.id || newId(),
    code: item.code || '',
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
    pilar: item.pilar || '',
    banco: Boolean(item.banco),
    storyMode: item.storyMode || 'aovivo',
    time: item.time || '',
    completed: Boolean(item.completed),
    tabKey,
    repostOfId: item.repostOfId || '',
    repostOfCode: item.repostOfCode || '',
    repostOfObjective: item.repostOfObjective || '',
    forAllBrokers: Boolean(item.forAllBrokers),
    brokersPostLink: item.brokersPostLink || '',
    brokersNote: item.brokersNote || '',
    responsavel: item.responsavel || '',
    casaId: item.casaId || '',
    observacao: item.observacao || '',
    _gravarOrigin: item._gravarOrigin || null,
    _editarOrigin: item._editarOrigin || null
  };

  // Itens sem data são intencionais — não auto-preenche.
  // Quem está no banco fica sem data; quem foi criado/editado com o campo
  // apagado também. A UI lida com data vazia mostrando "Sem data" / seção Banco.
  norm.recordingDate = item.recordingDate || '';
  norm.postDate = item.postDate || '';

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

    return backfillCodes({
      version: 5,
      currentWeekKey: cloudData.currentWeekKey || currentWeekKey,
      counters: cloudData.counters || emptyCounters(),
      dayPilars: normalizeDayPilars(cloudData.dayPilars),
      gavetas: normalizeGavetas(cloudData.gavetas),
      people: normalizePeople(cloudData.people),
      casas: normalizeCasas(cloudData.casas),
      gravacoes: normalizeGravacoes(cloudData.gravacoes),
      weeks: Object.keys(weeks).length ? weeks : { [currentWeekKey]: emptyWeekData() }
    });
  }

  if (cloudData.segunda && !cloudData.gravar) {
    return backfillCodes({
      version: 5,
      currentWeekKey,
      counters: emptyCounters(),
      dayPilars: emptyDayPilars(),
      gavetas: normalizeGavetas(cloudData.gavetas),
      people: normalizePeople(cloudData.people),
      casas: normalizeCasas(cloudData.casas),
      gravacoes: normalizeGravacoes(cloudData.gravacoes),
      weeks: {
        [currentWeekKey]: mergeLegacyStoriesIntoGravar({
          gravar: cloudData,
          postar: emptyTabData()
        }, currentWeekKey)
      }
    });
  }

  return backfillCodes({
    version: 5,
    currentWeekKey,
    counters: emptyCounters(),
    dayPilars: normalizeDayPilars(cloudData.dayPilars),
    gavetas: normalizeGavetas(cloudData.gavetas),
    people: normalizePeople(cloudData.people),
    casas: normalizeCasas(cloudData.casas),
    weeks: {
      [currentWeekKey]: mergeLegacyStoriesIntoGravar(cloudData, currentWeekKey)
    }
  });
};

export const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};
