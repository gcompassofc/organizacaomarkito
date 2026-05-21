import React from 'react';
import { badge as badgeTone, text } from '../../lib/ui';

const sizes = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1',
  md: 'px-2 py-0.5 text-[11px] gap-1.5'
};

export const Badge = ({
  tone = 'neutral',
  size = 'md',
  icon: Icon,
  dot = false,
  dotClass,
  className = '',
  children
}) => {
  const toneClass = badgeTone[tone] || badgeTone.neutral;
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  return (
    <span
      className={`inline-flex items-center font-semibold tracking-wider uppercase leading-none rounded ${toneClass} ${sizes[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotClass || 'bg-current opacity-70'}`} />}
      {Icon && <Icon className={iconSize} />}
      {children}
    </span>
  );
};
