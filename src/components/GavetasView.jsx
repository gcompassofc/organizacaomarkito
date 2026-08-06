import React, { useMemo, useState } from 'react';
import { Plus, ArrowUpRight, AlignLeft, Pencil, Copy, Check, X, Trash2, Search, CalendarPlus } from 'lucide-react';
import { toDateKey } from '../lib/dates';
import { useIsMobile } from '../lib/useIsMobile';
import { GlassModal, useInputStyle, useModalButtons, labelSpan } from './ui/GlassModal';

const ACCENT = '#2E6DE0';

const catOf = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('lanç') || t.includes('lanc')) return 'Lançamento';
  if (t.includes('pasta')) return 'Pasta';
  if (t.includes('reels')) return 'Reels';
  if (t.includes('carrossel')) return 'Carrossel';
  if (t.includes('post')) return 'Post';
  return 'Outro';
};
const BADGE = {
  Reels: [ACCENT, '#EAF1FD'], Carrossel: ['#0E7C6B', '#E3F5F0'], Post: ['#475569', '#EEF2F7'],
  'Lançamento': ['#B4530A', '#FBEEDD'], Pasta: ['#3B5578', '#EEF3FA'], Outro: ['#55627A', '#EEF2F7']
};
const badgeStyle = (type) => {
  const [fg, bg] = BADGE[catOf(type)] || BADGE.Outro;
  return { color: fg, background: bg };
};

const TYPE_OPTIONS = ['Pasta', 'Reels', 'Carrossel', 'Post', 'Lançamento'];

const LegendaModal = ({ open, text, onClose }) => {
  const [copied, setCopied] = useState(false);
  const btn = useModalButtons();
  const isMobile = btn.isMobile;
  React.useEffect(() => { if (!open) setCopied(false); }, [open]);
  const copy = () => navigator.clipboard.writeText(text || '').then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  return (
    <GlassModal open={open} onClose={onClose} maxWidth={480}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: isMobile ? 17 : 16, fontWeight: 600, color: '#16202E' }}>Legenda do post</h3>
        <button onClick={onClose} title="Fechar" aria-label="Fechar" style={btn.close}><X size={20} /></button>
      </div>
      <div style={{ background: '#F7FAFE', border: '1px solid #E6EDF6', borderRadius: 12, padding: 14, fontSize: isMobile ? 14 : 13, color: '#55627A', lineHeight: 1.55, maxHeight: isMobile ? '45dvh' : 320, overflowY: 'auto', whiteSpace: 'pre-wrap', marginBottom: 16 }}>{text}</div>
      <div style={{ display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
        <button onClick={copy} style={{ ...btn.save, background: copied ? '#0F766E' : ACCENT, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {copied ? <Check size={isMobile ? 16 : 14} /> : <Copy size={isMobile ? 16 : 14} />}{copied ? 'Copiado!' : 'Copiar legenda'}
        </button>
      </div>
    </GlassModal>
  );
};

// Editor de item de gaveta (e criação/edição do grupo).
const ItemEditor = ({ open, editing, onClose, onSave, onDelete }) => {
  const [draft, setDraft] = useState(null);
  const inputStyle = useInputStyle();
  const btn = useModalButtons();
  const isMobile = btn.isMobile;
  React.useEffect(() => {
    if (open) setDraft(editing?.item
      ? { type: editing.item.type || 'Pasta', title: editing.item.title || '', link: editing.item.link || '', linkLabel: editing.item.linkLabel || 'Ver materiais', legenda: editing.item.legenda || '' }
      : { type: 'Pasta', title: '', link: '', linkLabel: 'Ver materiais', legenda: '' });
  }, [open, editing]);
  if (!draft) return null;
  const set = (patch) => setDraft({ ...draft, ...patch });
  const isEdit = Boolean(editing?.item);
  return (
    <GlassModal open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontSize: isMobile ? 18 : 17, fontWeight: 600, color: '#16202E' }}>{isEdit ? 'Editar material' : 'Novo material'}</h3>
        <button onClick={onClose} title="Fechar" aria-label="Fechar" style={btn.close}><X size={20} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: 14, marginBottom: 14 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelSpan}>Tipo</span>
          <select value={draft.type} onChange={(e) => set({ type: e.target.value })} style={inputStyle}>
            {TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelSpan}>Título</span>
          <input type="text" value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="Título do material" style={inputStyle} />
        </label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 14, marginBottom: 14 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelSpan}>Link dos materiais</span>
          <input type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" value={draft.link} onChange={(e) => set({ link: e.target.value })} placeholder="https://…" style={inputStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelSpan}>Rótulo</span>
          <input type="text" value={draft.linkLabel} onChange={(e) => set({ linkLabel: e.target.value })} placeholder="Ver materiais" style={inputStyle} />
        </label>
      </div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        <span style={labelSpan}>Legenda (opcional)</span>
        <textarea rows={isMobile ? 4 : 5} value={draft.legenda} onChange={(e) => set({ legenda: e.target.value })} placeholder="Texto da legenda…" style={{ ...inputStyle, lineHeight: 1.5, resize: 'vertical' }} />
      </label>
      <div style={btn.footer}>
        <div style={btn.row}>
          <button onClick={onClose} style={btn.cancel}>Cancelar</button>
          <button onClick={() => { if (draft.title.trim()) onSave(editing, draft); }} style={btn.save}>Salvar</button>
        </div>
        {isEdit && <button onClick={() => onDelete(editing)} style={btn.danger}><Trash2 size={14} /> Excluir</button>}
      </div>
    </GlassModal>
  );
};

// Modal para criar/renomear grupo (imóvel).
const GroupModal = ({ open, editing, onClose, onSave, onDelete }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const inputStyle = useInputStyle();
  const btn = useModalButtons();
  const isMobile = btn.isMobile;
  React.useEffect(() => { if (open) { setName(editing?.group?.name || ''); setCode(editing?.group?.code || ''); } }, [open, editing]);
  const isEdit = Boolean(editing?.group);
  return (
    <GlassModal open={open} onClose={onClose} maxWidth={440}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontSize: isMobile ? 18 : 17, fontWeight: 600, color: '#16202E' }}>{isEdit ? 'Editar imóvel' : 'Novo imóvel'}</h3>
        <button onClick={onClose} title="Fechar" aria-label="Fechar" style={btn.close}><X size={20} /></button>
      </div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        <span style={labelSpan}>Nome do imóvel</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Cocaia (Chácara)" style={isMobile ? inputStyle : { ...inputStyle, fontSize: 13.5, padding: '10px 11px' }} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        <span style={labelSpan}>Código (opcional)</span>
        <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: CA0328" style={inputStyle} />
      </label>
      <div style={btn.footer}>
        <div style={btn.row}>
          <button onClick={onClose} style={btn.cancel}>Cancelar</button>
          <button onClick={() => { if (name.trim()) onSave(editing, { name: name.trim(), code: code.trim() }); }} style={btn.save}>Salvar</button>
        </div>
        {isEdit && <button onClick={() => onDelete(editing)} style={btn.danger}><Trash2 size={14} /> Excluir imóvel</button>}
      </div>
    </GlassModal>
  );
};

// Modal para encaixar um material da gaveta num dia do cronograma. Pede a
// data (obrigatória), horário/nota e responsável — os mesmos campos que o
// post ganha no cronograma. Ao agendar, o material sai da gaveta.
const ScheduleModal = ({ open, editing, people, onClose, onSchedule }) => {
  const [dateKey, setDateKey] = useState('');
  const [note, setNote] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const inputStyle = useInputStyle();
  const btn = useModalButtons();
  const isMobile = btn.isMobile;
  React.useEffect(() => {
    if (open) { setDateKey(toDateKey(new Date())); setNote(''); setResponsavel(''); }
  }, [open]);
  const item = editing?.item;
  if (!item) return null;
  return (
    <GlassModal open={open} onClose={onClose} maxWidth={440}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h3 style={{ fontSize: isMobile ? 18 : 17, fontWeight: 600, color: '#16202E' }}>Agendar no cronograma</h3>
        <button onClick={onClose} title="Fechar" aria-label="Fechar" style={btn.close}><X size={20} /></button>
      </div>
      <p style={{ fontSize: isMobile ? 13.5 : 12.5, color: '#8A94A8', lineHeight: 1.5, marginBottom: 16 }}>O material vira um post no dia escolhido, com título, tipo, link e legenda preenchidos — e sai da gaveta.</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7FAFE', border: '1px solid #E6EDF6', borderRadius: 12, padding: '10px 12px', marginBottom: 16 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 6, padding: '2px 7px', flexShrink: 0, ...badgeStyle(item.type) }}>{item.type}</span>
        <span style={{ fontSize: isMobile ? 14 : 13, fontWeight: 500, color: '#16202E', lineHeight: 1.35 }}>{item.title}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelSpan}>Data do post</span>
          <input type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelSpan}>Horário / nota</span>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: 18h" style={inputStyle} />
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        <span style={labelSpan}>Responsável por postar</span>
        <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)} style={inputStyle}>
          <option value="">— Ninguém —</option>
          {(people || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>

      <div style={btn.row}>
        <button onClick={onClose} style={btn.cancel}>Cancelar</button>
        <button onClick={() => { if (dateKey) onSchedule(editing, { dateKey, note, responsavel }); }} style={{ ...btn.save, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><CalendarPlus size={isMobile ? 16 : 14} />Agendar</button>
      </div>
    </GlassModal>
  );
};

const GavetaCard = ({ item, groupId, onEdit, onLegenda, onSchedule }) => {
  const [hover, setHover] = useState(false);
  const isMobile = useIsMobile();
  const tapSize = isMobile ? 40 : 24;
  const tapRadius = isMobile ? 12 : 9;
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ position: 'relative', background: 'rgba(255,255,255,0.66)', backdropFilter: 'blur(12px) saturate(160%)', WebkitBackdropFilter: 'blur(12px) saturate(160%)', border: `1px solid ${hover ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.85)'}`, borderRadius: 18, padding: isMobile ? '13px 14px 12px' : '11px 13px 10px', display: 'flex', flexDirection: 'column', gap: 3, boxShadow: hover ? '0 10px 26px rgba(30,84,191,0.14)' : '0 4px 16px rgba(20,40,80,0.06)', transition: 'box-shadow .15s, border-color .15s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', fontSize: isMobile ? 10.5 : 9.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 6, padding: isMobile ? '3px 8px' : '2px 7px', ...badgeStyle(item.type) }}>{item.type}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 5, flexShrink: 0 }}>
          <button onClick={() => onSchedule(groupId, item)} title="Agendar no cronograma" aria-label="Agendar no cronograma" style={{ flexShrink: 0, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: tapRadius, width: tapSize, height: tapSize, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: hover ? ACCENT : '#8A94A8', padding: 0 }}><CalendarPlus size={isMobile ? 16 : 12} /></button>
          <button onClick={() => onEdit(groupId, item)} title="Editar" aria-label="Editar material" style={{ flexShrink: 0, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: tapRadius, width: tapSize, height: tapSize, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: hover ? ACCENT : '#8A94A8', padding: 0 }}><Pencil size={isMobile ? 16 : 12} /></button>
        </div>
      </div>
      <div style={{ fontSize: isMobile ? 14.5 : 13, fontWeight: 500, color: '#16202E', lineHeight: 1.35 }}>{item.title}</div>
      {item.link && (
        <a href={item.link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: isMobile ? 13 : 11, color: ACCENT, textDecoration: 'none', fontWeight: 500, marginTop: isMobile ? 8 : 4, padding: isMobile ? '4px 0' : 0, width: 'fit-content' }}>
          <ArrowUpRight size={isMobile ? 14 : 11} />{item.linkLabel || 'Ver materiais'}
        </a>
      )}
      {item.legenda && (
        <button onClick={() => onLegenda(item.legenda)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: isMobile ? 13 : 11, color: '#55627A', background: 'none', border: 'none', padding: isMobile ? '4px 0' : 0, cursor: 'pointer', fontWeight: 500, marginTop: isMobile ? 4 : 3, width: 'fit-content' }}>
          <AlignLeft size={isMobile ? 14 : 12} />Legenda
        </button>
      )}
    </div>
  );
};

export const GavetasView = ({ planner, onSaveGaveta, onDeleteGaveta, onSaveGroup, onDeleteGroup, onScheduleGaveta }) => {
  const gavetas = planner.gavetas || [];
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [itemEditor, setItemEditor] = useState(null);   // { open, editing:{groupId, item?} }
  const [groupModal, setGroupModal] = useState(null);   // { open, editing:{group?} }
  const [scheduler, setScheduler] = useState(null);     // { open, editing:{groupId, item} }
  const [legenda, setLegenda] = useState(null);

  const q = search.trim().toLowerCase();
  const groups = useMemo(() => gavetas.map(g => ({
    ...g,
    items: g.items.filter(i => !q || (`${i.title} ${i.type}`).toLowerCase().includes(q))
  })), [gavetas, q]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flexWrap: 'wrap', marginBottom: isMobile ? 18 : 22 }}>
        {/* A descrição some no mobile: ocupa três linhas antes do conteúdo útil. */}
        {!isMobile && <p style={{ color: '#55627A', fontSize: 13, maxWidth: 640, margin: 0 }}>Materiais editados e prontos, organizados por imóvel. Use como uma prateleira para puxar conteúdo quando precisar.</p>}
        <div style={{ position: 'relative', flex: 1, marginLeft: isMobile ? 0 : 'auto', minWidth: isMobile ? 0 : 200 }}>
          <Search size={15} color="#A9B4C6" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar material…" aria-label="Buscar material" style={{ width: '100%', padding: isMobile ? '12px 12px 12px 36px' : '9px 12px 9px 34px', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 14, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', fontSize: isMobile ? 16 : 13, color: '#16202E' }} />
        </div>
        <button onClick={() => setGroupModal({ open: true, editing: {} })} aria-label="Novo imóvel" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 6, padding: isMobile ? '0 16px' : '9px 15px', height: isMobile ? 44 : undefined, border: 'none', background: ACCENT, color: '#fff', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 16px rgba(46,109,224,0.28)' }}><Plus size={16} />Imóvel</button>
      </div>

      {groups.map(group => (
        <section key={group.id} style={{ marginBottom: isMobile ? 22 : 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: isMobile ? 8 : 12, marginBottom: 13 }}>
            {/* alignItems center (não baseline) + nowrap: com wrap o lápis caía
                sozinho numa linha abaixo do nome no celular. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 7 : 10, minWidth: 0 }}>
              <h2 style={{ fontSize: isMobile ? 16 : 15, fontWeight: 600, color: '#16202E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</h2>
              {group.code && !isMobile && <span style={{ fontSize: 11, color: '#8A94A8', letterSpacing: '0.04em' }}>{group.code}</span>}
              <span style={{ flexShrink: 0, background: 'rgba(120,140,170,0.13)', color: '#55627A', fontSize: 11.5, fontWeight: 600, padding: '3px 11px', borderRadius: 999 }}>{group.items.length}</span>
              <button onClick={() => setGroupModal({ open: true, editing: { group } })} title="Editar imóvel" aria-label={`Editar ${group.name}`} style={{ flexShrink: 0, background: 'none', border: 'none', color: '#A9B4C6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: isMobile ? 36 : 21, height: isMobile ? 36 : 21, padding: 0 }}><Pencil size={isMobile ? 15 : 13} /></button>
            </div>
            <button onClick={() => setItemEditor({ open: true, editing: { groupId: group.id } })} aria-label={`Adicionar material em ${group.name}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 6, padding: isMobile ? '0 14px' : '6px 13px', height: isMobile ? 40 : undefined, border: '1px solid #E6EDF6', background: '#fff', borderRadius: 999, color: '#55627A', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}><Plus size={14} />Adicionar</button>
          </div>
          {/* No mobile os cards ficam em coluna única — 238px de mínimo estoura
              a largura útil de um celular de 390px. */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(238px,1fr))', gap: isMobile ? 10 : 12 }}>
            {group.items.map(item => (
              <GavetaCard key={item.id} item={item} groupId={group.id} onEdit={(gid, it) => setItemEditor({ open: true, editing: { groupId: gid, item: it } })} onLegenda={(t) => setLegenda(t)} onSchedule={(gid, it) => setScheduler({ open: true, editing: { groupId: gid, item: it } })} />
            ))}
            {group.items.length === 0 && <span style={{ fontSize: 12.5, color: '#A9B4C6' }}>Nenhum material aqui ainda.</span>}
          </div>
        </section>
      ))}

      {gavetas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '72px 20px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#8A94A8', marginBottom: 6 }}>Nenhum imóvel ainda</div>
          <div style={{ fontSize: 13, color: '#A9B4C6' }}>Clique em "Imóvel" para criar sua primeira gaveta.</div>
        </div>
      )}

      <ItemEditor
        open={!!itemEditor?.open}
        editing={itemEditor?.editing}
        onClose={() => setItemEditor(null)}
        onSave={(editing, draft) => { onSaveGaveta(editing, draft); setItemEditor(null); }}
        onDelete={(editing) => { onDeleteGaveta(editing); setItemEditor(null); }}
      />
      <GroupModal
        open={!!groupModal?.open}
        editing={groupModal?.editing}
        onClose={() => setGroupModal(null)}
        onSave={(editing, draft) => { onSaveGroup(editing, draft); setGroupModal(null); }}
        onDelete={(editing) => { onDeleteGroup(editing); setGroupModal(null); }}
      />
      <ScheduleModal
        open={!!scheduler?.open}
        editing={scheduler?.editing}
        people={planner.people || []}
        onClose={() => setScheduler(null)}
        onSchedule={(editing, draft) => { onScheduleGaveta(editing, draft); setScheduler(null); }}
      />
      <LegendaModal open={legenda != null} text={legenda || ''} onClose={() => setLegenda(null)} />
    </div>
  );
};

export default GavetasView;
