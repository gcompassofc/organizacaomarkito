// Tokens visuais centralizados.
// Strings literais para o scanner do Tailwind (NÃO use interpolação aqui).

// ============================================================================
// RADIUS
// ============================================================================
export const radius = {
  card: 'rounded-[20px]',
  big: 'rounded-[28px]',
  preview: 'rounded-[18px]',
  modal: 'rounded-[28px]',
  pill: 'rounded-full'
};

// ============================================================================
// TIPOGRAFIA — escala única
// Regra: só `meta`/`microMeta` são uppercase. Tudo mais é sentence case.
// ============================================================================
export const text = {
  display:   'text-3xl md:text-4xl font-bold tracking-tight leading-tight',
  h1:        'text-xl md:text-2xl font-semibold tracking-tight leading-snug',
  h2:        'text-base md:text-lg font-semibold leading-snug',
  h3:        'text-sm font-semibold leading-snug',
  body:      'text-sm font-normal leading-relaxed',
  bodyMedium:'text-sm font-medium leading-relaxed',
  bodySm:    'text-xs font-normal leading-relaxed',
  meta:      'text-[11px] font-semibold tracking-wider uppercase leading-none',
  microMeta: 'text-[10px] font-semibold tracking-wider uppercase leading-none',

  // Aliases legados (serão removidos no commit final, após migração completa).
  micro: 'text-[10px] font-semibold tracking-wider uppercase',
  badge: 'text-[11px] font-semibold tracking-wider uppercase',
  label: 'text-[10px] font-semibold tracking-wider uppercase',
  tab:   'text-[11px] font-semibold tracking-wider uppercase'
};

// ============================================================================
// CORES — paleta semântica enxuta (5 tons)
// brand=azul, accent=verde, warn=âmbar, danger=rosa, neutral=slate
// ============================================================================
export const badge = {
  brand:   'bg-blue-50 text-blue-700',
  accent:  'bg-emerald-50 text-emerald-700',
  warn:    'bg-amber-50 text-amber-700',
  danger:  'bg-rose-50 text-rose-700',
  neutral: 'bg-slate-100 text-slate-600',
  // tom forte usado em casos especiais (Torres editor externo)
  brandSolid:  'bg-blue-600 text-white',
  accentSolid: 'bg-emerald-600 text-white',
  warnSolid:   'bg-amber-500 text-white',
  dangerSolid: 'bg-rose-500 text-white',
  violet:      'bg-violet-600 text-white'
};

// Dots coloridos (para legendas/indicadores discretos).
export const dot = {
  brand:   'bg-blue-500',
  accent:  'bg-emerald-500',
  warn:    'bg-amber-500',
  danger:  'bg-rose-500',
  neutral: 'bg-slate-300',
  violet:  'bg-violet-500'
};

// ============================================================================
// SPACING — escala única (múltiplos de 4)
// 2=8px, 3=12px, 4=16px, 6=24px, 8=32px, 12=48px, 16=64px
// ============================================================================
export const space = {
  page:        'p-6 md:p-10',
  card:        'p-4 md:p-5',
  cardBig:     'p-5 md:p-6',
  modalHeader: 'px-6 py-5',
  modalBody:   'px-6 py-6',
  modalFooter: 'px-6 py-4',
  badge:       'px-2 py-0.5',
  stackLg:     'space-y-8',
  stackMd:     'space-y-6',
  stackSm:     'space-y-4',
  stackXs:     'space-y-3'
};

// ============================================================================
// ESTADOS
// ============================================================================
export const emptyState =
  'text-center py-12 text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 text-sm font-medium';
