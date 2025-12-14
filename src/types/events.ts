export interface BaseEvent {
  userId: string;
  eventType: string;
  timestamp?: number;
}

export interface ProgressEvent extends BaseEvent {
  jobId: string;
  step: string;
  percentage: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface CompletionEvent extends BaseEvent {
  resourceId: string;
  resourceType: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorEvent extends BaseEvent {
  error: string;
  errorCode?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

// Flashcard Events
export interface FlashcardProgressEvent extends ProgressEvent {
  eventType: 'flashcard.progress';
}

export interface FlashcardCompletedEvent extends CompletionEvent {
  eventType: 'flashcard.completed';
  resourceType: 'flashcard-set';
  jobId: string;
  flashcardSetId: string;
  cardCount: number;
}

export interface FlashcardFailedEvent extends ErrorEvent {
  eventType: 'flashcard.failed';
  jobId: string;
}

// Quiz Events
export interface QuizProgressEvent extends ProgressEvent {
  eventType: 'quiz.progress';
}

export interface QuizCompletedEvent extends CompletionEvent {
  eventType: 'quiz.completed';
  resourceType: 'quiz';
  quizId: string;
  questionCount: number;
}

export interface QuizFailedEvent extends ErrorEvent {
  eventType: 'quiz.failed';
  jobId: string;
}

// Content Events
export interface ContentProgressEvent extends ProgressEvent {
  eventType: 'content.progress';
}

export interface ContentCompletedEvent extends CompletionEvent {
  eventType: 'content.completed';
  resourceType: 'content';
  contentId: string;
}

export interface ContentFailedEvent extends ErrorEvent {
  eventType: 'content.failed';
  jobId: string;
}

// Notification Events
export interface NotificationNewEvent extends BaseEvent {
  eventType: 'notification.new';
  notificationId: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
}

export interface NotificationReadEvent extends BaseEvent {
  eventType: 'notification.read';
  notificationId: string;
}

// User Events
export interface UserLevelUpEvent extends BaseEvent {
  eventType: 'user.level.up';
  newLevel: number;
  totalXp: number;
  rewardsUnlocked?: string[];
}

export type AppEvent =
  | FlashcardProgressEvent
  | FlashcardCompletedEvent
  | FlashcardFailedEvent
  | QuizProgressEvent
  | QuizCompletedEvent
  | QuizFailedEvent
  | ContentProgressEvent
  | ContentCompletedEvent
  | ContentFailedEvent
  | NotificationNewEvent
  | NotificationReadEvent
  | UserLevelUpEvent;
