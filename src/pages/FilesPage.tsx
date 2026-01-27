import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileText,
  Download,
  Trash2,
  Search,
  Filter,
  Upload,
  Calendar,
  HardDrive,
  ChevronDown,
  X,
  Eye,
  MoreVertical,
  ArrowLeft,
  Grid,
  List,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { CardSkeleton, TableSkeleton } from '../components/skeletons';
import { format } from 'date-fns';
import { Toast as toast } from '../utils/toast';
import {
  userDocumentService,
  type UserDocument,
} from '../services/user-document.service';
import { Modal } from '../components/Modal';
import { DeleteModal } from '../components/DeleteModal';
import { FileUpload } from '../components/FileUpload';
import { StorageCleanupModal } from '../components/User/StorageCleanupModal';
import { useUserDocuments, useInvalidateQuota } from '../hooks';
import { useQueryClient } from '@tanstack/react-query';

type SortField = 'name' | 'date' | 'size';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export const FilesPage = () => {
  const navigate = useNavigate();
  const {
    data,
    isLoading: loading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserDocuments();
  const queryClient = useQueryClient();
  const invalidateQuota = useInvalidateQuota();

  const documents = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(
    null
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const location = useLocation();
  const [uploadModalOpen, setUploadModalOpen] = useState(
    location.state?.openUpload === true
  );
  const [storageCleanupModalOpen, setStorageCleanupModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredDocuments = useMemo(() => {
    // Determine which list to filter - use data from hook
    let filtered = [...documents];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.document.fileName
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter((doc) => {
        const mimeType = doc.document.mimeType;
        if (selectedType === 'pdf') {
          return mimeType.includes('pdf');
        }
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'date':
          comparison =
            new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          comparison = a.document.sizeBytes - b.document.sizeBytes;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [documents, searchQuery, selectedType, sortField, sortOrder]);

  const handleDownload = async (doc: UserDocument) => {
    try {
      const { url } = await userDocumentService.getDownloadUrl(doc.id);
      window.open(url, '_blank');
      toast.success('Download started');
    } catch (_error) {
      toast.error('Failed to download file');
    }
  };

  const handleDelete = (doc: UserDocument) => {
    setSelectedDocument(doc);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDocument) return;

    setIsDeleting(true);
    const loadingToast = toast.loading('Deleting file...');
    try {
      await userDocumentService.deleteUserDocument(selectedDocument.id);
      toast.success('File deleted successfully', { id: loadingToast });

      // Invalidate queries instead of local state update
      await queryClient.invalidateQueries({ queryKey: ['userDocuments'] });
      await invalidateQuota();

      setDeleteModalOpen(false);
      setSelectedDocument(null);
    } catch (_error) {
      toast.error('Failed to delete file', { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = (doc: UserDocument) => {
    setSelectedDocument(doc);
    setPreviewModalOpen(true);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    const loadingToast = toast.loading(
      `Uploading ${uploadFiles.length} file(s)...`
    );
    setUploading(true);

    try {
      await userDocumentService.uploadFiles(uploadFiles);
      toast.success(`Successfully uploaded ${uploadFiles.length} file(s)`, {
        id: loadingToast,
      });
      // Invalidate queries to refresh list
      await queryClient.invalidateQueries({ queryKey: ['userDocuments'] });
      await invalidateQuota();

      setUploadModalOpen(false);
      setUploadFiles([]);
    } catch (error: any) {
      if (
        error.response?.status === 403 &&
        (error.response?.data?.message?.includes('storage limit') ||
          error.response?.data?.message?.includes('Storage limit'))
      ) {
        toast.dismiss(loadingToast);
        setStorageCleanupModalOpen(true);
      } else {
        toast.error('Failed to upload files', { id: loadingToast });
      }
    } finally {
      setUploading(false);
    }
  };

  // File handling functions removed as they are now handled by FileUpload component
  // handleFileSelect, handleDrop, removeUploadFile are no longer needed here

  const getFileTypeCount = (type: string) => {
    if (type === 'all') return documents.length;
    return documents.filter((doc) => {
      const mimeType = doc.document.mimeType;
      if (type === 'pdf') {
        return mimeType.includes('pdf');
      } else {
        return false;
      }
    }).length;
  };

  const totalSize = documents.reduce(
    (acc, doc) => acc + doc.document.sizeBytes,
    0
  );

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;
      const scrolledToBottom = scrollHeight - scrollTop <= clientHeight + 200; // 200px threshold

      if (scrolledToBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const loadingView =
    viewMode === 'grid' ? (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <CardSkeleton count={10} />
      </div>
    ) : (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <TableSkeleton rows={10} columns={4} />
      </div>
    );

  const content = (() => {
    if (loading) {
      return loadingView;
    }

    if (filteredDocuments.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery || selectedType !== 'all'
              ? 'No documents found'
              : 'No documents yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || selectedType !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'Upload documents through the content generation pages'}
          </p>
        </div>
      );
    }

    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 flex flex-col"
            >
              {/* File Icon */}
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl flex items-center justify-center text-2xl sm:text-3xl">
                  {userDocumentService.getFileIcon(doc.document.mimeType)}
                </div>
                <div className="relative -mr-2 -mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  {openMenuId === doc.id && (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-10 w-full h-full cursor-default focus:outline-none"
                        aria-label="Close menu"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                        <button
                          onClick={() => {
                            handlePreview(doc);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </button>
                        <button
                          onClick={() => {
                            handleDownload(doc);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(doc);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* File Info */}
              <div className="mt-auto">
                <h3
                  className="font-semibold text-gray-900 dark:text-white mb-1 truncate text-sm sm:text-base"
                  title={doc.displayName}
                >
                  {doc.displayName}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {userDocumentService.formatFileSize(doc.document.sizeBytes)}
                </p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Size
                </th>
                <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                        {userDocumentService.getFileIcon(doc.document.mimeType)}
                      </div>
                      <div className="min-w-0 max-w-[200px] sm:max-w-xs lg:max-w-md">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {doc.displayName}
                        </p>
                        {/* Show size on mobile in subtitle */}
                        <p className="sm:hidden text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {userDocumentService.formatFileSize(
                            doc.document.sizeBytes
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {userDocumentService.formatFileSize(doc.document.sizeBytes)}
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handlePreview(doc)}
                        className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="hidden sm:block p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  })();

  return (
    <div
      ref={scrollContainerRef}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-screen overflow-y-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary-600" />
                My Documents
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Manage and organize your uploaded documents
              </p>
            </div>
          </div>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <Upload className="w-5 h-5" />
            Upload Documents
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm font-medium">
                  Total Documents
                </p>
                <p className="text-3xl font-bold mt-1">{documents.length}</p>
              </div>
              <FileText className="w-12 h-12 opacity-30" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">
                  Storage Used
                </p>
                <p className="text-3xl font-bold mt-1">
                  {userDocumentService.formatFileSize(totalSize)}
                </p>
              </div>
              <HardDrive className="w-12 h-12 opacity-30" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Recent Upload
                </p>
                <p className="text-lg font-bold mt-1">
                  {documents.length > 0
                    ? format(new Date(documents[0].uploadedAt), 'MMM d, yyyy')
                    : 'No files'}
                </p>
              </div>
              <Upload className="w-12 h-12 opacity-30" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="all">
                All Documents ({getFileTypeCount('all')})
              </option>
              <option value="pdf">PDFs ({getFileTypeCount('pdf')})</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-gray-50 dark:bg-gray-900 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
            Sort by:
          </span>
          {(['name', 'date', 'size'] as SortField[]).map((field) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                sortField === field
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {field.charAt(0).toUpperCase() + field.slice(1)}
              {sortField === field &&
                (sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                ))}
            </button>
          ))}
        </div>
      </div>

      {/* Files Display */}
      {content}

      {/* Loading More Indicator */}
      {isFetchingNextPage && !loading && (
        <div className="mt-6 flex items-center justify-center py-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading more files...</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete File"
        itemName={selectedDocument?.displayName}
        isDeleting={isDeleting}
      />

      {/* Storage Cleanup Modal */}
      <StorageCleanupModal
        isOpen={storageCleanupModalOpen}
        onClose={() => setStorageCleanupModalOpen(false)}
      />

      {/* Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="File Details"
      >
        {selectedDocument && (
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
                {userDocumentService.getFileIcon(
                  selectedDocument.document.mimeType
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                  {selectedDocument.displayName}
                </h3>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">
                  File Size
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {userDocumentService.formatFileSize(
                    selectedDocument.document.sizeBytes
                  )}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Type</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedDocument.document.mimeType}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">
                  Uploaded
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {format(
                    new Date(selectedDocument.uploadedAt),
                    'MMM d, yyyy h:mm a'
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleDownload(selectedDocument);
                  setPreviewModalOpen(false);
                }}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setUploadFiles([]);
        }}
        title="Upload Documents"
      >
        <div className="p-6">
          <FileUpload
            files={uploadFiles}
            onFilesChange={setUploadFiles}
            maxFiles={5}
            className="mb-6"
          />

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setUploadModalOpen(false);
                setUploadFiles([]);
              }}
              disabled={uploading}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploadFiles.length === 0 || uploading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading
                ? 'Uploading...'
                : `Upload ${uploadFiles.length} file(s)`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
