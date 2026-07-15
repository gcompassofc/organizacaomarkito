import React from 'react';
import { motion } from 'motion/react';
import { CalendarDays, Archive, Table2 } from 'lucide-react';

const TABS = [
  { id: 'cronograma', label: 'Cronograma', Icon: CalendarDays, color: '#2E6DE0', textActive: 'text-blue-600' },
  { id: 'gavetas',    label: 'Gavetas',    Icon: Archive,      color: '#3B5578', textActive: 'text-slate-700' },
  { id: 'planilha',   label: 'Planilha',   Icon: Table2,       color: '#1f2937', textActive: 'text-slate-800' }
];

export const MobileBottomNav = ({ activeView, onChangeView }) => (
  <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40 pb-safe">
    <div className="flex items-center justify-around h-16">
      {TABS.map(t => {
        const Icon = t.Icon;
        const active = activeView === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChangeView(t.id)}
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

// Largura de cada pílula (px) e padding lateral do trilho. O indicador animado
// é posicionado pelo índice da aba ativa — funciona para qualquer quantidade.
const PILL_W = 124;
const PAD = 8;

export const FloatingDesktopNav = ({ activeView, onChangeView }) => {
  const activeIndex = Math.max(0, TABS.findIndex(t => t.id === activeView));
  return (
    <nav className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-white/95 backdrop-blur border border-slate-100 shadow-xl shadow-slate-900/10 rounded-full px-2 py-2 flex items-center relative">
        <motion.div
          className="absolute top-2 bottom-2 rounded-full"
          initial={false}
          animate={{
            left: `${PAD + activeIndex * PILL_W}px`,
            width: `${PILL_W}px`,
            backgroundColor: TABS[activeIndex]?.color || '#2E6DE0'
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
        {TABS.map(t => {
          const active = activeView === t.id;
          const Icon = t.Icon;
          return (
            <button
              key={t.id}
              onClick={() => onChangeView(t.id)}
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
