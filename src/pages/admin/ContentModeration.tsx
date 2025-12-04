import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Modal } from '../../components/Modal';

export const ContentModeration = () => {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reportedContent'],
    queryFn: adminService.getReportedContent,
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: 'DELETE' | 'HIDE' | 'IGNORE'; reason?: string }) =>
      adminService.moderateContent(id, action, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reportedContent'] });
      toast.success('Content moderated successfully');
      setModalOpen(false);
      setSelectedReport(null);
    },
    onError: () => {
      toast.error('Failed to moderate content');
    },
  });

  const handleModerate = (report: any, action: 'DELETE' | 'HIDE' | 'IGNORE') => {
    setSelectedReport({ ...report, action });
    setModalOpen(true);
  };

  const confirmModeration = () => {
    if (selectedReport) {
      const contentId = selectedReport.contentId || selectedReport.quizId;
      moderateMutation.mutate({
        id: contentId,
        action: selectedReport.action,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Moderation</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {reports?.length || 0} pending reports
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">Content</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Reported By</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reports?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No pending reports
                  </td>
                </tr>
              ) : (
                reports?.map((report: any) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {report.content?.title || report.quiz?.title || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {report.contentId ? 'Content' : 'Quiz'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {report.user?.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {report.reason}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleModerate(report, 'IGNORE')}
                          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                          title="Ignore"
                        >
                          <EyeOff className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleModerate(report, 'HIDE')}
                          className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                          title="Hide"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleModerate(report, 'DELETE')}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm Moderation"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={confirmModeration}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Confirm
            </button>
          </div>
        }
      >
        <p>
          Are you sure you want to {selectedReport?.action.toLowerCase()} this content?
        </p>
      </Modal>
    </div>
  );
};
