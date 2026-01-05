import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { useKeyboardNavigation } from '../hooks';
import type { StudyPack } from '../types';

interface StudyPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string }) => Promise<void>;
  initialData?: StudyPack;
  isLoading?: boolean;
}

export const StudyPackModal: React.FC<StudyPackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setDescription(initialData?.description || '');
    }
  }, [isOpen, initialData]);

  const handleSubmit = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isLoading) return;

    await onSubmit({ title: trimmedTitle, description });
  }, [title, description, isLoading, onSubmit]);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  useKeyboardNavigation(isOpen, {
    onMoveUp: () => {},
    onMoveDown: () => {},
    onSelect: handleSubmit,
    onClose: onClose,
  });

  const isEditMode = !!initialData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Study Set' : 'Create New Study Set'}
    >
      <form onSubmit={onFormSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Biology 101"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            required
            autoFocus
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this collection about?"
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || isLoading}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isEditMode ? 'Saving...' : 'Creating...'}
              </>
            ) : isEditMode ? (
              'Save Changes'
            ) : (
              'Create Set'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
