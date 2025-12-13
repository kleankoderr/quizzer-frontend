import { apiClient } from './api';

export interface Content {
  id: string;
  title: string;
  content: string;
  description?: string;
  topic: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  quizId?: string;
  flashcardSetId?: string;
  learningGuide?: {
    overview?: string;
    keyConcepts?: string[];
    sections: {
      title: string;
      content: string;
      example?: string;
      assessment?: string;
      completed?: boolean;
      generatedExplanation?: string;
      generatedExample?: string;
    }[];
    nextSteps?: string[];
  };
  lastReadPosition?: number;
  studyPack?: {
    id: string;
    title: string;
  };
}

export interface GenerateContentDto {
  topic?: string;
  content?: string;
  title?: string;
  selectedFileIds?: string[];
  studyPackId?: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: unknown; timestamp: number }>();

const clearCache = () => {
  cache.clear();
};

export interface UpdateContentDto {
  title?: string;
  content?: string;
  topic?: string;
  learningGuide?: Content['learningGuide'];
  lastReadPosition?: number;
}

export const contentService = {
  /**
   * Unified content generation method
   * Supports generation from:
   * - Topic alone
   * - Content text (with optional topic/title)
   * - Uploaded files
   * - Selected files from file management
   * - Any combination of the above
   */
  async generate(
    data: GenerateContentDto,
    files?: File[],
    onProgress?: (progress: number) => void
  ): Promise<{ jobId: string }> {
    clearCache();
    const formData = new FormData();

    // Add text fields if provided
    if (data.topic) {
      formData.append('topic', data.topic);
    }
    if (data.content) {
      formData.append('content', data.content);
    }
    if (data.title) {
      formData.append('title', data.title);
    }
    if (data.studyPackId) {
      formData.append('studyPackId', data.studyPackId);
    }

    // Add selected file IDs if provided
    if (data.selectedFileIds && data.selectedFileIds.length > 0) {
      data.selectedFileIds.forEach((id) => {
        formData.append('selectedFileIds[]', id);
      });
    }

    // Add uploaded files if provided
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }

    const response = await apiClient.post('/content/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  async getAll(
    topic?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: Content[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const cacheKey = `content-${topic || 'all'}-${page}-${limit}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data as {
        data: Content[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    }

    const params = {
      ...(topic ? { topic } : {}),
      page,
      limit,
    };
    const response = await apiClient.get('/content', { params });

    cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    return response.data;
  },

  async getById(id: string): Promise<Content> {
    const response = await apiClient.get(`/content/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateContentDto): Promise<Content> {
    clearCache();
    const response = await apiClient.put(`/content/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    clearCache();
    await apiClient.delete(`/content/${id}`);
  },

  async addHighlight(
    contentId: string,
    data: {
      text: string;
      color?: string;
      startOffset: number;
      endOffset: number;
      note?: string;
      sectionIndex?: number;
    }
  ): Promise<unknown> {
    const response = await apiClient.post(
      `/content/${contentId}/highlights`,
      data
    );
    return response.data;
  },

  async deleteHighlight(highlightId: string): Promise<void> {
    await apiClient.delete(`/content/highlights/${highlightId}`);
  },

  async getPopularTopics(): Promise<string[]> {
    const response = await apiClient.get('/content/popular-topics');
    return response.data;
  },

  async generateExplanation(
    contentId: string,
    sectionTitle: string,
    sectionContent: string
  ): Promise<string> {
    const response = await apiClient.post(`/content/${contentId}/explain`, {
      sectionTitle,
      sectionContent,
    });
    return response.data;
  },

  async generateExample(
    contentId: string,
    sectionTitle: string,
    sectionContent: string
  ): Promise<string> {
    const response = await apiClient.post(`/content/${contentId}/example`, {
      sectionTitle,
      sectionContent,
    });
    return response.data;
  },
};
