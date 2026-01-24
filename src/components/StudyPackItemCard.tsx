import React from 'react';
import { Card } from './Card';

import { Trash2, Folder, XCircle, MoreVertical, HelpCircle, Layers, BookOpen, FileText } from 'lucide-react';
import { formatDate } from '../utils/dateFormat';

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



export const StudyPackItemCard: React.FC<StudyPackItemCardProps> = ({
  item,
  type,
  onMove,
  onRemove,
  onDelete,
  onClick,
  className = '',
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const stats = getItemStats(type, item);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = async (
    e: React.MouseEvent,
    action: () => void | Promise<void>
  ) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsLoading(true);
    try {
      await action();
    } catch (_error) {
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'quiz':
        return <HelpCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />;
      case 'flashcard':
        return <Layers className="w-6 h-6 text-primary-600 dark:text-primary-400" />;
      case 'content':
        return <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />;
      case 'userDocument':
        return <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />;
      default:
        return null;
    }
  };

  return (
    <div className={`h-full ${className}`}>
      <Card
        className="h-full"
        title={item.title || item.displayName || 'Untitled'}
        subtitle={getItemSubtitle(type, item)}
        icon={getIcon()}
        onClick={onClick}
        onTitleClick={onClick}
        onIconClick={onClick}
        actions={
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              disabled={isLoading}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              title="Actions"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <MoreVertical className="w-4 h-4" />
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {onMove && (
                  <button
                    onClick={(e) => handleAction(e, onMove)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 group transition-colors"
                  >
                    <Folder className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                    Move to...
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={(e) => handleAction(e, onRemove)}
                    className="w-full text-left px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 flex items-center gap-2 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Remove from pack
                  </button>
                )}
                {onDelete && (
                  <>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                    <button
                      onClick={(e) => handleAction(e, onDelete)}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete permanently
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        }
      >
        {/* Action Hint when not expanded */}
        <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
           <div className="flex items-center gap-1.5">
             <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
             {stats ? `${stats.count} ${stats.label}${stats.count === 1 ? '' : 's'}` : type}
           </div>
           {(item.createdAt || item.uploadedAt) && (
             <span>{formatDate(item.createdAt || item.uploadedAt)}</span>
           )}
        </div>
      </Card>
    </div>
  );
};
