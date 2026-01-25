import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { FlashcardSet, StudyPack } from '../types';
import { Card } from './Card';
import { Layers, Plus, Pencil, Folder, Trash2, X } from 'lucide-react';
import { MoveToStudyPackModal } from './MoveToStudyPackModal';
import { CollapsibleSection } from './CollapsibleSection';
import { CardMenu } from './CardMenu';
import { EditTitleModal } from './EditTitleModal';
import { flashcardService } from '../services/flashcard.service';
import { studyPackService } from '../services';
import { Toast as toast } from '../utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../utils/dateFormat';

interface FlashcardSetListProps {
  sets: FlashcardSet[];
  onDelete?: (id: string) => void;
  onCreateNew?: () => void;
  onItemMoved?: (itemId: string, pack?: StudyPack) => void;
}

interface FlashcardSetCardProps {
  set: FlashcardSet;
  onDelete?: (id: string) => void;
  onEdit: (id: string) => void;
  onMove: (id: string) => void;
  onRemove: (id: string, packId: string) => void;
}

const FlashcardSetCard: React.FC<FlashcardSetCardProps> = ({
  set,
  onDelete,
  onEdit,
  onMove,
  onRemove,
}) => {
  const navigate = useNavigate();
  const cardCount = set.cardCount || (Array.isArray(set.cards) ? set.cards.length : 0);
  const attemptCount = set.attemptCount || set._count?.attempts || 0;
  const hasStudied = attemptCount > 0;

  const navigateToSet = () => {
    navigate(`/flashcards/${set.id}${hasStudied ? '?view=history' : ''}`);
  };

  const menuItems = [
    {
      label: 'Edit Title',
      icon: <Pencil className="w-4 h-4" />,
      onClick: () => onEdit(set.id),
    },
    {
      label: 'Move to Study Set',
      icon: <Folder className="w-4 h-4" />,
      onClick: () => onMove(set.id),
    },
    ...(set.studyPack || set.studyPackId
      ? [
          {
            label: 'Remove from Study Set',
            icon: <X className="w-4 h-4" />,
            onClick: () =>
              onRemove(set.id, (set.studyPack?.id || set.studyPackId) as string),
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            label: 'Delete',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => onDelete(set.id),
            variant: 'danger' as const,
          },
        ]
      : []),
  ];

  return (
    <Card
      key={set.id}
      title={set.title}
      subtitle={set.topic}
      icon={<Layers className="w-6 h-6 text-primary-600 dark:text-primary-400" />}
      onClick={navigateToSet}
      onTitleClick={navigateToSet}
      onIconClick={navigateToSet}
      actions={<CardMenu items={menuItems} />}
    >
      <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
        <span>{cardCount} Cards</span>
        {set.createdAt && (
          <span>{formatDate(set.createdAt)}</span>
        )}
      </div>
    </Card>
  );
};

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

  const handleRemoveFromPack = async (itemId: string, packId: string) => {
    const loadingToast = toast.loading('Removing from study set...');
    try {
      await studyPackService.removeItem(packId, { type: 'flashcard', itemId });

      // Invalidate all relevant queries
      await queryClient.invalidateQueries({ queryKey: ['flashcardSets'] });
      await queryClient.invalidateQueries({ queryKey: ['flashcardSet', itemId] });
      await queryClient.invalidateQueries({ queryKey: ['studyPack', packId] });
      await queryClient.invalidateQueries({ queryKey: ['studyPacks'] });
      toast.success('Removed from study set', { id: loadingToast });
    } catch (_error) {
      toast.error('Failed to remove from study set', { id: loadingToast });
    }
  };

  const groupedSets = React.useMemo(() => {
    const groups: {
      [key: string]: { id: string; title: string; sets: FlashcardSet[] };
    } = {};
    const noPack: FlashcardSet[] = [];

    for (const set of sets) {
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
    }

    return { groups, noPack };
  }, [sets]);

  if (sets.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
          <Layers className="w-10 h-10 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No flashcard sets yet</h3>
        <p className="text-gray-500 mb-6">Generate your first flashcard set to get started!</p>
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Flashcard Sets</h2>
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
            {pack.sets.map((set) => (
              <FlashcardSetCard
                key={set.id}
                set={set}
                onEdit={(id) => setEditSetId(id)}
                onMove={(id) => setMoveSetId(id)}
                onRemove={handleRemoveFromPack}
                onDelete={onDelete}
              />
            ))}
          </div>
        </CollapsibleSection>
      ))}

      {/* Uncategorized Sets */}
      {groupedSets.noPack.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
          {groupedSets.noPack.map((set) => (
            <FlashcardSetCard
              key={set.id}
              set={set}
              onEdit={(id) => setEditSetId(id)}
              onMove={(id) => setMoveSetId(id)}
              onRemove={handleRemoveFromPack}
              onDelete={onDelete}
            />
          ))}
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
