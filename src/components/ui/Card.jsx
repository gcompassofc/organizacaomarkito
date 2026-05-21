import React from 'react';
import { radius as r, space } from '../../lib/ui';

const tones = {
  default:   'bg-white border border-slate-100 shadow-sm',
  highlight: 'bg-white border border-blue-100 shadow-md',
  muted:     'bg-slate-50/50 border border-slate-100',
  warning:   'bg-amber-50/40 border-2 border-dashed border-amber-300',
  danger:    'bg-rose-50/40 border border-rose-300'
};

const paddings = {
  none: '',
  sm:   'p-3',
  md:   space.card,
  lg:   space.cardBig
};

const radii = {
  card: r.card,
  big:  r.big,
  preview: r.preview
};

export const Card = ({
  tone = 'default',
  padding = 'md',
  radius = 'card',
  className = '',
  children,
  ...rest
}) => (
  <div
    className={`${tones[tone]} ${paddings[padding]} ${radii[radius]} ${className}`}
    {...rest}
  >
    {children}
  </div>
);
