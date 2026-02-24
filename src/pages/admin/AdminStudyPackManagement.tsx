import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Globe, History as HistoryIcon, Pencil, Plus, School, Search, Trash2, XCircle } from 'lucide-react';
import { adminService } from '../../services';
import { format } from 'date-fns';
import { Toast as toast } from '../../utils/toast';
import { DeleteModal } from '../../components/DeleteModal';
import { TableSkeleton } from '../../components/skeletons';
import { AdminStudyPackFormModal } from '../../components/admin/AdminStudyPackFormModal';

export const AdminStudyPackManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showFormModal, setShowFormModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    id: string;
    title: string;
    description?: string | null;
    scope: string;
    schoolId?: string | null;
    isActive?: boolean;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminStudyPacks', page, search],
    queryFn: () =>
      adminService.getAdminStudyPacks({
        page,
        limit: 10,
        search: search || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteAdminStudyPack,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStudyPacks'] });
      toast.success('Study pack deleted');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Failed to delete study pack');
    },
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingItem(null);
    setShowFormModal(true);
  };

  const openEditModal = (item: {
    id: string;
    title: string;
    description?: string | null;
    scope: string;
    schoolId?: string | null;
    isActive?: boolean;
  }) => {
    setEditingItem(item);
    setShowFormModal(true);
  };

  const handleFormSubmit = async (data: {
    title: string;
    description?: string;
    scope: 'GLOBAL' | 'SCHOOL';
    schoolId?: string;
    isActive: boolean;
  }) => {
    setCreateSubmitting(true);
    try {
      if (editingItem) {
        await adminService.updateAdminStudyPack(editingItem.id, data);
        toast.success('Study pack updated');
      } else {
        await adminService.createAdminStudyPack(data);
        toast.success('Study pack created');
      }
      queryClient.invalidateQueries({ queryKey: ['adminStudyPacks'] });
      setShowFormModal(false);
      setEditingItem(null);
      if (!editingItem) setPage(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (editingItem ? 'Failed to update study pack' : 'Failed to create study pack'));
    } finally {
      setCreateSubmitting(false);
    }
  };

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
            Study Pack Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage study packs visible to everyone (global or per school)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search study packs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Create Study Pack
          </button>
        </div>
      </div>

      <AdminStudyPackFormModal
        isOpen={showFormModal}
        onClose={() => {
          if (!createSubmitting) {
            setShowFormModal(false);
            setEditingItem(null);
          }
        }}
        mode={editingItem ? 'edit' : 'create'}
        initialValues={editingItem}
        onSubmit={handleFormSubmit}
        isSubmitting={createSubmitting}
      />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Title</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Scope</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Items</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Created</th>
                <th className="px-6 py-4 text-right font-bold uppercase tracking-wider text-xs w-24 min-w-[6rem]">Actions</th>
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
                      <p className="text-gray-500 font-medium">
                        No study packs yet. Create one to get started.
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
                    onClick={() => item.studyPackId && navigate(`/study-pack/${item.studyPackId}`)}
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
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {item.itemCount ?? 0}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item.isActive !== false)}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm whitespace-nowrap">
                      {format(new Date(item.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
              <span className="text-gray-900 dark:text-white font-bold">{data.meta.total}</span> packs
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
        title="Delete Study Pack"
        message="Are you sure you want to delete this study pack? This cannot be undone."
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
