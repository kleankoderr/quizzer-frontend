import { apiClient } from './api';
import { QUIZ_ENDPOINTS } from '../config/api';
import type {
  Quiz,
  QuizGenerateRequest,
  QuizSubmission,
  QuizResult,
} from '../types';
import { gamificationService, type GamificationUpdateResult } from './gamification.service';

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
  // Generate a new quiz
  generate: async (request: QuizGenerateRequest, files?: File[]): Promise<{ jobId: string; status: string }> => {
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
    formData.append('numberOfQuestions', request.numberOfQuestions.toString());
    formData.append('difficulty', request.difficulty || 'medium');
    
    // Add new fields for quiz type and question types
    if (request.quizType) formData.append('quizType', request.quizType);
    if (request.timeLimit) formData.append('timeLimit', request.timeLimit.toString());
    if (request.questionTypes && request.questionTypes.length > 0) {
      for (const type of request.questionTypes) {
        formData.append('questionTypes[]', type);
      }
    }
    
    const response = await apiClient.post<{ jobId: string; status: string }>(
      QUIZ_ENDPOINTS.GENERATE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Check job status
  getJobStatus: async (jobId: string): Promise<JobStatus> => {
    const response = await apiClient.get<JobStatus>(`/quiz/status/${jobId}`);
    return response.data;
  },

  // Poll for quiz completion
  pollForCompletion: async (jobId: string, maxAttempts = 60): Promise<Quiz> => {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const status = await quizService.getJobStatus(jobId);
      
      if (status.status === 'completed' && status.result?.quiz) {
        return status.result.quiz;
      }
      
      if (status.status === 'failed') {
        throw new Error(status.error || 'Quiz generation failed');
      }
      
      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('Quiz generation timed out');
  },

  // Get all quizzes
  getAll: async (): Promise<Quiz[]> => {
    const response = await apiClient.get<Quiz[]>(QUIZ_ENDPOINTS.GET_ALL);
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
};
