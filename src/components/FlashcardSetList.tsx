import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { FlashcardSet, StudyPack } from '../types';
import { Card } from './Card';
import { Layers, Plus } from 'lucide-react';
import { MoveToStudyPackModal } from './MoveToStudyPackModal';
import { CollapsibleSection } from './CollapsibleSection';
import { CardMenu, Pencil, Folder, Trash2 } from './CardMenu';
import { EditTitleModal } from './EditTitleModal';
import { flashcardService } from '../services/flashcard.service';
import { Toast as toast } from '../utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../utils/dateFormat';
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
  const navigate = useNavigate();
  const [moveSetId, setMoveSetId] = React.useState<string | null>(null);
  const [editSetId, setEditSetId] = React.useState<string | null>(null);
  const queryClient = useQueryClient();

  const editingSet = sets.find((s) => s.id === editSetId);

  const handleTitleUpdate = async (setId: string, newTitle: string) => {
    try {
      await flashcardService.updateTitle(setId, newTitle);
      
      // Optimistically update the cache
      queryClient.setQueryData(['flashcardSets'], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((s: FlashcardSet) =>
            s.id === setId ? { ...s, title: newTitle } : s
          ),
        };
      });

      // Invalidate to refetch from server
      await queryClient.invalidateQueries({ queryKey: ['flashcardSets'] });
      
      toast.success('Flashcard set title updated successfully!');
    } catch (error) {
      toast.error('Failed to update flashcard set title');
      throw error;
    }
  };

  const groupedSets = React.useMemo(() => {
    const groups: { [key: string]: { id: string; title: string; sets: FlashcardSet[] } } = {};
    const noPack: FlashcardSet[] = [];

    sets.forEach((set) => {
      if (set.studyPack) {
        const packId = set.studyPack.id;
        if (!groups[packId]) {
          groups[packId] = {
            id: packId,
            title: set.studyPack.title,
            sets: [],
          };
        }
        groups[packId].sets.push(set);
      } else {
        noPack.push(set);
      }
    });

    return { groups, noPack };
  }, [sets]);

  const renderSetCard = (set: FlashcardSet) => {
    const cardCount = set.cardCount || (Array.isArray(set.cards) ? set.cards.length : 0);
    const attemptCount = set.attemptCount || set._count?.attempts || 0;
    const hasStudied = attemptCount > 0;

    const menuItems = [
      {
        label: 'Edit Title',
        icon: <Pencil className="w-4 h-4" />,
        onClick: () => setEditSetId(set.id),
      },
      {
        label: 'Move to Study Pack',
        icon: <Folder className="w-4 h-4" />,
        onClick: () => setMoveSetId(set.id),
      },
      ...(onDelete
        ? [
            {
              label: 'Delete',
              icon: <Trash2 className="w-4 h-4" />,
              onClick: () => handleDelete(new Event('click') as any, set.id),
              variant: 'danger' as const,
            },
          ]
        : []),
    ];

    return (
      <Card
        key={set.id}
        to={`/flashcards/${set.id}${hasStudied ? '?view=history' : ''}`}
        title={set.title}
        subtitle={set.topic}
        actions={<CardMenu items={menuItems} />}
      >
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            {cardCount} card{cardCount === 1 ? '' : 's'}
          </span>
          <span className="px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md text-xs font-medium">
            Active
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            {formatDate(set.createdAt)}
          </span>
          {hasStudied && (
            <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
              Last studied
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
      {Object.values(groupedSets.groups).map((pack) => (
        <CollapsibleSection
          key={pack.id}
          title={pack.title}
          count={pack.sets.length}
          defaultOpen={false}
          onTitleClick={() => navigate(`/study-pack/${pack.id}?tab=flashcards`)}
          className="mb-8 last:mb-0"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pack.sets.map((set) => renderSetCard(set))}
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

      <EditTitleModal
        isOpen={!!editSetId}
        currentTitle={editingSet?.title || ''}
        onClose={() => setEditSetId(null)}
        onSave={(newTitle) => handleTitleUpdate(editSetId || '', newTitle)}
      />
    </div>
  );
};
