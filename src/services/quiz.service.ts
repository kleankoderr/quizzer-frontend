import { apiClient } from './api';
import { QUIZ_ENDPOINTS } from '../config/api';
import type {
  Quiz,
  Attempt,
  QuizGenerateRequest,
  QuizSubmission,
  QuizResult,
} from '../types';
import {
  gamificationService,
  type GamificationUpdateResult,
} from './gamification.service';

export interface QuizSubmitResult {
  result: QuizResult;
  gamification: GamificationUpdateResult;
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress?: any;
  result?: { success: boolean; quiz: Quiz };
  error?: string;
}

export const quizService = {
  generate: async (
    request: QuizGenerateRequest,
    files?: File[]
  ): Promise<{
    jobId: string;
    status: string;
    recordId?: string;
    cached?: boolean;
  }> => {
    const formData = new FormData();

    // Add files if provided
    if (files && files.length > 0) {
      for (const file of files) {
        formData.append('files', file);
      }
    }

    // Add other fields
    if (request.topic) formData.append('topic', request.topic);
    if (request.content) formData.append('content', request.content);
    if (request.contentId) formData.append('contentId', request.contentId);
    if (request.selectedFileIds && request.selectedFileIds.length > 0) {
      for (const id of request.selectedFileIds) {
        formData.append('selectedFileIds[]', id);
      }
    }
    if (request.studyPackId) {
      formData.append('studyPackId', request.studyPackId);
    }
    formData.append('numberOfQuestions', request.numberOfQuestions.toString());
    formData.append('difficulty', request.difficulty || 'medium');

    // Add new fields for quiz type and question types
    if (request.quizType) formData.append('quizType', request.quizType);
    if (request.timeLimit)
      formData.append('timeLimit', request.timeLimit.toString());
    if (request.questionTypes && request.questionTypes.length > 0) {
      for (const type of request.questionTypes) {
        formData.append('questionTypes[]', type);
      }
    }

    const response = await apiClient.post<{
      jobId: string;
      status: string;
      recordId?: string;
      cached?: boolean;
    }>(QUIZ_ENDPOINTS.GENERATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Check job status
  getJobStatus: async (jobId: string): Promise<JobStatus> => {
    const response = await apiClient.get<JobStatus>(`/quiz/status/${jobId}`);
    return response.data;
  },

  async getAttemptById(attemptId: string): Promise<Attempt> {
    const response = await apiClient.get<Attempt>(`/quiz/attempt/${attemptId}`);
    return response.data;
  },

  async getAttemptReview(attemptId: string): Promise<any> {
    const response = await apiClient.get<any>(
      `/quiz/attempt/${attemptId}/review`
    );
    return response.data;
  },
  /**
   * Get all quizzes for the current user
   */
  getAll: async (
    page: number = 1,
    limit: number = 20,
    studyPackId?: string
  ): Promise<{ data: Quiz[]; meta: any }> => {
    const params: any = { page, limit };
    if (studyPackId) params.studyPackId = studyPackId;

    const response = await apiClient.get<{ data: Quiz[]; meta: any }>(`/quiz`, {
      params,
    });
    return response.data;
  },

  // Get quiz by ID
  getById: async (id: string): Promise<Quiz> => {
    const response = await apiClient.get<Quiz>(QUIZ_ENDPOINTS.GET_BY_ID(id));
    return response.data;
  },

  // Submit quiz answers and get gamification updates
  submit: async (
    id: string,
    submission: QuizSubmission
  ): Promise<QuizSubmitResult> => {
    // Submit quiz
    const response = await apiClient.post<QuizResult>(
      QUIZ_ENDPOINTS.SUBMIT(id),
      submission
    );
    const result = response.data;

    // Get gamification updates (streak and challenges)
    const gamification = await gamificationService.afterQuizSubmission(
      result.score,
      result.totalQuestions
    );

    return { result, gamification };
  },

  // Update quiz title
  updateTitle: async (id: string, title: string): Promise<Quiz> => {
    const response = await apiClient.patch<Quiz>(`/quiz/${id}/title`, {
      title,
    });
    return response.data;
  },

  // Delete quiz
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/quiz/${id}`);
  },
};
