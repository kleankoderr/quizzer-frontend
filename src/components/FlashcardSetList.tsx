import React from 'react';
import type { FlashcardSet } from '../types';
import { Card } from './Card';
import {
  Calendar,
  CreditCard,
  Layers,
  Play,
  BookOpen,
  CheckCircle2,
  Trash2,
  Plus,
  Folder,
} from 'lucide-react';
import { MoveToStudyPackModal } from './MoveToStudyPackModal';
import { CollapsibleSection } from './CollapsibleSection';

interface FlashcardSetListProps {
  sets: FlashcardSet[];
  onDelete?: (id: string) => void;
  onCreateNew?: () => void;
  onItemMoved?: () => void;
}

export const FlashcardSetList: React.FC<FlashcardSetListProps> = ({
  sets,
  onDelete,
  onCreateNew,
  onItemMoved,
}) => {
  const [moveSetId, setMoveSetId] = React.useState<string | null>(null);

  const groupedSets = React.useMemo(() => {
    const groups: { [key: string]: FlashcardSet[] } = {};
    const noPack: FlashcardSet[] = [];

    sets.forEach((set) => {
      if (set.studyPack) {
        const title = set.studyPack.title;
        if (!groups[title]) groups[title] = [];
        groups[title].push(set);
      } else {
        noPack.push(set);
      }
    });

    return { groups, noPack };
  }, [sets]);

  const renderSetCard = (set: FlashcardSet) => {
    const cardCount = Array.isArray(set.cards) ? set.cards.length : 0;
    const hasStudied = !!set.lastStudiedAt;

    return (
      <Card
        key={set.id}
        to={`/flashcards/${set.id}`}
        title={set.title}
        subtitle={set.topic}
        icon={
          <Layers className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        }
        actions={
          <>
            {hasStudied && (
              <div className="flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                Studied
              </div>
            )}
            {onDelete && (
              <button
                onClick={(e) => handleDelete(e, set.id)}
                className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Delete flashcard set"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMoveSetId(set.id);
              }}
              className="p-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Move to Study Pack"
            >
              <Folder className="w-4 h-4" />
            </button>
          </>
        }
        footer={
          <>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              Click to study
            </span>
            <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
              <span className="text-sm font-bold">Study Now</span>
              <Play className="w-4 h-4 fill-current" />
            </div>
          </>
        }
      >
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" />
            {cardCount} card{cardCount === 1 ? '' : 's'}
          </span>
          <span className="px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md text-xs font-medium">
            Active
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(set.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {hasStudied && (
            <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
              <BookOpen className="w-3 h-3" />
              Reviewed
            </span>
          )}
        </div>
      </Card>
    );
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  if (sets.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
          <Layers className="w-10 h-10 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No flashcard sets yet
        </h3>
        <p className="text-gray-500 mb-6">
          Generate your first flashcard set to get started!
        </p>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create New Set
        </button>
      </div>
    );
  }

  return (
    <div className="card dark:bg-gray-800 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Your Flashcard Sets
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {sets.length} set{sets.length === 1 ? '' : 's'}
        </span>
      </div>
      {Object.entries(groupedSets.groups).map(([packTitle, packSets]) => (
        <CollapsibleSection
          key={packTitle}
          title={packTitle}
          count={packSets.length}
          defaultOpen={true}
          className="mb-8 last:mb-0"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packSets.map((set) => renderSetCard(set))}
          </div>
        </CollapsibleSection>
      ))}

      {/* Uncategorized Sets */}
      {groupedSets.noPack.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
          {groupedSets.noPack.map((set) => renderSetCard(set))}
        </div>
      )}

      <MoveToStudyPackModal
        isOpen={!!moveSetId}
        onClose={() => setMoveSetId(null)}
        itemId={moveSetId || ''}
        itemType="flashcard"
        onMoveSuccess={() => {
          if (onItemMoved) onItemMoved();
        }}
      />
    </div>
  );
};
