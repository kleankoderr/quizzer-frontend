import React, { useEffect, useState } from 'react';
import { CheckCircle2, Globe, School, X, XCircle } from 'lucide-react';
import { adminService } from '../../services';
import { Select } from '../ui/Select';

export interface AdminStudyPackFormValues {
  id: string;
  title: string;
  description?: string | null;
  scope: string;
  schoolId?: string | null;
  isActive?: boolean;
}

export interface AdminStudyPackFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialValues?: AdminStudyPackFormValues | null;
  onSubmit: (data: {
    title: string;
    description?: string;
    scope: 'GLOBAL' | 'SCHOOL';
    schoolId?: string;
    isActive: boolean;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const AdminStudyPackFormModal: React.FC<AdminStudyPackFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialValues,
  onSubmit,
  isSubmitting,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<'GLOBAL' | 'SCHOOL'>('GLOBAL');
  const [schoolId, setSchoolId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  useEffect(() => {
    if (scope === 'SCHOOL') {
      setLoadingSchools(true);
      adminService.getSchools().then((data) => setSchools(data || [])).finally(() => setLoadingSchools(false));
    }
  }, [scope]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialValues) {
      setTitle(initialValues.title);
      setDescription(initialValues.description ?? '');
      setScope((initialValues.scope as 'GLOBAL' | 'SCHOOL') || 'GLOBAL');
      setSchoolId(initialValues.schoolId ?? '');
      setIsActive(initialValues.isActive !== false);
    } else {
      setTitle('');
      setDescription('');
      setScope('GLOBAL');
      setSchoolId('');
      setIsActive(true);
    }
  }, [isOpen, initialValues]);

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    await onSubmit({
      title: trimmedTitle,
      description: description.trim() || undefined,
      scope,
      schoolId: scope === 'SCHOOL' ? schoolId || undefined : undefined,
      isActive,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl transition-all z-20 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {mode === 'edit' ? 'Edit Study Pack' : 'Create Study Pack'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Biology Fundamentals"
              className="input-field w-full"
              maxLength={200}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the study pack"
              className="input-field w-full min-h-[80px] resize-y"
              maxLength={500}
            />
          </div>
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
          {scope === 'SCHOOL' && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">School</label>
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
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary px-4 py-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary px-4 py-2" disabled={isSubmitting}>
              {isSubmitting ? (mode === 'edit' ? 'Saving...' : 'Creating...') : mode === 'edit' ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
