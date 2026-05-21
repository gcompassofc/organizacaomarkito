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

export const PILARES = [
  { id: 'lifestyle', label: 'Lifestyle', profiles: ['marco'] },
  { id: 'mercado', label: 'Sobre o Mercado', profiles: ['marco', 'opa'] },
  { id: 'opiniao', label: 'Opinião Forte', profiles: ['marco'] },
  { id: 'casas', label: 'Casas', profiles: ['marco'] },
  { id: 'sobre_opa', label: 'Sobre a OPA', profiles: ['opa'] },
  { id: 'imoveis_abertos', label: 'Imóveis Abertos', profiles: ['opa'] },
  { id: 'datas_sazonais', label: 'Datas Sazonais & Eventos', profiles: ['opa'] },
  { id: 'collabs_corretores', label: 'Collabs com Corretores', profiles: ['opa'] },
  { id: 'lancamentos', label: 'Lançamentos de Imóveis', profiles: ['opa'] }
];

export const pilaresForProfile = (profile) => {
  if (!profile || profile === 'collab') return PILARES;
  return PILARES.filter(p => p.profiles.includes(profile));
};

export const getPilarLabel = (id) => PILARES.find(p => p.id === id)?.label || '';

export const getPilarBadgeClass = (id) => {
  const map = {
    lifestyle: 'bg-rose-50 text-rose-700',
    mercado: 'bg-slate-100 text-slate-700',
    opiniao: 'bg-orange-50 text-orange-700',
    casas: 'bg-emerald-50 text-emerald-700',
    sobre_opa: 'bg-indigo-50 text-indigo-700',
    imoveis_abertos: 'bg-cyan-50 text-cyan-700',
    datas_sazonais: 'bg-amber-50 text-amber-700',
    collabs_corretores: 'bg-violet-50 text-violet-700',
    lancamentos: 'bg-blue-50 text-blue-700'
  };
  return map[id] || 'bg-slate-100 text-slate-500';
};
