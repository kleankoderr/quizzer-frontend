export interface JobStatus {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number | { percent?: number; message?: string };
  result?: any;
  error?: string;
}

export interface UseJobPollingOptions {
  jobId: string | undefined;
  endpoint: 'quiz' | 'flashcards' | 'content';
  onCompleted?: (result: any) => void;
  onFailed?: (error: string) => void;
  enabled?: boolean;
}
