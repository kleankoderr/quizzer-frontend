import { streakService, challengeService } from './index';
import type { Streak, Challenge } from '../types';

export interface GamificationUpdateResult {
  streak: Streak;
  challenges: Challenge[];
}

/**
 * Service to handle gamification updates after quiz/flashcard completion
 * This combines multiple API calls to update streak and get latest challenge progress
 */
export const gamificationService = {
  /**
   * Call after quiz submission to update streak and get latest gamification data
   */
  afterQuizSubmission: async (
    score: number,
    totalQuestions: number
  ): Promise<GamificationUpdateResult> => {
    // Update streak with quiz results
    const streak = await streakService.update({ score, totalQuestions });

    // Get updated daily challenges
    const challenges = await challengeService.getDaily();

    return { streak, challenges };
  },

  /**
   * Call after flashcard session to update streak and get latest gamification data
   */
  afterFlashcardSession: async (): Promise<GamificationUpdateResult> => {
    // Update streak (flashcards don't have score/totalQuestions)
    const streak = await streakService.update();

    // Get updated daily challenges
    const challenges = await challengeService.getDaily();

    return { streak, challenges };
  },

  /**
   * Load dashboard gamification data (streak, daily challenges, leaderboard)
   */
  loadDashboardData: async () => {
    const [streak, challenges] = await Promise.all([
      streakService.getCurrent(),
      challengeService.getDaily(),
    ]);

    return { streak, challenges };
  },
};
