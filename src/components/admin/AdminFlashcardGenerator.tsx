import React, { useEffect, useState } from 'react';
import { FlashcardGenerator } from '../FlashcardGenerator';
import type { FlashcardGenerateRequest } from '../../types';
import { adminService } from '../../services';
import { CheckCircle2, Globe, School, XCircle } from 'lucide-react';
import { Select } from '../ui/Select';

interface AdminFlashcardGeneratorProps {
  onGenerate: (request: FlashcardGenerateRequest & { scope: 'GLOBAL' | 'SCHOOL'; schoolId?: string; isActive?: boolean }, files?: File[]) => void;
  loading: boolean;
  initialValues?: {
    topic?: string;
    content?: string;
    mode?: 'topic' | 'content' | 'files';
    sourceTitle?: string;
    contentId?: string;
    studyPackId?: string;
  };
}

export const AdminFlashcardGenerator: React.FC<AdminFlashcardGeneratorProps> = ({
  onGenerate,
  loading,
  initialValues,
}) => {
  const [scope, setScope] = useState<'GLOBAL' | 'SCHOOL'>('GLOBAL');
  const [schoolId, setSchoolId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [schools, setSchools] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      if (scope === 'SCHOOL') {
        setLoadingSchools(true);
        try {
          const data = await adminService.getSchools();
          setSchools(data || []);
        } catch (error) {
          console.error('Failed to fetch schools:', error);
        } finally {
          setLoadingSchools(false);
        }
      }
    };
    fetchSchools();
  }, [scope]);

  const handleGenerate = (request: FlashcardGenerateRequest, files?: File[]) => {
    onGenerate(
      {
        ...request,
        scope,
        schoolId: scope === 'SCHOOL' ? schoolId || undefined : undefined,
        isActive,
      },
      files
    );
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-primary-200 dark:border-gray-700 bg-primary-50/50 dark:bg-primary-900/10 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Admin visibility</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Visibility Scope
            </label>
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
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Status
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  isActive
                    ? 'border-green-600 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Active
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  !isActive
                    ? 'border-red-600 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Inactive
              </button>
            </div>
          </div>
        </div>
        {scope === 'SCHOOL' && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Select School
            </label>
            <Select
              value={schoolId}
              onChange={setSchoolId}
              disabled={loadingSchools}
              options={[
                { label: 'Select a school...', value: '' },
                ...schools.map((school) => ({
                  label: school.name,
                  value: school.id,
                })),
              ]}
              prefixIcon={<School className="w-5 h-5" />}
            />
          </div>
        )}
      </div>
      <FlashcardGenerator
        onGenerate={handleGenerate}
        loading={loading}
        initialValues={initialValues}
      />
    </div>
  );
};
