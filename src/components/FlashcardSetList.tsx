import { Link } from 'react-router-dom';
import type { FlashcardSet } from '../types';
import { Calendar, CreditCard, Layers, Play, BookOpen, CheckCircle2 } from 'lucide-react';

interface FlashcardSetListProps {
  sets: FlashcardSet[];
}

export const FlashcardSetList: React.FC<FlashcardSetListProps> = ({ sets }) => {
  if (sets.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full mb-4">
          <Layers className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No flashcard sets yet
        </h3>
        <p className="text-gray-500 mb-6">
          Generate your first flashcard set to get started!
        </p>
        <div className="inline-flex items-center gap-2 text-sm text-emerald-600">
          <span>Click "New Set" above to begin</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Flashcard Sets</h2>
        <span className="text-sm text-gray-500">{sets.length} set{sets.length === 1 ? '' : 's'}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sets.map((set) => {
          const cardCount = Array.isArray(set.cards) ? set.cards.length : 0;
          const hasStudied = !!set.lastStudiedAt;
          
          return (
            <Link
              key={set.id}
              to={`/flashcards/${set.id}`}
              className="group relative overflow-hidden border-2 border-gray-200 rounded-xl p-5 hover:border-emerald-400 hover:shadow-lg transition-all duration-200 bg-white"
            >
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
              
              {/* Status badge */}
              {hasStudied && (
                <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  Studied
                </div>
              )}
              
              {/* Icon */}
              <div className="inline-flex p-2.5 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg mb-3 group-hover:from-emerald-200 group-hover:to-teal-200 transition-colors">
                <Layers className="w-5 h-5 text-emerald-600" />
              </div>
              
              {/* Content */}
              <h3 className="font-bold text-lg mb-1.5 text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                {set.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{set.topic}</p>
              
              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    {cardCount} card{cardCount === 1 ? '' : 's'}
                  </span>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(set.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {hasStudied && (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <BookOpen className="w-3 h-3" />
                      Reviewed
                    </span>
                  )}
                </div>
              </div>
              
              {/* Action hint */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Click to study</span>
                <Play className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
