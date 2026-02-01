import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Globe, History as HistoryIcon, Plus, School, Search, Trash2, X, XCircle } from 'lucide-react';
import { adminService } from '../../services';
import { format } from 'date-fns';
import { Toast as toast } from '../../utils/toast';
import { DeleteModal } from '../../components/DeleteModal';
import { TableSkeleton } from '../../components/skeletons';
import { AdminQuizGenerator } from '../../components/admin/AdminQuizGenerator';
import { ProgressToast } from '../../components/ProgressToast';
import { useDebounce, useJobEvents } from '../../hooks';

export const AdminQuizManagement = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showGenerator, setShowGenerator] = useState(false);
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  
  // Job polling state
  const [currentJobId, setCurrentJobId] = useState<string | undefined>(undefined);
  const toastIdRef = useRef<string | undefined>(undefined);

  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useQuery({
    queryKey: ['adminQuizzes', page, debouncedSearch],
    queryFn: () => adminService.getAdminQuizzes({
      page,
      limit: 10,
      search: debouncedSearch,
    }),
  });

  const deleteQuizMutation = useMutation({
    mutationFn: adminService.deleteQuiz,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminQuizzes'] });
      toast.success('Quiz deleted successfully');
      setDeleteQuizId(null);
    },
    onError: () => {
      toast.error('Failed to delete quiz');
    },
  });

  useJobEvents({
    jobId: currentJobId,
    type: 'quiz',
    onCompleted: async (result: any) => {
      await queryClient.invalidateQueries({ queryKey: ['adminQuizzes'] });
      
      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Quiz Generated!"
            message={`"${result.title}" is now available.`}
            progress={100}
            status="success"
            onClose={() => setGenerating(false)}
          />
        ),
        { id: toastIdRef.current, duration: 3000 }
      );

      setGenerating(false);
      setCurrentJobId(undefined);
      toastIdRef.current = undefined;
      setShowGenerator(false);
    },
    onFailed: (error: string) => {
      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Generation Failed"
            message={error}
            progress={0}
            status="error"
            onClose={() => setGenerating(false)}
          />
        ),
        { id: toastIdRef.current, duration: 5000 }
      );

      setGenerating(false);
      setCurrentJobId(undefined);
      toastIdRef.current = undefined;
    },
    enabled: !!currentJobId,
  });

  const handleGenerate = async (request: any, files?: File[]) => {
    setGenerating(true);
    
    const toastId = toast.custom(
      (t) => (
        <ProgressToast
          t={t}
          title="Generating Admin Quiz"
          message="Preparing global quiz content..."
          progress={0}
          status="processing"
          autoProgress={true}
          onClose={() => setGenerating(false)}
        />
      ),
      { duration: Infinity }
    );

    toastIdRef.current = toastId;

    try {
      const response = await adminService.generateQuiz(request, files);
      
      // Handle immediate completion (e.g. cached result)
      if (response.status === 'completed' || (response as any).cached) {
        await queryClient.invalidateQueries({ queryKey: ['adminQuizzes'] });
        
        toast.custom(
          (t) => (
            <ProgressToast
              t={t}
              title="Quiz Generated!"
              message="Quiz is now available (loaded from cache)."
              progress={100}
              status="success"
              onClose={() => setGenerating(false)}
            />
          ),
          { id: toastIdRef.current, duration: 3000 }
        );

        setGenerating(false);
        toastIdRef.current = undefined;
        setShowGenerator(false);
        return;
      }

      setCurrentJobId(response.jobId);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to start generation', { id: toastId });
      setGenerating(false);
      toastIdRef.current = undefined;
    }
  };

  const getScopeIcon = (scope: string) => {
    return scope === 'GLOBAL' ? <Globe className="w-4 h-4" /> : <School className="w-4 h-4" />;
  };

  const getStatusBadge = (isActive: boolean) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
      isActive 
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    }`}>
      {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Quiz Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage global or school-specific quizzes
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset to first page on search
              }}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Create Admin Quiz
          </button>
        </div>
      </div>

      {showGenerator && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-1">
            <button
              onClick={() => setShowGenerator(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl transition-all z-20"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-4 sm:p-6">
              <AdminQuizGenerator
                onGenerate={handleGenerate}
                loading={generating}
              />
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Quiz Details</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Scope</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Engagement</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Created</th>
                <th className="px-6 py-4 text-right font-bold uppercase tracking-wider text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-0">
                    <TableSkeleton rows={8} columns={6} />
                  </td>
                </tr>
              )}
              {!isLoading && data?.data?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <HistoryIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No quizzes found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && data?.data?.map((quiz: any) => (
                <tr
                  key={quiz.id}
                  onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 dark:text-white">{quiz.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{quiz.topic}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium">
                      {getScopeIcon(quiz.scope)}
                      <span>{quiz.scope}</span>
                      {quiz.school && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">• {quiz.school.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(quiz.isActive !== false)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 dark:text-white font-medium">
                      {quiz.attemptCount || 0} attempts
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {format(new Date(quiz.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteQuizId(quiz.id);
                      }}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data?.meta && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 px-4 sm:px-6 py-4 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Showing <span className="text-gray-900 dark:text-white font-bold">{(page - 1) * 10 + 1}</span> to{' '}
              <span className="text-gray-900 dark:text-white font-bold">{Math.min(page * 10, data.meta.total)}</span> of{' '}
              <span className="text-gray-900 dark:text-white font-bold">{data.meta.total}</span> quizzes
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-4 py-1.5 text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
                className="btn-secondary px-4 py-1.5 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <DeleteModal
        isOpen={!!deleteQuizId}
        onClose={() => setDeleteQuizId(null)}
        onConfirm={() => {
          if (deleteQuizId) deleteQuizMutation.mutate(deleteQuizId);
        }}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz? This will remove all associated statistics and practice history."
        isDeleting={deleteQuizMutation.isPending}
      />
    </div>
  );
};
