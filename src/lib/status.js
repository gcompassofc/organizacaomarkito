export const STATUS_META = {
  para_gravar:     { label: 'Para gravar',      dot: 'bg-blue-500',    chip: 'bg-blue-100 text-blue-700' },
  gravado:         { label: 'Gravado',          dot: 'bg-cyan-500',    chip: 'bg-cyan-100 text-cyan-700' },
  em_edicao:       { label: 'Em edição',        dot: 'bg-amber-500',   chip: 'bg-amber-100 text-amber-700' },
  pronto_postar:   { label: 'Pronto p/ postar', dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700' },
  postado:         { label: 'Postado',          dot: 'bg-green-700',   chip: 'bg-green-200 text-green-900' },
  atrasado_gravar: { label: 'Atrasado: gravar', dot: 'bg-rose-600',    chip: 'bg-rose-100 text-rose-700' },
  atrasado_editar: { label: 'Atrasado: editar', dot: 'bg-rose-600',    chip: 'bg-rose-100 text-rose-700' },
  atrasado_postar: { label: 'Atrasado: postar', dot: 'bg-rose-600',    chip: 'bg-rose-100 text-rose-700' }
};

export const KANBAN_COLUMNS = [
  { id: 'atrasado',      label: 'Atrasados',        accent: 'border-rose-400 bg-rose-50/40' },
  { id: 'para_gravar',   label: 'Para gravar',      accent: 'border-blue-200 bg-blue-50/40' },
  { id: 'em_edicao',     label: 'Em edição',        accent: 'border-amber-200 bg-amber-50/40' },
  { id: 'pronto_postar', label: 'Pronto p/ postar', accent: 'border-emerald-200 bg-emerald-50/40' },
  { id: 'postado',       label: 'Postado',          accent: 'border-green-300 bg-green-50/40' }
];

export const deriveStatus = (item, todayKey) => {
  const tab = item.tabKey || 'gravar';
  const completed = !!item.completed;
  if (tab === 'postar' && completed) return 'postado';
  if (tab === 'postar') return (item.postDate && item.postDate < todayKey) ? 'atrasado_postar' : 'pronto_postar';
  if (tab === 'editar') return (item.postDate && item.postDate < todayKey) ? 'atrasado_editar' : 'em_edicao';
  if (completed) return 'gravado';
  return (item.recordingDate && item.recordingDate < todayKey) ? 'atrasado_gravar' : 'para_gravar';
};

export const statusToKanbanColumn = (status) => {
  if (status.startsWith('atrasado_')) return 'atrasado';
  if (status === 'gravado') return 'em_edicao';
  return status;
};
