import React from 'react';

export const PageFooter = ({ totalCount, completedCount }) => (
  <footer className="mt-16 mb-16 flex flex-col md:flex-row items-center justify-between border-t border-slate-100 pt-8 gap-4">
    <div className="flex items-center gap-6 text-slate-500">
      <div className="inline-flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-300" />
        <span className="text-[11px] font-semibold tracking-wider uppercase">Total: {totalCount} itens</span>
      </div>
      <div className="inline-flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-[11px] font-semibold tracking-wider uppercase">{completedCount} concluídos</span>
      </div>
    </div>
  </footer>
);
