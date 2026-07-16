import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowUpRight, Pencil, X, Trash2, Search, House } from 'lucide-react';

const ACCENT = '#2E6DE0';
const CASA = '#0E7C6B'; // mesma cor da aba Casas na nav

const inputStyle = { width: '100%', padding: '9px 11px', border: '1px solid #E6EDF6', borderRadius: 10, background: '#F7FAFE', fontSize: 13, color: '#16202E' };
const labelSpan = { fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8A94A8' };

const GlassModal = ({ open, onClose, maxWidth = 480, children }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(12,22,45,0.30)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth, borderRadius: 26, padding: 24, boxShadow: '0 30px 70px rgba(16,32,56,0.28)', maxHeight: '88vh', overflowY: 'auto' }}>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Badge do código da casa — o mesmo visual usado no card do post.
export const casaBadgeStyle = { color: CASA, background: 'rgba(14,124,107,0.12)' };

// Modal de cadastro/edição da casa.
const CasaModal = ({ open, editing, onClose, onSave, onAskDelete }) => {
  const [draft, setDraft] = useState(null);
  React.useEffect(() => {
    if (open) setDraft(editing
      ? { code: editing.code || '', name: editing.name || '', siteLink: editing.siteLink || '', description: editing.description || '' }
      : { code: '', name: '', siteLink: '', description: '' });
  }, [open, editing]);
  if (!draft) return null;
  const set = (patch) => setDraft({ ...draft, ...patch });
  const isEdit = Boolean(editing);
  return (
    <GlassModal open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#16202E' }}>{isEdit ? 'Editar casa' : 'Nova casa'}</h3>
        <button onClick={onClose} title="Fechar" style={{ background: 'none', border: 'none', color: '#8A94A8', cursor: 'pointer', display: 'flex', padding: 4 }}><X size={18} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 14 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelSpan}>Código</span>
          <input type="text" value={draft.code} onChange={(e) => set({ code: e.target.value })} placeholder="Ex: CA0328" style={inputStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelSpan}>Nome da casa</span>
          <input type="text" value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ex: Casa Jardins" style={inputStyle} />
        </label>
      </div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        <span style={labelSpan}>Link do site</span>
        <input type="url" value={draft.siteLink} onChange={(e) => set({ siteLink: e.target.value })} placeholder="https://…" style={inputStyle} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        <span style={labelSpan}>Breve descrição</span>
        <textarea rows={4} value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Ex: 3 quartos, piscina, condomínio fechado…" style={{ ...inputStyle, lineHeight: 1.5, resize: 'vertical' }} />
      </label>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {isEdit ? <button onClick={() => onAskDelete(editing)} style={{ background: 'none', border: 'none', color: '#E11D48', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Trash2 size={14} /> Excluir casa</button> : <span />}
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
          <button onClick={onClose} style={{ padding: '9px 16px', border: '1px solid #E6EDF6', background: '#fff', borderRadius: 10, color: '#55627A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => { if (draft.name.trim()) onSave(editing, draft); }} style={{ padding: '10px 22px', border: 'none', background: ACCENT, color: '#fff', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 16px rgba(46,109,224,0.28)' }}>Salvar</button>
        </div>
      </div>
    </GlassModal>
  );
};

// Confirmação de exclusão, no mesmo visual glass dos modais da view.
const ConfirmDeleteModal = ({ open, casa, onCancel, onConfirm }) => (
  <GlassModal open={open} onClose={onCancel} maxWidth={400}>
    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#16202E', marginBottom: 8 }}>Excluir casa?</h3>
    <p style={{ fontSize: 13, color: '#55627A', lineHeight: 1.55, marginBottom: 18 }}>
      "{casa?.name}" será removida do cadastro. Os posts vinculados a ela continuam no cronograma — apenas deixam de mostrar o código.
    </p>
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <button onClick={onCancel} style={{ padding: '9px 16px', border: '1px solid #E6EDF6', background: '#fff', borderRadius: 10, color: '#55627A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
      <button onClick={onConfirm} style={{ padding: '10px 22px', border: 'none', background: '#E11D48', color: '#fff', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 16px rgba(225,29,72,0.28)' }}>Excluir</button>
    </div>
  </GlassModal>
);

const CasaCard = ({ casa, onEdit }) => {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ position: 'relative', background: 'rgba(255,255,255,0.66)', backdropFilter: 'blur(12px) saturate(160%)', WebkitBackdropFilter: 'blur(12px) saturate(160%)', border: `1px solid ${hover ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.85)'}`, borderRadius: 18, padding: '13px 15px 12px', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: hover ? '0 10px 26px rgba(30,84,191,0.14)' : '0 4px 16px rgba(20,40,80,0.06)', transition: 'box-shadow .15s, border-color .15s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        {casa.code
          ? <span style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 6, padding: '2px 7px', ...casaBadgeStyle }}>{casa.code}</span>
          : <span style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', color: '#A9B4C6' }}><House size={13} /></span>}
        <button onClick={() => onEdit(casa)} title="Editar" style={{ flexShrink: 0, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 9, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: hover ? ACCENT : '#8A94A8', padding: 0 }}><Pencil size={12} /></button>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#16202E', lineHeight: 1.35 }}>{casa.name}</div>
      {casa.description && (
        <div style={{ fontSize: 12, color: '#55627A', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{casa.description}</div>
      )}
      {casa.siteLink && (
        <a href={casa.siteLink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: ACCENT, textDecoration: 'none', fontWeight: 500, marginTop: 4, width: 'fit-content' }}>
          <ArrowUpRight size={11} />Ver no site
        </a>
      )}
    </div>
  );
};

// ── View de Casas ──
// Cadastro de imóveis (código, nome, link do site e descrição) que podem ser
// vinculados a posts no cronograma — o card do post mostra o código da casa.
export const CasasView = ({ casas, onSave, onDelete }) => {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);        // { open, editing: casa|null }
  const [confirming, setConfirming] = useState(null); // casa aguardando confirmação de exclusão

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () => casas.filter(c => !q || (`${c.name} ${c.code}`).toLowerCase().includes(q)),
    [casas, q]
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
        <p style={{ color: '#55627A', fontSize: 13, maxWidth: 640, margin: 0 }}>Imóveis cadastrados com código e link do site. Vincule uma casa a um post no cronograma para o código aparecer no card.</p>
        <div style={{ position: 'relative', marginLeft: 'auto', minWidth: 200 }}>
          <Search size={15} color="#A9B4C6" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar casa…" style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 14, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', fontSize: 13, color: '#16202E' }} />
        </div>
        <button onClick={() => setModal({ open: true, editing: null })} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', border: 'none', background: ACCENT, color: '#fff', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 16px rgba(46,109,224,0.28)' }}><Plus size={14} />Casa</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(238px,1fr))', gap: 12 }}>
        {filtered.map(casa => (
          <CasaCard key={casa.id} casa={casa} onEdit={(c) => setModal({ open: true, editing: c })} />
        ))}
      </div>

      {casas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '72px 20px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#8A94A8', marginBottom: 6 }}>Nenhuma casa ainda</div>
          <div style={{ fontSize: 13, color: '#A9B4C6' }}>Clique em "Casa" para cadastrar o primeiro imóvel.</div>
        </div>
      )}
      {casas.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', fontSize: 13, color: '#A9B4C6' }}>Nenhuma casa encontrada para "{search}".</div>
      )}

      <CasaModal
        open={!!modal?.open}
        editing={modal?.editing}
        onClose={() => setModal(null)}
        onSave={(editing, draft) => { onSave(editing, draft); setModal(null); }}
        onAskDelete={(casa) => { setModal(null); setConfirming(casa); }}
      />
      <ConfirmDeleteModal
        open={!!confirming}
        casa={confirming}
        onCancel={() => setConfirming(null)}
        onConfirm={() => { onDelete(confirming); setConfirming(null); }}
      />
    </div>
  );
};

export default CasasView;
