import { apiClient } from './api';

export interface UserDocument {
  id: string;
  displayName: string;
  uploadedAt: string;
  document: {
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    cloudinaryUrl: string;
    googleFileUrl?: string;
  };
}

export interface PaginatedUserDocuments {
  data: UserDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface CreateUserDocumentDto {
  documentId: string;
  displayName?: string;
}

class UserDocumentService {
  /**
   * Get all user documents (paginated)
   */
  async getUserDocuments(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedUserDocuments> {
    const response = await apiClient.get<PaginatedUserDocuments>(
      '/user-documents',
      {
        params: { page, limit },
      }
    );
    return response.data;
  }

  /**
   * Get a specific user document by ID
   */
  async getUserDocumentById(id: string): Promise<UserDocument> {
    const response = await apiClient.get<UserDocument>(`/user-documents/${id}`);
    return response.data;
  }

  /**
   * Create a user document reference
   */
  async createUserDocument(dto: CreateUserDocumentDto): Promise<UserDocument> {
    const response = await apiClient.post<UserDocument>('/user-documents', dto);
    return response.data;
  }

  /**
   * Delete a user document
   */
  async deleteUserDocument(id: string): Promise<void> {
    await apiClient.delete(`/user-documents/${id}`);
  }

  /**
   * Get download URL for a document
   */
  async getDownloadUrl(id: string): Promise<{ url: string }> {
    const response = await apiClient.get<{ url: string }>(
      `/user-documents/${id}/download`
    );
    return response.data;
  }

  /**
   * Upload files and create UserDocument references
   */
  async uploadFiles(files: File[]): Promise<UserDocument[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await apiClient.post<UserDocument[]>(
      '/user-documents/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file icon based on mime type
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
      return '📽️';
    if (mimeType.includes('text')) return '📃';
    if (mimeType.includes('zip') || mimeType.includes('compressed'))
      return '🗜️';
    return '📎';
  }
}

export const userDocumentService = new UserDocumentService();
