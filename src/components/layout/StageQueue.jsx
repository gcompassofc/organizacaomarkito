import React from 'react';
import { radius, text, emptyState } from '../../lib/ui';

export const StageQueue = ({ title, children }) => (
  <div className={`bg-white border border-slate-100 ${radius.big} p-5 md:p-8 shadow-sm`}>
    <h2 className={`${text.h1} text-slate-900 mb-6 text-center`}>{title}</h2>
    {children}
  </div>
);

export const QueueEmpty = ({ children = 'Nenhum conteúdo aqui' }) => (
  <div className={emptyState}>{children}</div>
);

export const QueueTabs = ({ value, onChange, options }) => (
  <div className="flex items-center justify-center mb-6">
    <div className="inline-flex items-center bg-slate-50 rounded-full p-1 text-[11px] font-semibold tracking-wider uppercase">
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-1.5 rounded-full transition-colors ${active ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);
