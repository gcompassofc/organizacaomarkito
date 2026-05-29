import { PILARES, pilaresForProfile } from './tags';

// ─────────────────────────────────────────────────────────────────────────────
// Importação em massa por texto.
//
// Formato esperado: blocos separados por linha em branco ou por uma linha "---".
// Cada bloco é um conjunto de linhas "Rótulo: valor". A ordem dos campos é livre
// e campos ausentes usam o padrão. O parser é tolerante a acentos, maiúsculas e
// sinônimos comuns.
// ─────────────────────────────────────────────────────────────────────────────

const stripAccents = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '');

const norm = (s) =>
  stripAccents(String(s || '').trim().toLowerCase());

// Rótulos aceitos para cada campo interno → lista de sinônimos (normalizados).
const FIELD_ALIASES = {
  objective: ['titulo', 'title', 'nome', 'nome do post', 'post', 'conteudo'],
  summary: ['roteiro', 'resumo', 'descricao', 'script'],
  contentType: ['tipo', 'formato', 'tipo de conteudo'],
  profile: ['perfil', 'conta', 'pagina'],
  recordingType: ['participacao', 'gravacao', 'quem grava'],
  pilar: ['pilar', 'pilar de conteudo', 'categoria'],
  editor: ['editor', 'responsavel', 'responsavel edicao', 'edita', 'quem edita'],
  recordingDate: ['data gravar', 'data de gravar', 'gravar em', 'dia gravar', 'data gravacao', 'gravar'],
  postDate: ['data postar', 'data de postar', 'postar em', 'dia postar', 'data', 'postar'],
  time: ['horario', 'hora', 'horario da postagem'],
  primaryLink: ['link bruto', 'link do video bruto', 'video bruto', 'link principal', 'link drive', 'link'],
  editedVideoLink: ['link editado', 'link do arquivo editado', 'arquivo editado', 'video editado', 'link secundario'],
  postCaption: ['legenda', 'legenda do post', 'caption'],
  firstComment: ['primeiro comentario', 'comentario', 'comentario fixado'],
  banco: ['banco', 'salvar no banco'],
  forAllBrokers: ['todos os corretores', 'para todos os corretores', 'corretores', 'replicar'],
  brokersPostLink: ['link da postagem', 'link corretores', 'link para corretores'],
  brokersNote: ['observacao', 'observacao para o grupo', 'obs', 'nota']
};

// Constrói índice reverso: rótulo normalizado → campo interno.
const LABEL_TO_FIELD = {};
Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
  aliases.forEach((a) => { LABEL_TO_FIELD[a] = field; });
});

// Valores aceitos para campos de seleção (normalizado → valor interno).
const CONTENT_TYPE_MAP = {
  'video curto': 'video_curto', 'video_curto': 'video_curto', 'video': 'video_curto', 'reels': 'video_curto', 'reel': 'video_curto',
  'youtube': 'youtube', 'video longo': 'youtube', 'video_longo': 'youtube', 'yt': 'youtube',
  'stories': 'stories', 'story': 'stories', 'storie': 'stories',
  'repost no stories': 'repost_stories', 'repost stories': 'repost_stories', 'repost': 'repost_stories', 'repost_stories': 'repost_stories',
  'estatico': 'estatico', 'post estatico': 'estatico', 'imagem': 'estatico', 'foto': 'estatico',
  'carrossel': 'carrossel', 'carousel': 'carrossel'
};

const PROFILE_MAP = {
  'opa': 'opa',
  'marco': 'marco',
  'collab': 'collab', 'collab (opa + marco)': 'collab', 'opa + marco': 'collab', 'colab': 'collab'
};

const RECORDING_MAP = {
  'sozinho': 'sozinho', 'so': 'sozinho', '1': 'sozinho', 'um': 'sozinho',
  'dois': 'com_alguem', 'com alguem': 'com_alguem', 'com_alguem': 'com_alguem', '2': 'com_alguem', 'acompanhado': 'com_alguem'
};

const EDITOR_MAP = {
  'indefinido': 'indefinido', '': 'indefinido', '-': 'indefinido',
  'allyson': 'allyson', 'ally': 'allyson',
  'kallyl': 'kallyl',
  'natalia': 'natalia',
  'torres': 'torres'
};

// Pilar: aceita o id ou o label (normalizado).
const PILAR_BY_NORM = {};
PILARES.forEach((p) => {
  PILAR_BY_NORM[norm(p.id)] = p.id;
  PILAR_BY_NORM[norm(p.label)] = p.id;
});

const BOOL_TRUE = new Set(['sim', 's', 'true', '1', 'x', 'yes', 'y']);
const BOOL_FALSE = new Set(['nao', 'n', 'false', '0', '', 'no']);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const BR_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;

// Aceita 2026-06-02 ou 02/06/2026 → devolve ISO ou null.
const parseDate = (raw) => {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (ISO_DATE.test(v)) return v;
  const m = v.match(BR_DATE);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = `20${y}`;
    const dd = d.padStart(2, '0');
    const mm = mo.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
  return null; // formato não reconhecido
};

const parseBool = (raw) => {
  const v = norm(raw);
  if (BOOL_TRUE.has(v)) return true;
  if (BOOL_FALSE.has(v)) return false;
  return null;
};

// Quebra o texto em blocos. Separadores: linha "---" (ou mais) ou linha em branco.
const splitBlocks = (text) => {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let current = [];
  let startLine = 1;

  const flush = (endLine) => {
    if (current.some((l) => l.trim() !== '')) {
      blocks.push({ lines: current.slice(), startLine });
    }
    current = [];
    startLine = endLine + 1;
  };

  lines.forEach((line, idx) => {
    const isSep = /^\s*-{3,}\s*$/.test(line);
    const isBlank = line.trim() === '';
    if (isSep || isBlank) {
      flush(idx + 1);
    } else {
      if (current.length === 0) startLine = idx + 1;
      current.push(line);
    }
  });
  flush(lines.length);

  return blocks;
};

// Faz o parse de UM bloco em um objeto de campos crus { field: valorTexto }.
const parseBlockFields = (block) => {
  const fields = {};
  const unknownLabels = [];
  let lastField = null;

  block.lines.forEach((line) => {
    const colon = line.indexOf(':');
    if (colon === -1) {
      // Linha sem ":" — continuação do campo anterior (ex: legenda multilinha).
      if (lastField && fields[lastField] !== undefined) {
        fields[lastField] += `\n${line.trim()}`;
      }
      return;
    }
    const label = norm(line.slice(0, colon));
    const value = line.slice(colon + 1).trim();
    const field = LABEL_TO_FIELD[label];
    if (!field) {
      unknownLabels.push(line.slice(0, colon).trim());
      lastField = null;
      return;
    }
    fields[field] = value;
    lastField = field;
  });

  return { fields, unknownLabels };
};

// Valida e converte os campos crus em um item pronto + erros/avisos.
const buildItem = (raw, defaults) => {
  const errors = [];
  const warnings = [];
  const item = { ...defaults() };

  // Título — obrigatório.
  const objective = (raw.objective || '').trim();
  if (!objective) {
    errors.push('Sem título — toda postagem precisa de um título.');
  }
  item.objective = objective;

  if (raw.summary !== undefined) item.summary = raw.summary;

  // Tipo.
  if (raw.contentType !== undefined && raw.contentType !== '') {
    const mapped = CONTENT_TYPE_MAP[norm(raw.contentType)];
    if (!mapped) {
      errors.push(`Tipo inválido: "${raw.contentType}". Use: vídeo curto, youtube, stories, repost no stories, estático ou carrossel.`);
    } else {
      item.contentType = mapped;
    }
  }

  // Perfil.
  if (raw.profile !== undefined && raw.profile !== '') {
    const mapped = PROFILE_MAP[norm(raw.profile)];
    if (!mapped) {
      errors.push(`Perfil inválido: "${raw.profile}". Use: OPA, Marco ou Collab.`);
    } else {
      item.profile = mapped;
    }
  }

  // Participação.
  if (raw.recordingType !== undefined && raw.recordingType !== '') {
    const mapped = RECORDING_MAP[norm(raw.recordingType)];
    if (!mapped) {
      warnings.push(`Participação não reconhecida: "${raw.recordingType}". Assumindo "Sozinho".`);
    } else {
      item.recordingType = mapped;
    }
  }

  // Pilar — precisa existir E ser compatível com o perfil.
  if (raw.pilar !== undefined && raw.pilar !== '') {
    const mapped = PILAR_BY_NORM[norm(raw.pilar)];
    if (!mapped) {
      errors.push(`Pilar inválido: "${raw.pilar}".`);
    } else {
      const allowed = pilaresForProfile(item.profile).map((p) => p.id);
      if (!allowed.includes(mapped)) {
        warnings.push(`Pilar "${raw.pilar}" não pertence ao perfil ${item.profile.toUpperCase()} — pilar ignorado.`);
      } else {
        item.pilar = mapped;
      }
    }
  }

  // Editor.
  if (raw.editor !== undefined && raw.editor !== '') {
    const mapped = EDITOR_MAP[norm(raw.editor)];
    if (!mapped) {
      warnings.push(`Editor não reconhecido: "${raw.editor}". Assumindo "Indefinido".`);
      item.editor = 'indefinido';
    } else {
      item.editor = mapped;
    }
  }

  // Datas.
  if (raw.recordingDate !== undefined && raw.recordingDate !== '') {
    const d = parseDate(raw.recordingDate);
    if (d === null) errors.push(`Data de gravar inválida: "${raw.recordingDate}". Use AAAA-MM-DD ou DD/MM/AAAA.`);
    else item.recordingDate = d;
  }
  if (raw.postDate !== undefined && raw.postDate !== '') {
    const d = parseDate(raw.postDate);
    if (d === null) errors.push(`Data de postar inválida: "${raw.postDate}". Use AAAA-MM-DD ou DD/MM/AAAA.`);
    else item.postDate = d;
  }

  if (raw.time !== undefined) item.time = raw.time;
  if (raw.primaryLink !== undefined) item.primaryLink = raw.primaryLink;
  if (raw.editedVideoLink !== undefined) item.editedVideoLink = raw.editedVideoLink;
  if (raw.postCaption !== undefined) item.postCaption = raw.postCaption;
  if (raw.firstComment !== undefined) item.firstComment = raw.firstComment;

  // Banco.
  if (raw.banco !== undefined && raw.banco !== '') {
    const b = parseBool(raw.banco);
    if (b === null) warnings.push(`Valor de "banco" não reconhecido: "${raw.banco}".`);
    else item.banco = b;
  }
  if (item.banco) {
    item.recordingDate = '';
    item.postDate = '';
  }

  // Para todos os corretores.
  if (raw.forAllBrokers !== undefined && raw.forAllBrokers !== '') {
    const b = parseBool(raw.forAllBrokers);
    if (b === null) warnings.push(`Valor de "todos os corretores" não reconhecido: "${raw.forAllBrokers}".`);
    else item.forAllBrokers = b;
  }
  if (raw.brokersPostLink !== undefined) item.brokersPostLink = raw.brokersPostLink;
  if (raw.brokersNote !== undefined) item.brokersNote = raw.brokersNote;
  if (item.forAllBrokers && !item.brokersNote) item.brokersNote = 'Enviar no grupo da equipe';

  return { item, errors, warnings };
};

// API principal: recebe o texto e a fábrica de item padrão, devolve a análise.
export const parseBulkText = (text, defaults) => {
  const blocks = splitBlocks(text);
  const entries = blocks.map((block, idx) => {
    const { fields, unknownLabels } = parseBlockFields(block);
    const { item, errors, warnings } = buildItem(fields, defaults);
    const allWarnings = [...warnings];
    unknownLabels.forEach((l) => allWarnings.push(`Campo desconhecido ignorado: "${l}".`));
    return {
      index: idx + 1,
      startLine: block.startLine,
      item,
      errors,
      warnings: allWarnings,
      valid: errors.length === 0
    };
  });

  return {
    entries,
    total: entries.length,
    validCount: entries.filter((e) => e.valid).length,
    errorCount: entries.filter((e) => !e.valid).length
  };
};
