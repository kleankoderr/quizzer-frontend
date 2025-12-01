import React from 'react';
import { ArrowRight, Clock, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contentService } from '../services/content.service';

interface Suggestion {
  type: 'review' | 'practice';
  topic: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface StudySuggestionsProps {
  suggestions: Suggestion[];
}

export const StudySuggestions: React.FC<StudySuggestionsProps> = ({ suggestions }) => {
  const navigate = useNavigate();

  const handleAction = async (suggestion: Suggestion) => {
    // Generate a quick quiz for the topic
    try {
      await contentService.generateFromTopic(suggestion.topic);
      // Navigate to tasks or wait for completion (simplified for now)
      navigate('/dashboard'); // Ideally navigate to a "generating" view or the quiz itself
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">No immediate suggestions. You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
          onClick={() => handleAction(suggestion)}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-1 p-2 rounded-lg ${
              suggestion.type === 'review' 
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {suggestion.type === 'review' ? <Clock className="w-4 h-4" /> : <Target className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {suggestion.topic}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {suggestion.reason}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
        </div>
      ))}
    </div>
  );
};
