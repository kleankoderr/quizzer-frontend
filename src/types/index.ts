// User types
export interface User {
  id: string;
  email: string;
  name: string;
  schoolName?: string;
  grade?: string;
  preferences?: Record<string, any>;
  avatar?: string;
  createdAt: string;
}

// User profile with statistics
export interface UserProfile extends User {
  statistics: {
    totalQuizzes: number;
    totalFlashcards: number;
    currentStreak: number;
    longestStreak: number;
    level: number;
    totalXP: number;
    totalAttempts: number;
  };
}

// User update types
export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
  schoolName?: string;
  grade?: string;
}

export interface UpdateSettingsRequest {
  preferences?: Record<string, any>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Auth types
export interface AuthResponse {
  user: User;
  accessToken: string;
}

// Quiz types
export type QuizType = "standard" | "timed" | "scenario";
export type QuestionType =
  | "true-false"
  | "single-select"
  | "multi-select"
  | "matching"
  | "fill-blank";
export type AnswerValue =
  | number
  | number[]
  | string
  | { [key: string]: string };

export interface QuizQuestion {
  questionType: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: AnswerValue;
  explanation?: string;
  // For matching questions
  leftColumn?: string[];
  rightColumn?: string[];
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty?: string;
  quizType?: QuizType;
  timeLimit?: number;
  questions: QuizQuestion[];
  userId: string;
  createdAt: string;
  attempts?: {
    score: number;
    completedAt: string;
  }[];
}

export interface QuizGenerateRequest {
  topic?: string;
  content?: string;
  numberOfQuestions: number;
  difficulty?: "easy" | "medium" | "hard";
  quizType?: QuizType;
  timeLimit?: number;
  questionTypes?: QuestionType[];
}

export interface QuizSubmission {
  answers: AnswerValue[];
}

export interface QuizResult {
  attemptId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  correctAnswers: AnswerValue[];
}

// Flashcard types
export interface Flashcard {
  front: string;
  back: string;
  explanation?: string;
}

export interface FlashcardSet {
  id: string;
  title: string;
  topic: string;
  cards: Flashcard[];
  userId: string;
  createdAt: string;
  lastStudiedAt?: string;
}

export interface FlashcardGenerateRequest {
  topic?: string;
  content?: string;
  numberOfCards: number;
}

// Streak types
export interface Achievement {
  icon: string;
  name: string;
  description: string;
}

export interface Milestone {
  days: number;
  icon: string;
  name: string;
  unlocked: boolean;
}

export interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | string;
  totalXP: number;
  level: number;
  xpForNextLevel: number;
  xpProgress: number;
  xpNeeded: number;
  progressPercentage: number;
  achievements: Achievement[];
  milestones: Milestone[];
  earnedXP?: number;
  leveledUp?: boolean;
  previousLevel?: number;
}

export interface UpdateStreakRequest {
  score?: number;
  totalQuestions?: number;
}

// Leaderboard types
export interface LeaderboardEntry {
  id: string;
  userId: string;
  score: number;
  rank: number;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  avatar?: string;
  userName?: string;
}

export interface Leaderboard {
  entries: LeaderboardEntry[];
  userRank?: number;
}

// Challenge types
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "monthly";
  target: number;
  reward: number;
  startDate: Date | string;
  endDate: Date | string;
  progress: number;
  completed: boolean;
  completedAt?: Date | string;
}

export interface CompleteChallengeRequest {
  challengeId: string;
}

// Recommendation types
export interface Recommendation {
  topic: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

// Attempt types
export interface Attempt {
  id: string;
  userId: string;
  quizId?: string;
  flashcardSetId?: string;
  type: "quiz" | "flashcard";
  score?: number;
  completedAt: string;
}
