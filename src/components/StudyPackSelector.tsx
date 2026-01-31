import React, { useCallback, useState } from 'react';
import { useStudyPacks } from '../hooks';
import { Folder } from 'lucide-react';
import { Select, type SelectOption } from './ui/Select';
import { studyPackService } from '../services';
import { Toast as toast } from '../utils/toast';
import { useQueryClient } from '@tanstack/react-query';

interface StudyPackSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  onCreationModeChange?: (isCreating: boolean) => void;
}

const CREATE_NEW_VALUE = '__CREATE_NEW__';

export const StudyPackSelector: React.FC<StudyPackSelectorProps> = ({
  value,
  onChange,
  className = '',
  onCreationModeChange,
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
      onCreationModeChange?.(true);
    } else {
      onChange(selectedValue);
    }
  };

  const cancelCreation = () => {
    setIsCreating(false);
    setNewPackTitle('');
    onCreationModeChange?.(false);
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
      onCreationModeChange?.(false);
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
        <div className="flex flex-col sm:flex-row gap-2">
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
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCreatePack}
              disabled={!newPackTitle.trim() || creatingLoading}
              className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap font-medium"
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
        </div>
      ) : (
        <Select
          id="study-pack-selector"
          value={value || ''}
          onChange={handleSelectChange}
          disabled={isLoading}
          options={[
            { label: 'No Study Set', value: '' },
            ...studyPacks.map((pack) => ({
              label: pack.title,
              value: pack.id,
            })),
            { label: '+ Create New Study Set...', value: CREATE_NEW_VALUE },
          ]}
          prefixIcon={<Folder className="h-5 w-5" />}
          renderOption={(option: SelectOption) => (
            <span
              className={
                option.value === CREATE_NEW_VALUE
                  ? 'font-semibold text-primary-600'
                  : ''
              }
            >
              {option.label}
            </span>
          )}
        />
      )}
    </div>
  );
};
