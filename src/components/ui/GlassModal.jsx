import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useIsMobile } from '../../lib/useIsMobile';

export const ACCENT = '#2E6DE0';

// Modal glass compartilhado por Cronograma, Gavetas e Casas.
// No mobile vira bottom sheet: sobe de baixo, encosta nas laterais e usa
// 100dvh como referência (dvh acompanha a barra do navegador, ao contrário de
// vh). O corpo rola sozinho, então o teclado empurra o conteúdo em vez de
// cobri-lo.
export const GlassModal = ({ open, onClose, maxWidth = 540, children }) => {
  const isMobile = useIsMobile();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // Trava o scroll do fundo — sem isso o toque no sheet arrasta a página
    // inteira atrás dele.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const sheet = {
    background: '#fff', width: '100%',
    borderRadius: '24px 24px 0 0',
    padding: '10px 18px calc(20px + env(safe-area-inset-bottom))',
    boxShadow: '0 -10px 40px rgba(16,32,56,0.24)',
    maxHeight: '92dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch'
  };
  const dialog = {
    background: '#fff', width: '100%', maxWidth, borderRadius: 26, padding: 24,
    boxShadow: '0 30px 70px rgba(16,32,56,0.28)', maxHeight: '88vh', overflowY: 'auto'
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(12,22,45,0.30)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
            zIndex: 1000, padding: isMobile ? 0 : 20
          }}
        >
          <motion.div
            initial={isMobile ? { y: '100%' } : { opacity: 0, y: 10 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, y: 0 }}
            exit={isMobile ? { y: '100%' } : { opacity: 0, y: 10 }}
            transition={isMobile ? { type: 'spring', bounce: 0, duration: 0.34 } : undefined}
            onClick={(e) => e.stopPropagation()}
            style={isMobile ? sheet : dialog}
          >
            {isMobile && (
              <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 12 }}>
                <span style={{ width: 38, height: 4, borderRadius: 999, background: '#DDE5F0' }} />
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// 16px é o mínimo que o iOS aceita sem dar zoom automático ao focar o campo.
// Abaixo disso o Safari amplia a página e o usuário fica preso num layout
// deslocado — por isso o input cresce no mobile em vez de encolher.
export const useInputStyle = () => {
  const isMobile = useIsMobile();
  return isMobile
    ? { width: '100%', padding: '12px 13px', border: '1px solid #E6EDF6', borderRadius: 12, background: '#F7FAFE', fontSize: 16, color: '#16202E' }
    : { width: '100%', padding: '9px 11px', border: '1px solid #E6EDF6', borderRadius: 10, background: '#F7FAFE', fontSize: 13, color: '#16202E' };
};

export const labelSpan = { fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8A94A8' };

// Botões de ação dos modais: no mobile empilham, ocupam a largura toda e têm
// ~48px de altura, para caber o polegar. A ordem inverte (column-reverse) para
// a ação primária ficar embaixo, mais perto da mão.
export const useModalButtons = (accent = ACCENT) => {
  const isMobile = useIsMobile();
  return {
    isMobile,
    row: isMobile
      ? { display: 'flex', flexDirection: 'column-reverse', gap: 10 }
      : { display: 'flex', gap: 10, marginLeft: 'auto' },
    cancel: isMobile
      ? { width: '100%', padding: '13px 16px', border: '1px solid #E6EDF6', background: '#fff', borderRadius: 12, color: '#55627A', fontSize: 15, fontWeight: 600, cursor: 'pointer' }
      : { padding: '9px 16px', border: '1px solid #E6EDF6', background: '#fff', borderRadius: 10, color: '#55627A', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    save: isMobile
      ? { width: '100%', padding: '14px 22px', border: 'none', background: accent, color: '#fff', borderRadius: 999, fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: `0 6px 16px ${accent}47` }
      : { padding: '10px 22px', border: 'none', background: accent, color: '#fff', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: `0 6px 16px ${accent}47` },
    // Botão destrutivo (Excluir) — no mobile vira linha inteira acima das ações.
    danger: isMobile
      ? { width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#E11D48', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, order: -1 }
      : { background: 'none', border: 'none', color: '#E11D48', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, order: -1 },
    // Wrapper do rodapé de ações.
    footer: isMobile
      ? { display: 'flex', flexDirection: 'column', gap: 14 }
      : { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    // Botão de fechar (X) do cabeçalho, com alvo de toque decente.
    close: { background: 'none', border: 'none', color: '#8A94A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, margin: -8, padding: 0 }
  };
};

export default GlassModal;
