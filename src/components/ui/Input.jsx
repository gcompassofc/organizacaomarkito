import React from 'react';

const baseField =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors';

export const Label = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
    {children}
  </label>
);

export const Hint = ({ children }) => (
  <p className="mt-1.5 text-xs text-slate-400 font-normal">{children}</p>
);

export const Field = ({ label, hint, htmlFor, children }) => (
  <div>
    {label && <Label htmlFor={htmlFor}>{label}</Label>}
    {children}
    {hint && <Hint>{hint}</Hint>}
  </div>
);

export const Input = React.forwardRef(({ className = '', size = 'md', ...rest }, ref) => {
  const sizeClass = size === 'lg' ? 'text-base' : 'text-sm';
  return <input ref={ref} className={`${baseField} ${sizeClass} ${className}`} {...rest} />;
});
Input.displayName = 'Input';

export const Textarea = React.forwardRef(({ className = '', rows = 3, ...rest }, ref) => (
  <textarea ref={ref} rows={rows} className={`${baseField} resize-none ${className}`} {...rest} />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef(({ className = '', children, ...rest }, ref) => (
  <select ref={ref} className={`${baseField} appearance-none cursor-pointer ${className}`} {...rest}>
    {children}
  </select>
));
Select.displayName = 'Select';
