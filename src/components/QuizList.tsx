import { Card } from './Card';
import type { Quiz } from '../types';
import {
  Calendar,
  FileText,
  Brain,
  Play,
  CheckCircle2,
  Trash2,
  Plus,
} from 'lucide-react';

interface QuizListProps {
  quizzes: Quiz[];
  onDelete?: (id: string) => void;
  onCreateNew?: () => void;
}

export const QuizList: React.FC<QuizListProps> = ({
  quizzes,
  onDelete,
  onCreateNew,
}) => {
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  if (quizzes.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
          <Brain className="w-10 h-10 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No quizzes yet
        </h3>
        <p className="text-gray-500 mb-6">
          Generate your first quiz to get started!
        </p>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create New Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="card dark:bg-gray-800 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Your Quizzes
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {quizzes.length} quiz{quizzes.length === 1 ? '' : 'zes'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {quizzes.map((quiz) => {
          const hasAttempts = quiz.attempts && quiz.attempts.length > 0;
          const latestAttempt = quiz.attempts?.[0] ?? null;

          return (
            <Card
              key={quiz.id}
              to={`/quiz/${quiz.id}`}
              title={quiz.title}
              subtitle={quiz.topic}
              icon={
                <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              }
              actions={
                <>
                  {hasAttempts && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      Attempted
                    </div>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => handleDelete(e, quiz.id)}
                      className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              }
              footer={
                <>
                  <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Click to {hasAttempts ? 'retake' : 'start'}
                  </span>
                  <Play className="w-4 h-4 text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              }
            >
              {/* Tags */}
              {quiz.tags && quiz.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {quiz.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-[10px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    {quiz.questions.length} questions
                  </span>
                  <span className="px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md text-xs font-medium">
                    {quiz.difficulty || 'Medium'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(quiz.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {latestAttempt && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                      Score: {latestAttempt.score}%
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
