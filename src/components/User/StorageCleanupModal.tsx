import React, { useEffect, useState } from 'react';
import { Modal } from '../Modal';
import { useStorageCleanup } from '../../hooks/useStorageCleanup';
import { Trash2, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

interface StorageCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageCleanupModal: React.FC<StorageCleanupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data, loading, deleting, fetchSuggestions, deleteFiles } =
    useStorageCleanup();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
      setSelectedIds(new Set());
    }
  }, [isOpen, fetchSuggestions]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleCleanup = async () => {
    if (selectedIds.size === 0) return;
    const success = await deleteFiles(Array.from(selectedIds));
    if (success) {
      setSelectedIds(new Set());
    }
  };

  const selectedSizeMB =
    data?.suggestions
      .filter((s) => selectedIds.has(s.id))
      .reduce((acc, s) => acc + Number.parseFloat(s.sizeMB), 0) || 0;

  const needed = data?.neededDeletion || 0;
  const remainingNeeded = Math.max(0, needed - selectedSizeMB);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Storage Limit Reached"
      className="max-w-2xl"
    >
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-sm font-bold text-red-800 dark:text-red-300">
              Storage Cleanup Required
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              You have exceeded your storage limit. Please delete at least{' '}
              <span className="font-bold">{needed.toFixed(2)} MB</span> of files
              to continue uploading.
            </p>
          </div>
        </div>

        {loading && !data ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-500">Analyze storage...</p>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Selected for deletion
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {selectedSizeMB.toFixed(2)} MB / {needed.toFixed(2)} MB required
                </span>
              </div>
              <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    remainingNeeded <= 0 ? 'bg-emerald-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min(100, (selectedSizeMB / needed) * 100)}%` }}
                />
              </div>
              {remainingNeeded <= 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  You have selected enough files to clear the limit
                </p>
              )}
            </div>

            {/* Suggestions List */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Largest Files
              </h4>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-500 w-10">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={
                            data?.suggestions.length === selectedIds.size &&
                            data?.suggestions.length > 0
                          }
                          onChange={() => {
                            if (selectedIds.size === data?.suggestions.length) {
                              setSelectedIds(new Set());
                            } else {
                              setSelectedIds(
                                new Set(data?.suggestions.map((s) => s.id))
                              );
                            }
                          }}
                        />
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">File</th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-right">
                        Size
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data?.suggestions.map((file) => (
                      <tr
                        key={file.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                          selectedIds.has(file.id)
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : ''
                        }`}
                        onClick={() => toggleSelection(file.id)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(file.id)}
                            onChange={() => toggleSelection(file.id)}
                            className="rounded border-gray-300"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-200">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="truncate max-w-[200px]">
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                          {file.sizeMB} MB
                        </td>
                      </tr>
                    ))}
                    {data?.suggestions.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No large files found to suggest.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
              >
                Close
              </button>
              <button
                onClick={handleCleanup}
                disabled={selectedIds.size === 0 || deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Selected ({selectedSizeMB.toFixed(2)} MB)
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
