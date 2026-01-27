import { Folder, Pencil, Trash2 } from 'lucide-react';

interface StudyPackCardProps {
  studyPack: StudyPack;
  onDelete?: () => void;
  onEdit?: () => void;
}

import React from 'react';
import { Card } from './Card';
import { useNavigate } from 'react-router-dom';
import type { StudyPack } from '../types';
import { formatDate } from '../utils/dateFormat';

export const StudyPackCard: React.FC<StudyPackCardProps> = ({
  studyPack,
  onDelete,
  onEdit,
}) => {
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

  const renderCountBreakdown = () => {
    const parts = [];
    if (counts.quizzes > 0)
      parts.push(
        `${counts.quizzes} ${counts.quizzes === 1 ? 'Quiz' : 'Quizzes'}`
      );
    if (counts.flashcardSets > 0)
      parts.push(
        `${counts.flashcardSets} ${
          counts.flashcardSets === 1 ? 'Flashcard' : 'Flashcards'
        }`
      );
    if (counts.contents > 0)
      parts.push(
        `${counts.contents} ${counts.contents === 1 ? 'Material' : 'Materials'}`
      );
    if (counts.userDocuments > 0)
      parts.push(
        `${counts.userDocuments} ${counts.userDocuments === 1 ? 'File' : 'Files'}`
      );

    if (parts.length === 0) return 'Empty Set';
    if (parts.length > 2) return `${totalItems} Items`;
    return parts.join(', ');
  };

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

  const navigateToPack = () => {
    navigate(`/study-pack/${studyPack.id}`);
  };

  return (
    <Card
      title={studyPack.title}
      subtitle={studyPack.description}
      icon={
        <Folder className="w-6 h-6 text-primary-600 dark:text-primary-400" />
      }
      onClick={navigateToPack}
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
      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
        <span>{renderCountBreakdown()}</span>
        {studyPack.createdAt && <span>{formatDate(studyPack.createdAt)}</span>}
      </div>
    </Card>
  );
};
