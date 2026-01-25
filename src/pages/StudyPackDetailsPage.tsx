import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { studyPackService } from '../services';
import { quizService } from '../services/quiz.service';
import { flashcardService } from '../services/flashcard.service';
import { contentService, userDocumentService } from '../services';
import { StudyPackItemCard } from '../components/StudyPackItemCard';
import { DeleteModal } from '../components/DeleteModal';
import { MoveToStudyPackModal } from '../components/MoveToStudyPackModal';
import { StudyPackModal } from '../components/StudyPackModal';
import { Toast as toast } from '../utils/toast';
import {
  BookOpen,
  Calendar,
  Layers,
  HelpCircle,
  FileText,
  Trash2,
  Folder,
  Plus,
  Edit2,
} from 'lucide-react';
import { useQuizzes, useFlashcardSets, useContents } from '../hooks';

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

interface DeleteState {
  itemId: string | null;
  itemType: ItemType;
}

interface StudyPackData {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  quizzes?: any[];
  flashcardSets?: any[];
  contents?: any[];
  userDocuments?: any[];
  userId: string;
  _count?: {
    quizzes: number;
    flashcardSets: number;
    contents: number;
    userDocuments: number;
  };
}

const TAB_CONFIG = {
  quizzes: {
    dataKey: 'quizzes' as const,
    itemType: 'quiz' as const,
    route: '/quiz',
    navigateState: { openGenerator: true },
  },
  flashcards: {
    dataKey: 'flashcardSets' as const,
    itemType: 'flashcard' as const,
    route: '/flashcards',
    navigateState: { openGenerator: true },
  },
  materials: {
    dataKey: 'contents' as const,
    itemType: 'content' as const,
    route: '/study',
    navigateState: { openCreator: true },
  },
  files: {
    dataKey: 'userDocuments' as const,
    itemType: 'userDocument' as const,
    route: '/files',
    navigateState: { openUpload: true },
  },
} as const;

// Service map for item deletion
const ITEM_DELETE_SERVICES = {
  quiz: quizService.delete.bind(quizService),
  flashcard: flashcardService.delete.bind(flashcardService),
  content: contentService.delete.bind(contentService),
  userDocument:
    userDocumentService.deleteUserDocument.bind(userDocumentService),
} as const;

// ============================================================================
// Utility Components
// ============================================================================

const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-7xl mx-auto">{children}</div>
);

const LoadingSkeleton: React.FC = () => (
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

// Helper to determine TabId from ItemType
const getTabConfigId = (type: string): TabId => {
  if (type === 'quiz') return 'quizzes';
  if (type === 'flashcard') return 'flashcards';
  if (type === 'content') return 'materials';
  if (type === 'userDocument' || type === 'file') return 'files';
  return type as TabId;
};

export const StudyPackDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: studyPack,
    isLoading,
    isError,
  } = useQuery<StudyPackData>({
    queryKey: ['studyPack', id],
    queryFn: () =>
      id
        ? studyPackService.getById(id)
        : Promise.reject(new Error('No ID provided')),
    enabled: !!id,
    retry: false,
  });

  // Handle fetch errors
  React.useEffect(() => {
    if (isError) {
      toast.error('Failed to load study set');
      navigate('/study-pack');
    }
  }, [isError, navigate]);

  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabId) || 'quizzes';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // Update URL when tab changes
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabId);
    navigate(`?${newParams.toString()}`, { replace: true });
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Independent queries for each tab to support infinite scroll
  const {
    data: quizzesData,
    fetchNextPage: fetchNextQuizzes,
    hasNextPage: hasNextQuizzes,
    isFetchingNextPage: isFetchingQuizzes,
  } = useQuizzes(id);

  const {
    data: setsData,
    fetchNextPage: fetchNextSets,
    hasNextPage: hasNextSets,
    isFetchingNextPage: isFetchingSets,
  } = useFlashcardSets(id);

  const {
    data: contentsData,
    fetchNextPage: fetchNextContents,
    hasNextPage: hasNextContents,
    isFetchingNextPage: isFetchingContents,
  } = useContents(undefined, id);

  const quizzes = useMemo(
    () => quizzesData?.pages.flatMap((p) => p.data) ?? [],
    [quizzesData]
  );
  const flashcardSets = useMemo(
    () => setsData?.pages.flatMap((p) => p.data) ?? [],
    [setsData]
  );
  const contents = useMemo(
    () => contentsData?.pages.flatMap((p) => p.data) ?? [],
    [contentsData]
  );

  const counts = useMemo(
    () => ({
      quizzes:
        quizzesData?.pages[0]?.meta?.total ?? studyPack?._count?.quizzes ?? 0,
      flashcards:
        setsData?.pages[0]?.meta?.total ??
        studyPack?._count?.flashcardSets ??
        0,
      materials:
        contentsData?.pages[0]?.meta?.total ?? studyPack?._count?.contents ?? 0,
      files: studyPack?.userDocuments?.length ?? 0,
    }),
    [quizzesData, setsData, contentsData, studyPack]
  );

  React.useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;
      if (scrollHeight - scrollTop <= clientHeight + 300) {
        if (activeTab === 'quizzes' && hasNextQuizzes && !isFetchingQuizzes)
          fetchNextQuizzes();
        if (activeTab === 'flashcards' && hasNextSets && !isFetchingSets)
          fetchNextSets();
        if (activeTab === 'materials' && hasNextContents && !isFetchingContents)
          fetchNextContents();
      }
    };
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [
    activeTab,
    hasNextQuizzes,
    isFetchingQuizzes,
    fetchNextQuizzes,
    hasNextSets,
    isFetchingSets,
    fetchNextSets,
    hasNextContents,
    isFetchingContents,
    fetchNextContents,
  ]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [moveState, setMoveState] = useState<MoveState>({
    itemId: null,
    itemType: 'content',
  });
  const [deleteState, setDeleteState] = useState<DeleteState>({
    itemId: null,
    itemType: 'content',
  });
  const [isDeletingPack, setIsDeletingPack] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const tabs: TabConfig[] = useMemo(
    () => [
      {
        id: 'quizzes',
        label: 'Quizzes',
        icon: HelpCircle,
        count: counts.quizzes,
        createRoute: '/quiz',
        emptyMessage: 'Create a quiz to test your knowledge on this topic.',
        emptyAction: 'Add Quiz',
      },
      {
        id: 'flashcards',
        label: 'Flashcards',
        icon: Layers,
        count: counts.flashcards,
        createRoute: '/flashcards',
        emptyMessage: 'Create flashcards to memorize key concepts efficiently.',
        emptyAction: 'Add Flashcards',
      },
      {
        id: 'materials',
        label: 'Study Materials',
        icon: BookOpen,
        count: counts.materials,
        createRoute: '/content',
        emptyMessage: 'Add content to read and learn from.',
        emptyAction: 'Add Content',
      },
      {
        id: 'files',
        label: 'Documents',
        icon: FileText,
        count: counts.files,
        createRoute: '',
        emptyMessage: 'Upload documents to your study set.',
        emptyAction: 'Add File',
      },
    ],
    [counts, studyPack]
  );

  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTab),
    [tabs, activeTab]
  );

  const handleEditSubmit = useCallback(
    async (data: { title: string; description: string }) => {
      if (!studyPack) return;

      setIsUpdating(true);
      try {
        const updatedPack = await studyPackService.update(studyPack.id, data);

        // Optimistic update
        queryClient.setQueryData(
          ['studyPack', id],
          (old: StudyPackData | undefined) => {
            if (!old) return updatedPack;
            return {
              ...old,
              title: updatedPack.title,
              description: updatedPack.description,
            };
          }
        );

        toast.success('Study set updated successfully');
        setShowEditModal(false);
      } catch (error) {
        toast.error('Failed to update study set');
        console.error('Failed to update study pack:', error);
      } finally {
        setIsUpdating(false);
      }
    },
    [studyPack, id, queryClient]
  );

  const handleDeletePack = useCallback(async () => {
    if (!studyPack) return;

    setIsDeletingPack(true);
    try {
      await studyPackService.delete(studyPack.id);
      toast.success('Study set deleted');
      queryClient.invalidateQueries({ queryKey: ['studyPacks'] });
      navigate('/study-pack');
    } catch (error) {
      toast.error('Failed to delete study set');
      console.error('Failed to delete study pack:', error);
      setIsDeletingPack(false);
    }
  }, [studyPack, navigate, queryClient]);

  const handleRemoveItem = useCallback(
    async (itemId: string, type: ItemType) => {
      if (!studyPack) return;

      const config = TAB_CONFIG[getTabConfigId(type)];
      const dataKey = config.dataKey;

      // Optimistic update
      queryClient.setQueryData(
        ['studyPack', studyPack.id],
        (old: StudyPackData | undefined) => {
          if (!old) return old;
          return {
            ...old,
            [dataKey]:
              old[dataKey]?.filter((item: any) => item.id !== itemId) || [],
          };
        }
      );

      try {
        await studyPackService.removeItem(studyPack.id, {
          type: type as any,
          itemId,
        });
        toast.success('Item removed from pack');

        // Invalidate all relevant queries
        await queryClient.invalidateQueries({ queryKey: ['contents'] });
        await queryClient.invalidateQueries({ queryKey: ['quizzes'] });
        await queryClient.invalidateQueries({ queryKey: ['flashcardSets'] });
        await queryClient.invalidateQueries({ queryKey: ['studyPacks'] });
        await queryClient.invalidateQueries({
          queryKey: ['studyPack', studyPack.id],
        });
      } catch (error) {
        toast.error('Failed to remove item');
        console.error('Failed to remove item:', error);
        // Revert on error
        await queryClient.invalidateQueries({
          queryKey: ['studyPack', studyPack.id],
        });
      }
    },
    [studyPack, queryClient]
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
      const deleteService = ITEM_DELETE_SERVICES[itemType];

      await deleteService(itemId);

      toast.success('Item deleted permanently');
      queryClient.invalidateQueries({
        queryKey: ['studyPack', studyPack.id],
      });
      setShowDeleteItemModal(false);
      setDeleteState({ itemId: null, itemType: 'content' });
    } catch (error) {
      toast.error('Failed to delete item');
      console.error('Failed to delete item:', error);
    } finally {
      setIsDeletingItem(false);
    }
  }, [deleteState, studyPack, queryClient]);

  const handleMoveItem = useCallback(
    (itemId: string, type: 'quiz' | 'flashcard' | 'content') => {
      setMoveState({ itemId, itemType: type });
    },
    []
  );

  const closeMoveModal = useCallback(() => {
    setMoveState({ itemId: null, itemType: 'content' });
  }, []);

  const handleMoveSuccess = useCallback(
    (pack: any) => {
      if (pack?.id !== id) {
        const config = TAB_CONFIG[getTabConfigId(moveState.itemType)];
        const dataKey = config.dataKey;

        queryClient.setQueryData(
          ['studyPack', id],
          (old: StudyPackData | undefined) => {
            if (!old) return old;
            return {
              ...old,
              [dataKey]:
                old[dataKey]?.filter(
                  (item: any) => item.id !== moveState.itemId
                ) || [],
            };
          }
        );
      }
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['flashcardSets'] });
      queryClient.invalidateQueries({ queryKey: ['studyPacks'] });
      queryClient.invalidateQueries({ queryKey: ['studyPack', id] });
    },
    [id, moveState.itemId, moveState.itemType, queryClient]
  );

  const handleNavigateToCreate = useCallback(
    (tabId: TabId) => {
      const config = TAB_CONFIG[tabId];
      const commonState = { studyPackId: studyPack?.id };

      navigate(config.route, {
        state: { ...config.navigateState, ...commonState },
      });
    },
    [navigate, studyPack?.id]
  );

  const handleNavigateToItem = useCallback(
    (itemId: string, type: ItemType, item?: any) => {
      if (type === 'userDocument') return;

      const routeMap = {
        quiz: '/quiz',
        flashcard: '/flashcards',
        content: '/content',
      } as const;

      const hasAttempts = (item?._count?.attempts || 0) > 0;
      const historyParam = hasAttempts ? '?view=history' : '';

      // Add breadcrumb context for content navigation
      if (type === 'content' && studyPack) {
        navigate(`${routeMap[type]}/${itemId}`, {
          state: {
            breadcrumb: [
              { label: studyPack.title, path: `/study-pack/${studyPack.id}` },
            ],
          },
        });
      } else {
        navigate(`${routeMap[type]}/${itemId}${historyParam}`);
      }
    },
    [navigate, studyPack]
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
        <button
          onClick={() => handleNavigateToCreate(tab.id)}
          className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
        >
          {tab.emptyAction}
        </button>
      </div>
    ),
    [handleNavigateToCreate]
  );

  const renderTabContent = useCallback(() => {
    if (!studyPack) return null;

    const config = TAB_CONFIG[activeTab];
    let items: any[] = [];
    let isFetchingNext = false;

    if (activeTab === 'quizzes') {
      items = quizzes;
      isFetchingNext = isFetchingQuizzes;
    } else if (activeTab === 'flashcards') {
      items = flashcardSets;
      isFetchingNext = isFetchingSets;
    } else if (activeTab === 'materials') {
      items = contents;
      isFetchingNext = isFetchingContents;
    } else if (activeTab === 'files') {
      items = studyPack.userDocuments || [];
    }

    const hasItems = items.length > 0;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-end">
          <button
            onClick={() => handleNavigateToCreate(activeTab)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {currentTab?.emptyAction || 'Add Item'}
          </button>
        </div>

        {hasItems ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any) => (
              <StudyPackItemCard
                key={item.id}
                item={item}
                type={config.itemType}
                onClick={
                  config.itemType === 'userDocument'
                    ? undefined
                    : () => handleNavigateToItem(item.id, config.itemType, item)
                }
                onMove={
                  config.itemType === 'userDocument'
                    ? undefined
                    : () => handleMoveItem(item.id, config.itemType as any)
                }
                onRemove={() => handleRemoveItem(item.id, config.itemType)}
                onDelete={() => handleDeleteItem(item.id, config.itemType)}
              />
            ))}
          </div>
        ) : (
          currentTab && renderEmptyState(currentTab)
        )}

        {isFetchingNext && (
          <div className="flex justify-center p-4">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }, [
    studyPack,
    activeTab,
    currentTab,
    handleNavigateToCreate,
    handleNavigateToItem,
    handleMoveItem,
    handleRemoveItem,
    handleDeleteItem,
    renderEmptyState,
    quizzes,
    flashcardSets,
    contents,
    isFetchingQuizzes,
    isFetchingSets,
    isFetchingContents,
  ]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!studyPack) {
    return null;
  }

  return (
    <Container>
      <div
        ref={scrollContainerRef}
        className="h-screen overflow-y-auto scrollbar-hide pb-8"
      >
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex-shrink-0">
                <Folder className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">
                    {studyPack.title}
                  </h1>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex-shrink-0"
                    title="Edit Study Set"
                    aria-label="Edit Study Set"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl text-sm sm:text-base">
                  {studyPack.description || 'No description provided.'}
                </p>
                <div className="flex items-center gap-4 mt-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
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
              className="flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm font-medium w-full sm:w-auto"
              aria-label="Delete Study Set"
            >
              <Trash2 className="w-4 h-4" />
              Delete Set
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div
          role="tablist"
          className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 mb-8 scrollbar-none"
        >
          {tabs.map((tab) => (
            <button
              role="tab"
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              aria-label={`${tab.label} tab`}
              aria-selected={activeTab === tab.id}
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
                {counts[tab.id as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Modals */}
        <StudyPackModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          initialData={studyPack}
          onSubmit={handleEditSubmit}
          isLoading={isUpdating}
        />

        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeletePack}
          title="Delete Study Set"
          message="Are you sure you want to delete this study set? The items inside will NOT be deleted."
          itemName="Study Set"
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
          onMoveSuccess={handleMoveSuccess}
        />
      </div>
    </Container>
  );
};
