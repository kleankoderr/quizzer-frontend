import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Globe, History as HistoryIcon, Plus, School, Search, Trash2, X, XCircle } from 'lucide-react';
import { adminService } from '../../services';
import { format } from 'date-fns';
import { Toast as toast } from '../../utils/toast';
import { DeleteModal } from '../../components/DeleteModal';
import { TableSkeleton } from '../../components/skeletons';
import { ContentGenerator } from '../../components/ContentGenerator';
import { ProgressToast } from '../../components/ProgressToast';
import { useJobEvents } from '../../hooks';
import { Select } from '../../components/ui/Select';
import type { GenerateContentDto } from '../../services/content.service';

export const AdminStudyMaterialManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | undefined>(undefined);
  const toastIdRef = useRef<string | undefined>(undefined);

  const [scope, setScope] = useState<'GLOBAL' | 'SCHOOL'>('GLOBAL');
  const [schoolId, setSchoolId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [schools, setSchools] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  useEffect(() => {
    if (scope === 'SCHOOL') {
      setLoadingSchools(true);
      adminService.getSchools().then((data) => { setSchools(data || []); }).finally(() => setLoadingSchools(false));
    }
  }, [scope]);

  const { data, isLoading } = useQuery({
    queryKey: ['adminStudyMaterials', page, search],
    queryFn: () =>
      adminService.getAdminStudyMaterials({
        page,
        limit: 10,
        search: search || undefined,
      }),
  });

  useJobEvents({
    jobId: currentJobId,
    type: 'content',
    onCompleted: async (result: any) => {
      await queryClient.invalidateQueries({ queryKey: ['adminStudyMaterials'] });
      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Study Material Ready!"
            message={`"${result?.title ?? 'Material'}" is now visible to everyone.`}
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
      setShowCreateModal(false);
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

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteAdminStudyMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStudyMaterials'] });
      toast.success('Study material deleted');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Failed to delete study material');
    },
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleGenerate = async (dto: GenerateContentDto, files?: File[]) => {
    setGenerating(true);
    const toastId = toast.custom(
      (t) => (
        <ProgressToast
          t={t}
          title="Generating Admin Study Material"
          message="Preparing content..."
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
      const { jobId } = await adminService.generateAdminStudyMaterial(
        {
          ...dto,
          scope,
          schoolId: scope === 'SCHOOL' ? schoolId : undefined,
          isActive,
        },
        files
      );
      setCurrentJobId(jobId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to start generation', { id: toastId });
      setGenerating(false);
      toastIdRef.current = undefined;
    }
  };

  const extraFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Visibility Scope</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setScope('GLOBAL')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                scope === 'GLOBAL'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Globe className="w-4 h-4" />
              Global
            </button>
            <button
              type="button"
              onClick={() => setScope('SCHOOL')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                scope === 'SCHOOL'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <School className="w-4 h-4" />
              School
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Status</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsActive(true)}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                isActive ? 'border-green-600 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Active
            </button>
            <button
              type="button"
              onClick={() => setIsActive(false)}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                !isActive ? 'border-red-600 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <XCircle className="w-4 h-4" />
              Inactive
            </button>
          </div>
        </div>
      </div>
      {scope === 'SCHOOL' && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Select School</label>
          <Select
            value={schoolId}
            onChange={setSchoolId}
            disabled={loadingSchools}
            options={[
              { label: 'Select a school...', value: '' },
              ...schools.map((s) => ({ label: s.name, value: s.id })),
            ]}
            prefixIcon={<School className="w-5 h-5" />}
          />
        </div>
      )}
    </div>
  );

  const getScopeIcon = (s: string) =>
    s === 'GLOBAL' ? <Globe className="w-4 h-4" /> : <School className="w-4 h-4" />;

  const getStatusBadge = (active: boolean) => (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
        active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}
    >
      {active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {active ? 'Active' : 'Inactive'}
    </span>
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Study Material Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage study materials visible to everyone (global or per school)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Create Study Material
          </button>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
            <button
              onClick={() => !generating && setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl transition-all z-20"
            >
              <X className="w-5 h-5" />
            </button>
            <ContentGenerator
              title="Create Study Material"
              subtitle="Same as user flow: from topic, text, or documents. Then set visibility."
              onGenerate={handleGenerate}
              loading={generating}
              showStudyPackSelector={false}
              extraFields={extraFields}
            />
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Title</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Scope</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Created</th>
                <th className="px-6 py-4 text-right font-bold uppercase tracking-wider text-xs w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-0">
                    <TableSkeleton rows={8} columns={5} />
                  </td>
                </tr>
              )}
              {!isLoading && data?.data?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <HistoryIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">
                        No study materials yet. Create one to make it visible to everyone.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading &&
                data?.data?.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => item.contentId && navigate(`/content/${item.contentId}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{item.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium">
                        {getScopeIcon(item.scope)}
                        <span>{item.scope}</span>
                        {item.school && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">• {item.school.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item.isActive !== false)}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm whitespace-nowrap">
                      {format(new Date(item.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all"
                        title="Delete"
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
              <span className="text-gray-900 dark:text-white font-bold">{data.meta.total}</span> materials
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
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
        title="Delete Study Material"
        message="Are you sure you want to delete this study material? It will no longer be visible to users."
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
