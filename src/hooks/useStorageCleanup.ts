import { useState, useCallback } from 'react';
import { apiClient } from '../services/api';
import { Toast as toast } from '../utils/toast';

export interface CleanupSuggestion {
  id: string;
  name: string;
  sizeMB: string;
  uploadedAt: string;
}

export interface CleanupData {
  needsCleanup: boolean;
  neededDeletion: number; // MB
  currentUsage: number; // MB
  limit: number; // MB
  suggestions: CleanupSuggestion[];
}

export const useStorageCleanup = () => {
  const [data, setData] = useState<CleanupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<CleanupData>(
        '/user/quota/cleanup-suggestions'
      );
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch cleanup suggestions:', error);
      toast.error('Failed to load storage suggestions');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFiles = useCallback(
    async (fileIds: string[]) => {
      setDeleting(true);
      try {
        // Delete sequentially or parallel? Parallel is faster.
        await Promise.all(
          fileIds.map((id) => apiClient.delete(`/user-documents/${id}`))
        );
        toast.success(`Deleted ${fileIds.length} file(s)`);
        // Refresh suggestions
        await fetchSuggestions();
        return true;
      } catch (error) {
        console.error('Failed to delete files:', error);
        toast.error('Failed to delete some files');
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [fetchSuggestions]
  );

  return {
    data,
    loading,
    deleting,
    fetchSuggestions,
    deleteFiles,
  };
};
