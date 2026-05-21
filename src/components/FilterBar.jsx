import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const PROFILES = [
  { id: 'todos', label: 'Todos', dot: 'bg-slate-300' },
  { id: 'marco', label: 'Marco', dot: 'bg-emerald-500' },
  { id: 'opa',   label: 'OPA',   dot: 'bg-blue-500' }
];

const EDITORS = [
  { id: 'todos',      label: 'Todos',      dot: 'bg-slate-300' },
  { id: 'indefinido', label: 'Indefinido', dot: 'bg-slate-400' },
  { id: 'allyson',    label: 'Allyson',    dot: 'bg-amber-500' },
  { id: 'kallyl',     label: 'Kallyl',     dot: 'bg-amber-500' },
  { id: 'natalia',    label: 'Natalia',    dot: 'bg-amber-500' },
  { id: 'torres',     label: 'Torres',     dot: 'bg-violet-500', tag: 'Externo' }
];

const accent = (id, opts) => {
  if (id === 'todos') return 'text-slate-500';
  const opt = opts.find(o => o.id === id);
  if (!opt) return 'text-slate-500';
  if (opt.dot.includes('emerald')) return 'text-emerald-700';
  if (opt.dot.includes('blue'))    return 'text-blue-700';
  if (opt.dot.includes('amber'))   return 'text-amber-700';
  if (opt.dot.includes('violet'))  return 'text-violet-700';
  return 'text-slate-500';
};

const Popover = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = options.find(o => o.id === value) || options[0];
  const isActive = value !== 'todos';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`group inline-flex items-center gap-2 pl-3 pr-2.5 h-9 rounded-full border transition-colors ${isActive ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}
      >
        <span className={`w-2 h-2 rounded-full ${current.dot}`} />
        <span className="inline-flex items-baseline gap-1.5">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">{label}</span>
          <span className={`text-xs font-semibold ${accent(value, options)}`}>{current.label}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={3} />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-30 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-900/10 p-1.5">
          {options.map(opt => {
            const selected = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors ${selected ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
              >
                <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                <span className={`flex-1 text-sm font-medium ${selected ? accent(opt.id, options) : 'text-slate-700'}`}>
                  {opt.label}
                </span>
                {opt.tag && (
                  <span className="text-[9px] font-semibold tracking-wider uppercase text-violet-500">{opt.tag}</span>
                )}
                {selected && <Check className="w-3.5 h-3.5 text-slate-500" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const FilterBar = ({
  visible = true,
  showEditor = false,
  profileFilter,
  onProfileChange,
  editorFilter,
  onEditorChange,
  inline = false
}) => {
  if (!visible) return null;

  return (
    <div className={inline ? 'inline-flex items-center gap-2' : 'mb-8 flex items-center justify-center gap-3'}>
      <Popover
        label="Perfil"
        value={profileFilter}
        options={PROFILES}
        onChange={onProfileChange}
      />
      {showEditor && (
        <Popover
          label="Edita"
          value={editorFilter}
          options={EDITORS}
          onChange={onEditorChange}
        />
      )}
    </div>
  );
};
