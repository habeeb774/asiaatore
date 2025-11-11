import React from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';

export default function ConfirmModal({ open, onClose, title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false, onConfirm }) {
  const footer = (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" onClick={onClose}>{cancelText}</Button>
      <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm?.(); onClose?.(); }}>
        {confirmText}
      </Button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      <div className="text-sm text-foreground/80 whitespace-pre-line">{message}</div>
    </Modal>
  );
}
