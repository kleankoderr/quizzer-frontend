import { apiClient } from "./api";

export interface Content {
  id: string;
  title: string;
  content: string;
  topic: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentDto {
  title: string;
  content: string;
  topic: string;
}

export interface GenerateFromTopicDto {
  topic: string;
}

export const contentService = {
  async generateFromTopic(topic: string): Promise<Content> {
    const response = await apiClient.post("/content/generate", { topic });
    return response.data;
  },

  async createFromText(data: CreateContentDto): Promise<Content> {
    const response = await apiClient.post("/content", data);
    return response.data;
  },

  async createFromFile(file: File): Promise<Content> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/content/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async getAll(topic?: string): Promise<Content[]> {
    const params = topic ? { topic } : {};
    const response = await apiClient.get("/content", { params });
    return response.data;
  },

  async getById(id: string): Promise<Content> {
    const response = await apiClient.get(`/content/${id}`);
    return response.data;
  },

  async update(id: string, data: Partial<CreateContentDto>): Promise<Content> {
    const response = await apiClient.put(`/content/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
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
  ): Promise<any> {
    const response = await apiClient.post(
      `/content/${contentId}/highlights`,
      data
    );
    return response.data;
  },

  async deleteHighlight(highlightId: string): Promise<void> {
    await apiClient.delete(`/content/highlights/${highlightId}`);
  },
};
