import { apiClient } from "./api";

export interface Content {
  id: string;
  title: string;
  content: string;
  topic: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  quizId?: string;
  flashcardSetId?: string;
  learningGuide?: {
    overview: string;
    keyConcepts: string[];
    sections: {
      title: string;
      content: string;
      example?: string;
      completed?: boolean;
      generatedExplanation?: string;
      generatedExample?: string;
    }[];
    nextSteps: string[];
  };
  lastReadPosition?: number;
}

export interface CreateContentDto {
  title: string;
  content: string;
  topic: string;
}

export interface GenerateFromTopicDto {
  topic: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: unknown; timestamp: number }>();

const clearCache = () => {
  cache.clear();
};

export interface UpdateContentDto extends Partial<CreateContentDto> {
  learningGuide?: Content["learningGuide"];
  lastReadPosition?: number;
}

export const contentService = {
  async generateFromTopic(topic: string): Promise<{ taskId: string }> {
    clearCache();
    const response = await apiClient.post("/content/generate", { topic });
    return response.data;
  },

  async createFromText(data: CreateContentDto): Promise<Content> {
    clearCache();
    const response = await apiClient.post("/content", data);
    return response.data;
  },

  async createFromFile(file: File): Promise<Content> {
    clearCache();
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/content/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
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
    const cacheKey = `content-${topic || "all"}-${page}-${limit}`;
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
    const response = await apiClient.get("/content", { params });

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
    const response = await apiClient.get("/content/popular-topics");
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
