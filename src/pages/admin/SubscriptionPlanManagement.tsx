import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Users,
  Zap,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { SubscriptionPlan } from '../../services/adminService';
import { Toast as toast } from '../../utils/toast';

export const SubscriptionPlanManagement = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );

  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: adminService.getSubscriptionPlans,
  });

  const createMutation = useMutation({
    mutationFn: adminService.createSubscriptionPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
      setIsCreateModalOpen(false);
      toast.success('Plan created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create plan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminService.updateSubscriptionPlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
      setIsEditModalOpen(false);
      setSelectedPlan(null);
      toast.success('Plan updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update plan');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteSubscriptionPlan,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
      setIsDeleteModalOpen(false);
      setSelectedPlan(null);
      toast.success(data.message || 'Plan deleted/deactivated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    },
  });

  const handleEdit = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsEditModalOpen(true);
  };

  const handleDelete = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPlan) {
      deleteMutation.mutate(selectedPlan.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Subscription Plans
          </h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-4 h-10 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Subscription Plans
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage subscription plans and pricing
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Create Plan
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans?.map((plan) => (
          <div
            key={plan.id}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary-100 p-2 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {plan.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                        <X className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(plan)}
                  className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  title="Edit plan"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(plan)}
                  className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  title="Delete plan"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ₦{plan.price.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / {plan.interval}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>{plan.subscriberCount || 0} subscribers</span>
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                  <Zap className="h-4 w-4 text-primary-600" />
                  Quotas
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{plan.quotas?.quizzes || 0}</span> quizzes/mo
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{plan.quotas?.flashcards || 0}</span> flashcards/mo
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{plan.quotas?.studyMaterials || 0}</span> materials/mo
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{plan.quotas?.conceptExplanations || 0}</span> explanations/mo
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{plan.quotas?.storageLimitMB || 0}</span> MB storage
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{plan.quotas?.filesPerMonth || 0}</span> files/mo
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <PlanFormModal
          plan={selectedPlan}
          isOpen={isCreateModalOpen || isEditModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedPlan(null);
          }}
          onSubmit={(data) => {
            if (isEditModalOpen && selectedPlan) {
              updateMutation.mutate({ id: selectedPlan.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Delete Plan
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete "{selectedPlan.name}"?
              {selectedPlan.subscriberCount && selectedPlan.subscriberCount > 0 && (
                <span className="mt-2 block font-medium text-amber-600">
                  This plan has {selectedPlan.subscriberCount} active subscribers. It will be deactivated instead of deleted.
                </span>
              )}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedPlan(null);
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Plan Form Modal Component
const PlanFormModal = ({
  plan,
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  plan: SubscriptionPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    price: plan?.price || 0,
    interval: plan?.interval || 'month',
    isActive: plan?.isActive !== false,
    quotas: {
      quizzes: plan?.quotas?.quizzes || 0,
      flashcards: plan?.quotas?.flashcards || 0,
      studyMaterials: plan?.quotas?.studyMaterials || 0,
      conceptExplanations: plan?.quotas?.conceptExplanations || 0,
      smartRecommendations: plan?.quotas?.smartRecommendations || 0,
      smartCompanions: plan?.quotas?.smartCompanions || 0,
      storageLimitMB: plan?.quotas?.storageLimitMB || 0,
      filesPerMonth: plan?.quotas?.filesPerMonth || 0,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {plan ? 'Edit Plan' : 'Create Plan'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Plan Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Premium Plan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Price (Naira)
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={formData.price}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string or valid numbers only
                  if (value === '' || /^\d+$/.test(value)) {
                    setFormData({ ...formData, price: value === '' ? 0 : Number(value) });
                  }
                }}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="2000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Billing Interval
              </label>
              <select
                value={formData.interval}
                onChange={(e) =>
                  setFormData({ ...formData, interval: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active Plan
                </span>
              </label>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
            <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              Monthly Quotas
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quizzes per Month
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quotas.quizzes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quotas: {
                        ...formData.quotas,
                        quizzes: Number(e.target.value),
                      },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Flashcards per Month
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quotas.flashcards}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quotas: {
                        ...formData.quotas,
                        flashcards: Number(e.target.value),
                      },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Study Materials per Month
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quotas.studyMaterials}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quotas: {
                        ...formData.quotas,
                        studyMaterials: Number(e.target.value),
                      },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Concept Explanations per Month
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quotas.conceptExplanations}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quotas: {
                        ...formData.quotas,
                        conceptExplanations: Number(e.target.value),
                      },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Smart Recommendations per Month
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quotas.smartRecommendations}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quotas: {
                        ...formData.quotas,
                        smartRecommendations: Number(e.target.value),
                      },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Smart Companions per Month
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quotas.smartCompanions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quotas: {
                        ...formData.quotas,
                        smartCompanions: Number(e.target.value),
                      },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Storage Limit (MB)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quotas.storageLimitMB}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quotas: {
                        ...formData.quotas,
                        storageLimitMB: Number(e.target.value),
                      },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Documents per Month
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quotas.filesPerMonth}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quotas: {
                        ...formData.quotas,
                        filesPerMonth: Number(e.target.value),
                      },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
