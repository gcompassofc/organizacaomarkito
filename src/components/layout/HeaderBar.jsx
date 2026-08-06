import React from 'react';
import { LogOut, KeyRound } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { text } from '../../lib/ui';

export const HeaderBar = ({ firebaseReady, saving, saveError, onLogout, canChangePassword, onChangePassword }) => (
  <header className="flex items-center justify-between gap-2 mb-6 md:mb-8 pt-1 md:pt-2">
    <h1 className={`${text.display} text-slate-900 truncate`}>
      Meu <span className="text-blue-600">Plano</span>
    </h1>
    <div className="flex items-center gap-1 md:gap-3 text-slate-400 shrink-0">
      {firebaseReady && (
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase ${saveError ? 'text-rose-600' : 'text-slate-400'}`}
          title={saveError ? 'Falha ao salvar — alterações podem estar fora de sincronia' : (saving ? 'Salvando' : 'Sincronizado')}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${saveError ? 'bg-rose-500 animate-pulse' : saving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
          {/* No mobile só o ponto colorido — o rótulo rouba espaço do título. */}
          <span className="hidden sm:inline">{saveError ? 'Erro' : saving ? 'Salvando' : 'Sync'}</span>
        </span>
      )}
      {canChangePassword && (
        <IconButton icon={KeyRound} label="Trocar senha" tone="neutral" size="lg" onClick={onChangePassword} className="min-w-11 min-h-11 md:min-w-0 md:min-h-0" />
      )}
      <IconButton icon={LogOut} label="Sair" tone="neutral" size="lg" onClick={onLogout} className="min-w-11 min-h-11 md:min-w-0 md:min-h-0" />
    </div>
  </header>
);
