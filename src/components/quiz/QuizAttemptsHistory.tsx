import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Eye, TrendingUp, Award, Clock } from 'lucide-react';
import { calculateGrade, getGradeColor } from '../../utils/gradeUtils';

interface QuizAttempt {
  id: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  timeSpent?: number;
}

interface QuizAttemptsHistoryProps {
  quizTitle: string;
  attempts: QuizAttempt[];
  onRetake: () => void;
}

export const QuizAttemptsHistory: React.FC<QuizAttemptsHistoryProps> = ({
  quizTitle,
  attempts,
  onRetake,
}) => {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (attempts.length === 0) {
      return { best: 0, average: 0, latest: 0 };
    }

    const percentages = attempts.map(
      (a) => Math.round((a.score / a.totalQuestions) * 100)
    );

    return {
      best: Math.max(...percentages),
      average: Math.round(
        percentages.reduce((sum, p) => sum + p, 0) / percentages.length
      ),
      latest: percentages[0],
    };
  }, [attempts]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const formatTimeSpent = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleReviewLatest = () => {
    if (attempts.length > 0) {
      navigate(`/quiz/attempt/${attempts[0].id}/review`);
    }
  };

  const handleReviewAttempt = (attemptId: string) => {
    navigate(`/quiz/attempt/${attemptId}/review`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="card dark:bg-gray-800">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {quizTitle}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              You've completed this quiz {attempts.length} time
              {attempts.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-center mb-2">
              <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {stats.best}%
            </div>
            <div className="text-xs text-green-600 dark:text-green-500 font-medium mt-1">
              Best Score
            </div>
          </div>

          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {stats.average}%
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-500 font-medium mt-1">
              Average
            </div>
          </div>

          <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="text-2xl font-bold text-primary-700 dark:text-primary-400">
              {stats.latest}%
            </div>
            <div className="text-xs text-primary-600 dark:text-primary-500 font-medium mt-1">
              Latest
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRetake}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
            Retake Quiz
          </button>
          <button
            onClick={handleReviewLatest}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors"
          >
            <Eye className="w-5 h-5" />
            Review Latest
          </button>
        </div>
      </div>

      {/* Attempts History */}
      <div className="card dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Attempt History
        </h2>

        <div className="space-y-3">
          {attempts.map((attempt, index) => {
            const percentage = Math.round(
              (attempt.score / attempt.totalQuestions) * 100
            );
            const grade = calculateGrade(percentage);
            const gradeColor = getGradeColor(grade);

            return (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Attempt Number */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-700 dark:text-primary-400">
                        #{attempts.length - index}
                      </span>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(attempt.completedAt)}
                    </div>
                    {attempt.timeSpent && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatTimeSpent(attempt.timeSpent)}
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {attempt.score}/{attempt.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {percentage}%
                    </div>
                  </div>

                  {/* Grade Badge */}
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${gradeColor}`}
                    >
                      {grade}
                    </span>
                  </div>
                </div>

                {/* Review Button */}
                <button
                  onClick={() => handleReviewAttempt(attempt.id)}
                  className="ml-4 flex-shrink-0 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  Review
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
