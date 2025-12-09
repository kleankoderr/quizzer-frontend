import { useState } from 'react';
import { CheckCircle, XCircle, Target, Eye, EyeOff } from 'lucide-react';
import { QuestionRenderer } from '../QuestionRenderer';
import type { Quiz, QuizResult, AnswerValue } from '../../types';

interface QuizReviewProps {
  quiz: Quiz;
  result: QuizResult;
  selectedAnswers: (AnswerValue | null)[];
  challengeId?: string;
}

export const QuizReview = ({
  quiz,
  result,
  selectedAnswers,
}: QuizReviewProps) => {
  const [showExplanations, setShowExplanations] = useState(false);
  const checkAnswerCorrect = (
    questionType: string,
    userAnswer: AnswerValue | null,
    correctAnswer: AnswerValue
  ): boolean => {
    if (userAnswer === null) return false;

    switch (questionType) {
      case 'multi-select': {
        if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer))
          return false;
        if (userAnswer.length !== correctAnswer.length) return false;
        const sortedUser = [...userAnswer].sort(
          (a, b) => Number(a) - Number(b)
        );
        const sortedCorrect = [...correctAnswer].sort(
          (a, b) => Number(a) - Number(b)
        );
        return sortedUser.every((val, idx) => val === sortedCorrect[idx]);
      }

      case 'matching': {
        if (typeof userAnswer !== 'object' || typeof correctAnswer !== 'object')
          return false;
        if (Array.isArray(userAnswer) || Array.isArray(correctAnswer))
          return false;
        const userObj = userAnswer as { [key: string]: string };
        const correctObj = correctAnswer as { [key: string]: string };
        const userKeys = Object.keys(userObj).sort((a, b) =>
          a.localeCompare(b)
        );
        const correctKeys = Object.keys(correctObj).sort((a, b) =>
          a.localeCompare(b)
        );
        if (userKeys.length !== correctKeys.length) return false;
        if (!userKeys.every((key, idx) => key === correctKeys[idx]))
          return false;
        return userKeys.every((key) => userObj[key] === correctObj[key]);
      }

      default:
        return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
    }
  };

  return (
    <div className="card dark:bg-gray-800 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg flex-shrink-0">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Review Answers
          </h2>
        </div>
        <button
          onClick={() => setShowExplanations(!showExplanations)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition-colors text-sm font-medium"
        >
          {showExplanations ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span className="hidden sm:inline">Hide Explanations</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Show Explanations</span>
            </>
          )}
        </button>
      </div>
      <div className="space-y-4 sm:space-y-6">
        {quiz.questions.map((question, index) => {
          const userAnswer = selectedAnswers[index];
          const correctAnswer = result.correctAnswers[index];

          // Determine if answer is correct based on question type
          const isCorrect = checkAnswerCorrect(
            question.questionType,
            userAnswer,
            correctAnswer
          );

          return (
            <div
              key={index}
              className={`p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all ${
                isCorrect
                  ? 'border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                  : 'border-red-300 dark:border-red-700 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20'
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                ) : (
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1 min-w-0">
                  <QuestionRenderer
                    question={question}
                    questionIndex={index}
                    selectedAnswer={userAnswer}
                    onAnswerSelect={() => {}}
                    showResults={true}
                    correctAnswer={correctAnswer}
                    showExplanation={showExplanations}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
