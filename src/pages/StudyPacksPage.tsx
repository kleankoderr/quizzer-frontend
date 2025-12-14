import React, { useState, useMemo, useCallback } from 'react';
import { StudyPackCard } from '../components/StudyPackCard';
import { studyPackService } from '../services/studyPackService';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { StudyPackModal } from '../components/StudyPackModal';
import { DeleteModal } from '../components/DeleteModal';
import { Toast as toast } from '../utils/toast';
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import type { StudyPack } from '../types';

const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-7xl mx-auto">{children}</div>
);

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
    {children}
  </h1>
);

export const StudyPacksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<StudyPack | undefined>(
    undefined
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'alphabetical' | 'date'>('alphabetical');

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(9); // 3x3 grid

  const { data, isLoading } = useQuery({
    queryKey: ['studyPacks', page, limit],
    queryFn: () => studyPackService.getAll(page, limit),
    placeholderData: keepPreviousData,
  });

  const studyPacks = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.meta.totalPages || 1;

  const sortedStudyPacks = useMemo(() => {
    return [...studyPacks].sort((a, b) => {
      if (sortBy === 'date') {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return a.title.localeCompare(b.title);
    });
  }, [studyPacks, sortBy]);

  const handleOpenCreate = () => {
    setEditingPack(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pack: StudyPack) => {
    setEditingPack(pack);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPack(undefined);
  };

  const handleSubmit = async (data: { title: string; description: string }) => {
    setIsSubmitting(true);
    try {
      if (editingPack) {
        await studyPackService.update(editingPack.id, data);
        toast.success('Study pack updated');
      } else {
        await studyPackService.create(data);
        toast.success('Study pack created');
        setPage(1);
      }
      await queryClient.invalidateQueries({ queryKey: ['studyPacks'] });
      handleCloseModal();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${editingPack ? 'update' : 'create'} study pack`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await studyPackService.delete(deleteId);
      setDeleteId(null);
      toast.success('Study pack deleted');
      await queryClient.invalidateQueries({ queryKey: ['studyPacks'] });
    } catch (_error) {
      toast.error('Failed to delete study pack');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteId, queryClient]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <Container>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <Title>Study Packs</Title>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize your learning resources into collections.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'alphabetical' | 'date')
            }
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500 font-medium w-full sm:w-auto"
          >
            <option value="alphabetical">Alphabetical (A-Z)</option>
            <option value="date">Date Added</option>
          </select>

          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Create Study Pack
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : sortedStudyPacks.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {sortedStudyPacks.map((pack) => (
              <StudyPackCard
                key={pack.id}
                studyPack={pack}
                onDelete={() => setDeleteId(pack.id)}
                onEdit={() => handleOpenEdit(pack)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4 text-primary-600 dark:text-primary-400">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Create your first Study Pack
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Group your quizzes, flashcards, and study materials by topic or
            course.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Create Study Pack
          </button>
        </div>
      )}

      <StudyPackModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingPack}
        isLoading={isSubmitting}
      />

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Study Pack?"
        message="Are you sure you want to delete this study pack? The items inside will not be deleted, they will just be removed from this pack."
        itemName="Study Pack"
        isDeleting={isDeleting}
      />
    </Container>
  );
};
