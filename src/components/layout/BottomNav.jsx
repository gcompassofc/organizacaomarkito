import React from 'react';
import { motion } from 'motion/react';
import { Video, Scissors, Calendar, CalendarDays } from 'lucide-react';

const TABS = [
  { id: 'gravar',     label: 'Gravar',     Icon: Video,        color: '#2563eb', textActive: 'text-blue-600' },
  { id: 'editar',     label: 'Editar',     Icon: Scissors,     color: '#f59e0b', textActive: 'text-amber-600' },
  { id: 'postar',     label: 'Postar',     Icon: Calendar,     color: '#059669', textActive: 'text-emerald-600' },
  { id: 'cronograma', label: 'Cronograma', Icon: CalendarDays, color: '#0d4a87', textActive: 'text-sky-700' }
];

export const MobileBottomNav = ({ activeTab, showPlanilha, onChangeTab }) => (
  <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40 pb-safe">
    <div className="flex items-center justify-around h-16">
      {TABS.map(t => {
        const Icon = t.Icon;
        const active = activeTab === t.id && !showPlanilha;
        return (
          <button
            key={t.id}
            onClick={() => onChangeTab(t.id)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${active ? t.textActive : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Icon className="w-5 h-5" strokeWidth={2.25} />
            <span className="text-[10px] font-semibold tracking-wider uppercase">{t.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

// Largura de cada pílula (px) e do padding lateral do trilho. O indicador
// animado é posicionado pelo índice da aba ativa, então funciona para
// qualquer quantidade de abas sem posições mágicas.
const PILL_W = 116;
const PAD = 8;

export const FloatingDesktopNav = ({ activeTab, onChangeTab }) => {
  const activeIndex = Math.max(0, TABS.findIndex(t => t.id === activeTab));
  return (
    <nav className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-white/95 backdrop-blur border border-slate-100 shadow-xl shadow-slate-900/10 rounded-full px-2 py-2 flex items-center relative">
        <motion.div
          className="absolute top-2 bottom-2 rounded-full"
          initial={false}
          animate={{
            left: `${PAD + activeIndex * PILL_W}px`,
            width: `${PILL_W}px`,
            backgroundColor: TABS[activeIndex]?.color || '#2563eb'
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
        {TABS.map(t => {
          const active = activeTab === t.id;
          const Icon = t.Icon;
          return (
            <button
              key={t.id}
              onClick={() => onChangeTab(t.id)}
              style={{ width: `${PILL_W}px` }}
              className="relative h-10 flex items-center justify-center gap-2 text-xs font-semibold tracking-wider uppercase"
            >
              <motion.span animate={{ color: active ? '#ffffff' : '#94a3b8' }} className="flex items-center gap-2">
                <Icon className="w-4 h-4" strokeWidth={2.25} />
                {t.label}
              </motion.span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
