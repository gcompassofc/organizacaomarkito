import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, ChevronLeft, ChevronRight, Search, SlidersHorizontal,
  ArrowUpRight, AlignLeft, Pencil, Copy, Check, X, Trash2, Settings
} from 'lucide-react';
import {
  MONTH_SHORT, DAY_NAMES_SHORT, weeksForMonth, mondayOf, toDateKey
} from '../lib/dates';
import { getPostsByDate } from '../lib/selectors';

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

// ── Modal genérico com o visual glass do HTML ──
const GlassModal = ({ open, onClose, maxWidth = 540, children }) => {
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
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: '#fff', width: '100%', maxWidth, borderRadius: 26, padding: 24, boxShadow: '0 30px 70px rgba(16,32,56,0.28)', maxHeight: '88vh', overflowY: 'auto' }}
        >
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  );
};

const inputStyle = { width: '100%', padding: '9px 11px', border: '1px solid #E6EDF6', borderRadius: 10, background: '#F7FAFE', fontSize: 13, color: '#16202E' };
const labelSpan = { fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8A94A8' };

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
const PostEditor = ({ open, editing, people, onClose, onSave, onDelete }) => {
  const [draft, setDraft] = useState(null);
  React.useEffect(() => {
    if (open) {
      setDraft(editing?.card ? {
        type: typeLabelOf(editing.card),
        title: editing.card.objective || '',
        note: editing.card.time || '',
        link: editing.card.primaryLink || '',
        linkLabel: 'Ver materiais',
        legenda: editing.card.postCaption || '',
        responsavel: editing.card.responsavel || ''
      } : { type: 'Reels', title: '', note: '', link: '', linkLabel: 'Ver materiais', legenda: '', responsavel: '' });
    }
  }, [open, editing]);
  if (!draft) return null;
  const set = (patch) => setDraft({ ...draft, ...patch });
  const isEdit = Boolean(editing?.card);

  return (
    <GlassModal open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#16202E' }}>{isEdit ? 'Editar post' : 'Novo post'}</h3>
        <button onClick={onClose} title="Fechar" style={{ background: 'none', border: 'none', color: '#8A94A8', cursor: 'pointer', display: 'flex', padding: 4 }}><X size={18} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
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
        <span style={labelSpan}>Responsável por postar</span>
        <select value={draft.responsavel} onChange={(e) => set({ responsavel: e.target.value })} style={inputStyle}>
          <option value="">— Ninguém —</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        <span style={labelSpan}>Título</span>
        <input type="text" value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="Título do post" style={{ ...inputStyle, fontSize: 13.5, padding: '10px 11px' }} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        <span style={labelSpan}>Link dos materiais</span>
        <input type="url" value={draft.link} onChange={(e) => set({ link: e.target.value })} placeholder="https://…" style={inputStyle} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        <span style={labelSpan}>Legenda (opcional)</span>
        <textarea rows={6} value={draft.legenda} onChange={(e) => set({ legenda: e.target.value })} placeholder="Texto da legenda para o Instagram…" style={{ ...inputStyle, lineHeight: 1.5, resize: 'vertical' }} />
      </label>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {isEdit ? (
          <button onClick={() => onDelete(editing)} style={{ background: 'none', border: 'none', color: '#E11D48', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Trash2 size={14} /> Excluir</button>
        ) : <span />}
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
          <button onClick={onClose} style={{ padding: '9px 16px', border: '1px solid #E6EDF6', background: '#fff', borderRadius: 10, color: '#55627A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => { if (draft.title.trim()) onSave(editing, draft); }} style={{ padding: '10px 22px', border: 'none', background: ACCENT, color: '#fff', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 16px rgba(46,109,224,0.28)' }}>Salvar</button>
        </div>
      </div>
    </GlassModal>
  );
};

// ── Modal de legenda ──
const LegendaModal = ({ open, text, onClose }) => {
  const [copied, setCopied] = useState(false);
  React.useEffect(() => { if (!open) setCopied(false); }, [open]);
  const copy = () => navigator.clipboard.writeText(text || '').then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  return (
    <GlassModal open={open} onClose={onClose} maxWidth={480}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#16202E' }}>Legenda do post</h3>
        <button onClick={onClose} title="Fechar" style={{ background: 'none', border: 'none', color: '#8A94A8', cursor: 'pointer', display: 'flex', padding: 4 }}><X size={18} /></button>
      </div>
      <div style={{ background: '#F7FAFE', border: '1px solid #E6EDF6', borderRadius: 12, padding: 14, fontSize: 13, color: '#55627A', lineHeight: 1.55, maxHeight: 320, overflowY: 'auto', whiteSpace: 'pre-wrap', marginBottom: 16 }}>{text}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={copy} style={{ color: '#fff', border: 'none', borderRadius: 999, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, background: copied ? '#0F766E' : ACCENT, boxShadow: '0 6px 16px rgba(46,109,224,0.28)' }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copiado!' : 'Copiar legenda'}
        </button>
      </div>
    </GlassModal>
  );
};

// ── Modal de responsáveis ──
const SettingsModal = ({ open, people, onClose, onAdd, onRemove }) => {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const fileRef = useRef(null);
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
        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#16202E' }}>Responsáveis</h3>
        <button onClick={onClose} title="Fechar" style={{ background: 'none', border: 'none', color: '#8A94A8', cursor: 'pointer', display: 'flex', padding: 4 }}><X size={18} /></button>
      </div>
      <p style={{ fontSize: 12.5, color: '#8A94A8', lineHeight: 1.5, marginBottom: 18 }}>Quem publica o conteúdo. A foto aparece no canto de cada post; o responsável é escolhido ao criar ou editar um post.</p>

      {people.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          {people.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid #F0F3F8' }}>
              <Avatar person={p} size={36} />
              <span style={{ flex: 1, fontSize: 13.5, color: '#16202E', fontWeight: 500 }}>{p.name}</span>
              <button onClick={() => onRemove(p.id)} title="Remover" style={{ background: 'none', border: 'none', color: '#A9B4C6', cursor: 'pointer', display: 'flex', padding: 5 }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label title="Adicionar foto" style={{ width: 48, height: 48, minWidth: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', ...(photo ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { border: '1px dashed #CFE0F8', background: '#F7FAFE' }) }}>
          {!photo && <Plus size={16} color={ACCENT} />}
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
        </label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do responsável" style={{ flex: 1, padding: '10px 12px', border: '1px solid #E6EDF6', borderRadius: 10, background: '#F7FAFE', fontSize: 13.5, color: '#16202E' }} />
        <button onClick={add} style={{ padding: '10px 16px', border: 'none', background: ACCENT, color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Adicionar</button>
      </div>
    </GlassModal>
  );
};

// Verde do estado "postado".
const DONE = '#15935A';

// ── Card de post ──
const PostCard = ({ entry, iso, person, onEdit, onLegenda, onTogglePosted, onDragStart, onDragEnd }) => {
  const { item } = entry;
  const [hover, setHover] = useState(false);
  const done = !!item.completed;
  const typeLabel = typeLabelOf(item);
  const link = item.primaryLink || item.secondaryLink || item.editedVideoLink;
  const isVideo = /drive\.google|youtu/.test(link || '');
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, entry, iso)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Arraste para outro dia"
      style={{
        position: 'relative',
        background: done ? 'rgba(224,246,233,0.82)' : 'rgba(255,255,255,0.66)',
        backdropFilter: 'blur(12px) saturate(160%)', WebkitBackdropFilter: 'blur(12px) saturate(160%)',
        border: `1px solid ${done ? 'rgba(21,147,90,0.45)' : (hover ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.85)')}`,
        borderRadius: 18, padding: '11px 13px 10px',
        display: 'flex', flexDirection: 'column', gap: 3, cursor: 'grab',
        boxShadow: done ? '0 4px 16px rgba(21,147,90,0.12)' : (hover ? '0 10px 26px rgba(30,84,191,0.14)' : '0 4px 16px rgba(20,40,80,0.06)'),
        transition: 'box-shadow .15s, border-color .15s, background .15s'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 6, padding: '2px 7px', ...(done ? { color: DONE, background: 'rgba(21,147,90,0.14)' } : badgeStyle(typeLabel)) }}>{done ? 'Postado' : typeLabel}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {person && <Avatar person={person} size={22} />}
          <button onClick={() => onTogglePosted(entry)} title={done ? 'Desmarcar' : 'Marcar como postado'} style={{ flexShrink: 0, background: done ? DONE : 'rgba(255,255,255,0.7)', border: `1px solid ${done ? DONE : 'rgba(255,255,255,0.9)'}`, borderRadius: 9, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: done ? '#fff' : (hover ? DONE : '#8A94A8'), padding: 0 }}><Check size={13} strokeWidth={3} /></button>
          <button onClick={() => onEdit(entry, iso)} title="Editar" style={{ flexShrink: 0, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 9, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: hover ? ACCENT : '#8A94A8', padding: 0 }}><Pencil size={12} /></button>
        </div>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: done ? '#3B6E52' : '#16202E', lineHeight: 1.35, textDecoration: done ? 'line-through' : 'none', textDecorationColor: 'rgba(21,147,90,0.45)' }}>{item.objective}</div>
      {item.time && <div style={{ fontSize: 11, color: '#8A94A8', fontStyle: 'italic', marginTop: 1 }}>{item.time}</div>}
      {link && (
        <a href={link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: ACCENT, textDecoration: 'none', fontWeight: 500, marginTop: 4, width: 'fit-content' }}>
          <ArrowUpRight size={11} />{isVideo ? 'Ver vídeo' : 'Ver materiais'}
        </a>
      )}
      {item.postCaption && (
        <button onClick={() => onLegenda(item.postCaption)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#55627A', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 500, marginTop: 3, width: 'fit-content' }}>
          <AlignLeft size={12} />Legenda
        </button>
      )}
    </div>
  );
};

export const CronogramaView = ({
  planner, profileFilter, onSavePost, onDeletePost, onMovePost, onTogglePosted, onAddPerson, onRemovePerson
}) => {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [search, setSearch] = useState('');
  const [types, setTypes] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [editor, setEditor] = useState(null);      // { open, editing:{card,weekKey,dayId} | {dateKey} }
  const [legenda, setLegenda] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dragRef = useRef(null);
  const [overCol, setOverCol] = useState(null);

  const people = planner.people || [];
  const peopleMap = useMemo(() => Object.fromEntries(people.map(p => [p.id, p])), [people]);
  const postsByDate = useMemo(() => getPostsByDate(planner, profileFilter), [planner, profileFilter]);

  const q = search.trim().toLowerCase();
  const filtering = q.length > 0 || types.length > 0;
  const matches = (item) => {
    const okType = !types.length || types.includes(catOf(typeLabelOf(item)));
    const hay = `${item.objective || ''} ${item.time || ''}`.toLowerCase();
    return okType && (!q || hay.includes(q));
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

  // Monta as semanas do mês; a atual sempre destacada e no topo.
  let weeks = monthWeeks.map((mo, idx) => {
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
  const curIdx = weeks.findIndex(w => w.isCurrent);
  if (curIdx > 0) { const cw = weeks.splice(curIdx, 1)[0]; weeks.unshift(cw); }

  const notCurrentMonth = !(month.y === today.getFullYear() && month.m === today.getMonth());
  const totalMatches = Object.values(postsByDate).flat().filter(e => matches(e.item)).length;
  const currentCount = weeks[0]?.isCurrent ? weeks[0].count : 0;
  const monthPosts = weeks.reduce((s, w) => s + w.days.reduce((a, d) => a + (d.inMonth ? d.cards.length : 0), 0), 0);
  const statusText = filtering
    ? `${totalMatches} resultado${totalMatches === 1 ? '' : 's'}`
    : (weeks[0]?.isCurrent ? `${currentCount} post${currentCount === 1 ? '' : 's'} nesta semana` : `${monthPosts} post${monthPosts === 1 ? '' : 's'} no mês`);

  // Chips de tipo presentes nos dados.
  const present = {};
  Object.values(postsByDate).flat().forEach(e => { present[catOf(typeLabelOf(e.item))] = true; });
  const chipDefs = ['Reels', 'Carrossel', 'Post', 'Motion', 'Estático', 'Lançamento', 'Stories', 'Takes'];
  const chips = chipDefs.filter(k => present[k]);

  const changeMonth = (delta) => {
    let y = month.y, m = month.m + delta;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setMonth({ y, m });
  };
  const toggleType = (k) => setTypes(t => t.includes(k) ? t.filter(x => x !== k) : [...t, k]);
  const toggleWeek = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // Drag & drop
  const onDragStart = (e, entry, iso) => { dragRef.current = { entry, iso }; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', entry.item.id); } catch {} };
  const onDragEnd = () => { dragRef.current = null; setOverCol(null); };
  const onColDragOver = (e, iso) => { if (dragRef.current) { e.preventDefault(); setOverCol(iso); } };
  const onColDrop = (e, iso) => {
    e.preventDefault();
    const d = dragRef.current;
    if (d && d.iso !== iso) onMovePost({ card: d.entry.item, weekKey: d.entry.weekKey, dayId: d.entry.dayId }, iso);
    dragRef.current = null; setOverCol(null);
  };

  return (
    <div>
      {/* Barra de mês */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 16, padding: 5, boxShadow: '0 6px 18px rgba(20,40,80,0.08)' }}>
          <button onClick={() => changeMonth(-1)} title="Mês anterior" style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 10, color: '#55627A', cursor: 'pointer' }}><ChevronLeft size={18} /></button>
          <div style={{ minWidth: 158, textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#16202E' }}>{MONTH_FULL[month.m]} {month.y}</div>
          <button onClick={() => changeMonth(1)} title="Próximo mês" style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 10, color: '#55627A', cursor: 'pointer' }}><ChevronRight size={18} /></button>
        </div>
        {notCurrentMonth && (
          <button onClick={() => setMonth({ y: today.getFullYear(), m: today.getMonth() })} style={{ padding: '8px 15px', background: '#EAF1FD', border: 'none', borderRadius: 999, color: ACCENT, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Mês atual</button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: '#55627A', fontWeight: 500, whiteSpace: 'nowrap' }}>{statusText}</span>
      </div>

      {/* Busca + filtros + config */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
          <Search size={15} color="#A9B4C6" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar post…" style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 14, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', fontSize: 13, color: '#16202E' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setFilterOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 999, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', ...((types.length || filterOpen) ? { background: 'rgba(234,241,253,0.85)', color: ACCENT, borderColor: 'rgba(207,224,248,0.9)' } : { background: 'rgba(255,255,255,0.6)', color: '#55627A', borderColor: 'rgba(255,255,255,0.9)' }) }}>
            <SlidersHorizontal size={15} />Filtros
            {types.length > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: ACCENT, color: '#fff', fontSize: 10.5, fontWeight: 700 }}>{types.length}</span>}
          </button>
          {filterOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 60, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px) saturate(190%)', WebkitBackdropFilter: 'blur(24px) saturate(190%)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 20, boxShadow: '0 20px 48px rgba(16,32,56,0.18)', padding: 15, width: 272 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8A94A8' }}>Tipo de post</span>
                {types.length > 0 && <button onClick={() => setTypes([])} style={{ background: 'none', border: 'none', color: ACCENT, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Limpar</button>}
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {chips.map(k => {
                  const active = types.includes(k);
                  return <button key={k} onClick={() => toggleType(k)} style={{ padding: '5px 12px', borderRadius: 999, border: '1px solid', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', ...(active ? { background: ACCENT, color: '#fff', borderColor: ACCENT } : { background: 'rgba(255,255,255,0.6)', color: '#55627A', borderColor: 'rgba(255,255,255,0.9)' }) }}>{k}</button>;
                })}
                {chips.length === 0 && <span style={{ fontSize: 12, color: '#A9B4C6' }}>Nenhum tipo ainda</span>}
              </div>
            </div>
          )}
        </div>
        <button onClick={() => setSettingsOpen(true)} title="Responsáveis" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 999, color: '#55627A', cursor: 'pointer' }}><Settings size={17} /></button>
      </div>

      {/* Semanas */}
      {weeks.map(week => {
        const wrapStyle = week.isCurrent
          ? { background: 'linear-gradient(155deg,rgba(255,255,255,0.85) 0%,rgba(233,242,255,0.62) 100%)', backdropFilter: 'blur(26px) saturate(190%)', WebkitBackdropFilter: 'blur(26px) saturate(190%)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 28, padding: '20px 22px 14px', boxShadow: '0 20px 54px rgba(46,109,224,0.16)', marginBottom: 18 }
          : { background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 24, marginBottom: 12, overflow: 'hidden', boxShadow: '0 6px 22px rgba(20,40,80,0.07)' };
        const countPill = <span style={{ background: 'rgba(120,140,170,0.13)', color: '#55627A', fontSize: 11.5, fontWeight: 600, padding: '3px 11px', borderRadius: 999, whiteSpace: 'nowrap' }}>{week.count} posts</span>;
        return (
          <div key={week.id} style={wrapStyle}>
            {week.isCurrent ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', background: ACCENT, borderRadius: 999, padding: '4px 11px' }}>Semana atual</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#16202E' }}>{week.label}</span>
                  <span style={{ fontSize: 13, color: '#8A94A8' }}>{week.range}</span>
                </div>
                {countPill}
              </div>
            ) : (
              <button onClick={() => toggleWeek(week.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ display: 'inline-flex', transition: 'transform .2s', transform: week.isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}><ChevronRight size={14} color="#8A94A8" /></span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#16202E' }}>{week.label}</span>
                  <span style={{ fontSize: 12.5, color: '#8A94A8' }}>{week.range}</span>
                </span>
                {countPill}
              </button>
            )}

            {week.isOpen && (
              <div style={week.isCurrent ? { marginTop: 12 } : { padding: '2px 16px 16px' }}>
                <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 10, alignItems: 'start', minWidth: 840 }}>
                    {week.days.map(day => (
                      <div key={day.iso} onDragOver={(e) => onColDragOver(e, day.iso)} onDrop={(e) => onColDrop(e, day.iso)} style={{ display: 'flex', flexDirection: 'column', gap: 8, borderRadius: 10, padding: 4, transition: 'background .12s', background: overCol === day.iso ? '#EAF1FD' : 'transparent' }}>
                        <div style={{ paddingBottom: 8, borderBottom: day.isToday ? `2px solid ${ACCENT}` : '1.5px solid #E6EDF6', marginBottom: 2, opacity: day.inMonth ? 1 : 0.4 }}>
                          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: day.isToday ? ACCENT : '#9AA6B8' }}>{day.name}</div>
                          <div style={{ fontSize: 19, fontWeight: 500, lineHeight: 1, marginTop: 2, color: day.isToday ? ACCENT : '#C7D2E3' }}>{day.dateLabel}</div>
                        </div>
                        {day.cards.map(entry => (
                          <PostCard key={entry.item.id} entry={entry} iso={day.iso} person={peopleMap[entry.item.responsavel]} onEdit={(en, iso) => setEditor({ open: true, editing: { card: en.item, weekKey: en.weekKey, dayId: en.dayId } })} onLegenda={(t) => setLegenda(t)} onTogglePosted={onTogglePosted} onDragStart={onDragStart} onDragEnd={onDragEnd} />
                        ))}
                        <button onClick={() => setEditor({ open: true, editing: { dateKey: day.iso } })} style={{ marginTop: 2, width: '100%', padding: 9, border: '1px dashed rgba(46,109,224,0.35)', background: 'rgba(255,255,255,0.4)', borderRadius: 14, color: ACCENT, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <Plus size={12} />Post
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginTop: 44, paddingTop: 22, borderTop: '1px solid #E6EDF6' }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A94A8' }}>Tipos</span>
        {[['#2E6DE0', 'Reels · Carrossel · Post'], ['#6D48C7', 'Motion'], ['#177245', 'Estático'], ['#B4530A', 'Lançamento']].map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#55627A' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{l}</span>
        ))}
      </div>

      <PostEditor
        open={!!editor?.open}
        editing={editor?.editing}
        people={people}
        onClose={() => setEditor(null)}
        onSave={(editing, draft) => { onSavePost(editing, draft); setEditor(null); }}
        onDelete={(editing) => { onDeletePost(editing); setEditor(null); }}
      />
      <LegendaModal open={legenda != null} text={legenda || ''} onClose={() => setLegenda(null)} />
      <SettingsModal open={settingsOpen} people={people} onClose={() => setSettingsOpen(false)} onAdd={onAddPerson} onRemove={onRemovePerson} />
    </div>
  );
};

export default CronogramaView;
