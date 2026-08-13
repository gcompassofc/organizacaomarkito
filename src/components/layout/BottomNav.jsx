import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, Archive, House, Video } from 'lucide-react';

// Abas expansíveis: inativa mostra só o ícone; a ativa expande revelando o
// rótulo, com o fundo pintado na cor da própria aba. Adaptado para o nosso
// stack (motion/react) e para navegação — sempre há uma aba ativa, então não
// há estado "nenhuma selecionada".
const TABS = [
  { id: 'marco',      label: 'Marco',      Icon: Video,        color: '#D6294B', soft: 'rgba(214,41,75,0.12)' },
  { id: 'cronograma', label: 'Cronograma', Icon: CalendarDays, color: '#2E6DE0', soft: 'rgba(46,109,224,0.12)' },
  { id: 'gavetas',    label: 'Gavetas',    Icon: Archive,      color: '#3B5578', soft: 'rgba(59,85,120,0.12)' },
  { id: 'casas',      label: 'Casas',      Icon: House,        color: '#0E7C6B', soft: 'rgba(14,124,107,0.12)' }
];

const spring = { type: 'spring', bounce: 0, duration: 0.55, delay: 0.06 };

const buttonVariants = {
  inactive: { gap: 0, paddingLeft: '0.6rem', paddingRight: '0.6rem' },
  active:   { gap: '0.5rem', paddingLeft: '1rem', paddingRight: '1.05rem' }
};
const labelVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: 'auto', opacity: 1 },
  exit:    { width: 0, opacity: 0 }
};

// Um item de aba, compartilhado entre mobile e desktop.
const TabButton = ({ tab, active, onClick, height = 42 }) => {
  const { Icon } = tab;
  return (
    <motion.button
      type="button"
      onClick={() => onClick(tab.id)}
      variants={buttonVariants}
      initial={false}
      animate={active ? 'active' : 'inactive'}
      transition={spring}
      aria-current={active ? 'page' : undefined}
      aria-label={tab.label}
      title={tab.label}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        height, minWidth: height,
        borderRadius: 999, border: 'none', cursor: 'pointer', overflow: 'hidden',
        background: active ? tab.soft : 'transparent',
        color: active ? tab.color : '#94A3B8',
        fontSize: 13.5, fontWeight: 600, letterSpacing: '0.01em', WebkitTapHighlightColor: 'transparent'
      }}
    >
      <Icon size={20} strokeWidth={2.25} style={{ flexShrink: 0 }} />
      <AnimatePresence initial={false}>
        {active && (
          <motion.span
            variants={labelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={spring}
            style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
          >
            {tab.label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Trilho de vidro que embrulha as abas — mesmo visual glass do Cronograma.
// No mobile as abas são mais altas (48px) para caber o polegar com folga.
const Rail = ({ activeView, onChangeView, tabHeight = 42 }) => (
  <div
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: 5,
      borderRadius: 999,
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.85)',
      boxShadow: '0 12px 34px rgba(20,40,80,0.16)'
    }}
  >
    {TABS.map(tab => (
      <TabButton key={tab.id} tab={tab} active={activeView === tab.id} onClick={onChangeView} height={tabHeight} />
    ))}
  </div>
);

// `bottom` usa a safe area do iOS — sem isso a barra fica atrás do indicador
// de home nos iPhones sem botão físico.
export const MobileBottomNav = ({ activeView, onChangeView }) => (
  <nav
    className="md:hidden fixed left-1/2 -translate-x-1/2 z-40"
    style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
  >
    <Rail activeView={activeView} onChangeView={onChangeView} tabHeight={48} />
  </nav>
);

export const FloatingDesktopNav = ({ activeView, onChangeView }) => (
  <nav className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
    <Rail activeView={activeView} onChangeView={onChangeView} />
  </nav>
);
