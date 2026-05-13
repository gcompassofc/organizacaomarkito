export const tabConfig = {
  gravar: {
    label: 'Gravar',
    accent: 'blue',
    titleLabel: 'Titulo',
    titlePlaceholder: 'QUAL CONTEUDO VAMOS GRAVAR?',
    summaryLabel: 'Roteiro',
    summaryPlaceholder: 'GANCHO, PROMESSA, TOPICOS E FECHAMENTO',
    primaryLinkLabel: 'Suba o video aqui',
    secondaryLinkLabel: 'Link do conteudo completo'
  },
  editar: {
    label: 'Editar',
    accent: 'amber',
    titleLabel: 'Titulo',
    titlePlaceholder: 'QUAL CONTEUDO VAMOS EDITAR?',
    primaryLinkLabel: 'Suba o video aqui',
    secondaryLinkLabel: 'Arquivo editado'
  },
  postar: {
    label: 'Postar',
    accent: 'emerald',
    titleLabel: 'Nome do post',
    titlePlaceholder: 'QUAL POST VAI AO AR?',
    primaryLinkLabel: 'Arquivo editado',
    secondaryLinkLabel: 'Pasta completa'
  }
};

export const getRecordingTag = (value) => (value === 'com_alguem' ? 'Dois' : 'Sozinho');

export const getContentTypeTag = (value) => {
  if (value === 'stories') return 'Stories';
  if (value === 'estatico') return 'Estático';
  if (value === 'carrossel') return 'Carrossel';
  if (value === 'youtube' || value === 'video_longo') return 'YouTube';
  return 'Vídeo Curto';
};

export const getContentTypeBadgeClass = (value, fallback) => {
  if (value === 'youtube' || value === 'video_longo') return 'bg-red-100 text-red-700';
  return fallback;
};

export const getProfileTag = (value) => {
  if (value === 'marco') return 'Marco';
  if (value === 'collab') return 'Collab';
  return 'OPA';
};

export const getProfileBadgeClass = (value) => {
  if (value === 'collab') return 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white';
  if (value === 'marco') return 'bg-emerald-100 text-emerald-700';
  return 'bg-blue-100 text-blue-700';
};

export const profileMatchesFilter = (itemProfile, filter) => {
  if (filter === 'todos') return true;
  const p = itemProfile || 'opa';
  if (p === filter) return true;
  if (p === 'collab' && (filter === 'marco' || filter === 'opa')) return true;
  return false;
};
