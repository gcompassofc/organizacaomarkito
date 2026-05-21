import React from 'react';

const tones = {
  neutral: 'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
  danger:  'text-slate-300 hover:text-rose-600 hover:bg-rose-50',
  brand:   'text-slate-400 hover:text-blue-600 hover:bg-blue-50',
  ghost:   'text-slate-300 hover:text-slate-500'
};

const sizes = {
  sm: { wrap: 'p-1',   icon: 'w-3.5 h-3.5' },
  md: { wrap: 'p-1.5', icon: 'w-4 h-4' },
  lg: { wrap: 'p-2',   icon: 'w-5 h-5' }
};

export const IconButton = React.forwardRef(({
  icon: Icon,
  label,
  tone = 'neutral',
  size = 'md',
  className = '',
  strokeWidth = 2.5,
  ...rest
}, ref) => {
  const s = sizes[size];
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${tones[tone]} ${s.wrap} ${className}`}
      {...rest}
    >
      {Icon && <Icon className={s.icon} strokeWidth={strokeWidth} />}
    </button>
  );
});
IconButton.displayName = 'IconButton';
