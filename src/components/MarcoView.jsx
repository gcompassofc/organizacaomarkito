import React, { useCallback, useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import {
  Plus, ArrowUpRight, Pencil, X, Trash2, Check, AlignLeft, Video,
  RotateCcw, MessageSquareWarning, Undo2, Copy
} from 'lucide-react';
import { useIsMobile } from '../lib/useIsMobile';
import { GlassModal, useInputStyle, useModalButtons, labelSpan } from './ui/GlassModal';

// Vermelho de REC — mesma cor da aba "Marco" na nav. Usado tanto pro badge
// "Gravar" quanto pra ação de arrastar/tocar em "gravar" no modo cartão.
const REC = '#D6294B';
const DONE = '#15935A';
// Âmbar: estado intermediário "precisa refazer" — nem pendente, nem gravado.
const REFAZER = '#D97706';

// Pilha de cards: cada card de fundo desce STACK_STEP e encolhe 5%, então o
// mais baixo sobra ~STACK_PEEK abaixo do card da frente. Como os cards são
// `position: absolute`, o contêiner NÃO cresce junto — quem vem depois na
// coluna precisa descontar essa sobra, senão encosta na pilha.
const STACK_STEP = 22;
const STACK_PEEK = 24;

// Copia texto pra área de transferência. A API moderna exige contexto seguro
// (https/localhost) e gesto do usuário; o fallback com textarea + execCommand
// cobre navegador antigo e http. Devolve se deu certo, pro botão avisar.
const copyText = async (text) => {
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* cai no fallback abaixo */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length); // iOS ignora só o select()
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
};

// Botão de copiar com retorno visual ("Copiado!" por 2s). `variant` 'inline'
// é o link discreto dos cards; 'pill' é o botão com borda dos modais.
// `stopDrag` impede que o toque no botão vire arrasto do card da pilha.
const CopyTextButton = ({ text, variant = 'inline', color = REC, label = 'Copiar texto', stopDrag = false }) => {
  const isMobile = useIsMobile();
  const [state, setState] = useState('idle'); // idle | ok | erro
  const timer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const handle = async (e) => {
    e.stopPropagation();
    const ok = await copyText(text);
    setState(ok ? 'ok' : 'erro');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2000);
  };

  const shown = state === 'ok' ? 'Copiado!' : state === 'erro' ? 'Não deu — copie na mão' : label;
  const tone = state === 'ok' ? DONE : state === 'erro' ? '#E11D48' : color;
  const Icon = state === 'ok' ? Check : Copy;

  // minHeight 44 no mobile: alvo de toque confortável sem precisar de moldura.
  const inline = {
    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: isMobile ? 13 : 12.5,
    color: tone, background: 'none', border: 'none', padding: isMobile ? '6px 2px' : '2px',
    minHeight: isMobile ? 44 : undefined,
    cursor: 'pointer', fontWeight: 600, width: 'fit-content'
  };
  const pill = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: isMobile ? '13px 16px' : '9px 14px', width: isMobile ? '100%' : 'auto',
    border: `1px solid ${state === 'idle' ? '#E6EDF6' : tone}`, background: '#fff',
    borderRadius: isMobile ? 12 : 10, color: tone, fontSize: isMobile ? 15 : 13,
    fontWeight: 600, cursor: 'pointer', boxSizing: 'border-box'
  };

  return (
    <button
      onPointerDownCapture={stopDrag ? (e) => e.stopPropagation() : undefined}
      onClick={handle}
      aria-label={label}
      style={variant === 'pill' ? pill : inline}
    >
      <Icon size={isMobile ? 14 : 12.5} strokeWidth={state === 'ok' ? 3 : 2} />{shown}
    </button>
  );
};

// ── Modal de cadastro/edição (título, texto e link) ──
// Usado tanto pra criar uma gravação nova quanto pra editar qualquer item,
// em qualquer fila (pendente, refação ou gravado).
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

// Modal com o texto do vídeo em tela cheia — usado a partir do card no modo
// pilha ("Ler tudo") e nas listas de Refação/Gravados.
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
          <div style={{ background: '#F7FAFE', border: '1px solid #E6EDF6', borderRadius: 12, padding: 14, fontSize: isMobile ? 15 : 13.5, color: '#55627A', lineHeight: 1.65, maxHeight: isMobile ? '52dvh' : 380, overflowY: 'auto', whiteSpace: 'pre-wrap', marginBottom: 16 }}>{gravacao.script || 'Sem texto cadastrado.'}</div>
          <div style={btn.row}>
            <button onClick={onClose} style={btn.cancel}>Fechar</button>
            {gravacao.script && <CopyTextButton text={gravacao.script} variant="pill" />}
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

// ── Modal de aceite (swipe/toque pra DIREITA) ──
// Tudo que o Marco precisa pra executar: ler o texto, abrir a pasta onde
// sobe o vídeo e confirmar. O link de upload é cadastrado pela equipe na
// gravação — aqui ele só é aberto, nunca digitado.
const AcceptModal = ({ open, gravacao, onCancel, onConfirm }) => {
  const btn = useModalButtons(DONE);
  const isMobile = btn.isMobile;

  return (
    <GlassModal open={open} onClose={onCancel} maxWidth={520}>
      {gravacao && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 999, background: 'rgba(21,147,90,0.14)', color: DONE, flexShrink: 0 }}>
              <Check size={16} strokeWidth={3} />
            </span>
            <h3 style={{ fontSize: isMobile ? 18 : 17, fontWeight: 600, color: '#16202E', minWidth: 0 }}>Vou gravar</h3>
          </div>
          <p style={{ fontSize: isMobile ? 15 : 13.5, fontWeight: 600, color: '#16202E', margin: '10px 0 10px' }}>{gravacao.title}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <AlignLeft size={12} color="#8A94A8" />
            <span style={labelSpan}>Texto do vídeo</span>
            {gravacao.script && (
              <span style={{ marginLeft: 'auto' }}>
                <CopyTextButton text={gravacao.script} label="Copiar" />
              </span>
            )}
          </div>
          <div style={{ background: '#F7FAFE', border: '1px solid #E6EDF6', borderRadius: 12, padding: 13, fontSize: isMobile ? 14.5 : 13, color: '#55627A', lineHeight: 1.6, maxHeight: isMobile ? '32dvh' : 220, overflowY: 'auto', whiteSpace: 'pre-wrap', marginBottom: 16 }}>
            {gravacao.script || 'Sem texto cadastrado.'}
          </div>

          {gravacao.uploadLink ? (
            <a
              href={gravacao.uploadLink} target="_blank" rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: isMobile ? '14px 18px' : '11px 18px', marginBottom: 20,
                border: `1.5px solid ${REC}`, borderRadius: 999, background: '#fff',
                color: REC, fontSize: isMobile ? 15 : 13.5, fontWeight: 600, textDecoration: 'none'
              }}
            >
              <ArrowUpRight size={isMobile ? 18 : 16} strokeWidth={2.5} />Subir vídeo
            </a>
          ) : (
            <p style={{ fontSize: isMobile ? 13.5 : 12.5, color: '#A9B4C6', margin: '0 0 20px', textAlign: 'center' }}>
              Sem link de upload cadastrado — adicione no lápis do card.
            </p>
          )}

          <div style={btn.row}>
            <button onClick={onCancel} style={btn.cancel}>Cancelar</button>
            <button onClick={() => onConfirm(gravacao)} style={btn.save}>Marcar como OK</button>
          </div>
        </>
      )}
    </GlassModal>
  );
};

// ── Modal de refação (swipe/toque pra ESQUERDA) ──
// O Marco deixa a observação do que precisa mudar; o item sai da pilha dele
// e cai na fila que a equipe acompanha.
const RefazerModal = ({ open, gravacao, onCancel, onConfirm }) => {
  const [nota, setNota] = useState('');
  const inputStyle = useInputStyle();
  const btn = useModalButtons(REFAZER);
  const isMobile = btn.isMobile;
  React.useEffect(() => { if (open) setNota(gravacao?.notaRefazer || ''); }, [open, gravacao]);

  return (
    <GlassModal open={open} onClose={onCancel} maxWidth={480}>
      {gravacao && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 999, background: 'rgba(217,119,6,0.14)', color: REFAZER, flexShrink: 0 }}>
              <RotateCcw size={15} strokeWidth={2.5} />
            </span>
            <h3 style={{ fontSize: isMobile ? 18 : 17, fontWeight: 600, color: '#16202E', minWidth: 0 }}>Precisa refazer</h3>
          </div>
          <p style={{ fontSize: isMobile ? 15 : 13.5, fontWeight: 600, color: '#16202E', margin: '10px 0 14px' }}>{gravacao.title}</p>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            <span style={labelSpan}>O que precisa ajustar?</span>
            <textarea rows={isMobile ? 5 : 5} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ex: trocar o texto, o imóvel já vendeu, gravar em outro cômodo…" style={{ ...inputStyle, lineHeight: 1.55, resize: 'vertical' }} autoFocus />
          </label>

          <div style={btn.row}>
            <button onClick={onCancel} style={btn.cancel}>Cancelar</button>
            <button
              onClick={() => nota.trim() && onConfirm(gravacao, nota)}
              disabled={!nota.trim()}
              style={{ ...btn.save, opacity: nota.trim() ? 1 : 0.45, cursor: nota.trim() ? 'pointer' : 'default' }}
            >
              Enviar para refação
            </button>
          </div>
        </>
      )}
    </GlassModal>
  );
};

// ── Card arrastável (o de cima da pilha) ──
// `exitDirection` é controlado pelo pai: fica null em repouso, vira
// 'right'/'left' assim que o limite de arrasto é cruzado (ou os botões são
// tocados) e volta a null se a ação for cancelada no modal — o card então
// anima de volta pro centro sozinho, porque a `animate` prop reage à mudança.
const SwipeCard = ({ gravacao, exitDirection, draggable, onSwipeRight, onSwipeLeft, onOpenScript, onEdit }) => {
  const isMobile = useIsMobile();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-14, 14]);
  const gravarOpacity = useTransform(x, [24, 130], [0, 1]);
  const refazerOpacity = useTransform(x, [-130, -24], [1, 0]);

  const handleDragEnd = (_, info) => {
    if (exitDirection) return;
    const DIST = 110;   // arrasto curto e decidido já vale
    const FLICK = 650;  // ou um peteleco rápido
    // A velocidade só conta se o card também ESTIVER daquele lado: sem isso,
    // arrastar pra direita e voltar correndo pro centro dispara "refazer",
    // porque na volta a velocidade fica negativa.
    const { x: dx } = info.offset;
    const { x: vx } = info.velocity;
    if (dx > DIST || (vx > FLICK && dx > 40)) onSwipeRight(gravacao);
    else if (dx < -DIST || (vx < -FLICK && dx < -40)) onSwipeLeft(gravacao);
  };

  const target = exitDirection === 'right'
    ? { x: 620, opacity: 0, rotate: 20 }
    : exitDirection === 'left'
      ? { x: -620, opacity: 0, rotate: -20 }
      : { x: 0, opacity: 1, rotate: 0 };

  const stop = (e) => e.stopPropagation();

  return (
    <motion.div
      drag={draggable ? 'x' : false}
      dragDirectionLock
      onDragEnd={handleDragEnd}
      style={{ x, rotate, position: 'absolute', inset: 0, zIndex: 20, touchAction: 'pan-y' }}
      animate={target}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <div
        style={{
          position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
          background: '#fff', borderRadius: 26, border: '1px solid rgba(230,237,246,0.9)',
          boxShadow: '0 18px 40px rgba(20,40,80,0.14)', overflow: 'hidden',
          cursor: draggable ? 'grab' : 'default', userSelect: 'none'
        }}
      >
        {/* Selos GRAVAR / REFAZER, aparecem conforme o arrasto. Ficam abaixo
            da linha do lápis pra não brigar com ele no canto superior. */}
        <motion.div style={{ opacity: gravarOpacity, position: 'absolute', top: 64, left: 20, zIndex: 2, border: `3px solid ${DONE}`, color: DONE, borderRadius: 10, padding: '5px 12px', fontSize: 15, fontWeight: 800, letterSpacing: '0.06em', transform: 'rotate(-10deg)', textTransform: 'uppercase', background: 'rgba(255,255,255,0.92)' }}>Gravar</motion.div>
        <motion.div style={{ opacity: refazerOpacity, position: 'absolute', top: 64, right: 20, zIndex: 2, border: `3px solid ${REFAZER}`, color: REFAZER, borderRadius: 10, padding: '5px 12px', fontSize: 15, fontWeight: 800, letterSpacing: '0.06em', transform: 'rotate(10deg)', textTransform: 'uppercase', background: 'rgba(255,255,255,0.92)' }}>Refazer</motion.div>

        <button
          onPointerDownCapture={stop}
          onClick={(e) => { stop(e); onEdit(gravacao); }}
          title="Editar" aria-label="Editar gravação"
          style={{ position: 'absolute', top: 14, right: 14, zIndex: 3, width: 34, height: 34, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.85)', boxShadow: '0 2px 8px rgba(20,40,80,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A94A8', cursor: 'pointer' }}
        >
          <Pencil size={14} />
        </button>

        <div style={{ padding: isMobile ? '52px 20px 18px' : '48px 24px 18px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: REC, marginBottom: 10, width: 'fit-content' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: REC }} />
            Para gravar
          </span>

          <h3 style={{ fontSize: isMobile ? 20 : 19, fontWeight: 700, color: '#16202E', lineHeight: 1.28, marginBottom: 14 }}>{gravacao.title}</h3>

          <div style={{ flex: 1, minHeight: 0, background: '#F7FAFE', border: '1px solid #E6EDF6', borderRadius: 14, padding: 14, overflow: 'hidden', position: 'relative' }}>
            <p style={{
              fontSize: isMobile ? 14.5 : 13.5, color: '#55627A', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0,
              display: '-webkit-box', WebkitLineClamp: isMobile ? 6 : 8, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {gravacao.script || 'Sem texto cadastrado — toque no lápis pra adicionar.'}
            </p>
          </div>

          {gravacao.script && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 12 }}>
              <button
                onPointerDownCapture={stop}
                onClick={(e) => { stop(e); onOpenScript(gravacao); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: REC, background: 'none', border: 'none', padding: isMobile ? '6px 2px' : '2px', minHeight: isMobile ? 44 : undefined, cursor: 'pointer', fontWeight: 600, width: 'fit-content' }}
              >
                Ler texto completo
              </button>
              <span style={{ width: 1, height: 12, background: '#E6EDF6' }} />
              <CopyTextButton text={gravacao.script} label="Copiar" color="#55627A" stopDrag />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Pilha: só o card de cima é interativo (arrastável); os de trás são só o
// "lombo" visual, pra dar profundidade de pilha estilo Tinder.
const SwipeStack = ({ items, height, pendingId, pendingDirection, onSwipeRight, onSwipeLeft, onOpenScript, onEdit }) => {
  const visible = items.slice(0, 3);
  // width 100% é obrigatório: todos os cards são `position: absolute`, então
  // sem largura explícita este contêiner colapsa pra zero e a pilha some.
  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      {visible.map((g, i) => {
        if (i === 0) {
          return (
            <SwipeCard
              key={g.id}
              gravacao={g}
              draggable={!pendingId}
              exitDirection={pendingId === g.id ? pendingDirection : null}
              onSwipeRight={onSwipeRight}
              onSwipeLeft={onSwipeLeft}
              onOpenScript={onOpenScript}
              onEdit={onEdit}
            />
          );
        }
        // Cards de trás: só o "lombo" da pilha, mas com o título do próximo
        // conteúdo — enquanto o de cima está sendo arrastado, o que aparece
        // atrás precisa parecer conteúdo de verdade, não um retângulo vazio.
        return (
          <div
            key={g.id}
            style={{
              position: 'absolute', inset: 0, borderRadius: 26, overflow: 'hidden',
              background: '#fff', border: '1px solid rgba(230,237,246,0.9)',
              boxShadow: '0 10px 26px rgba(20,40,80,0.07)',
              // Escala + descida suficientes pra "aparecer" por baixo do card
              // da frente: só o deslocamento não basta, a escala come a sobra.
              transform: `translateY(${i * STACK_STEP}px) scale(${1 - i * 0.05})`,
              // O card fica opaco (senão o título do card de trás vaza por
              // cima); quem esmaece é só o conteúdo dele.
              zIndex: 10 - i, padding: '48px 24px 0'
            }}
          >
            <div style={{ opacity: 1 - i * 0.45 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: REC, marginBottom: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: REC }} />
                Para gravar
              </span>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: '#16202E', lineHeight: 1.28, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{g.title}</h3>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Cards das filas de Refação e Gravados (visão em lista, sem arrasto) ──
const RefacaoCard = React.memo(({ gravacao, onEdit, onResolve, onOpenScript }) => {
  const [hover, setHover] = useState(false);
  const isMobile = useIsMobile();
  const tapSize = isMobile ? 40 : 26;
  const tapRadius = isMobile ? 12 : 9;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', background: 'rgba(255,251,240,0.82)',
        border: `1px solid ${hover ? 'rgba(217,119,6,0.55)' : 'rgba(217,119,6,0.3)'}`,
        borderRadius: 18, padding: isMobile ? '14px 15px 13px' : '13px 15px 12px',
        display: 'flex', flexDirection: 'column', gap: 6,
        boxShadow: hover ? '0 10px 26px rgba(217,119,6,0.14)' : '0 4px 16px rgba(217,119,6,0.08)',
        transition: 'box-shadow .15s, border-color .15s'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: isMobile ? 10.5 : 9.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 6, padding: isMobile ? '3px 8px' : '2px 7px', color: REFAZER, background: 'rgba(217,119,6,0.14)' }}>
          <RotateCcw size={11} strokeWidth={2.5} />Refazer
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 5, flexShrink: 0 }}>
          <button onClick={() => onEdit(gravacao)} title="Editar" aria-label={`Editar ${gravacao.title}`} style={{ flexShrink: 0, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: tapRadius, width: tapSize, height: tapSize, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: hover ? REFAZER : '#8A94A8', padding: 0 }}><Pencil size={isMobile ? 16 : 13} /></button>
        </div>
      </div>

      <div style={{ fontSize: isMobile ? 15 : 13.5, fontWeight: 600, color: '#16202E', lineHeight: 1.35 }}>{gravacao.title}</div>

      {gravacao.notaRefazer && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, background: 'rgba(217,119,6,0.09)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 10, padding: '8px 10px', marginTop: 2 }}>
          <MessageSquareWarning size={13} color={REFAZER} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: isMobile ? 13.5 : 12, color: '#7A4A06', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>"{gravacao.notaRefazer}"</p>
        </div>
      )}

      {gravacao.script && (
        <button onClick={() => onOpenScript(gravacao)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: isMobile ? 13 : 11.5, color: '#55627A', background: 'none', border: 'none', padding: isMobile ? '4px 0' : 0, cursor: 'pointer', fontWeight: 500, marginTop: isMobile ? 2 : 1, width: 'fit-content' }}>
          <AlignLeft size={isMobile ? 14 : 12} />Ver texto
        </button>
      )}

      <button
        onClick={() => onResolve(gravacao)}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: isMobile ? 8 : 6, padding: isMobile ? '10px 14px' : '8px 13px', border: 'none', borderRadius: 999, background: REFAZER, color: '#fff', fontSize: isMobile ? 13.5 : 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(217,119,6,0.28)' }}
      >
        <Undo2 size={13} />Ajustado — reenviar pro Marco
      </button>
    </div>
  );
});
RefacaoCard.displayName = 'RefacaoCard';

const GravacaoCard = React.memo(({ gravacao, onEdit, onToggleDone, onOpenScript }) => {
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
});
GravacaoCard.displayName = 'GravacaoCard';

// Botão circular grande de ação abaixo da pilha — funciona como alternativa
// ao arrasto (clique/toque simples), essencial no desktop e pra quem prefere
// não arrastar no celular.
const StackActionButton = ({ color, Icon, label, onClick, disabled }) => {
  const isMobile = useIsMobile();
  const size = isMobile ? 60 : 54;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1
      }}
    >
      <span style={{
        width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fff', border: `2px solid ${color}`, color,
        boxShadow: `0 8px 20px ${color}33`
      }}>
        <Icon size={isMobile ? 26 : 22} strokeWidth={2.5} />
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#55627A' }}>{label}</span>
    </button>
  );
};

// ── View do Marco ──
// Modo cartão: o Marco vê um conteúdo por vez, arrasta pra direita pra
// aceitar gravar (ou toca no ✓), ou pra esquerda quando precisa refazer algo
// (ou toca no ✕). Abaixo da pilha ficam as filas de Refação (aguardando a
// equipe ajustar) e Gravados (concluídos).
export const MarcoView = ({ gravacoes, onSave, onDelete, onToggleDone, onComplete, onSendRefazer, onResolveRefazer }) => {
  const isMobile = useIsMobile();
  const [modal, setModal] = useState(null);           // { open, editing: gravacao|null }
  const [script, setScript] = useState(null);         // gravação com o roteiro aberto
  const [confirming, setConfirming] = useState(null); // gravação aguardando confirmação de exclusão
  const [pending, setPending] = useState(null);        // { gravacao, direction } — card em decisão

  const pendentes = useMemo(() => gravacoes.filter(g => !g.done && !g.precisaRefazer), [gravacoes]);
  const emRefacao = useMemo(() => gravacoes.filter(g => g.precisaRefazer), [gravacoes]);
  const gravados = useMemo(() => gravacoes.filter(g => g.done), [gravacoes]);

  const grid = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(258px,1fr))', gap: isMobile ? 10 : 12 };
  const stackHeight = isMobile ? 420 : 440;

  const handleSwipeRight = useCallback((g) => setPending({ gravacao: g, direction: 'right' }), []);
  const handleSwipeLeft = useCallback((g) => setPending({ gravacao: g, direction: 'left' }), []);
  const cancelPending = useCallback(() => setPending(null), []);
  const openScript = useCallback((g) => setScript(g), []);
  const openEdit = useCallback((g) => setModal({ open: true, editing: g }), []);

  const confirmAccept = (g) => {
    onComplete(g);
    setPending(null);
  };
  const confirmRefazer = (g, nota) => {
    if (!nota || !nota.trim()) return;
    onSendRefazer(g, nota);
    setPending(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flexWrap: 'wrap', marginBottom: isMobile ? 16 : 20 }}>
        {!isMobile && <p style={{ color: '#55627A', fontSize: 13, maxWidth: 560, margin: 0 }}>Arraste o card pra direita pra gravar, ou pra esquerda se precisa refazer algo.</p>}
        <span style={{ marginLeft: isMobile ? 0 : 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: '#55627A', fontWeight: 500, whiteSpace: 'nowrap' }}>
          <span>{pendentes.length} para gravar</span>
          {emRefacao.length > 0 && <span style={{ color: REFAZER }}>· {emRefacao.length} em refação</span>}
        </span>
        <button onClick={() => setModal({ open: true, editing: null })} aria-label="Nova gravação" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 6, padding: isMobile ? '0 16px' : '9px 15px', height: isMobile ? 44 : undefined, border: 'none', background: REC, color: '#fff', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 16px rgba(214,41,75,0.28)' }}><Plus size={16} />Gravação</button>
      </div>

      {/* Pilha estilo cartão */}
      {pendentes.length > 0 ? (
        <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: STACK_PEEK + (isMobile ? 24 : 28) }}>
          <SwipeStack
            items={pendentes}
            height={stackHeight}
            pendingId={pending?.gravacao.id}
            pendingDirection={pending?.direction}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            onOpenScript={openScript}
            onEdit={openEdit}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 44 : 56 }}>
            <StackActionButton color={REFAZER} Icon={X} label="Refazer" disabled={!!pending} onClick={() => handleSwipeLeft(pendentes[0])} />
            <StackActionButton color={DONE} Icon={Check} label="Gravar" disabled={!!pending} onClick={() => handleSwipeRight(pendentes[0])} />
          </div>
        </div>
      ) : (
        gravacoes.length > 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px 8px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: DONE, marginBottom: 4 }}>Tudo revisado 🎉</div>
            <div style={{ fontSize: 13, color: '#A9B4C6' }}>Nenhum conteúdo esperando decisão no momento.</div>
          </div>
        )
      )}

      {gravacoes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '72px 20px' }}>
          <Video size={30} color="#C7D2E3" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#8A94A8', marginBottom: 6 }}>Nada para gravar ainda</div>
          <div style={{ fontSize: 13, color: '#A9B4C6' }}>Clique em "Gravação" para adicionar o primeiro vídeo.</div>
        </div>
      )}

      {/* Fila de Refação — acompanhada pela equipe */}
      {emRefacao.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: isMobile ? 34 : 42, marginBottom: isMobile ? 12 : 14 }}>
            <RotateCcw size={13} color={REFAZER} />
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: REFAZER, whiteSpace: 'nowrap' }}>Refação ({emRefacao.length})</span>
            <span style={{ flex: 1, height: 1, background: '#E6EDF6' }} />
          </div>
          <div style={grid}>
            {emRefacao.map(g => (
              <RefacaoCard key={g.id} gravacao={g} onEdit={openEdit} onResolve={onResolveRefazer} onOpenScript={openScript} />
            ))}
          </div>
        </>
      )}

      {/* Gravados */}
      {gravados.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: isMobile ? 34 : 42, marginBottom: isMobile ? 12 : 14 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A94A8', whiteSpace: 'nowrap' }}>Gravados ({gravados.length})</span>
            <span style={{ flex: 1, height: 1, background: '#E6EDF6' }} />
          </div>
          <div style={grid}>
            {gravados.map(g => (
              <GravacaoCard key={g.id} gravacao={g} onEdit={openEdit} onToggleDone={onToggleDone} onOpenScript={openScript} />
            ))}
          </div>
        </>
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
      <AcceptModal
        open={!!pending && pending.direction === 'right'}
        gravacao={pending?.gravacao}
        onCancel={cancelPending}
        onConfirm={confirmAccept}
      />
      <RefazerModal
        open={!!pending && pending.direction === 'left'}
        gravacao={pending?.gravacao}
        onCancel={cancelPending}
        onConfirm={confirmRefazer}
      />
    </div>
  );
};

export default MarcoView;
