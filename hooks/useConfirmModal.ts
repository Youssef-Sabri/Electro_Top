import { useState, useCallback } from 'react';

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  isDestructive?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

const INITIAL_STATE: ConfirmModalState = {
  isOpen: false,
  title: '',
  message: '',
  onConfirm: () => {},
  isDestructive: false,
};

export function useConfirmModal() {
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(INITIAL_STATE);

  const openConfirm = useCallback((config: Omit<ConfirmModalState, 'isOpen'>) => {
    setConfirmModal({ ...config, isOpen: true });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmModal(INITIAL_STATE);
  }, []);

  return { confirmModal, openConfirm, closeConfirm };
}
