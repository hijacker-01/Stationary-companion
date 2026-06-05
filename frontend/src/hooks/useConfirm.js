import { useState, useCallback } from 'react';
import ConfirmModal from '../components/ConfirmModal';

export function useConfirm() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    confirmVariant: 'danger',
    resolve: null
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        confirmLabel: options.confirmLabel || 'Confirm',
        confirmVariant: options.confirmVariant || 'danger',
        resolve
      });
    });
  }, []);

  const handleConfirm = () => {
    modalState.resolve?.(true);
    setModalState(s => ({ ...s, isOpen: false }));
  };

  const handleCancel = () => {
    modalState.resolve?.(false);
    setModalState(s => ({ ...s, isOpen: false }));
  };

  const ConfirmModalComponent = () => (
    <ConfirmModal 
      isOpen={modalState.isOpen}
      title={modalState.title}
      message={modalState.message}
      confirmLabel={modalState.confirmLabel}
      confirmVariant={modalState.confirmVariant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmModalComponent };
}
