import mixpanel, { type Dict } from "mixpanel-browser";

class AnalyticsService {
  private static instance: AnalyticsService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public init(): void {
    if (this.isInitialized) return;

    const token = import.meta.env.VITE_MIXPANEL_TOKEN;
    const isDev = import.meta.env.DEV;

    if (token) {
      mixpanel.init(token, {
        debug: isDev,
        track_pageview: false,
        persistence: "localStorage",
        autocapture: true,
        record_sessions_percent: 100,
        api_host: isDev ? "/mixpanel" : "https://api-js.mixpanel.com",
      });
      this.isInitialized = true;
    }
  }

  public identify(userId: string): void {
    if (!this.isInitialized) return;
    mixpanel.identify(userId);
  }

  public reset(): void {
    if (!this.isInitialized) return;
    mixpanel.reset();
  }

  public track(eventName: string, properties?: Dict): void {
    if (!this.isInitialized) {
      return;
    }

    mixpanel.track(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
    });
  }

  // Auth Events
  public trackAuthLogin(
    method: string,
    success: boolean,
    error?: string
  ): void {
    const eventName = success ? "auth.login_success" : "auth.login_failed";
    this.track(eventName, { method, error });
  }

  public trackAuthSignup(
    method: string,
    success: boolean,
    error?: string
  ): void {
    const eventName = success ? "auth.signup_success" : "auth.signup_failed";
    this.track(eventName, { method, error });
  }

  // Content Events
  public trackContentView(
    contentId: string,
    type: string,
    title: string
  ): void {
    this.track("content.opened", { contentId, type, title });
  }

  public trackFileUpload(fileName: string, size: number, type: string): void {
    this.track("file.upload_started", { fileName, size, type });
  }

  public trackFileUploadResult(
    fileName: string,
    success: boolean,
    error?: string
  ): void {
    const eventName = success ? "file.upload_completed" : "file.upload_failed";
    this.track(eventName, { fileName, error });
  }

  // Quiz Events
  public trackQuizAttemptStarted(quizId: string, title: string): void {
    this.track("quiz.attempt_started", { quizId, title });
  }

  public trackQuizAttemptCompleted(
    quizId: string,
    score: number,
    totalQuestions: number,
    durationSeconds: number
  ): void {
    this.track("quiz.attempt_completed", {
      quizId,
      score,
      totalQuestions,
      percentage: (score / totalQuestions) * 100,
      duration: durationSeconds,
    });
  }

  // Flashcard Events
  public trackFlashcardStudyStarted(setId: string, title: string): void {
    this.track("flashcard.study_started", { setId, title });
  }

  public trackFlashcardViewed(setId: string, cardId: string): void {
    this.track("flashcard.viewed", { setId, cardId });
  }
}

export const analytics = AnalyticsService.getInstance();
