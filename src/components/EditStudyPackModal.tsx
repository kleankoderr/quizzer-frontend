import React, { useState } from 'react';
import { Modal } from './Modal';
import toast from 'react-hot-toast';
import { studyPackService } from '../services/studyPackService';
import type { StudyPack } from '../types';

interface EditStudyPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyPack: StudyPack;
  onUpdate: (updatedPack: StudyPack) => void;
}

export const EditStudyPackModal: React.FC<EditStudyPackModalProps> = ({
  isOpen,
  onClose,
  studyPack,
  onUpdate,
}) => {
  const [title, setTitle] = useState(studyPack.title);
  const [description, setDescription] = useState(studyPack.description || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setLoading(true);
    try {
      const updatedPack = await studyPackService.update(studyPack.id, {
        title,
        description,
      });
      onUpdate(updatedPack);
      toast.success('Study pack updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update study pack', error);
      toast.error('Failed to update study pack');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Study Pack">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Biology 101"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white resize-none h-24"
            placeholder="Optional description..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
