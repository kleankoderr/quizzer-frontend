import React from 'react';
import { Modal } from './Modal';
import { Loader2, Trash2 } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: React.ReactNode;
  itemName?: string; // Optional: specific name of item being deleted to be bolded in message
  isDeleting?: boolean;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item',
  message,
  itemName,
  isDeleting = false,
}) => {
  const handleDelete = async () => {
    await onConfirm();
  };

  const defaultMessage = (
    <p className="text-gray-600 dark:text-gray-400">
      Are you sure you want to delete{' '}
      {itemName ? <strong>{itemName}</strong> : 'this item'}? This action cannot
      be undone.
    </p>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={isDeleting ? () => {} : onClose} // Prevent closing while deleting
      title={title}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
              </>
            )}
          </button>
        </>
      }
    >
      <div className="py-2">{message || defaultMessage}</div>
    </Modal>
  );
};
