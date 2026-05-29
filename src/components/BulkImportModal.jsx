import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, FileText, ClipboardList } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Textarea } from './ui/Input';
import { parseBulkText } from '../lib/bulkImport';
import { getContentTypeTag, getProfileTag, getPilarLabel } from '../lib/tags';
import { defaultItem } from '../lib/planner';

const EXAMPLE = `Titulo: Vídeo sobre financiamento
Tipo: video curto
Perfil: opa
Pilar: Sobre o Mercado
Data postar: 2026-06-02
Horario: 14:00
Legenda: 3 erros que travam seu financiamento
---
Titulo: Story do lançamento
Tipo: stories
Perfil: marco
Data postar: 03/06/2026`;

const EntryPreview = ({ entry }) => {
  const { item, valid, errors, warnings } = entry;
  const tone = !valid
    ? 'border-rose-200 bg-rose-50/40'
    : warnings.length
      ? 'border-amber-200 bg-amber-50/40'
      : 'border-slate-200 bg-white';

  return (
    <div className={`rounded-xl border p-3 ${tone}`}>
      <div className="flex items-start gap-2">
        {!valid ? (
          <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
        ) : warnings.length ? (
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            <span className="text-slate-400 font-mono text-[11px] mr-1.5">#{entry.index}</span>
            {item.objective || <span className="italic text-slate-400">Sem título</span>}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className="text-[10px] font-semibold tracking-wider uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              {getContentTypeTag(item.contentType)}
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              {getProfileTag(item.profile)}
            </span>
            {item.pilar && (
              <span className="text-[10px] font-semibold tracking-wider uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                {getPilarLabel(item.pilar)}
              </span>
            )}
            {item.banco ? (
              <span className="text-[10px] font-semibold tracking-wider uppercase bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded">Banco</span>
            ) : (
              <span className="text-[10px] text-slate-400">
                {item.postDate ? `postar ${item.postDate}` : 'sem data'}
                {item.recordingDate ? ` · gravar ${item.recordingDate}` : ''}
              </span>
            )}
            {item.forAllBrokers && (
              <span className="text-[10px] font-semibold tracking-wider uppercase bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">Todos os corretores</span>
            )}
          </div>

          {errors.map((e, i) => (
            <p key={`e-${i}`} className="mt-1.5 text-xs text-rose-700 leading-snug">⛔ {e}</p>
          ))}
          {warnings.map((w, i) => (
            <p key={`w-${i}`} className="mt-1 text-xs text-amber-700 leading-snug">⚠️ {w}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

const BulkImportModal = ({ open, onClose, onImport }) => {
  const [textValue, setTextValue] = useState('');

  const analysis = useMemo(
    () => parseBulkText(textValue, defaultItem),
    [textValue]
  );

  const close = () => { setTextValue(''); onClose(); };
  const handleImport = () => {
    const valid = analysis.entries.filter((e) => e.valid).map((e) => e.item);
    if (valid.length === 0) return;
    onImport(valid);
    setTextValue('');
  };

  const hasText = textValue.trim() !== '';

  return (
    <Modal
      open={open}
      onClose={close}
      title="Importar várias postagens"
      subtitle="Cole o texto no formato de blocos. Cada postagem é um bloco separado por uma linha em branco ou por ---"
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={close}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleImport}
            disabled={analysis.validCount === 0}
            className="flex-1"
          >
            {analysis.validCount > 0
              ? `Importar ${analysis.validCount} ${analysis.validCount === 1 ? 'postagem' : 'postagens'}`
              : 'Importar'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Texto das postagens
            </label>
            {!hasText && (
              <button
                type="button"
                onClick={() => setTextValue(EXAMPLE)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Usar exemplo
              </button>
            )}
          </div>
          <Textarea
            rows={10}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder={`Titulo: ...\nTipo: video curto\nPerfil: opa\nData postar: 2026-06-02\n---\nTitulo: ...`}
            className="font-mono text-xs leading-relaxed"
            autoFocus
          />
        </div>

        {hasText && (
          <>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <FileText className="w-3.5 h-3.5" />
                {analysis.total} {analysis.total === 1 ? 'bloco lido' : 'blocos lidos'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {analysis.validCount} ok
              </span>
              {analysis.errorCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-rose-600">
                  <XCircle className="w-3.5 h-3.5" />
                  {analysis.errorCount} com erro
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {analysis.entries.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-6">
                  Nenhum bloco reconhecido ainda
                </p>
              ) : (
                analysis.entries.map((entry) => (
                  <EntryPreview key={entry.index} entry={entry} />
                ))
              )}
            </div>

            {analysis.errorCount > 0 && (
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3">
                As postagens com <span className="text-rose-600 font-semibold">erro</span> não serão importadas até você corrigir o texto.
                As com <span className="text-amber-600 font-semibold">aviso</span> entram normalmente (o aviso é só pra você saber o que foi ajustado).
              </p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default BulkImportModal;
