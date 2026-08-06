import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, ChevronLeft, ChevronRight, Search, SlidersHorizontal,
  ArrowUpRight, AlignLeft, Pencil, Copy, Check, X, Trash2, Settings, Info,
  CalendarDays
} from 'lucide-react';
import {
  MONTH_SHORT, DAY_NAMES_SHORT, weeksForMonth, mondayOf, toDateKey
} from '../lib/dates';
import { getPostsByDate } from '../lib/selectors';
import { useIsMobile } from '../lib/useIsMobile';
import { GlassModal, useInputStyle, useModalButtons, labelSpan } from './ui/GlassModal';

const MONTH_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const ACCENT = '#2E6DE0';

// ── Categoria + cor do badge (réplica do HTML) ──
const catOf = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('motion')) return 'Motion';
  if (t.includes('carrossel')) return 'Carrossel';
  if (t.includes('lanç') || t.includes('lanc')) return 'Lançamento';
  if (t.includes('estát') || t.includes('estat')) return 'Estático';
  if (t.includes('stories')) return 'Stories';
  if (t.includes('takes')) return 'Takes';
  if (t.includes('pasta')) return 'Pasta';
  if (t.includes('post')) return 'Post';
  if (t.includes('reels')) return 'Reels';
  return 'Outro';
};
const BADGE = {
  Reels: [ACCENT, '#EAF1FD'], Carrossel: ['#0E7C6B', '#E3F5F0'], Post: ['#475569', '#EEF2F7'],
  Motion: ['#6D48C7', '#F1ECFC'], 'Estático': ['#177245', '#E7F5EC'], 'Lançamento': ['#B4530A', '#FBEEDD'],
  Stories: ['#B83280', '#FBEAF3'], Takes: ['#0E7490', '#E2F3F8'], Pasta: ['#3B5578', '#EEF3FA'], Outro: ['#55627A', '#EEF2F7']
};
const badgeStyle = (type) => {
  const [fg, bg] = BADGE[catOf(type)] || BADGE.Outro;
  return { color: fg, background: bg };
};

// Deriva o "tipo" (texto do badge) a partir dos campos do item real.
const typeLabelOf = (item) => {
  if (item.pilar === 'lancamentos') return 'Lançamento';
  const ct = item.contentType;
  if (ct === 'estatico') return 'Estático';
  if (ct === 'carrossel') return 'Carrossel';
  if (ct === 'stories') return 'Stories';
  if (ct === 'repost_stories') return 'Repost no Stories';
  if (ct === 'youtube' || ct === 'video_longo') return 'YouTube';
  return 'Reels';
};

const initialsOf = (name) => {
  const p = (name || '').trim().split(/\s+/);
  const a = (p[0] || '')[0] || '';
  const b = p.length > 1 ? (p[p.length - 1][0] || '') : '';
  return ((a + b).toUpperCase()) || '?';
};

const Avatar = ({ person, size = 22 }) => {
  if (!person) return null;
  const base = {
    width: size, height: size, minWidth: size, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: size < 26 ? 9 : 12, fontWeight: 600,
    overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 0 2px #fff'
  };
  if (person.photo) {
    return <span title={person.name} style={{ ...base, backgroundImage: `url(${person.photo})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' }} />;
  }
  return <span title={person.name} style={{ ...base, background: '#EAF1FD', color: ACCENT }}>{initialsOf(person.name)}</span>;
};


const TYPE_OPTIONS = [
  { label: 'Reels', contentType: 'video_curto', pilar: '' },
  { label: 'Reels Motion', contentType: 'video_curto', pilar: '' },
  { label: 'Carrossel', contentType: 'carrossel', pilar: '' },
  { label: 'Post', contentType: 'estatico', pilar: '' },
  { label: 'Estático', contentType: 'estatico', pilar: '' },
  { label: 'Lançamento', contentType: 'video_curto', pilar: 'lancamentos' },
  { label: 'Stories', contentType: 'stories', pilar: '' },
  { label: 'Takes', contentType: 'video_curto', pilar: '' }
];

// ── Editor de post ──
// `dateKey` é a data do post. No desktop ela é definida arrastando o card
// entre colunas; no mobile (sem drag & drop) este campo é o único jeito de
// mover um post de dia, então ele aparece no formulário.
const PostEditor = ({ open, editing, people, casas, onClose, onSave, onDelete, onCasaInfo }) => {
  const [draft, setDraft] = useState(null);
  const inputStyle = useInputStyle();
  const btn = useModalButtons();
  const isMobile = btn.isMobile;
  React.useEffect(() => {
    if (open) {
      setDraft(editing?.card ? {
        type: typeLabelOf(editing.card),
        title: editing.card.objective || '',
        note: editing.card.time || '',
        link: editing.card.primaryLink || '',
        linkLabel: 'Ver materiais',
        legenda: editing.card.postCaption || '',
        observacao: editing.card.observacao || '',
        responsavel: editing.card.responsavel || '',
        casaId: editing.card.casaId || '',
        dateKey: editing.card.postDate || ''
      } : { type: 'Reels', title: '', note: '', link: '', linkLabel: 'Ver materiais', legenda: '', observacao: '', responsavel: '', casaId: '', dateKey: editing?.dateKey || '' });
    }
  }, [open, editing]);
  if (!draft) return null;
  const set = (patch) => setDraft({ ...draft, ...patch });
  const isEdit = Boolean(editing?.card);
  const twoCol = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 };

  return (
    <GlassModal open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontSize: isMobile ? 18 : 17, fontWeight: 600, color: '#16202E' }}>{isEdit ? 'Editar post' : 'Novo post'}</h3>
        <button onClick={onClose} title="Fechar" aria-label="Fechar" style={{ background: 'none', border: 'none', color: '#8A94A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, margin: -8, padding: 0 }}><X size={20} /></button>
      </div>

      <div style={twoCol}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelSpan}>Tipo</span>
          <select value={draft.type} onChange={(e) => set({ type: e.target.value })} style={inputStyle}>
            {TYPE_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelSpan}>Horário / nota</span>
          <input type="text" value={draft.note} onChange={(e) => set({ note: e.target.value })} placeholder="Ex: 18h" style={inputStyle} />
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        <span style={labelSpan}>Data do post</span>
        <input type="date" value={draft.dateKey} onChange={(e) => set({ dateKey: e.target.value })} style={inputStyle} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        <span style={labelSpan}>Responsável por postar</span>
        <select value={draft.responsavel} onChange={(e) => set({ responsavel: e.target.value })} style={inputStyle}>
          <option value="">— Ninguém —</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        <span style={labelSpan}>Casa (imóvel)</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={draft.casaId} onChange={(e) => set({ casaId: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
            <option value="">— Nenhuma —</option>
            {(casas || []).map(c => <option key={c.id} value={c.id}>{c.code ? `${c.code} · ` : ''}{c.name}</option>)}
          </select>
          {draft.casaId && (
            <button type="button" onClick={() => onCasaInfo(draft.casaId)} title="Ver informações da casa" aria-label="Ver informações da casa" style={{ flexShrink: 0, background: '#F7FAFE', border: '1px solid #E6EDF6', borderRadius: 12, width: isMobile ? 46 : 36, height: isMobile ? 46 : 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0E7C6B', padding: 0 }}><Info size={isMobile ? 18 : 15} /></button>
          )}
        </div>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        <span style={labelSpan}>Título</span>
        <input type="text" value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="Título do post" style={isMobile ? inputStyle : { ...inputStyle, fontSize: 13.5, padding: '10px 11px' }} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        <span style={labelSpan}>Link dos materiais</span>
        <input type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" value={draft.link} onChange={(e) => set({ link: e.target.value })} placeholder="https://…" style={inputStyle} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        <span style={labelSpan}>Legenda (opcional)</span>
        <textarea rows={isMobile ? 4 : 6} value={draft.legenda} onChange={(e) => set({ legenda: e.target.value })} placeholder="Texto da legenda para o Instagram…" style={{ ...inputStyle, lineHeight: 1.5, resize: 'vertical' }} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        <span style={{ ...labelSpan, color: '#E11D48' }}>Observação (opcional)</span>
        <textarea rows={2} value={draft.observacao} onChange={(e) => set({ observacao: e.target.value })} placeholder="Ex: aguardar aprovação do corretor…" style={{ ...inputStyle, lineHeight: 1.5, resize: 'vertical' }} />
      </label>

      <div style={btn.footer}>
        <div style={btn.row}>
          <button onClick={onClose} style={btn.cancel}>Cancelar</button>
          <button onClick={() => { if (draft.title.trim()) onSave(editing, draft); }} style={btn.save}>Salvar</button>
        </div>
        {isEdit && (
          <button onClick={() => onDelete(editing)} style={btn.danger}><Trash2 size={14} /> Excluir</button>
        )}
      </div>
    </GlassModal>
  );
};

// ── Modal de legenda ──
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

// ── Modal de detalhe da casa vinculada ao post ──
const CASA_COLOR = '#0E7C6B';
const CasaInfoModal = ({ open, casa, onClose }) => {
  const btn = useModalButtons(CASA_COLOR);
  const isMobile = btn.isMobile;
  return (
  <GlassModal open={open} onClose={onClose} maxWidth={440}>
    {casa && (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
          <h3 style={{ fontSize: isMobile ? 18 : 17, fontWeight: 600, color: '#16202E', minWidth: 0 }}>{casa.name}</h3>
          <button onClick={onClose} title="Fechar" aria-label="Fechar" style={btn.close}><X size={20} /></button>
        </div>
        {casa.code && (
          <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 6, padding: '3px 9px', color: CASA_COLOR, background: 'rgba(14,124,107,0.12)', marginBottom: 14 }}>{casa.code}</span>
        )}
        {casa.description && (
          <div style={{ background: '#F7FAFE', border: '1px solid #E6EDF6', borderRadius: 12, padding: 14, fontSize: isMobile ? 14 : 13, color: '#55627A', lineHeight: 1.55, whiteSpace: 'pre-wrap', marginBottom: 16, marginTop: casa.code ? 0 : 8 }}>{casa.description}</div>
        )}
        {!casa.description && <div style={{ height: 8 }} />}
        <div style={btn.row}>
          <button onClick={onClose} style={btn.cancel}>Fechar</button>
          {casa.siteLink && (
            <a href={casa.siteLink} target="_blank" rel="noreferrer" style={{ ...btn.save, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none', boxSizing: 'border-box' }}>
              <ArrowUpRight size={isMobile ? 16 : 14} />Ver no site
            </a>
          )}
        </div>
      </>
    )}
  </GlassModal>
  );
};

// ── Modal de responsáveis ──
const SettingsModal = ({ open, people, onClose, onAdd, onRemove }) => {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const fileRef = useRef(null);
  const isMobile = useIsMobile();
  React.useEffect(() => { if (!open) { setName(''); setPhoto(''); } }, [open]);
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setPhoto(r.result);
    r.readAsDataURL(f);
  };
  const add = () => { if (!name.trim() && !photo) return; onAdd(name.trim() || 'Responsável', photo); setName(''); setPhoto(''); if (fileRef.current) fileRef.current.value = ''; };
  return (
    <GlassModal open={open} onClose={onClose} maxWidth={440}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h3 style={{ fontSize: isMobile ? 18 : 17, fontWeight: 600, color: '#16202E' }}>Responsáveis</h3>
        <button onClick={onClose} title="Fechar" aria-label="Fechar" style={{ background: 'none', border: 'none', color: '#8A94A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, margin: -8, padding: 0 }}><X size={20} /></button>
      </div>
      <p style={{ fontSize: isMobile ? 13.5 : 12.5, color: '#8A94A8', lineHeight: 1.5, marginBottom: 18 }}>Quem publica o conteúdo. A foto aparece no canto de cada post; o responsável é escolhido ao criar ou editar um post.</p>

      {people.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          {people.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid #F0F3F8' }}>
              <Avatar person={p} size={isMobile ? 40 : 36} />
              <span style={{ flex: 1, fontSize: isMobile ? 14.5 : 13.5, color: '#16202E', fontWeight: 500 }}>{p.name}</span>
              <button onClick={() => onRemove(p.id)} title="Remover" aria-label={`Remover ${p.name}`} style={{ background: 'none', border: 'none', color: '#A9B4C6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: isMobile ? 40 : 26, height: isMobile ? 40 : 26, padding: 0 }}><Trash2 size={17} /></button>
            </div>
          ))}
        </div>
      )}

      {/* No mobile o nome ganha a linha toda e o botão vira largura cheia —
          os três lado a lado deixariam o campo com ~120px. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isMobile ? 12 : 0 }}>
        <label title="Adicionar foto" style={{ width: 48, height: 48, minWidth: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', ...(photo ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { border: '1px dashed #CFE0F8', background: '#F7FAFE' }) }}>
          {!photo && <Plus size={16} color={ACCENT} />}
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
        </label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do responsável" style={{ flex: 1, minWidth: 0, padding: isMobile ? '12px 13px' : '10px 12px', border: '1px solid #E6EDF6', borderRadius: isMobile ? 12 : 10, background: '#F7FAFE', fontSize: isMobile ? 16 : 13.5, color: '#16202E' }} />
        {!isMobile && (
          <button onClick={add} style={{ padding: '10px 16px', border: 'none', background: ACCENT, color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Adicionar</button>
        )}
      </div>
      {isMobile && (
        <button onClick={add} style={{ width: '100%', padding: '14px 16px', border: 'none', background: ACCENT, color: '#fff', borderRadius: 999, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Adicionar</button>
      )}
    </GlassModal>
  );
};

// Verde do estado "postado".
const DONE = '#15935A';

// ── Card de post ──
// Além de arrastar para outro dia, aceita drop de um card do MESMO dia para
// reordenar: a metade do card onde o mouse está decide se insere acima ou
// abaixo (indicado por uma linha azul).
const PostCard = ({ entry, iso, person, casa, onCasaInfo, onEdit, onLegenda, onTogglePosted, onDragStart, onDragEnd, dragInfo, onReorder }) => {
  const { item } = entry;
  const isMobile = useIsMobile();
  const [hover, setHover] = useState(false);
  const [insertPos, setInsertPos] = useState(null); // 'before' | 'after' | null
  const done = !!item.completed;
  // Alvo de toque: 24px é pequeno demais para o polegar; no mobile vai a 40px.
  const tapSize = isMobile ? 40 : 24;
  const tapRadius = isMobile ? 12 : 9;
  const typeLabel = typeLabelOf(item);
  const link = item.primaryLink || item.secondaryLink || item.editedVideoLink;
  const isVideo = /drive\.google|youtu/.test(link || '');

  // Só reordena se o card arrastado é do mesmo dia e não é ele mesmo.
  const canReorder = () => {
    const d = dragInfo.current;
    return d && d.iso === iso && d.entry.item.id !== item.id;
  };
  const onCardDragOver = (e) => {
    if (!canReorder()) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setInsertPos(e.clientY < rect.top + rect.height / 2 ? 'before' : 'after');
  };
  const onCardDrop = (e) => {
    if (!canReorder()) return;
    e.preventDefault();
    e.stopPropagation();
    const d = dragInfo.current;
    onReorder(d.entry, entry, insertPos === 'before');
    setInsertPos(null);
  };
  const indicator = (top) => (
    <div style={{ position: 'absolute', left: 6, right: 6, [top ? 'top' : 'bottom']: -6, height: 3, borderRadius: 999, background: ACCENT, boxShadow: '0 0 6px rgba(46,109,224,0.6)', pointerEvents: 'none', zIndex: 5 }} />
  );

  // Drag & drop HTML5 não funciona em touch — no mobile o card não é
  // arrastável e a troca de dia acontece pelo campo "Data do post" no editor.
  const dragProps = isMobile ? {} : {
    draggable: true,
    onDragStart: (e) => onDragStart(e, entry, iso),
    onDragEnd,
    onDragOver: onCardDragOver,
    onDragLeave: () => setInsertPos(null),
    onDrop: onCardDrop,
    title: 'Arraste para outro dia ou para cima/baixo no mesmo dia'
  };

  return (
    <div
      {...dragProps}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: done ? 'rgba(224,246,233,0.82)' : 'rgba(255,255,255,0.66)',
        backdropFilter: 'blur(12px) saturate(160%)', WebkitBackdropFilter: 'blur(12px) saturate(160%)',
        border: `1px solid ${done ? 'rgba(21,147,90,0.45)' : (hover ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.85)')}`,
        borderRadius: 18, padding: isMobile ? '13px 14px 12px' : '11px 13px 10px',
        display: 'flex', flexDirection: 'column', gap: 3, cursor: isMobile ? 'default' : 'grab',
        boxShadow: done ? '0 4px 16px rgba(21,147,90,0.12)' : (hover ? '0 10px 26px rgba(30,84,191,0.14)' : '0 4px 16px rgba(20,40,80,0.06)'),
        transition: 'box-shadow .15s, border-color .15s, background .15s'
      }}
    >
      {insertPos === 'before' && indicator(true)}
      {insertPos === 'after' && indicator(false)}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: isMobile ? 10.5 : 9.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 6, padding: isMobile ? '3px 8px' : '2px 7px', ...(done ? { color: DONE, background: 'rgba(21,147,90,0.14)' } : badgeStyle(typeLabel)) }}>{done ? 'Postado' : typeLabel}</span>
          {casa && (
            <button onClick={(e) => { e.stopPropagation(); onCasaInfo(casa); }} title={`${casa.name} — ver informações`} style={{ display: 'inline-flex', alignItems: 'center', fontSize: isMobile ? 10.5 : 9.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 6, padding: isMobile ? '4px 9px' : '2px 7px', border: 'none', cursor: 'pointer', color: '#0E7C6B', background: 'rgba(14,124,107,0.12)' }}>{casa.code || casa.name}</button>
          )}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 5, flexShrink: 0 }}>
          {person && <Avatar person={person} size={isMobile ? 26 : 22} />}
          <button onClick={() => onTogglePosted(entry)} title={done ? 'Desmarcar' : 'Marcar como postado'} aria-label={done ? 'Desmarcar como postado' : 'Marcar como postado'} style={{ flexShrink: 0, background: done ? DONE : 'rgba(255,255,255,0.7)', border: `1px solid ${done ? DONE : 'rgba(255,255,255,0.9)'}`, borderRadius: tapRadius, width: tapSize, height: tapSize, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: done ? '#fff' : (hover ? DONE : '#8A94A8'), padding: 0 }}><Check size={isMobile ? 18 : 13} strokeWidth={3} /></button>
          <button onClick={() => onEdit(entry, iso)} title="Editar" aria-label="Editar post" style={{ flexShrink: 0, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: tapRadius, width: tapSize, height: tapSize, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: hover ? ACCENT : '#8A94A8', padding: 0 }}><Pencil size={isMobile ? 16 : 12} /></button>
        </div>
      </div>
      <div style={{ fontSize: isMobile ? 14.5 : 12.5, fontWeight: 500, color: done ? '#3B6E52' : '#16202E', lineHeight: 1.35, textDecoration: done ? 'line-through' : 'none', textDecorationColor: 'rgba(21,147,90,0.45)' }}>{item.objective}</div>
      {item.time && <div style={{ fontSize: isMobile ? 12.5 : 11, color: '#8A94A8', fontStyle: 'italic', marginTop: 1 }}>{item.time}</div>}
      {link && (
        <a href={link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: isMobile ? 13 : 11, color: ACCENT, textDecoration: 'none', fontWeight: 500, marginTop: isMobile ? 8 : 4, padding: isMobile ? '4px 0' : 0, width: 'fit-content' }}>
          <ArrowUpRight size={isMobile ? 14 : 11} />{isVideo ? 'Ver vídeo' : 'Ver materiais'}
        </a>
      )}
      {item.postCaption && (
        <button onClick={() => onLegenda(item.postCaption)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: isMobile ? 13 : 11, color: '#55627A', background: 'none', border: 'none', padding: isMobile ? '4px 0' : 0, cursor: 'pointer', fontWeight: 500, marginTop: isMobile ? 4 : 3, width: 'fit-content' }}>
          <AlignLeft size={isMobile ? 14 : 12} />Legenda
        </button>
      )}
      {item.observacao && (
        <div style={{ fontSize: isMobile ? 12 : 10.5, color: '#E11D48', opacity: 0.85, lineHeight: 1.4, marginTop: 3, fontStyle: 'italic' }}>{item.observacao}</div>
      )}
    </div>
  );
};

export const CronogramaView = ({
  planner, profileFilter, onSavePost, onDeletePost, onMovePost, onReorderPost, onTogglePosted, onAddPerson, onRemovePerson
}) => {
  const isMobile = useIsMobile();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [search, setSearch] = useState('');
  const [types, setTypes] = useState([]);
  const [casaFilter, setCasaFilter] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [editor, setEditor] = useState(null);      // { open, editing:{card,weekKey,dayId} | {dateKey} }
  const [legenda, setLegenda] = useState(null);
  const [casaInfo, setCasaInfo] = useState(null);  // casa em exibição no modal de detalhe
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dragRef = useRef(null);
  const [overCol, setOverCol] = useState(null);

  const people = planner.people || [];
  const peopleMap = useMemo(() => Object.fromEntries(people.map(p => [p.id, p])), [people]);
  const casas = planner.casas || [];
  const casasMap = useMemo(() => Object.fromEntries(casas.map(c => [c.id, c])), [casas]);
  const postsByDate = useMemo(() => getPostsByDate(planner, profileFilter), [planner, profileFilter]);

  const q = search.trim().toLowerCase();
  const filtering = q.length > 0 || types.length > 0 || casaFilter.length > 0;
  const matches = (item) => {
    const okType = !types.length || types.includes(catOf(typeLabelOf(item)));
    const okCasa = !casaFilter.length || casaFilter.includes(item.casaId);
    const hay = `${item.objective || ''} ${item.time || ''}`.toLowerCase();
    return okType && okCasa && (!q || hay.includes(q));
  };

  const curMonday = mondayOf(today);
  const curMondayIso = toDateKey(curMonday);
  const monthWeeks = weeksForMonth(month.y, month.m);

  const isSameDay = (dt) => dt.getDate() === today.getDate() && dt.getMonth() === today.getMonth() && dt.getFullYear() === today.getFullYear();
  const rangeOf = (mondayDate) => {
    const a = mondayDate, b = new Date(mondayDate); b.setDate(b.getDate() + 6);
    return a.getMonth() !== b.getMonth()
      ? `${a.getDate()} ${MONTH_SHORT[a.getMonth()]} – ${b.getDate()} ${MONTH_SHORT[b.getMonth()]}`
      : `${a.getDate()} – ${b.getDate()} ${MONTH_SHORT[b.getMonth()]}`;
  };

  // Monta as semanas do mês em sequência (1, 2, 3…). A atual fica destacada e
  // aberta, mas permanece na sua posição na ordem — não sobe para o topo.
  const weeks = monthWeeks.map((mo, idx) => {
    const wid = toDateKey(mo);
    const days = DAY_NAMES_SHORT.map((nm, i) => {
      const dt = new Date(mo); dt.setDate(mo.getDate() + i);
      const iso = toDateKey(dt);
      const inMonth = dt.getMonth() === month.m && dt.getFullYear() === month.y;
      const cards = (postsByDate[iso] || []).filter(e => matches(e.item));
      return { name: nm, iso, dateLabel: String(dt.getDate()).padStart(2, '0'), isToday: isSameDay(dt), inMonth, cards };
    });
    const count = days.reduce((s, d) => s + d.cards.length, 0);
    const isCurrent = wid === curMondayIso;
    const isOpen = isCurrent || !!expanded[wid] || filtering;
    return { id: wid, order: idx, label: `Semana ${String(idx + 1).padStart(2, '0')}`, range: rangeOf(mo), count, isCurrent, isOpen, days };
  });

  const notCurrentMonth = !(month.y === today.getFullYear() && month.m === today.getMonth());
  const totalMatches = Object.values(postsByDate).flat().filter(e => matches(e.item)).length;
  const currentWeek = weeks.find(w => w.isCurrent);
  const currentCount = currentWeek?.count || 0;
  const monthPosts = weeks.reduce((s, w) => s + w.days.reduce((a, d) => a + (d.inMonth ? d.cards.length : 0), 0), 0);
  const statusText = filtering
    ? `${totalMatches} resultado${totalMatches === 1 ? '' : 's'}`
    : (currentWeek ? `${currentCount} post${currentCount === 1 ? '' : 's'} nesta semana` : `${monthPosts} post${monthPosts === 1 ? '' : 's'} no mês`);

  // Chips de tipo presentes nos dados.
  const present = {};
  Object.values(postsByDate).flat().forEach(e => { present[catOf(typeLabelOf(e.item))] = true; });
  const chipDefs = ['Reels', 'Carrossel', 'Post', 'Motion', 'Estático', 'Lançamento', 'Stories', 'Takes'];
  const chips = chipDefs.filter(k => present[k]);

  // Chips de casa: só as casas realmente vinculadas a algum post.
  const casasPresent = {};
  Object.values(postsByDate).flat().forEach(e => { if (e.item.casaId && casasMap[e.item.casaId]) casasPresent[e.item.casaId] = true; });
  const casaChips = casas.filter(c => casasPresent[c.id]);

  const changeMonth = (delta) => {
    let y = month.y, m = month.m + delta;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setMonth({ y, m });
  };
  const toggleType = (k) => setTypes(t => t.includes(k) ? t.filter(x => x !== k) : [...t, k]);
  const toggleCasa = (id) => setCasaFilter(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id]);
  const toggleWeek = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // Drag & drop
  const onDragStart = (e, entry, iso) => { dragRef.current = { entry, iso }; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', entry.item.id); } catch {} };
  const onDragEnd = () => { dragRef.current = null; setOverCol(null); };
  // O highlight de coluna só acende ao arrastar de OUTRO dia — dentro do
  // mesmo dia o feedback é a linha de inserção no próprio card.
  const onColDragOver = (e, iso) => { if (dragRef.current) { e.preventDefault(); setOverCol(dragRef.current.iso !== iso ? iso : null); } };
  const onColDrop = (e, iso) => {
    e.preventDefault();
    const d = dragRef.current;
    if (d && d.iso !== iso) onMovePost({ card: d.entry.item, weekKey: d.entry.weekKey, dayId: d.entry.dayId }, iso);
    dragRef.current = null; setOverCol(null);
  };

  return (
    <div>
      {/* Barra de mês */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flexWrap: 'wrap', marginBottom: isMobile ? 12 : 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: isMobile ? 1 : undefined, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 16, padding: 5, boxShadow: '0 6px 18px rgba(20,40,80,0.08)' }}>
          <button onClick={() => changeMonth(-1)} title="Mês anterior" aria-label="Mês anterior" style={{ width: isMobile ? 42 : 34, height: isMobile ? 42 : 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 10, color: '#55627A', cursor: 'pointer' }}><ChevronLeft size={19} /></button>
          <div style={{ flex: isMobile ? 1 : undefined, minWidth: isMobile ? 0 : 158, textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#16202E', whiteSpace: 'nowrap' }}>{MONTH_FULL[month.m]} {month.y}</div>
          <button onClick={() => changeMonth(1)} title="Próximo mês" aria-label="Próximo mês" style={{ width: isMobile ? 42 : 34, height: isMobile ? 42 : 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 10, color: '#55627A', cursor: 'pointer' }}><ChevronRight size={19} /></button>
        </div>
        {notCurrentMonth && (
          <button onClick={() => setMonth({ y: today.getFullYear(), m: today.getMonth() })} style={{ padding: isMobile ? '10px 15px' : '8px 15px', background: '#EAF1FD', border: 'none', borderRadius: 999, color: ACCENT, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Mês atual</button>
        )}
        <span style={{ marginLeft: isMobile ? 0 : 'auto', width: isMobile ? '100%' : undefined, fontSize: 12.5, color: '#55627A', fontWeight: 500, whiteSpace: 'nowrap' }}>{statusText}</span>
      </div>

      {/* Busca + filtros + config */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14, flexWrap: 'wrap', marginBottom: isMobile ? 16 : 22 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? 0 : 200, maxWidth: isMobile ? 'none' : 300 }}>
          <Search size={15} color="#A9B4C6" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar post…" aria-label="Buscar post" style={{ width: '100%', padding: isMobile ? '12px 12px 12px 36px' : '9px 12px 9px 34px', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 14, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', fontSize: isMobile ? 16 : 13, color: '#16202E' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setFilterOpen(o => !o)} aria-label="Filtros" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: isMobile ? '11px 14px' : '9px 15px', borderRadius: 999, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', ...((types.length || casaFilter.length || filterOpen) ? { background: 'rgba(234,241,253,0.85)', color: ACCENT, borderColor: 'rgba(207,224,248,0.9)' } : { background: 'rgba(255,255,255,0.6)', color: '#55627A', borderColor: 'rgba(255,255,255,0.9)' }) }}>
            <SlidersHorizontal size={16} />{!isMobile && 'Filtros'}
            {(types.length + casaFilter.length) > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: ACCENT, color: '#fff', fontSize: 10.5, fontWeight: 700 }}>{types.length + casaFilter.length}</span>}
          </button>
          {filterOpen && (
            // No mobile o painel ancora à direita para não vazar da tela.
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', ...(isMobile ? { right: 0 } : { left: 0 }), zIndex: 60, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px) saturate(190%)', WebkitBackdropFilter: 'blur(24px) saturate(190%)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 20, boxShadow: '0 20px 48px rgba(16,32,56,0.18)', padding: 15, width: isMobile ? 'min(80vw, 272px)' : 272 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8A94A8' }}>Tipo de post</span>
                {(types.length > 0 || casaFilter.length > 0) && <button onClick={() => { setTypes([]); setCasaFilter([]); }} style={{ background: 'none', border: 'none', color: ACCENT, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Limpar</button>}
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {chips.map(k => {
                  const active = types.includes(k);
                  return <button key={k} onClick={() => toggleType(k)} style={{ padding: '5px 12px', borderRadius: 999, border: '1px solid', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', ...(active ? { background: ACCENT, color: '#fff', borderColor: ACCENT } : { background: 'rgba(255,255,255,0.6)', color: '#55627A', borderColor: 'rgba(255,255,255,0.9)' }) }}>{k}</button>;
                })}
                {chips.length === 0 && <span style={{ fontSize: 12, color: '#A9B4C6' }}>Nenhum tipo ainda</span>}
              </div>
              {casaChips.length > 0 && (
                <>
                  <div style={{ marginTop: 14, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8A94A8' }}>Casa</span>
                  </div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {casaChips.map(c => {
                      const active = casaFilter.includes(c.id);
                      return <button key={c.id} onClick={() => toggleCasa(c.id)} title={c.name} style={{ padding: '5px 12px', borderRadius: 999, border: '1px solid', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', ...(active ? { background: '#0E7C6B', color: '#fff', borderColor: '#0E7C6B' } : { background: 'rgba(255,255,255,0.6)', color: '#55627A', borderColor: 'rgba(255,255,255,0.9)' }) }}>{c.code || c.name}</button>;
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <button onClick={() => setSettingsOpen(true)} title="Responsáveis" aria-label="Responsáveis" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: isMobile ? 44 : 38, height: isMobile ? 44 : 38, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 999, color: '#55627A', cursor: 'pointer' }}><Settings size={isMobile ? 19 : 17} /></button>
      </div>

      {/* Semanas */}
      {weeks.map(week => {
        const wrapStyle = week.isCurrent
          ? { background: 'linear-gradient(155deg,rgba(255,255,255,0.85) 0%,rgba(233,242,255,0.62) 100%)', backdropFilter: 'blur(26px) saturate(190%)', WebkitBackdropFilter: 'blur(26px) saturate(190%)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: isMobile ? 22 : 28, padding: isMobile ? '15px 13px 12px' : '20px 22px 14px', boxShadow: '0 20px 54px rgba(46,109,224,0.16)', marginBottom: isMobile ? 14 : 18 }
          : { background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: isMobile ? 20 : 24, marginBottom: isMobile ? 10 : 12, overflow: 'hidden', boxShadow: '0 6px 22px rgba(20,40,80,0.07)' };
        const countPill = <span style={{ background: 'rgba(120,140,170,0.13)', color: '#55627A', fontSize: 11.5, fontWeight: 600, padding: '3px 11px', borderRadius: 999, whiteSpace: 'nowrap' }}>{week.count} posts</span>;
        return (
          <div key={week.id} style={wrapStyle}>
            {week.isCurrent ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 11, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', background: ACCENT, borderRadius: 999, padding: '4px 11px' }}>Semana atual</span>
                  {!isMobile && <span style={{ fontSize: 16, fontWeight: 600, color: '#16202E' }}>{week.label}</span>}
                  <span style={{ fontSize: isMobile ? 12.5 : 13, color: '#8A94A8' }}>{week.range}</span>
                </div>
                {countPill}
              </div>
            ) : (
              <button onClick={() => toggleWeek(week.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: isMobile ? '15px 14px' : '14px 18px', minHeight: isMobile ? 54 : undefined, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10, minWidth: 0 }}>
                  <span style={{ display: 'inline-flex', flexShrink: 0, transition: 'transform .2s', transform: week.isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}><ChevronRight size={15} color="#8A94A8" /></span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#16202E', whiteSpace: 'nowrap' }}>{week.label}</span>
                  <span style={{ fontSize: 12.5, color: '#8A94A8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{week.range}</span>
                </span>
                {countPill}
              </button>
            )}

            {week.isOpen && (
              <div style={week.isCurrent ? { marginTop: 12 } : (isMobile ? { padding: '2px 12px 14px' } : { padding: '2px 16px 16px' })}>
                {isMobile ? (
                  // No celular a grade de 7 colunas viraria um scroll horizontal
                  // de ~840px (cards de ~110px). Vira lista vertical: um bloco
                  // por dia, na largura toda da tela. Dias vazios encolhem para
                  // uma linha só, para a semana continuar navegável com o polegar.
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {week.days.map(day => {
                      const empty = day.cards.length === 0;
                      return (
                        <div key={day.iso} style={{ opacity: day.inMonth ? 1 : 0.55 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 7, marginBottom: empty ? 0 : 9, borderBottom: day.isToday ? `2px solid ${ACCENT}` : '1.5px solid #E6EDF6' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: day.isToday ? ACCENT : '#55627A' }}>{day.name}</span>
                            <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1, color: day.isToday ? ACCENT : '#9AA6B8' }}>{day.dateLabel}</span>
                            {day.isToday && <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#fff', background: ACCENT, borderRadius: 999, padding: '3px 8px' }}>Hoje</span>}
                            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                              {!empty && <span style={{ fontSize: 11.5, fontWeight: 600, color: '#8A94A8' }}>{day.cards.length}</span>}
                              <button
                                onClick={() => setEditor({ open: true, editing: { dateKey: day.iso } })}
                                title={`Novo post em ${day.name} ${day.dateLabel}`}
                                aria-label={`Novo post em ${day.name} ${day.dateLabel}`}
                                style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 11, border: '1px dashed rgba(46,109,224,0.4)', background: 'rgba(255,255,255,0.5)', color: ACCENT, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                              >
                                <Plus size={16} />
                              </button>
                            </span>
                          </div>
                          {!empty && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                              {day.cards.map(entry => (
                                <PostCard key={entry.item.id} entry={entry} iso={day.iso} person={peopleMap[entry.item.responsavel]} casa={casasMap[entry.item.casaId]} onCasaInfo={(c) => setCasaInfo(c)} onEdit={(en) => setEditor({ open: true, editing: { card: en.item, weekKey: en.weekKey, dayId: en.dayId } })} onLegenda={(t) => setLegenda(t)} onTogglePosted={onTogglePosted} onDragStart={onDragStart} onDragEnd={onDragEnd} dragInfo={dragRef} onReorder={(src, tgt, before) => onReorderPost({ card: src.item, weekKey: src.weekKey, dayId: src.dayId }, { card: tgt.item, weekKey: tgt.weekKey, dayId: tgt.dayId }, before)} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 10, alignItems: 'start', minWidth: 840 }}>
                      {week.days.map(day => (
                        <div key={day.iso} onDragOver={(e) => onColDragOver(e, day.iso)} onDrop={(e) => onColDrop(e, day.iso)} style={{ display: 'flex', flexDirection: 'column', gap: 8, borderRadius: 10, padding: 4, transition: 'background .12s', background: overCol === day.iso ? '#EAF1FD' : 'transparent' }}>
                          <div style={{ paddingBottom: 8, borderBottom: day.isToday ? `2px solid ${ACCENT}` : '1.5px solid #E6EDF6', marginBottom: 2, opacity: day.inMonth ? 1 : 0.4 }}>
                            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: day.isToday ? ACCENT : '#9AA6B8' }}>{day.name}</div>
                            <div style={{ fontSize: 19, fontWeight: 500, lineHeight: 1, marginTop: 2, color: day.isToday ? ACCENT : '#C7D2E3' }}>{day.dateLabel}</div>
                          </div>
                          {day.cards.map(entry => (
                            <PostCard key={entry.item.id} entry={entry} iso={day.iso} person={peopleMap[entry.item.responsavel]} casa={casasMap[entry.item.casaId]} onCasaInfo={(c) => setCasaInfo(c)} onEdit={(en) => setEditor({ open: true, editing: { card: en.item, weekKey: en.weekKey, dayId: en.dayId } })} onLegenda={(t) => setLegenda(t)} onTogglePosted={onTogglePosted} onDragStart={onDragStart} onDragEnd={onDragEnd} dragInfo={dragRef} onReorder={(src, tgt, before) => onReorderPost({ card: src.item, weekKey: src.weekKey, dayId: src.dayId }, { card: tgt.item, weekKey: tgt.weekKey, dayId: tgt.dayId }, before)} />
                          ))}
                          <button onClick={() => setEditor({ open: true, editing: { dateKey: day.iso } })} style={{ marginTop: 2, width: '100%', padding: 9, border: '1px dashed rgba(46,109,224,0.35)', background: 'rgba(255,255,255,0.4)', borderRadius: 14, color: ACCENT, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <Plus size={12} />Post
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {weeks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '72px 20px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#8A94A8', marginBottom: 6 }}>Nenhuma semana neste mês</div>
          <div style={{ fontSize: 13, color: '#A9B4C6' }}>Use as setas para navegar até um mês com conteúdo.</div>
        </div>
      )}

      {/* Legenda de tipos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 18, flexWrap: 'wrap', marginTop: isMobile ? 28 : 44, paddingTop: isMobile ? 16 : 22, borderTop: '1px solid #E6EDF6' }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A94A8' }}>Tipos</span>
        {[['#2E6DE0', 'Reels · Carrossel · Post'], ['#6D48C7', 'Motion'], ['#177245', 'Estático'], ['#B4530A', 'Lançamento']].map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#55627A' }}><span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: c }} />{l}</span>
        ))}
      </div>

      <PostEditor
        open={!!editor?.open}
        editing={editor?.editing}
        people={people}
        casas={casas}
        onCasaInfo={(id) => { const c = casasMap[id]; if (c) setCasaInfo(c); }}
        onClose={() => setEditor(null)}
        onSave={(editing, draft) => { onSavePost(editing, draft); setEditor(null); }}
        onDelete={(editing) => { onDeletePost(editing); setEditor(null); }}
      />
      <LegendaModal open={legenda != null} text={legenda || ''} onClose={() => setLegenda(null)} />
      <CasaInfoModal open={casaInfo != null} casa={casaInfo} onClose={() => setCasaInfo(null)} />
      <SettingsModal open={settingsOpen} people={people} onClose={() => setSettingsOpen(false)} onAdd={onAddPerson} onRemove={onRemovePerson} />
    </div>
  );
};

export default CronogramaView;
