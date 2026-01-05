import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { StudyPackCard } from '../components/StudyPackCard';
import { studyPackService } from '../services/studyPackService';
import { Plus, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
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

  // Search state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(9); // 3x3 grid

  const { data, isLoading } = useQuery({
    queryKey: ['studyPacks', page, limit, debouncedSearch],
    queryFn: () => studyPackService.getAll(page, limit, debouncedSearch),
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
        toast.success('Study set updated');
      } else {
        await studyPackService.create(data);
        toast.success('Study set created');
        setPage(1);
      }
      await queryClient.invalidateQueries({ queryKey: ['studyPacks'] });
      handleCloseModal();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${editingPack ? 'update' : 'create'} study set`
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
      toast.success('Study set deleted');
      await queryClient.invalidateQueries({ queryKey: ['studyPacks'] });
    } catch (_error) {
      toast.error('Failed to delete study set');
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
        <div>
          <Title>Study Sets</Title>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize your learning resources into collections.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full lg:w-auto">
          {/* Optimal Search Input */}
          <div className="relative flex-1 md:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search study sets..."
              className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'alphabetical' | 'date')
              }
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 font-medium shadow-sm transition-all"
            >
              <option value="alphabetical">Alphabetical (A-Z)</option>
              <option value="date">Date Added</option>
            </select>

            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold shadow-md whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Create Study Set</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
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
      ) : debouncedSearch ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No results found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            We couldn't find any study sets matching "{debouncedSearch}".
            Try adjusting your search or clear it to see all packs.
          </p>
          <button
            onClick={() => setSearch('')}
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2.5 rounded-xl transition-colors font-semibold"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4 text-primary-600 dark:text-primary-400">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Create your first Study Set
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Group your quizzes, flashcards, and study materials by topic or
            course.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Create Study Set
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
        title="Delete Study Set?"
        message="Are you sure you want to delete this study set? The items inside will not be deleted, they will just be removed from this set."
        itemName="Study Set"
        isDeleting={isDeleting}
      />
    </Container>
  );
};
