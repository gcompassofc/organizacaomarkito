import React from 'react';

const variants = {
  primary:   'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20',
  secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
  ghost:     'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
  danger:    'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20',
  dark:      'bg-slate-900 hover:bg-slate-800 text-white',
  accent:    'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20'
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2'
};

export const Button = React.forwardRef(({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  children,
  type = 'button',
  ...rest
}, ref) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {Icon && iconPosition === 'left' && <Icon className={iconSize} strokeWidth={2.5} />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className={iconSize} strokeWidth={2.5} />}
    </button>
  );
});
Button.displayName = 'Button';
