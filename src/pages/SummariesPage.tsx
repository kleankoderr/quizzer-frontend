import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { type Summary, summaryService } from '../services/summary.service';
import { Card } from '../components/Card';
import { CardMenu, Trash2 } from '../components/CardMenu';
import { BarChart3, Clock, ExternalLink, Eye, EyeOff, Globe, Lock, Sparkles } from 'lucide-react';
import { formatDate } from '../utils/dateFormat';
import { Toast as toast } from '../utils/toast';
import { LoadingScreen } from '../components/LoadingScreen';
import { DeleteModal } from '../components/DeleteModal';

export const SummariesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [summaryToDelete, setSummaryToDelete] = useState<Summary | null>(null);

  const {
    data: summaries,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-summaries'],
    queryFn: summaryService.getUserSummaries,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => summaryService.deleteSummary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-summaries'] });
      toast.success('Summary deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete summary');
    },
    onSettled: () => {
      setIsDeleteModalOpen(false);
      setSummaryToDelete(null);
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      summaryService.toggleVisibility(id, isPublic),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-summaries'] });
      toast.success(
        `Summary is now ${variables.isPublic ? 'public' : 'private'}`
      );
    },
    onError: () => {
      toast.error('Failed to update visibility');
    },
  });

  if (isLoading) return <LoadingScreen message="Loading summaries..." />;
  if (error)
    return (
      <div className="p-8 text-center text-red-500">
        Error loading summaries
      </div>
    );

  const handleVisibilityToggle = (summary: Summary) => {
    visibilityMutation.mutate({ id: summary.id, isPublic: !summary.isPublic });
  };

  const handleDelete = (summary: Summary) => {
    setSummaryToDelete(summary);
    setIsDeleteModalOpen(true);
  };

  if (!summaries || summaries.length === 0) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="card text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
            <Sparkles className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
            No summaries yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Generate summaries for your study materials to see them here!
          </p>
          <Link
            to="/study"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            Go to Study Materials
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Your Summaries
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and share your AI-generated study summaries
          </p>
        </div>
        <div className="bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-full border border-primary-100 dark:border-primary-800">
          <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
            {summaries.length}{' '}
            {summaries.length === 1 ? 'Summary' : 'Summaries'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {summaries.map((summary) => {
          const menuItems = [
            {
              label: 'View Summary',
              icon: <ExternalLink className="w-4 h-4" />,
              onClick: () => window.open(`/s/${summary.shortCode}`, '_blank'),
            },
            {
              label: summary.isPublic ? 'Make Private' : 'Make Public',
              icon: summary.isPublic ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              ),
              onClick: () => handleVisibilityToggle(summary),
            },
            {
              label: 'Delete',
              icon: <Trash2 className="w-4 h-4" />,
              onClick: () => handleDelete(summary),
              variant: 'danger' as const,
            },
          ];

          return (
            <Card
              key={summary.id}
              to={`/s/${summary.shortCode}`}
              title={summary.studyMaterial.title}
              subtitle={
                summary.studyMaterial.topic ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {summary.studyMaterial.topic.split(',').map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider rounded border border-primary-100 dark:border-primary-800/50"
                      >
                        {tag.trim().replaceAll('`', '')}
                      </span>
                    ))}
                  </div>
                ) : undefined
              }
              actions={<CardMenu items={menuItems} />}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    <span>{summary.viewCount} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(summary.generatedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    {summary.isPublic ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                        <Globe className="w-3 h-3" />
                        <span>Public</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        <Lock className="w-3 h-3" />
                        <span>Private</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {Number((summary as any)._count?.reactions) || 0}{' '}
                      reactions
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          if (summaryToDelete) {
            deleteMutation.mutate(summaryToDelete.id);
          }
        }}
        title="Delete Summary"
        itemName={summaryToDelete?.studyMaterial.title}
        isDeleting={deleteMutation.isPending}
        message={
          <p>
            Are you sure you want to delete the summary for{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {summaryToDelete?.studyMaterial.title}
            </span>
            ? This action cannot be undone and will remove all associated
            reactions and views.
          </p>
        }
      />
    </div>
  );
};
