import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Shield,
  ShieldAlert,
  UserX,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { adminService, type User } from '../../services/adminService';
import { format } from 'date-fns';
import { Toast as toast } from '../../utils/toast';
import { Modal } from '../../components/Modal';
import { TableSkeleton } from '../../components/skeletons';

export const UserManagement = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [premiumFilter, setPremiumFilter] = useState('');
  const [page, setPage] = useState(1);
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
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter, premiumFilter],
    queryFn: () =>
      adminService.getUsers({
        page,
        limit: 10,
        search,
        role: roleFilter || undefined,
        isPremium: premiumFilter === '' ? undefined : premiumFilter === 'true',
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminService.updateUserStatus(userId, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
      closeModal();
    },
    onError: () => {
      toast.error('Failed to update user status');
      closeModal();
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
      closeModal();
    },
    onError: () => {
      toast.error('Failed to delete user');
      closeModal();
    },
  });

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleStatusUpdate = (userId: string, isActive: boolean) => {
    setModalConfig({
      isOpen: true,
      title: isActive ? 'Activate User' : 'Suspend User',
      message: `Are you sure you want to ${isActive ? 'activate' : 'suspend'} this user?`,
      confirmText: isActive ? 'Activate' : 'Suspend',
      confirmColor: isActive
        ? 'bg-green-600 hover:bg-green-700'
        : 'bg-yellow-600 hover:bg-yellow-700',
      onConfirm: () => updateStatusMutation.mutate({ userId, isActive }),
    });
  };

  const handleDelete = (userId: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete User',
      message:
        'Are you sure you want to delete this user? This action cannot be undone.',
      confirmText: 'Delete',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: () => deleteUserMutation.mutate(userId),
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          User Management
        </h1>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-64"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
          <select
            value={premiumFilter}
            onChange={(e) => setPremiumFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Users</option>
            <option value="true">Premium</option>
            <option value="false">Free</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">Activity</th>
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
              ) : data?.data.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                data?.data.map((user: User) => (
                  <tr
                    key={user.id}
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <span className="text-xs font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            {user.subscription?.status === 'ACTIVE' &&
                              user.subscription.currentPeriodEnd >
                                new Date() && (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  {user.subscription.plan.name}
                                </span>
                              )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            : user.role === 'ADMIN'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {user.role === 'SUPER_ADMIN' && (
                          <ShieldAlert className="mr-1 h-3 w-3" />
                        )}
                        {user.role === 'ADMIN' && (
                          <Shield className="mr-1 h-3 w-3" />
                        )}
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col text-xs">
                        <span>{user._count?.quizzes || 0} Quizzes</span>
                        <span>{user._count?.attempts || 0} Attempts</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div
                        className="flex justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {user.role !== 'SUPER_ADMIN' && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusUpdate(user.id, !user.isActive)
                              }
                              className={`p-1.5 rounded-lg transition-colors ${
                                user.isActive
                                  ? 'text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20'
                                  : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                              }`}
                              title={
                                user.isActive ? 'Suspend User' : 'Activate User'
                              }
                            >
                              {user.isActive ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-1.5 rounded-lg text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
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

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              disabled={
                updateStatusMutation.isPending || deleteUserMutation.isPending
              }
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={modalConfig.onConfirm}
              disabled={
                updateStatusMutation.isPending || deleteUserMutation.isPending
              }
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${modalConfig.confirmColor || 'bg-primary-600 hover:bg-primary-700'}`}
            >
              {updateStatusMutation.isPending ||
              deleteUserMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                modalConfig.confirmText || 'Confirm'
              )}
            </button>
          </div>
        }
      >
        <p>{modalConfig.message}</p>
      </Modal>
    </div>
  );
};
