import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studyPackService } from '../services/studyPackService';
import { StudyPackItemCard } from '../components/StudyPackItemCard';
import {
  BookOpen,
  Calendar,
  Layers,
  HelpCircle,
  FileText,
  ArrowLeft,
  Trash2,
  Folder,
  Plus,
  Edit2,
} from 'lucide-react';
import { DeleteModal } from '../components/DeleteModal';
import { MoveToStudyPackModal } from '../components/MoveToStudyPackModal';
import { EditStudyPackModal } from '../components/EditStudyPackModal';
import { Toast as toast } from '../utils/toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { quizService } from '../services/quiz.service';
import { flashcardService } from '../services/flashcard.service';
import { contentService } from '../services';
import { userDocumentService } from '../services';

const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-7xl mx-auto">{children}</div>
);

type TabId = 'quizzes' | 'flashcards' | 'materials' | 'files';
type ItemType = 'quiz' | 'flashcard' | 'content' | 'userDocument';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
  count: number;
  createRoute: string;
  emptyMessage: string;
  emptyAction: string;
}

interface MoveState {
  itemId: string | null;
  itemType: 'quiz' | 'flashcard' | 'content';
}

export const StudyPackDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // We can rely on useQuery to manage data state
  const {
    data: studyPack,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['studyPack', id],
    queryFn: () =>
      id ? studyPackService.getById(id) : Promise.reject('No ID'),
    enabled: !!id,
    retry: false,
  });

  // If error, redirect could be handled in useEffect, but here we'll just check it
  React.useEffect(() => {
    if (isError) {
      toast.error('Failed to load study pack');
      navigate('/study-packs');
    }
  }, [isError, navigate]);

  const [activeTab, setActiveTab] = useState<TabId>('quizzes');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moveState, setMoveState] = useState<MoveState>({
    itemId: null,
    itemType: 'content',
  });
  const [deleteState, setDeleteState] = useState<{
    itemId: string | null;
    itemType: ItemType;
  }>({
    itemId: null,
    itemType: 'content',
  });
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [isDeletingPack, setIsDeletingPack] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  const handleUpdate = useCallback(
    (updatedPack: any) => {
      queryClient.setQueryData(['studyPack', id], (old: any) => {
        if (!old) return updatedPack;
        return {
          ...old,
          title: updatedPack.title,
          description: updatedPack.description,
        };
      });
    },
    [id, queryClient]
  );

  const handleDelete = useCallback(async () => {
    if (!studyPack) return;

    setIsDeletingPack(true);
    try {
      await studyPackService.delete(studyPack.id);
      toast.success('Study pack deleted');
      queryClient.invalidateQueries({ queryKey: ['studyPacks'] }); // Invalidate list
      navigate('/study-packs');
    } catch (error) {
      console.error('Failed to delete study pack', error);
      toast.error('Failed to delete study pack');
      setIsDeletingPack(false);
    }
  }, [studyPack, navigate, queryClient]);

  const handleRemoveItem = useCallback(
    async (itemId: string, type: ItemType) => {
      if (!studyPack) return;

      // Optimistic update
      queryClient.setQueryData(['studyPack', studyPack.id], (old: any) => {
        if (!old) return old;
        const listKey =
          type === 'quiz'
            ? 'quizzes'
            : type === 'flashcard'
              ? 'flashcardSets'
              : type === 'userDocument'
                ? 'userDocuments'
                : 'contents';

        return {
          ...old,
          [listKey]: old[listKey]?.filter((i: any) => i.id !== itemId),
        };
      });

      try {
        await studyPackService.removeItem(studyPack.id, {
          type: type as any,
          itemId,
        });
        toast.success('Item removed from pack');
        // No need to invalidate immediately if optimistic update worked, unless to sync
        queryClient.invalidateQueries({
          queryKey: ['studyPack', studyPack.id],
        });
      } catch (error) {
        console.error('Failed to remove item', error);
        toast.error('Failed to remove item');
        // Revert invalidation on error
        queryClient.invalidateQueries({
          queryKey: ['studyPack', studyPack.id],
        });
      }
    },
    [studyPack, queryClient]
  );

  const handleMoveItem = useCallback(
    (itemId: string, type: 'quiz' | 'flashcard' | 'content') => {
      setMoveState({ itemId, itemType: type });
    },
    []
  );

  const handleDeleteItem = useCallback((itemId: string, type: ItemType) => {
    setDeleteState({ itemId, itemType: type });
    setShowDeleteItemModal(true);
  }, []);

  const executeDeleteItem = useCallback(async () => {
    if (!deleteState.itemId || !studyPack) return;

    setIsDeletingItem(true);
    try {
      const { itemId, itemType } = deleteState;

      switch (itemType) {
        case 'quiz':
          await quizService.delete(itemId);
          break;
        case 'flashcard':
          await flashcardService.delete(itemId);
          break;
        case 'content':
          await contentService.delete(itemId);
          break;
        case 'userDocument':
          await userDocumentService.deleteUserDocument(itemId);
          break;
      }

      toast.success('Item deleted permanently');
      queryClient.invalidateQueries({
        queryKey: ['studyPack', studyPack.id],
      });
      setShowDeleteItemModal(false);
      setDeleteState({ itemId: null, itemType: 'content' });
    } catch (error) {
      console.error('Failed to delete item', error);
      toast.error('Failed to delete item');
    } finally {
      setIsDeletingItem(false);
    }
  }, [deleteState, studyPack, queryClient]);

  const closeMoveModal = useCallback(() => {
    setMoveState({ itemId: null, itemType: 'content' });
  }, []);

  const tabs: TabConfig[] = useMemo(
    () => [
      {
        id: 'quizzes',
        label: 'Quizzes',
        icon: HelpCircle,
        count: studyPack?.quizzes?.length || 0,
        createRoute: '/quiz',
        emptyMessage: 'Create a quiz to test your knowledge on this topic.',
        emptyAction: 'Add Quiz',
      },
      {
        id: 'flashcards',
        label: 'Flashcards',
        icon: Layers,
        count: studyPack?.flashcardSets?.length || 0,
        createRoute: '/flashcards',
        emptyMessage: 'Create flashcards to memorize key concepts efficiently.',
        emptyAction: 'Add Flashcards',
      },
      {
        id: 'materials',
        label: 'Study Materials',
        icon: BookOpen,
        count: studyPack?.contents?.length || 0,
        createRoute: '/content',
        emptyMessage: 'Add content to read and learn from.',
        emptyAction: 'Add Content',
      },
      {
        id: 'files',
        label: 'Files',
        icon: FileText,
        count: studyPack?.userDocuments?.length || 0,
        createRoute: '',
        emptyMessage: 'Upload documents to your study pack.',
        emptyAction: '',
      },
    ],
    [studyPack]
  );

  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTab),
    [tabs, activeTab]
  );

  const renderEmptyState = useCallback(
    (tab: TabConfig) => (
      <div className="col-span-full py-16 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
        <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4 text-primary-600 dark:text-primary-400">
          <tab.icon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          No {tab.label.toLowerCase()} yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
          {tab.emptyMessage}
        </p>
        {tab.createRoute && (
          <button
            onClick={() => {
              if (tab.id === 'materials') {
                navigate('/study', { state: { openCreator: true } });
              } else if (tab.id === 'quizzes') {
                navigate('/quiz', { state: { openGenerator: true } });
              } else if (tab.id === 'flashcards') {
                navigate('/flashcards', { state: { openGenerator: true } });
              } else if (tab.createRoute) {
                navigate(tab.createRoute);
              }
            }}
            className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            {tab.emptyAction}
          </button>
        )}
      </div>
    ),
    [navigate]
  );

  const renderTabContent = useCallback(() => {
    if (!studyPack) return null;

    const contentMap = {
      quizzes: studyPack.quizzes || [],
      flashcards: studyPack.flashcardSets || [],
      materials: studyPack.contents || [],
      files: studyPack.userDocuments || [],
    };

    const typeMap = {
      quizzes: 'quiz' as const,
      flashcards: 'flashcard' as const,
      materials: 'content' as const,
      files: 'userDocument' as const,
    };

    const items = contentMap[activeTab];
    const itemType = typeMap[activeTab];
    const hasItems = items.length > 0;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {currentTab?.createRoute && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (activeTab === 'materials') {
                  navigate('/study', { state: { openCreator: true } });
                } else if (activeTab === 'quizzes') {
                  navigate('/quiz', { state: { openGenerator: true } });
                } else if (activeTab === 'flashcards') {
                  navigate('/flashcards', { state: { openGenerator: true } });
                } else if (currentTab?.createRoute) {
                  navigate(currentTab.createRoute);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {currentTab.emptyAction}
            </button>
          </div>
        )}

        {hasItems ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any) => (
              <StudyPackItemCard
                key={item.id}
                item={item}
                type={itemType}
                onClick={
                  itemType === 'userDocument'
                    ? undefined
                    : () =>
                        navigate(
                          `/${itemType === 'content' ? 'content' : itemType === 'flashcard' ? 'flashcards' : 'quiz'}/${item.id}`
                        )
                }
                onMove={
                  itemType === 'userDocument'
                    ? undefined
                    : () => handleMoveItem(item.id, itemType as any)
                }
                onRemove={() => handleRemoveItem(item.id, itemType)}
                onDelete={() => handleDeleteItem(item.id, itemType)}
              />
            ))}
          </div>
        ) : (
          currentTab && renderEmptyState(currentTab)
        )}
      </div>
    );
  }, [
    studyPack,
    activeTab,
    currentTab,
    navigate,
    handleMoveItem,
    handleRemoveItem,
    handleDeleteItem,
    renderEmptyState,
  ]);

  if (isLoading) {
    return (
      <Container>
        <div className="mb-8 animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-xl" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-1/3 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-t-lg mb-[-1px]"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </Container>
    );
  }

  if (!studyPack) return null;

  return (
    <Container>
      <div className="mb-8">
        <button
          onClick={() => navigate('/study-packs')}
          className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Study Packs
        </button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
              <Folder className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {studyPack.title}
                </h1>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                  title="Edit Study Pack"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                {studyPack.description || 'No description provided.'}
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Created{' '}
                  {new Date(studyPack.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete Pack
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 mb-8 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span
              className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {renderTabContent()}

      <EditStudyPackModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        studyPack={studyPack}
        onUpdate={handleUpdate}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Study Pack"
        message="Are you sure you want to delete this study pack? The items inside will NOT be deleted."
        itemName="Study Pack"
        isDeleting={isDeletingPack}
      />

      <DeleteModal
        isOpen={showDeleteItemModal}
        onClose={() => setShowDeleteItemModal(false)}
        onConfirm={executeDeleteItem}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action handles permanent deletion and cannot be undone."
        itemName="Item"
        isDeleting={isDeletingItem}
      />

      <MoveToStudyPackModal
        isOpen={!!moveState.itemId}
        onClose={closeMoveModal}
        itemId={moveState.itemId || ''}
        itemType={moveState.itemType}
        onMoveSuccess={(pack) => {
          if (pack?.id !== id) {
            queryClient.setQueryData(['studyPack', id], (old: any) => {
              if (!old) return old;
              const listKey =
                moveState.itemType === 'quiz'
                  ? 'quizzes'
                  : moveState.itemType === 'flashcard'
                    ? 'flashcardSets'
                    : moveState.itemType === 'content' // Type guard
                      ? 'contents'
                      : 'userDocuments'; // Fallback or explicit check if type was wider

              return {
                ...old,
                [listKey]: old[listKey]?.filter(
                  (i: any) => i.id !== moveState.itemId
                ),
              };
            });
          }
          queryClient.invalidateQueries({ queryKey: ['studyPack', id] });
        }}
      />
    </Container>
  );
};
