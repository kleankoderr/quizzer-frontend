import { Trophy, CheckCircle, ArrowRight } from "lucide-react";

interface QuizTransitionCardProps {
  quizNumber: number;
  totalQuizzes: number;
  score: number;
  totalQuestions: number;
  onContinue: () => void;
}

export const QuizTransitionCard: React.FC<QuizTransitionCardProps> = ({
  quizNumber,
  totalQuizzes,
  score,
  totalQuestions,
  onContinue,
}) => {
  const percentage = (score / totalQuestions) * 100;
  const isGoodScore = percentage >= 70;

  return (
    <div className="card dark:bg-gray-800 p-8 text-center max-w-2xl mx-auto">
      {/* Icon */}
      <div
        className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
          isGoodScore
            ? "bg-green-100 dark:bg-green-900/30"
            : "bg-blue-100 dark:bg-blue-900/30"
        }`}
      >
        {isGoodScore ? (
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        ) : (
          <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        )}
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {isGoodScore ? "Great Job!" : "Quiz Completed!"}
      </h2>

      {/* Score */}
      <div className="mb-6">
        <div
          className={`text-5xl font-bold mb-2 ${
            isGoodScore
              ? "text-green-600 dark:text-green-400"
              : "text-blue-600 dark:text-blue-400"
          }`}
        >
          {Math.round(percentage)}%
        </div>
        <div className="text-gray-600 dark:text-gray-400">
          {score} out of {totalQuestions} correct
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Quiz {quizNumber} of {totalQuizzes} completed
          </span>
        </div>
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalQuizzes }).map((_, idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full ${
                idx < quizNumber
                  ? "bg-green-500"
                  : idx === quizNumber
                    ? "bg-blue-500"
                    : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Motivational Message */}
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {isGoodScore
          ? "Excellent work! Keep up the momentum!"
          : "Good effort! Let's continue to the next quiz."}
      </p>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        className="flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl mx-auto"
      >
        <span>Continue to Next Quiz</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};
