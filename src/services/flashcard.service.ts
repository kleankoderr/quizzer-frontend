import { apiClient } from "./api";
import { FLASHCARD_ENDPOINTS } from "../config/api";
import type { FlashcardSet, FlashcardGenerateRequest } from "../types";

export interface FlashcardJobStatus {
  jobId: string;
  status: "pending" | "active" | "completed" | "failed";
  progress?: any;
  result?: { success: boolean; flashcardSet: FlashcardSet };
  error?: string;
}

export const flashcardService = {
  // Generate flashcards
  generate: async (
    request: FlashcardGenerateRequest,
    files?: File[],
  ): Promise<{ jobId: string; status: string }> => {
    const formData = new FormData();

    // Add files if provided
    if (files && files.length > 0) {
      for (const file of files) {
        formData.append("files", file);
      }
    }

    // Add other fields
    if (request.topic) formData.append("topic", request.topic);
    if (request.content) formData.append("content", request.content);
    if (request.contentId) formData.append("contentId", request.contentId);
    formData.append("numberOfCards", request.numberOfCards.toString());

    const response = await apiClient.post<{ jobId: string; status: string }>(
      FLASHCARD_ENDPOINTS.GENERATE,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  // Check job status
  getJobStatus: async (jobId: string): Promise<FlashcardJobStatus> => {
    const response = await apiClient.get<FlashcardJobStatus>(
      `/flashcards/status/${jobId}`,
    );
    return response.data;
  },

  // Poll for flashcard completion
  pollForCompletion: async (
    jobId: string,
    onProgress?: (progress: number) => void,
    maxAttempts = 60,
  ): Promise<FlashcardSet | null> => {
    let attempts = 0;
    let jobFound = false;

    while (attempts < maxAttempts) {
      try {
        const status = await flashcardService.getJobStatus(jobId);
        jobFound = true; // Mark that we successfully found the job at least once

        // Update progress if available
        if (status.progress && onProgress) {
          // Progress can be a number or an object depending on implementation
          const progressValue =
            typeof status.progress === "number"
              ? status.progress
              : status.progress.percent || 0;
          onProgress(progressValue);
        }

        if (status.status === "completed") {
          if (onProgress) onProgress(100);

          // Check if result exists and extract flashcardSet
          if (status.result && typeof status.result === "object") {
            const result = status.result as any;
            if (result.flashcardSet) {
              return result.flashcardSet;
            }
          }
          // Job completed successfully, return null to indicate success without direct result
          return null;
        }

        if (status.status === "failed") {
          throw new Error(status.error || "Flashcard generation failed");
        }
      } catch (error: any) {
        // Handle 404: If job was previously found, it might have been completed and removed
        if (error?.response?.status === 404 && jobFound) {
          if (onProgress) onProgress(100);
          return null; // Assume success if it was running and now gone
        }
        // If never found or other error, rethrow
        if (error?.response?.status !== 404) {
          throw error;
        }
      }

      // Wait 5 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error("Flashcard generation timed out");
  },

  // Get all flashcard sets
  getAll: async (): Promise<FlashcardSet[]> => {
    const response = await apiClient.get<FlashcardSet[]>(
      FLASHCARD_ENDPOINTS.GET_ALL,
    );
    return response.data;
  },

  // Get flashcard set by ID
  getById: async (id: string): Promise<FlashcardSet> => {
    const response = await apiClient.get<FlashcardSet>(
      FLASHCARD_ENDPOINTS.GET_BY_ID(id),
    );
    return response.data;
  },

  // Record flashcard study session
  recordSession: async (
    id: string,
    cardResponses: Array<{
      cardIndex: number;
      response: "know" | "dont-know" | "skipped";
    }>,
  ): Promise<any> => {
    const response = await apiClient.post(
      FLASHCARD_ENDPOINTS.RECORD_SESSION(id),
      { cardResponses },
    );
    return response.data;
  },

  // Delete flashcard set
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/flashcards/${id}`);
  },
};
