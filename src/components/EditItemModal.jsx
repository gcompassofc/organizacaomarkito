import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { ItemFormFields } from './ItemFormFields';

const EditItemModal = ({ editModal, setEditModal, activeTab, handleSaveEdit, repostablePosts }) => {
  if (!editModal.isOpen || !editModal.item) return null;

  const item = editModal.item;
  const close = () => setEditModal({ isOpen: false, dayId: null, item: null, itemWeekKey: null, sourceStage: null });
  const patch = (p) => setEditModal({ ...editModal, item: { ...item, ...p } });
  const currentStage = item.tabKey || activeTab || 'gravar';

  return (
    <Modal
      open={editModal.isOpen}
      onClose={close}
      title="Editar tarefa"
      subtitle="Qualquer campo pode ser alterado a qualquer momento"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={close}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" onClick={handleSaveEdit} className="flex-1">
            Salvar alterações
          </Button>
        </>
      }
    >
      <ItemFormFields
        item={item}
        onPatch={patch}
        mode="edit"
        stageValue={currentStage}
        onStageChange={(id) => patch({ tabKey: id })}
        repostablePosts={repostablePosts}
      />
    </Modal>
  );
};

export default EditItemModal;
