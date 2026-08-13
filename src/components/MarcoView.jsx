import React, { useMemo, useState } from 'react';
import { Plus, ArrowUpRight, Pencil, X, Trash2, Check, AlignLeft, Video } from 'lucide-react';
import { useIsMobile } from '../lib/useIsMobile';
import { GlassModal, useInputStyle, useModalButtons, labelSpan } from './ui/GlassModal';

// Vermelho de REC — mesma cor da aba "Marco" na nav.
const REC = '#D6294B';
const DONE = '#15935A';

// Modal de cadastro/edição da gravação.
const GravacaoModal = ({ open, editing, onClose, onSave, onAskDelete }) => {
  const [draft, setDraft] = useState(null);
  const inputStyle = useInputStyle();
  const btn = useModalButtons(REC);
  const isMobile = btn.isMobile;
  React.useEffect(() => {
    if (open) setDraft(editing
      ? { title: editing.title || '', script: editing.script || '', uploadLink: editing.uploadLink || '' }
      : { title: '', script: '', uploadLink: '' });
  }, [open, editing]);
  if (!draft) return null;
  const set = (patch) => setDraft({ ...draft, ...patch });
  const isEdit = Boolean(editing);
  return (
    <GlassModal open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontSize: isMobile ? 18 : 17, fontWeight: 600, color: '#16202E' }}>{isEdit ? 'Editar gravação' : 'Nova gravação'}</h3>
        <button onClick={onClose} title="Fechar" aria-label="Fechar" style={btn.close}><X size={20} /></button>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        <span style={labelSpan}>Título</span>
        <input type="text" value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ex: Tour pela casa Jardins" style={inputStyle} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        <span style={labelSpan}>Texto do vídeo</span>
        <textarea rows={isMobile ? 6 : 8} value={draft.script} onChange={(e) => set({ script: e.target.value })} placeholder="O que o Marco fala no vídeo…" style={{ ...inputStyle, lineHeight: 1.55, resize: 'vertical' }} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        <span style={labelSpan}>Link onde ele sobe o vídeo</span>
        <input type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" value={draft.uploadLink} onChange={(e) => set({ uploadLink: e.target.value })} placeholder="https://…" style={inputStyle} />
      </label>

      <div style={btn.footer}>
        <div style={btn.row}>
          <button onClick={onClose} style={btn.cancel}>Cancelar</button>
          <button onClick={() => { if (draft.title.trim()) onSave(editing, draft); }} style={btn.save}>Salvar</button>
        </div>
        {isEdit && <button onClick={() => onAskDelete(editing)} style={btn.danger}><Trash2 size={14} /> Excluir gravação</button>}
      </div>
    </GlassModal>
  );
};

// Modal com o texto do vídeo em tela cheia — o card mostra só um resumo, e
// gravar exige ler o roteiro inteiro.
const ScriptModal = ({ open, gravacao, onClose }) => {
  const btn = useModalButtons(REC);
  const isMobile = btn.isMobile;
  return (
    <GlassModal open={open} onClose={onClose} maxWidth={520}>
      {gravacao && (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
            <h3 style={{ fontSize: isMobile ? 17 : 16, fontWeight: 600, color: '#16202E', minWidth: 0 }}>{gravacao.title}</h3>
            <button onClick={onClose} title="Fechar" aria-label="Fechar" style={btn.close}><X size={20} /></button>
          </div>
          <div style={{ background: '#F7FAFE', border: '1px solid #E6EDF6', borderRadius: 12, padding: 14, fontSize: isMobile ? 15 : 13.5, color: '#55627A', lineHeight: 1.65, maxHeight: isMobile ? '52dvh' : 380, overflowY: 'auto', whiteSpace: 'pre-wrap', marginBottom: 16 }}>{gravacao.script}</div>
          <div style={btn.row}>
            <button onClick={onClose} style={btn.cancel}>Fechar</button>
            {gravacao.uploadLink && (
              <a href={gravacao.uploadLink} target="_blank" rel="noreferrer" style={{ ...btn.save, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none', boxSizing: 'border-box' }}>
                <ArrowUpRight size={isMobile ? 16 : 14} />Subir vídeo
              </a>
            )}
          </div>
        </>
      )}
    </GlassModal>
  );
};

// Confirmação de exclusão, no mesmo visual glass da view.
const ConfirmDeleteModal = ({ open, gravacao, onCancel, onConfirm }) => {
  const btn = useModalButtons('#E11D48');
  return (
    <GlassModal open={open} onClose={onCancel} maxWidth={400}>
      <h3 style={{ fontSize: btn.isMobile ? 17 : 16, fontWeight: 600, color: '#16202E', marginBottom: 8 }}>Excluir gravação?</h3>
      <p style={{ fontSize: btn.isMobile ? 14 : 13, color: '#55627A', lineHeight: 1.55, marginBottom: 18 }}>
        "{gravacao?.title}" sai da lista do Marco. Essa ação não pode ser desfeita.
      </p>
      <div style={btn.row}>
        <button onClick={onCancel} style={btn.cancel}>Cancelar</button>
        <button onClick={onConfirm} style={btn.save}>Excluir</button>
      </div>
    </GlassModal>
  );
};

const GravacaoCard = ({ gravacao, onEdit, onToggleDone, onOpenScript }) => {
  const [hover, setHover] = useState(false);
  const isMobile = useIsMobile();
  const done = gravacao.done;
  const tapSize = isMobile ? 40 : 26;
  const tapRadius = isMobile ? 12 : 9;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: done ? 'rgba(224,246,233,0.82)' : 'rgba(255,255,255,0.66)',
        backdropFilter: 'blur(12px) saturate(160%)', WebkitBackdropFilter: 'blur(12px) saturate(160%)',
        border: `1px solid ${done ? 'rgba(21,147,90,0.45)' : (hover ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.85)')}`,
        borderRadius: 18, padding: isMobile ? '14px 15px 13px' : '13px 15px 12px',
        display: 'flex', flexDirection: 'column', gap: 4,
        boxShadow: done ? '0 4px 16px rgba(21,147,90,0.12)' : (hover ? '0 10px 26px rgba(30,84,191,0.14)' : '0 4px 16px rgba(20,40,80,0.06)'),
        transition: 'box-shadow .15s, border-color .15s, background .15s'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: isMobile ? 10.5 : 9.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 6, padding: isMobile ? '3px 8px' : '2px 7px', ...(done ? { color: DONE, background: 'rgba(21,147,90,0.14)' } : { color: REC, background: 'rgba(214,41,75,0.11)' }) }}>
          {!done && <span style={{ width: 6, height: 6, borderRadius: '50%', background: REC, flexShrink: 0 }} />}
          {done ? 'Gravado' : 'Gravar'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 5, flexShrink: 0 }}>
          <button onClick={() => onToggleDone(gravacao)} title={done ? 'Desmarcar' : 'Marcar como gravado'} aria-label={done ? 'Desmarcar como gravado' : 'Marcar como gravado'} style={{ flexShrink: 0, background: done ? DONE : 'rgba(255,255,255,0.7)', border: `1px solid ${done ? DONE : 'rgba(255,255,255,0.9)'}`, borderRadius: tapRadius, width: tapSize, height: tapSize, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: done ? '#fff' : (hover ? DONE : '#8A94A8'), padding: 0 }}><Check size={isMobile ? 18 : 14} strokeWidth={3} /></button>
          <button onClick={() => onEdit(gravacao)} title="Editar" aria-label={`Editar ${gravacao.title}`} style={{ flexShrink: 0, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: tapRadius, width: tapSize, height: tapSize, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: hover ? REC : '#8A94A8', padding: 0 }}><Pencil size={isMobile ? 16 : 13} /></button>
        </div>
      </div>

      <div style={{ fontSize: isMobile ? 15 : 13.5, fontWeight: 600, color: done ? '#3B6E52' : '#16202E', lineHeight: 1.35, textDecoration: done ? 'line-through' : 'none', textDecorationColor: 'rgba(21,147,90,0.45)' }}>{gravacao.title}</div>

      {gravacao.script && (
        <button onClick={() => onOpenScript(gravacao)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: isMobile ? 13 : 11.5, color: '#55627A', background: 'none', border: 'none', padding: isMobile ? '4px 0' : 0, cursor: 'pointer', fontWeight: 500, marginTop: isMobile ? 4 : 3, width: 'fit-content' }}>
          <AlignLeft size={isMobile ? 14 : 12} />Texto do vídeo
        </button>
      )}

      {gravacao.uploadLink && (
        <a href={gravacao.uploadLink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: isMobile ? 13 : 11.5, color: REC, textDecoration: 'none', fontWeight: 500, marginTop: isMobile ? 4 : 3, padding: isMobile ? '4px 0' : 0, width: 'fit-content' }}>
          <ArrowUpRight size={isMobile ? 14 : 11} />Subir vídeo
        </a>
      )}
    </div>
  );
};

// ── View do Marco ──
// Lista simples do que o Marco tem para gravar: título, texto do vídeo, link
// onde ele sobe e o check de gravado. Pendentes primeiro; os gravados descem
// para uma seção própria no fim.
export const MarcoView = ({ gravacoes, onSave, onDelete, onToggleDone }) => {
  const isMobile = useIsMobile();
  const [modal, setModal] = useState(null);           // { open, editing: gravacao|null }
  const [script, setScript] = useState(null);         // gravação com o roteiro aberto
  const [confirming, setConfirming] = useState(null); // gravação aguardando confirmação

  const pendentes = useMemo(() => gravacoes.filter(g => !g.done), [gravacoes]);
  const gravados = useMemo(() => gravacoes.filter(g => g.done), [gravacoes]);

  const grid = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(258px,1fr))', gap: isMobile ? 10 : 12 };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flexWrap: 'wrap', marginBottom: isMobile ? 18 : 22 }}>
        {!isMobile && <p style={{ color: '#55627A', fontSize: 13, maxWidth: 620, margin: 0 }}>O que o Marco tem para gravar. Cada item traz o texto do vídeo e o link onde ele sobe o arquivo depois de gravar.</p>}
        <span style={{ marginLeft: isMobile ? 0 : 'auto', fontSize: 12.5, color: '#55627A', fontWeight: 500, whiteSpace: 'nowrap' }}>
          {pendentes.length} para gravar
        </span>
        <button onClick={() => setModal({ open: true, editing: null })} aria-label="Nova gravação" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 6, padding: isMobile ? '0 16px' : '9px 15px', height: isMobile ? 44 : undefined, border: 'none', background: REC, color: '#fff', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 16px rgba(214,41,75,0.28)' }}><Plus size={16} />Gravação</button>
      </div>

      <div style={grid}>
        {pendentes.map(g => (
          <GravacaoCard key={g.id} gravacao={g} onEdit={(x) => setModal({ open: true, editing: x })} onToggleDone={onToggleDone} onOpenScript={(x) => setScript(x)} />
        ))}
      </div>

      {gravados.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: pendentes.length ? (isMobile ? 26 : 34) : 0, marginBottom: isMobile ? 12 : 14 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A94A8', whiteSpace: 'nowrap' }}>Gravados ({gravados.length})</span>
            <span style={{ flex: 1, height: 1, background: '#E6EDF6' }} />
          </div>
          <div style={grid}>
            {gravados.map(g => (
              <GravacaoCard key={g.id} gravacao={g} onEdit={(x) => setModal({ open: true, editing: x })} onToggleDone={onToggleDone} onOpenScript={(x) => setScript(x)} />
            ))}
          </div>
        </>
      )}

      {gravacoes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '72px 20px' }}>
          <Video size={30} color="#C7D2E3" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#8A94A8', marginBottom: 6 }}>Nada para gravar ainda</div>
          <div style={{ fontSize: 13, color: '#A9B4C6' }}>Clique em "Gravação" para adicionar o primeiro vídeo.</div>
        </div>
      )}

      {gravacoes.length > 0 && pendentes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px 8px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: DONE, marginBottom: 4 }}>Tudo gravado 🎉</div>
          <div style={{ fontSize: 13, color: '#A9B4C6' }}>Nenhuma gravação pendente no momento.</div>
        </div>
      )}

      <GravacaoModal
        open={!!modal?.open}
        editing={modal?.editing}
        onClose={() => setModal(null)}
        onSave={(editing, draft) => { onSave(editing, draft); setModal(null); }}
        onAskDelete={(g) => { setModal(null); setConfirming(g); }}
      />
      <ScriptModal open={script != null} gravacao={script} onClose={() => setScript(null)} />
      <ConfirmDeleteModal
        open={!!confirming}
        gravacao={confirming}
        onCancel={() => setConfirming(null)}
        onConfirm={() => { onDelete(confirming); setConfirming(null); }}
      />
    </div>
  );
};

export default MarcoView;
