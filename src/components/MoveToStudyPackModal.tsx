import React, { useState, useCallback } from 'react';
import { Modal } from './Modal';
import { studyPackService } from '../services/studyPackService';
import type { StudyPack } from '../types';
import { Folder, Plus } from 'lucide-react';
import { Toast as toast } from '../utils/toast';
import { useAsync } from '../hooks';

interface MoveToStudyPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemType: 'quiz' | 'flashcard' | 'content' | 'file';
  onMoveSuccess?: (pack?: StudyPack) => void;
}

export const MoveToStudyPackModal: React.FC<MoveToStudyPackModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemType,
  onMoveSuccess,
}) => {
  const [studyPacks, setStudyPacks] = useState<StudyPack[]>([]);
  const [moving, setMoving] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [newPackTitle, setNewPackTitle] = useState('');

  const { execute: fetchStudyPacks, loading } = useAsync(
    async () => {
      const data = await studyPackService.getAll();
      setStudyPacks(data.data || []);
    },
    {
      onError: () => toast.error('Failed to load study packs'),
    }
  );

  // Fetch packs when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchStudyPacks();
      setIsCreating(false);
      setNewPackTitle('');
      setMoving(null);
    }
  }, [isOpen]);

  const handleCreatePack = useCallback(async () => {
    const trimmedTitle = newPackTitle.trim();
    if (!trimmedTitle) return;

    setCreatingLoading(true);
    try {
      const newPack = await studyPackService.create({
        title: trimmedTitle,
        description: '',
        coverImage: '',
      });
      setStudyPacks((prev) => [newPack, ...prev]);
      toast.success('Study pack created');
      setIsCreating(false);
      setNewPackTitle('');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to create study pack'
      );
    } finally {
      setCreatingLoading(false);
    }
  }, [newPackTitle]);

  const handleMove = useCallback(
    async (packId: string) => {
      try {
        setMoving(packId);
        await studyPackService.moveItem(packId, { type: itemType, itemId });
        toast.success('Item moved successfully');
        const pack = studyPacks.find((p) => p.id === packId);
        onMoveSuccess?.(pack);
        onClose();
      } catch (_error) {
        toast.error('Failed to move item');
      } finally {
        setMoving(null);
      }
    },
    [itemId, itemType, onMoveSuccess, onClose, studyPacks]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleCreatePack();
      if (e.key === 'Escape') setIsCreating(false);
    },
    [handleCreatePack]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Move to Study Pack">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {isCreating ? (
              <div className="flex gap-2 mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input
                  type="text"
                  value={newPackTitle}
                  onChange={(e) => setNewPackTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter title..."
                  className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                  disabled={creatingLoading}
                />
                <button
                  onClick={handleCreatePack}
                  disabled={!newPackTitle.trim() || creatingLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {creatingLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </>
                  ) : (
                    'Create'
                  )}
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  disabled={creatingLoading}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center p-3 mb-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors text-left group text-gray-500 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600"
              >
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mr-3 group-hover:bg-primary-100">
                  <Plus className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-primary-600" />
                </div>
                <span className="font-medium">Create New Study Pack</span>
              </button>
            )}

            {studyPacks.length === 0 && !isCreating ? (
              <p className="text-center text-gray-500 py-4">
                No study packs found.
              </p>
            ) : (
              studyPacks.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => handleMove(pack.id)}
                  disabled={!!moving}
                  className={`w-full flex items-center p-3 rounded-lg border transition-all text-left group ${
                    moving === pack.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 ring-1 ring-primary-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg mr-3">
                    {moving === pack.id ? (
                      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Folder className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {pack.title}
                    </h4>
                    {pack.description && (
                      <p className="text-xs text-gray-500 truncate">
                        {pack.description}
                      </p>
                    )}
                  </div>
                  {moving === pack.id && (
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400 animate-pulse ml-2">
                      Moving...
                    </span>
                  )}
                </button>
              ))
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
