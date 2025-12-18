import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { format } from 'date-fns';

export const SubscriptionsPage = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminSubscriptions', page, statusFilter],
    queryFn: () =>
      adminService.getAllSubscriptions({
        page,
        limit: 10,
        status: statusFilter || undefined,
      }),
  });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Subscriptions
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage all user subscriptions
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Started</th>
                <th className="px-6 py-4 font-medium">Ends</th>
                <th className="px-6 py-4 font-medium">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                data?.data.map((sub: any) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {sub.user.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {sub.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        <CreditCard className="h-3 w-3" />
                        {sub.plan.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          sub.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {sub.currentPeriodStart
                        ? format(new Date(sub.currentPeriodStart), 'MMM d, yyyy')
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {sub.currentPeriodEnd
                        ? format(new Date(sub.currentPeriodEnd), 'MMM d, yyyy')
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      ₦{sub.plan.price.toLocaleString()}/{sub.plan.interval}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {data.meta.totalPages}
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
    </div>
  );
};
