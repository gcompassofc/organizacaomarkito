import React from 'react';
import { LogOut } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { text } from '../../lib/ui';

export const HeaderBar = ({ firebaseReady, saving, saveError, onLogout }) => (
  <header className="flex items-center justify-between mb-8 pt-2">
    <h1 className={`${text.display} text-slate-900`}>
      Meu <span className="text-blue-600">Plano</span>
    </h1>
    <div className="flex items-center gap-3 text-slate-400">
      {firebaseReady && (
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase ${saveError ? 'text-rose-600' : 'text-slate-400'}`}
          title={saveError ? 'Falha ao salvar — alterações podem estar fora de sincronia' : (saving ? 'Salvando' : 'Sincronizado')}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${saveError ? 'bg-rose-500 animate-pulse' : saving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
          {saveError ? 'Erro' : saving ? 'Salvando' : 'Sync'}
        </span>
      )}
      <IconButton icon={LogOut} label="Sair" tone="neutral" size="md" onClick={onLogout} />
    </div>
  </header>
);
