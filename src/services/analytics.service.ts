// import mixpanel, { type Dict } from "mixpanel-browser";

// Define a type for the properties to avoid import errors
type Dict = Record<string, any>;

class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public init(): void {
    // Analytics removed
  }

  public identify(_userId: string): void {
    // Analytics removed
  }

  public reset(): void {
    // Analytics removed
  }

  public track(_eventName: string, _properties?: Dict): void {
    // Analytics removed
  }

  // Auth Events
  public trackAuthLogin(
    _method: string,
    _success: boolean,
    _error?: string
  ): void {
    // Analytics removed
  }

  public trackAuthSignup(
    _method: string,
    _success: boolean,
    _error?: string
  ): void {
    // Analytics removed
  }

  // Content Events
  public trackContentView(
    _contentId: string,
    _type: string,
    _title: string
  ): void {
    // Analytics removed
  }

  public trackFileUpload(
    _fileName: string,
    _size: number,
    _type: string
  ): void {
    // Analytics removed
  }

  public trackFileUploadResult(
    _fileName: string,
    _success: boolean,
    _error?: string
  ): void {
    // Analytics removed
  }

  // Quiz Events
  public trackQuizAttemptStarted(_quizId: string, _title: string): void {
    // Analytics removed
  }

  public trackQuizAttemptCompleted(
    _quizId: string,
    _score: number,
    _totalQuestions: number,
    _durationSeconds: number
  ): void {
    // Analytics removed
  }

  // Flashcard Events
  public trackFlashcardStudyStarted(_setId: string, _title: string): void {
    // Analytics removed
  }

  public trackFlashcardViewed(_setId: string, _cardId: string): void {
    // Analytics removed
  }
}

export const analytics = AnalyticsService.getInstance();
