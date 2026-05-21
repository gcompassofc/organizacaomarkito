import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { text, radius, space } from '../../lib/ui';

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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => { if (closeOnBackdrop) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white ${radius.modal} ${widths[size]} w-full shadow-2xl shadow-slate-900/30 relative max-h-[90vh] flex flex-col`}
          >
            {(title || subtitle) && (
              <header className={`flex items-start justify-between ${space.modalHeader} border-b border-slate-100`}>
                <div className="min-w-0 flex-1 pr-4">
                  {title && <h3 className={`${text.h1} text-slate-900`}>{title}</h3>}
                  {subtitle && (
                    <p className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">{subtitle}</p>
                  )}
                </div>
                <IconButton icon={X} label="Fechar" onClick={onClose} size="md" />
              </header>
            )}

            <div className={`flex-1 overflow-y-auto ${space.modalBody}`}>
              {children}
            </div>

            {footer && (
              <footer className={`border-t border-slate-100 ${space.modalFooter} flex items-center gap-3`}>
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
