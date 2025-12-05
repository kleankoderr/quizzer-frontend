// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  schoolName?: string;
  grade?: string;
  preferences?: Record<string, any>;
  onboardingCompleted?: boolean;
  assessmentPopupShown?: boolean;
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
  tags?: string[];
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
  contentId?: string;
}

export interface QuizSubmission {
  answers: AnswerValue[];
  challengeId?: string;
}

export interface QuizResult {
  attemptId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  correctAnswers: AnswerValue[];
  feedback?: {
    message: string;
    percentile?: number;
    dailyRank?: number;
    streakMessage?: string;
  };
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
  contentId?: string;
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
  userId: string;
  score: number;
  rank: number;
  userName: string;
  avatar?: string;
  schoolName?: string;
  // Legacy fields
  id?: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface Leaderboard {
  entries: LeaderboardEntry[];
  userRank?: number;
  currentUser?: {
    userId: string;
    userName?: string;
    avatar?: string;
    score: number;
    rank: number;
    schoolName?: string;
  } | null;
}

// Challenge types
export interface ChallengeQuiz {
  id: string;
  quizId: string;
  order: number;
  quiz: {
    id: string;
    title: string;
    topic: string;
    difficulty: string;
    quizType?: QuizType;
    timeLimit?: number;
    questions: QuizQuestion[];
  };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "monthly" | "hot";
  category?: string;
  target: number;
  reward: number;
  startDate: Date | string;
  endDate: Date | string;
  rules?: string;
  timeLimit?: number;
  format?: string; // "TIMED", "SCENARIO", "SPEED", "ACCURACY", "MIXED"
  progress: number;
  completed: boolean;
  completedAt?: Date | string;
  currentQuizIndex?: number;
  quizAttempts?: Array<{
    quizId: string;
    score: number;
    totalQuestions: number;
    attemptId: string;
    completedAt: string;
  }>;
  finalScore?: number;
  percentile?: number;
  quizId?: string; // Legacy single quiz support
  quizzes?: ChallengeQuiz[]; // Multi-quiz support
  participantCount?: number;
  joined?: boolean;
}

export interface CompleteChallengeRequest {
  challengeId: string;
}

export interface ChallengeProgress {
  currentQuizIndex: number;
  totalQuizzes: number;
  completedQuizzes: number;
  quizAttempts: Array<{
    quizId: string;
    score: number;
    totalQuestions: number;
    attemptId: string;
    completedAt: string;
  }>;
  finalScore?: number;
  percentile?: number;
  completed: boolean;
}

export interface ChallengeLeaderboard {
  entries: Array<{
    userId: string;
    userName: string;
    avatar?: string;
    score: number;
    rank: number;
    completedAt?: string;
  }>;
  currentUser?: {
    userId: string;
    userName: string;
    avatar?: string;
    score: number;
    rank: number;
    completedAt?: string;
  } | null;
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
  challengeId?: string;
  type: "quiz" | "flashcard" | "challenge";
  score?: number;
  totalQuestions?: number;
  completedAt: string;
  quiz?: {
    id: string;
    title: string;
    topic: string;
  };
  flashcardSet?: {
    id: string;
    title: string;
    topic: string;
  };
  challenge?: {
    id: string;
    title: string;
    type: string;
  };
}
