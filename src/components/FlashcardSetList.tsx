import React from 'react';
import type { FlashcardSet, StudyPack } from '../types';
import { Card } from './Card';
import { Layers, Plus, Folder, Trash2 } from 'lucide-react';
import { MoveToStudyPackModal } from './MoveToStudyPackModal';
import { CollapsibleSection } from './CollapsibleSection';

interface FlashcardSetListProps {
  sets: FlashcardSet[];
  onDelete?: (id: string) => void;
  onCreateNew?: () => void;
  onItemMoved?: (itemId: string, pack?: StudyPack) => void;
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
    const cardCount = set.cardCount || (Array.isArray(set.cards) ? set.cards.length : 0);
    const hasStudied = !!set.lastStudiedAt;

    return (
      <Card
        key={set.id}
        to={`/flashcards/${set.id}`}
        title={set.title}
        subtitle={set.topic}
        actions={
          <div className="flex items-center gap-1">
            {onDelete && (
              <button
                onClick={(e) => handleDelete(e, set.id)}
                className="p-1.5 text-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
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
              className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Move to Study Pack"
            >
              <Folder className="w-4 h-4" />
            </button>
          </div>
        }
      >
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            {cardCount} card{cardCount === 1 ? '' : 's'}
          </span>
          <span className="px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md text-xs font-medium">
            Active
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            {new Date(set.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          {hasStudied && (
            <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
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
        onMoveSuccess={(pack) => {
          if (onItemMoved) onItemMoved(moveSetId || '', pack);
        }}
      />
    </div>
  );
};
