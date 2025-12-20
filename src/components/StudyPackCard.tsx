import React from 'react';
import { Card } from './Card';
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
      title: 'Files',
    },
  ];

  return (
    <Card
      title={studyPack.title}
      subtitle={studyPack.description || 'No description'}
      icon={
        <Folder className="w-6 h-6 text-primary-600 dark:text-primary-400" />
      }
      to={`/study-pack/${studyPack.id}`}
      gradientColor="bg-blue-500"
      actions={
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-gray-400 hover:text-blue-500 group/edit"
              title="Edit Study Pack"
              aria-label="Edit study pack"
            >
              <Pencil className="w-5 h-5 transition-transform group-hover/edit:scale-110" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-gray-400 hover:text-red-500 group/delete"
              title="Delete Study Pack"
              aria-label="Delete study pack"
            >
              <Trash2 className="w-5 h-5 transition-transform group-hover/delete:scale-110" />
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
        {stats.map((stat) => (
          <StatItem key={stat.title} {...stat} />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
        <span className="font-medium">
          {totalItems} item{totalItems === 1 ? '' : 's'}
        </span>
        <span>{formattedDate}</span>
      </div>
    </Card>
  );
};
