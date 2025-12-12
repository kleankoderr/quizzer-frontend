import React, { useRef } from 'react';
import { Card } from './Card';
import {
  Brain,
  Layers,
  BookOpen,
  FileText,
  MoreVertical,
  Trash2,
  Folder,
  XCircle,
  Calendar,
  FileQuestion,
} from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

interface StudyPackItemCardProps {
  item: any;
  type: 'quiz' | 'flashcard' | 'content' | 'userDocument';
  onMove?: () => void;
  onRemove?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  className?: string;
}

const ICON_MAP = {
  quiz: Brain,
  flashcard: Layers,
  content: BookOpen,
  userDocument: FileText,
} as const;

const getItemStats = (type: string, item: any) => {
  switch (type) {
    case 'quiz': {
      const count = item._count?.questions ?? item.questions?.length ?? 0;
      return { icon: FileQuestion, count, label: 'question' };
    }
    case 'flashcard': {
      const count = item._count?.cards ?? item.cards?.length ?? 0;
      return { icon: Layers, count, label: 'card' };
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
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setShowMenu(false));

  const Icon = ICON_MAP[type] || FileQuestion;
  const stats = getItemStats(type, item);
  const dateStr = item.createdAt || item.uploadedAt;
  const formattedDate = dateStr ? formatDate(dateStr) : '';

  const handleMenuAction = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    action();
  };

  const menuItems = [
    onMove && {
      label: 'Move to...',
      icon: Folder,
      onClick: onMove,
      className:
        'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700',
    },
    onRemove && {
      label: 'Remove',
      icon: XCircle,
      onClick: onRemove,
      className:
        'text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10',
    },
    onDelete && {
      label: 'Delete',
      icon: Trash2,
      onClick: onDelete,
      className:
        'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 border-t border-gray-100 dark:border-gray-700',
    },
  ].filter(Boolean);

  return (
    <div className={className}>
      <Card
        title={item.title || item.displayName || 'Untitled'}
        subtitle={getItemSubtitle(type, item)}
        icon={
          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        }
        onClick={onClick}
        actions={
          menuItems.length > 0 && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 hover:text-primary-600"
                aria-label="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden py-1">
                  {menuItems.map((item) => {
                    const ItemIcon = item!.icon;
                    return (
                      <button
                        key={item?.label}
                        onClick={handleMenuAction(item!.onClick)}
                        className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors ${item!.className}`}
                      >
                        <ItemIcon className="w-4 h-4 mr-2.5" />
                        {item!.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )
        }
      >
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3">
          <div className="flex items-center gap-3">
            {formattedDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </div>
            )}
          </div>

          {stats && (
            <span className="flex items-center gap-1.5">
              <stats.icon className="w-4 h-4" />
              {stats.count} {stats.label}
              {stats.count === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
};
