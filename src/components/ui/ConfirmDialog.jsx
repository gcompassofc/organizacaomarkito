import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Tem certeza?',
  subtitle = 'Esta ação não pode ser desfeita',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  children
}) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    subtitle={subtitle}
    size="sm"
    footer={
      <>
        <Button variant="secondary" size="md" onClick={onClose}>{cancelLabel}</Button>
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          size="md"
          onClick={() => { onConfirm(); onClose(); }}
          className="flex-1"
        >
          {confirmLabel}
        </Button>
      </>
    }
  >
    {children}
  </Modal>
);
