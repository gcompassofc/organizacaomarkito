import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

export const WeekNavigator = ({ onPrev, onNext, onToday }) => (
  <div className="flex items-center text-slate-400">
    <IconButton icon={ChevronLeft} label="Semana anterior" size="sm" tone="neutral" onClick={onPrev} />
    <button
      onClick={onToday}
      className="px-2 text-[10px] font-semibold tracking-wider uppercase text-slate-400 hover:text-blue-600 transition-colors"
    >
      Hoje
    </button>
    <IconButton icon={ChevronRight} label="Próxima semana" size="sm" tone="neutral" onClick={onNext} />
  </div>
);
