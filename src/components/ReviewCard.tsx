import { Clock, BookOpen, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Quiz, FlashcardSet, RetentionLevel } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { Card } from './Card';

interface ReviewItemProps {
  item: Quiz | FlashcardSet;
  type: 'quiz' | 'flashcard';
  nextReviewAt: string;
  lastReviewedAt: string;
  retentionLevel: RetentionLevel;
  strength: number;
}

export const ReviewCard = ({
  item,
  type,
  nextReviewAt,
  lastReviewedAt,
  retentionLevel,
}: ReviewItemProps) => {
  const navigate = useNavigate();

  // Calculate urgency level
  const now = new Date();
  const reviewDate = new Date(nextReviewAt);
  const daysOverdue = Math.floor(
    (now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const getUrgencyLabel = () => {
    if (daysOverdue > 2) return 'Overdue';
    if (daysOverdue >= 0) return 'Due Today';
    return 'Due Soon';
  };

  const getUrgencyColor = () => {
    if (daysOverdue > 2) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    if (daysOverdue >= 0) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  };

  // Map retention level to stage (0-3)
  const getStageInfo = () => {
    const stages = [
      { name: '🌱 New', level: 'LEARNING', stage: 0 },
      { name: '📚 Learning', level: 'REINFORCEMENT', stage: 1 },
      { name: '🔄 Review', level: 'RECALL', stage: 2 },
      { name: '⭐ Mastered', level: 'MASTERY', stage: 3 },
    ];

    const currentStage = stages.find(s => s.level === retentionLevel) || stages[0];
    
    return {
      currentStage: currentStage.stage,
      stageName: currentStage.name,
      completed: currentStage.stage + 1,
    };
  };

  const stageInfo = getStageInfo();

  const handleClick = () => {
    if (type === 'quiz') {
      navigate(`/quiz/${item.id}`);
    } else {
      navigate(`/flashcards/${item.id}?view=study`);
    }
  };

  // Create 4 segments with gaps
  const segments = [0, 1, 2, 3];
  const segmentAngle = 80;
  const gapAngle = 10;

  return (
    <Card
      title={item.title}
      subtitle={item.topic}
      icon={
        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          {type === 'quiz' ? (
            <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          ) : (
            <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          )}
        </div>
      }
      actions={
        // Segmented Circle Progress - Big and visible
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
            {segments.map((segment) => {
              const startAngle = segment * (segmentAngle + gapAngle);
              const endAngle = startAngle + segmentAngle;
              
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              
              const radius = 34;
              const centerX = 40;
              const centerY = 40;
              
              const x1 = centerX + radius * Math.cos(startRad);
              const y1 = centerY + radius * Math.sin(startRad);
              const x2 = centerX + radius * Math.cos(endRad);
              const y2 = centerY + radius * Math.sin(endRad);
              
              const isCompleted = segment < stageInfo.completed;
              
              return (
                <path
                  key={segment}
                  d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="none"
                  className={isCompleted 
                    ? 'text-blue-600 dark:text-blue-500' 
                    : 'text-gray-200 dark:text-gray-700'
                  }
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {stageInfo.completed}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                of 4
              </span>
            </div>
          </div>
        </div>
      }
      onClick={handleClick}
    >
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getUrgencyColor()}`}>
            {getUrgencyLabel()}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {stageInfo.stageName}
          </span>
        </div>
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(lastReviewedAt), { addSuffix: true })}
        </div>
      </div>
    </Card>
  );
};
