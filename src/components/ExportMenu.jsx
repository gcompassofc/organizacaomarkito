import React, { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { MONTH_NAMES, toDateKey } from '../lib/dates';
import { IconButton } from './ui/IconButton';
import { Button } from './ui/Button';
import { Input, Field } from './ui/Input';
import { text } from '../lib/ui';

export const ExportMenu = ({ onExport, onWipe }) => {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setConfirmWipe(false); } };
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); setConfirmWipe(false); } };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const today = new Date();
  const monthLabel = `${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;

  const exportAll = () => { onExport({}); setOpen(false); };
  const exportThisMonth = () => {
    const y = today.getFullYear();
    const m = today.getMonth();
    onExport({
      from: toDateKey(new Date(y, m, 1)),
      to: toDateKey(new Date(y, m + 1, 0))
    });
    setOpen(false);
  };
  const exportRange = () => {
    if (!from && !to) return;
    onExport({ from: from || undefined, to: to || undefined });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <IconButton
        icon={Download}
        label="Exportar"
        tone="neutral"
        size="md"
        onClick={() => setOpen(o => !o)}
        className={open ? 'bg-slate-100 text-slate-700' : ''}
      />

      {open && (
        <div className="absolute top-full right-0 mt-2 z-30 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-900/10 p-2">
          <button
            onClick={exportAll}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors"
          >
            <span className="text-sm font-semibold text-slate-700">Tudo</span>
            <span className={`${text.microMeta} text-slate-400`}>todos os itens</span>
          </button>
          <button
            onClick={exportThisMonth}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors"
          >
            <span className="text-sm font-semibold text-slate-700">Este mês</span>
            <span className={`${text.microMeta} text-slate-400`}>{monthLabel}</span>
          </button>

          <div className="border-t border-slate-100 mt-1 pt-3 px-3 pb-2">
            <p className={`${text.microMeta} text-slate-400 mb-3`}>
              Período personalizado
            </p>
            <div className="space-y-3">
              <Field label="De">
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </Field>
              <Field label="Até">
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </Field>
              <Button
                variant="primary"
                size="sm"
                onClick={exportRange}
                disabled={!from && !to}
                className="w-full"
              >
                Baixar período
              </Button>
            </div>
          </div>

          {onWipe && (
            <div className="border-t border-rose-100 mt-1 pt-3 px-3 pb-2">
              <p className={`${text.microMeta} text-rose-400 mb-2`}>
                Zona perigosa
              </p>
              {!confirmWipe ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmWipe(true)}
                  className="w-full border-rose-100 text-rose-600 hover:bg-rose-50"
                >
                  Apagar todos os conteúdos
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-rose-700 leading-snug px-1 font-normal">
                    Isso apaga TUDO de todas as semanas e não tem volta.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setConfirmWipe(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => { onWipe(); setConfirmWipe(false); setOpen(false); }}
                      className="flex-1"
                    >
                      Sim, apagar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
