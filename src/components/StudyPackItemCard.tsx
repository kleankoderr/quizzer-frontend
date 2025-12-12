import React from 'react';
import { Card } from './Card';

import { Trash2, Folder, XCircle } from 'lucide-react';

interface StudyPackItemCardProps {
  item: any;
  type: 'quiz' | 'flashcard' | 'content' | 'userDocument';
  onMove?: () => void;
  onRemove?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  className?: string;
}

const getItemStats = (type: string, item: any) => {
  switch (type) {
    case 'quiz': {
      const count = item._count?.questions ?? item.questions?.length ?? 0;
      return { count, label: 'question' };
    }
    case 'flashcard': {
      const count = item._count?.cards ?? item.cards?.length ?? 0;
      return { count, label: 'card' };
    }
    default:
      return null;
  }
};

const getItemSubtitle = (type: string, item: any) => {
  if (type === 'userDocument') return 'Uploaded File';
  return item.topic || '';
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const StudyPackItemCard: React.FC<StudyPackItemCardProps> = ({
  item,
  type,
  onMove,
  onRemove,
  onDelete,
  onClick,
  className = '',
}) => {
  const stats = getItemStats(type, item);
  const dateStr = item.createdAt || item.uploadedAt;
  const formattedDate = dateStr ? formatDate(dateStr) : '';

  return (
    <div className={className}>
      <Card
        title={item.title || item.displayName || 'Untitled'}
        subtitle={getItemSubtitle(type, item)}
        onClick={onClick}
        actions={
          <div className="flex items-center gap-1">
            {onMove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMove();
                }}
                className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Move to..."
              >
                <Folder className="w-4 h-4" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-full transition-colors"
                title="Remove from pack"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 text-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        }
      >
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3">
          <div className="flex items-center gap-3">
            {formattedDate && <div>{formattedDate}</div>}
          </div>

          {stats && (
            <span className="flex items-center gap-1.5">
              {stats.count} {stats.label}
              {stats.count === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
};
