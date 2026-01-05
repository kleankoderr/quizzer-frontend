import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  BookOpen,
  Calendar,
  User,
  Trash2,
  Layers,
  Trophy,
  FileText,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { format } from 'date-fns';
import { Toast as toast } from '../../utils/toast';
import { DeleteModal } from '../../components/DeleteModal';
import { TableSkeleton } from '../../components/skeletons';

type ContentType = 'quizzes' | 'flashcards' | 'contents' | 'challenges';

export const ContentManagement = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<ContentType>('quizzes');
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmColor?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminContent', activeTab, page, search],
    queryFn: () => {
      if (activeTab === 'quizzes') {
        return adminService.getAllContent({
          page,
          limit: 10,
          search,
          type: 'quiz',
        });
      } else if (activeTab === 'flashcards') {
        return adminService.getAllFlashcards({ page, limit: 10, search });
      } else if (activeTab === 'challenges') {
        return adminService.getAllChallenges({ page, limit: 10, search });
      } else {
        return adminService.getAllContent({
          page,
          limit: 10,
          search,
          type: 'content',
        });
      }
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: adminService.deleteQuiz,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminContent'] });
      toast.success('Quiz deleted successfully');
      closeModal();
    },
    onError: () => {
      toast.error('Failed to delete quiz');
      closeModal();
    },
  });

  const deleteFlashcardMutation = useMutation({
    mutationFn: adminService.deleteFlashcard,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminContent'] });
      toast.success('Flashcard set deleted successfully');
      closeModal();
    },
    onError: () => {
      toast.error('Failed to delete flashcard set');
      closeModal();
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: adminService.deleteContent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminContent'] });
      toast.success('Content deleted successfully');
      closeModal();
    },
    onError: () => {
      toast.error('Failed to delete content');
      closeModal();
    },
  });

  const deleteChallengeMutation = useMutation({
    mutationFn: adminService.deleteChallenge,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminContent'] });
      toast.success('Challenge deleted successfully');
      closeModal();
    },
    onError: () => {
      toast.error('Failed to delete challenge');
      closeModal();
    },
  });

  const isDeleting =
    deleteQuizMutation.isPending ||
    deleteFlashcardMutation.isPending ||
    deleteContentMutation.isPending ||
    deleteChallengeMutation.isPending;

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDelete = (id: string, type: ContentType, title: string) => {
    const typeLabels = {
      quizzes: 'quiz',
      flashcards: 'flashcard set',
      contents: 'study material',
      challenges: 'challenge',
    };

    setModalConfig({
      isOpen: true,
      title: `Delete ${typeLabels[type]}`,
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: () => {
        if (type === 'quizzes') deleteQuizMutation.mutate(id);
        else if (type === 'flashcards') deleteFlashcardMutation.mutate(id);
        else if (type === 'contents') deleteContentMutation.mutate(id);
        else if (type === 'challenges') deleteChallengeMutation.mutate(id);
      },
    });
  };

  const tabs = [
    { id: 'quizzes' as ContentType, label: 'Quizzes', icon: BookOpen },
    { id: 'flashcards' as ContentType, label: 'Flashcards', icon: Layers },
    { id: 'contents' as ContentType, label: 'Study Materials', icon: FileText },
    { id: 'challenges' as ContentType, label: 'Challenges', icon: Trophy },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Content Management
        </h1>

        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-64"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Topic</th>
                <th className="px-6 py-4 font-medium">Creator</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium">Engagement</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <TableSkeleton rows={10} columns={6} />
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No content found
                  </td>
                </tr>
              ) : (
                data?.data?.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        {item.topic || item.type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <User className="h-4 w-4" />
                        <span>{item.user?.name || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(item.createdAt), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {item._count?.attempts || item._count?.completions || 0}{' '}
                      {activeTab === 'challenges' ? 'participants' : 'sessions'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          handleDelete(item.id, activeTab, item.title)
                        }
                        className="p-1.5 rounded-lg text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 px-4 sm:px-6 py-4 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
              Showing <span className="font-medium">{(page - 1) * 10 + 1}</span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(page * 10, data.meta.total)}
              </span>{' '}
              of <span className="font-medium">{data.meta.total}</span> results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700 dark:text-white"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(data.meta.totalPages, p + 1))
                }
                disabled={page === data.meta.totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700 dark:text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <DeleteModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        isDeleting={isDeleting}
      />
    </div>
  );
};
