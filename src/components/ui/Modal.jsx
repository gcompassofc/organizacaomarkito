import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { text, space } from '../../lib/ui';

export const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
  closeOnBackdrop = true
}) => {
  const widths = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-3xl'
  };
  return (
    <AnimatePresence>
      {open && (
        // No mobile o modal encosta embaixo (bottom sheet): mais perto do
        // polegar e o teclado não cobre o conteúdo.
        <div
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => { if (closeOnBackdrop) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white rounded-t-[28px] md:rounded-[28px] ${widths[size]} w-full shadow-2xl shadow-slate-900/30 relative max-h-[92dvh] md:max-h-[90vh] flex flex-col pb-[env(safe-area-inset-bottom)] md:pb-0`}
          >
            {(title || subtitle) && (
              <header className={`flex items-start justify-between ${space.modalHeader} border-b border-slate-100`}>
                <div className="min-w-0 flex-1 pr-4">
                  {title && <h3 className={`${text.h1} text-slate-900`}>{title}</h3>}
                  {subtitle && (
                    <p className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">{subtitle}</p>
                  )}
                </div>
                <IconButton icon={X} label="Fechar" onClick={onClose} size="lg" className="-m-1.5 min-w-11 min-h-11 md:min-w-0 md:min-h-0" />
              </header>
            )}

            <div className={`flex-1 overflow-y-auto ${space.modalBody}`}>
              {children}
            </div>

            {/* No mobile as ações empilham em largura cheia — lado a lado elas
                ficam estreitas demais para o polegar. */}
            {footer && (
              <footer className={`border-t border-slate-100 ${space.modalFooter} flex flex-col-reverse md:flex-row md:items-center gap-3 *:w-full md:*:w-auto`}>
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
