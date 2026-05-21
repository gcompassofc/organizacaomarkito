import React from 'react';
import { Check, Copy } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

const SummaryModal = ({ summaryModal, onClose, handleCopy, copiedState }) => {
  if (!summaryModal.isOpen || !summaryModal.item) return null;
  return (
    <Modal
      open={summaryModal.isOpen}
      onClose={onClose}
      title={summaryModal.item.objective}
      size="md"
      footer={
        <Button
          variant={copiedState ? 'accent' : 'primary'}
          size="lg"
          onClick={handleCopy}
          icon={copiedState ? Check : Copy}
          className="w-full"
        >
          {copiedState ? 'Copiado!' : 'Copiar roteiro'}
        </Button>
      }
    >
      <div className="bg-slate-50 p-5 rounded-2xl max-h-[50vh] overflow-y-auto">
        <div className="ql-snow">
          <div
            className="ql-editor text-slate-700 text-base leading-relaxed break-normal"
            dangerouslySetInnerHTML={{ __html: (summaryModal.item.summary || '').replace(/&nbsp;/g, ' ') }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default SummaryModal;
