import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/adminService';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export const PaymentFailuresPage = () => {
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['paymentFailures', page],
    queryFn: () => adminService.getPaymentFailures(page, LIMIT),
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const getFailureReason = (reason: string) => {
    if (!reason) return 'Unknown error';
    return reason.length > 50 ? reason.substring(0, 50) + '...' : reason;
  };

  const renderTableBody = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <tr key={`skeleton-${i}`} className="animate-pulse">
          <td className="px-6 py-4">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
          </td>
          <td className="px-6 py-4">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
          </td>
        </tr>
      ));
    }

    if (isError) {
      return (
        <tr>
          <td colSpan={5} className="px-6 py-8 text-center text-red-500">
            Failed to load payment failures. Please try again.
          </td>
        </tr>
      );
    }

    if (!data?.data || data.data.length === 0) {
      return (
        <tr>
          <td
            colSpan={5}
            className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
          >
            No payment failures found
          </td>
        </tr>
      );
    }

    return data.data.map((failure: any) => (
      <tr
        key={failure.id}
        className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
      >
        <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
          {format(new Date(failure.createdAt), 'MMM d, yyyy HH:mm')}
        </td>
        <td className="px-6 py-4">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {failure.user?.name || 'Unknown User'}
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              {failure.user?.email || 'No Email'}
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white">
          ₦{(failure.amount || 0).toLocaleString()}
        </td>
        <td className="px-6 py-4 text-red-600 dark:text-red-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="truncate max-w-xs" title={failure.failureReason}>
              {getFailureReason(failure.failureReason)}
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Failed
          </span>
        </td>
      </tr>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Payment Failures
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor and investigate failed subscription payments
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user or email..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              disabled
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Reason</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {renderTableBody()}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium">{(page - 1) * LIMIT + 1}</span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(page * LIMIT, data.meta.total)}
              </span>{' '}
              of <span className="font-medium">{data.meta.total}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= (data.meta.totalPages || 1)}
                className="flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
