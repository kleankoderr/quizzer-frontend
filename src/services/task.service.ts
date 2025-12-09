import { apiClient } from './api';

export interface Task {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  result?: any;
  error?: string;
}

export const taskService = {
  async getStatus(taskId: string): Promise<Task> {
    const response = await apiClient.get(`/tasks/${taskId}`);
    return response.data;
  },
};
