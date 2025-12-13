import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { School, Plus, Edit2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Toast as toast } from '../../utils/toast';
import { useState } from 'react';
import { Modal } from '../../components/Modal';

export const SchoolManagement = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactEmail: '',
  });
  const queryClient = useQueryClient();

  const { data: schools, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: adminService.getSchools,
  });

  const createMutation = useMutation({
    mutationFn: adminService.createSchool,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('School created successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create school');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminService.updateSchool(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('School updated successfully');
      setEditingSchool(null);
      closeModal(); // Keep closeModal to reset form and modal state
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update school');
    },
  });

  const openCreateModal = () => {
    setEditingSchool(null);
    setFormData({ name: '', address: '', contactEmail: '' });
    setModalOpen(true);
  };

  const openEditModal = (school: any) => {
    setEditingSchool(school);
    setFormData({
      name: school.name || '',
      address: school.address || '',
      contactEmail: school.contactEmail || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSchool(null);
    setFormData({ name: '', address: '', contactEmail: '' });
  };

  const handleSubmit = () => {
    if (editingSchool) {
      updateMutation.mutate({ id: editingSchool.id, data: formData });
    } else {
      createMutation.mutate(formData);
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
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          School Management
        </h1>
        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add School
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schools?.map((school: any) => (
          <div
            key={school.id}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary-100 p-2 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <School className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {school.name}
                  </h3>
                  {school.address && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {school.address}
                    </p>
                  )}
                  {school.contactEmail && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {school.contactEmail}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => openEditModal(school)}
                className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingSchool ? 'Edit School' : 'Add School'}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              {editingSchool ? 'Update' : 'Create'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              School Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Enter school name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Enter address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) =>
                setFormData({ ...formData, contactEmail: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Enter contact email"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
