import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { ItemFormFields } from './ItemFormFields';

const AddItemModal = ({ isAdding, setIsAdding, newItem, setNewItem, addItem, repostablePosts }) => {
  const update = (patch) => setNewItem({ ...newItem, ...patch });
  const showPostFields = newItem.initialStage === 'postar' || newItem.initialStage === 'editar';

  return (
    <Modal
      open={isAdding}
      onClose={() => setIsAdding(false)}
      title="Nova tarefa"
      subtitle="Preencha só o que importa agora — você ajusta depois"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={() => setIsAdding(false)}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" onClick={addItem} className="flex-1">
            Salvar tarefa
          </Button>
        </>
      }
    >
      <ItemFormFields
        item={newItem}
        onPatch={update}
        mode="create"
        stageValue={newItem.initialStage}
        onStageChange={(id) => update({ initialStage: id })}
        showPostFields={showPostFields}
        repostablePosts={repostablePosts}
      />
    </Modal>
  );
};

export default AddItemModal;
