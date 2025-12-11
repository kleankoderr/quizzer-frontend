import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Check,
  Search,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  userDocumentService,
  type UserDocument,
} from '../services/user-document.service';
import { useNavigate } from 'react-router-dom';

interface FileSelectorProps {
  selectedFileIds: string[];
  onSelectionChange: (fileIds: string[]) => void;
  maxFiles?: number;
  className?: string;
  hideIfEmpty?: boolean;
}

export const FileSelector = ({
  selectedFileIds,
  onSelectionChange,
  maxFiles = 5,
  className = '',
  hideIfEmpty = false,
}: FileSelectorProps) => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<UserDocument[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const loadingRef = useRef(false); // Prevent duplicate calls

  useEffect(() => {
    // Only load if not already loading
    if (!loadingRef.current) {
      loadDocuments();
    }
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredDocuments(
        documents.filter(
          (doc) =>
            doc.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.document.fileName
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredDocuments(documents);
    }
  }, [searchQuery, documents]);

  const loadDocuments = async () => {
    // Prevent duplicate calls
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      const docs = await userDocumentService.getUserDocuments();
      setDocuments(docs);
      setFilteredDocuments(docs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const toggleSelection = (docId: string) => {
    if (selectedFileIds.includes(docId)) {
      onSelectionChange(selectedFileIds.filter((id) => id !== docId));
    } else {
      if (selectedFileIds.length >= maxFiles) {
        toast.error(`You can select up to ${maxFiles} files`);
        return;
      }
      onSelectionChange([...selectedFileIds, docId]);
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  if (loading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Loading files...
          </span>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    if (loading) return null;
  }

  if (documents.length === 0) {
    if (hideIfEmpty) return null;

    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}
      >
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No files uploaded yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Upload files to reuse them across different generations
          </p>
          <button
            onClick={() => navigate('/files')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Manage Files
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Select Files
          </h3>
          <div className="flex items-center gap-2">
            {selectedFileIds.length > 0 && (
              <button
                onClick={clearSelection}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Clear ({selectedFileIds.length})
              </button>
            )}
            <button
              onClick={() => navigate('/files')}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Manage
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* File List */}
      <div className="max-h-64 overflow-y-auto">
        {filteredDocuments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No files found
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredDocuments.map((doc) => {
              const isSelected = selectedFileIds.includes(doc.id);
              return (
                <button
                  key={doc.id}
                  onClick={() => toggleSelection(doc.id)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${
                    isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-primary-600 border-primary-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* File Icon */}
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                    {userDocumentService.getFileIcon(doc.document.mimeType)}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {doc.displayName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {userDocumentService.formatFileSize(
                          doc.document.sizeBytes
                        )}
                      </span>
                      <span>•</span>
                      <span>
                        {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedFileIds.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedFileIds.length} of {maxFiles} files selected
          </p>
        </div>
      )}
    </div>
  );
};
