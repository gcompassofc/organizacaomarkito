import React from 'react';
import { text } from '../../lib/ui';

export const SectionHeader = ({ title, subtitle, meta, actions, className = '' }) => (
  <header className={`flex items-start justify-between gap-4 ${className}`}>
    <div className="min-w-0 flex-1">
      <h2 className={`${text.h2} text-slate-900`}>{title}</h2>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">{subtitle}</p>
      )}
      {meta && <div className="mt-2">{meta}</div>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </header>
);

export const SectionDivider = ({ title, className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <span className={`${text.microMeta} text-slate-400`}>{title}</span>
    <span className="flex-1 h-px bg-slate-100" />
  </div>
);
