import { Link } from 'react-router-dom';
import type { Quiz } from '../types';
import { Calendar, FileText, Brain, Play, CheckCircle2 } from 'lucide-react';

interface QuizListProps {
  quizzes: Quiz[];
}

export const QuizList: React.FC<QuizListProps> = ({ quizzes }) => {
  if (quizzes.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
          <Brain className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No quizzes yet</h3>
        <p className="text-gray-500 mb-6">Generate your first quiz to get started!</p>
        <div className="inline-flex items-center gap-2 text-sm text-blue-600">
          <span>Click "New Quiz" above to begin</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Quizzes</h2>
        <span className="text-sm text-gray-500">{quizzes.length} quiz{quizzes.length === 1 ? '' : 'zes'}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map((quiz) => {
          const hasAttempts = quiz.attempts && quiz.attempts.length > 0;
          const latestAttempt = quiz.attempts?.[0] ?? null;
          
          return (
            <Link
              key={quiz.id}
              to={`/quiz/${quiz.id}`}
              className="group relative overflow-hidden border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-lg transition-all duration-200 bg-white"
            >
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              
              {/* Status badge */}
              {hasAttempts && (
                <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  Attempted
                </div>
              )}
              
              {/* Icon */}
              <div className="inline-flex p-2.5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg mb-3 group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              
              {/* Content */}
              <h3 className="font-bold text-lg mb-1.5 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {quiz.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{quiz.topic}</p>
              
              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    {quiz.questions.length} questions
                  </span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                    {quiz.difficulty || 'Medium'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(quiz.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {latestAttempt && (
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      Score: {latestAttempt.score}%
                    </span>
                  )}
                </div>
              </div>
              
              {/* Action hint */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Click to {hasAttempts ? 'retake' : 'start'}</span>
                <Play className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
