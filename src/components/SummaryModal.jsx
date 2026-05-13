import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Copy, X } from 'lucide-react';

const SummaryModal = ({ summaryModal, onClose, handleCopy, copiedState }) => (
  <AnimatePresence>
    {summaryModal.isOpen && summaryModal.item && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-2xl font-black text-slate-800 uppercase mb-4 pr-10">{summaryModal.item.objective}</h3>
          <div className="bg-slate-50 p-5 rounded-2xl mb-6 max-h-[50vh] overflow-y-auto">
            <div className="ql-snow">
              <div
                className="ql-editor text-slate-700 text-base leading-relaxed break-normal"
                dangerouslySetInnerHTML={{ __html: (summaryModal.item.summary || '').replace(/&nbsp;/g, ' ') }}
              />
            </div>
          </div>
          <button onClick={handleCopy} className={`w-full font-black py-4 rounded-xl text-sm uppercase flex items-center justify-center space-x-2 ${copiedState ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
            {copiedState ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            <span>{copiedState ? 'Copiado!' : 'Copiar roteiro'}</span>
          </button>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default SummaryModal;
