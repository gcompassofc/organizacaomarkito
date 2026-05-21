import React, { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { MONTH_NAMES, toDateKey } from '../lib/dates';

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
      <button
        onClick={() => setOpen(o => !o)}
        className={`p-2 hover:bg-slate-50 rounded-lg transition-colors ${open ? 'text-slate-700 bg-slate-50' : 'text-slate-300 hover:text-slate-700'}`}
        title="Exportar CSV"
      >
        <Download className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-30 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-900/10 p-2">
          <button
            onClick={exportAll}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors"
          >
            <span className="text-[11px] font-black uppercase text-slate-700">Tudo</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">todos os itens</span>
          </button>
          <button
            onClick={exportThisMonth}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors"
          >
            <span className="text-[11px] font-black uppercase text-slate-700">Este mês</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">{monthLabel}</span>
          </button>

          <div className="border-t border-slate-100 mt-1 pt-3 px-3 pb-2">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">
              Período personalizado
            </p>
            <div className="space-y-2.5">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1.5">De</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-300 transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1.5">Até</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-300 transition-colors"
                />
              </div>
              <button
                onClick={exportRange}
                disabled={!from && !to}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase py-2 rounded-lg transition-colors disabled:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400 tracking-wider"
              >
                Baixar período
              </button>
            </div>
          </div>

          {onWipe && (
            <div className="border-t border-rose-100 mt-1 pt-3 px-3 pb-2">
              <p className="text-[9px] font-black uppercase text-rose-400 tracking-widest mb-2">
                Zona perigosa
              </p>
              {!confirmWipe ? (
                <button
                  onClick={() => setConfirmWipe(true)}
                  className="w-full text-[10px] font-black uppercase text-rose-600 hover:bg-rose-50 py-2 rounded-lg border border-rose-100 transition-colors tracking-wider"
                >
                  Apagar todos os conteúdos
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-rose-700 leading-snug px-1">
                    Isso apaga TUDO de todas as semanas e não tem volta.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmWipe(false)}
                      className="flex-1 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 py-2 rounded-lg border border-slate-200 tracking-wider transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => { onWipe(); setConfirmWipe(false); setOpen(false); }}
                      className="flex-1 text-[10px] font-black uppercase bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg tracking-wider transition-colors"
                    >
                      Sim, apagar
                    </button>
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
