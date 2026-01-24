import React from 'react';
import { Card } from './Card';
import { useNavigate } from 'react-router-dom';
import type { StudyPack } from '../types';
import {
  Folder,
  FileText,
  Brain,
  HelpCircle,
  Layers,
  Pencil,
  Trash2,
} from 'lucide-react';

interface StudyPackCardProps {
  studyPack: StudyPack;
  onDelete?: () => void;
  onEdit?: () => void;
}

const StatItem: React.FC<{
  icon: React.ReactNode;
  count: number;
  title: string;
}> = ({ icon, count, title }) => (
  <div className="flex items-center gap-1" title={title}>
    {icon}
    <span>{count}</span>
  </div>
);

export const StudyPackCard: React.FC<StudyPackCardProps> = ({
  studyPack,
  onDelete,
  onEdit,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const navigate = useNavigate();

  const counts = studyPack._count || {
    quizzes: 0,
    flashcardSets: 0,
    contents: 0,
    userDocuments: 0,
  };

  const totalItems = Object.values(counts).reduce(
    (sum, count) => sum + count,
    0
  );

  const formattedDate = new Date(studyPack.createdAt).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.();
  };

  const stats = [
    {
      icon: <HelpCircle className="w-4 h-4" />,
      count: counts.quizzes,
      title: 'Quizzes',
    },
    {
      icon: <Layers className="w-4 h-4" />,
      count: counts.flashcardSets,
      title: 'Flashcards',
    },
    {
      icon: <Brain className="w-4 h-4" />,
      count: counts.contents,
      title: 'Study Materials',
    },
    {
      icon: <FileText className="w-4 h-4" />,
      count: counts.userDocuments,
      title: 'Documents',
    },
  ];

  const navigateToPack = () => {
    navigate(`/study-pack/${studyPack.id}`);
  };

  const toggleExpand = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <Card
      title={studyPack.title}
      subtitle={studyPack.description || 'No description'}
      icon={
        <Folder className="w-6 h-6 text-primary-600 dark:text-primary-400" />
      }
      onClick={toggleExpand}
      onTitleClick={navigateToPack}
      onIconClick={navigateToPack}
      gradientColor="bg-blue-500"
      actions={
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-gray-400 hover:text-blue-500 group/edit"
              title="Edit Study Set"
              aria-label="Edit study set"
            >
              <Pencil className="w-5 h-5 transition-transform group-hover/edit:scale-110" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-gray-400 hover:text-red-500 group/delete"
              title="Delete Study Set"
              aria-label="Delete study set"
            >
              <Trash2 className="w-5 h-5 transition-transform group-hover/delete:scale-110" />
            </button>
          )}
        </div>
      }
    >
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            {stats.map((stat) => (
              <StatItem key={stat.title} {...stat} />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-medium whitespace-nowrap">
              {totalItems} item{totalItems === 1 ? '' : 's'}
            </span>
            <span>Created {formattedDate}</span>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); navigateToPack(); }}
            className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Open Study Set
            <Folder className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isExpanded && (
        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
          <span>{totalItems} item{totalItems === 1 ? '' : 's'}</span>
          <span>Click to expand</span>
        </div>
      )}
    </Card>
  );
};
