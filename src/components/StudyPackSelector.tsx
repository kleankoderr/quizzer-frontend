import React, { useState, useCallback } from 'react';
import { useStudyPacks } from '../hooks';
import { Folder } from 'lucide-react';
import { studyPackService } from '../services/studyPackService';
import { Toast as toast } from '../utils/toast';
import { useQueryClient } from '@tanstack/react-query';

interface StudyPackSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

const CREATE_NEW_VALUE = '__CREATE_NEW__';

export const StudyPackSelector: React.FC<StudyPackSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useStudyPacks(1, 100);
  const studyPacks = data?.data || [];

  const [isCreating, setIsCreating] = useState(false);
  const [newPackTitle, setNewPackTitle] = useState('');
  const [creatingLoading, setCreatingLoading] = useState(false);

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === CREATE_NEW_VALUE) {
      setIsCreating(true);
    } else {
      onChange(selectedValue);
    }
  };

  const cancelCreation = () => {
    setIsCreating(false);
    setNewPackTitle('');
  };

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

      // Invalidate and refetch study packs
      await queryClient.invalidateQueries({ queryKey: ['studyPacks'] });

      // Automatically select the newly created pack
      onChange(newPack.id);

      toast.success('Study set created');
      setIsCreating(false);
      setNewPackTitle('');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to create study set'
      );
    } finally {
      setCreatingLoading(false);
    }
  }, [newPackTitle, onChange, queryClient]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleCreatePack();
      if (e.key === 'Escape') cancelCreation();
    },
    [handleCreatePack]
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor="study-pack-selector"
        className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
      >
        Add to Study Set (Optional)
      </label>

      {isCreating ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newPackTitle}
            onChange={(e) => setNewPackTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter study set name..."
            className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            autoFocus
            disabled={creatingLoading}
          />
          <button
            onClick={handleCreatePack}
            disabled={!newPackTitle.trim() || creatingLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap font-medium"
          >
            {creatingLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Create'
            )}
          </button>
          <button
            onClick={cancelCreation}
            disabled={creatingLoading}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Folder className="h-5 w-5 text-gray-400" />
          </div>
          <select
            id="study-pack-selector"
            value={value || ''}
            onChange={(e) => handleSelectChange(e.target.value)}
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none"
          >
            <option value="">No Study Set</option>
            {studyPacks.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.title}
              </option>
            ))}
            <option
              value={CREATE_NEW_VALUE}
              className="font-semibold text-primary-600"
            >
              + Create New Study Set...
            </option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
