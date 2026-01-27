import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import type { Quiz, StudyPack } from '../types';
import { Brain, Plus, Pencil, Folder, Trash2, X } from 'lucide-react';
import { MoveToStudyPackModal } from './MoveToStudyPackModal';
import { CollapsibleSection } from './CollapsibleSection';
import { CardMenu } from './CardMenu';
import { EditTitleModal } from './EditTitleModal';
import { quizService } from '../services/quiz.service';
import { studyPackService } from '../services';
import { Toast as toast } from '../utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../utils/dateFormat';

interface QuizListProps {
  quizzes: Quiz[];
  onDelete?: (id: string) => void;
  onCreateNew?: () => void;
  onItemMoved?: (itemId: string, pack?: StudyPack) => void;
}

interface QuizCardProps {
  quiz: Quiz;
  onDelete?: (id: string) => void;
  onEdit: (id: string) => void;
  onMove: (id: string) => void;
  onRemove: (id: string, packId: string) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  onDelete,
  onEdit,
  onMove,
  onRemove,
}) => {
  const navigate = useNavigate();

  const navigateToQuiz = () => {
    navigate(
      `/quiz/${quiz.id}${quiz.attemptCount && quiz.attemptCount > 0 ? '?view=history' : ''}`
    );
  };

  const menuItems = [
    {
      label: 'Edit Title',
      icon: <Pencil className="w-4 h-4" />,
      onClick: () => onEdit(quiz.id),
    },
    {
      label: 'Move to Study Set',
      icon: <Folder className="w-4 h-4" />,
      onClick: () => onMove(quiz.id),
    },
    ...(quiz.studyPack || quiz.studyPackId
      ? [
          {
            label: 'Remove from Study Set',
            icon: <X className="w-4 h-4" />,
            onClick: () =>
              onRemove(
                quiz.id,
                (quiz.studyPack?.id || quiz.studyPackId) as string
              ),
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            label: 'Delete',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => onDelete(quiz.id),
            variant: 'danger' as const,
          },
        ]
      : []),
  ];

  return (
    <Card
      key={quiz.id}
      title={quiz.title}
      subtitle={quiz.topic}
      icon={
        <Brain className="w-6 h-6 text-primary-600 dark:text-primary-400" />
      }
      onClick={navigateToQuiz}
      onTitleClick={navigateToQuiz}
      onIconClick={navigateToQuiz}
      actions={<CardMenu items={menuItems} />}
    >
      <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
        <span>
          {quiz.questionCount || quiz.questions?.length || 0} Questions
        </span>
        {quiz.createdAt && <span>{formatDate(quiz.createdAt)}</span>}
      </div>
    </Card>
  );
};

export const QuizList: React.FC<QuizListProps> = ({
  quizzes,
  onDelete,
  onCreateNew,
  onItemMoved,
}) => {
  const navigate = useNavigate();
  const [moveQuizId, setMoveQuizId] = React.useState<string | null>(null);
  const [editQuizId, setEditQuizId] = React.useState<string | null>(null);
  const queryClient = useQueryClient();

  const editingQuiz = quizzes.find((q) => q.id === editQuizId);

  const handleTitleUpdate = async (quizId: string, newTitle: string) => {
    try {
      await quizService.updateTitle(quizId, newTitle);

      // Optimistically update the cache
      queryClient.setQueryData(['quizzes'], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((q: Quiz) =>
            q.id === quizId ? { ...q, title: newTitle } : q
          ),
        };
      });

      // Invalidate to refetch from server
      await queryClient.invalidateQueries({ queryKey: ['quizzes'] });

      toast.success('Quiz title updated successfully!');
    } catch (error) {
      toast.error('Failed to update quiz title');
      throw error;
    }
  };

  const handleRemoveFromPack = async (itemId: string, packId: string) => {
    const loadingToast = toast.loading('Removing from study set...');
    try {
      await studyPackService.removeItem(packId, { type: 'quiz', itemId });

      // Invalidate all relevant queries
      await queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      await queryClient.invalidateQueries({ queryKey: ['quiz', itemId] });
      await queryClient.invalidateQueries({ queryKey: ['studyPack', packId] });
      await queryClient.invalidateQueries({ queryKey: ['studyPacks'] });
      toast.success('Removed from study set', { id: loadingToast });
    } catch (_error) {
      toast.error('Failed to remove from study set', { id: loadingToast });
    }
  };

  const groupedQuizzes = React.useMemo(() => {
    const groups: {
      [key: string]: { id: string; title: string; quizzes: Quiz[] };
    } = {};
    const noPack: Quiz[] = [];

    quizzes.forEach((quiz) => {
      if (quiz.studyPack) {
        const packId = quiz.studyPack.id;
        if (!groups[packId]) {
          groups[packId] = {
            id: packId,
            title: quiz.studyPack.title,
            quizzes: [],
          };
        }
        groups[packId].quizzes.push(quiz);
      } else {
        noPack.push(quiz);
      }
    });

    return { groups, noPack };
  }, [quizzes]);

  if (quizzes.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
          <Brain className="w-10 h-10 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No quizzes yet
        </h3>
        <p className="text-gray-500 mb-6">
          Generate your first quiz to get started!
        </p>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create New Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="card dark:bg-gray-800 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Your Quizzes
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {quizzes.length} quiz{quizzes.length === 1 ? '' : 'zes'}
        </span>
      </div>
      <div className="space-y-6">
        {Object.values(groupedQuizzes.groups).map((pack) => (
          <CollapsibleSection
            key={pack.id}
            title={pack.title}
            count={pack.quizzes.length}
            defaultOpen={false}
            onTitleClick={() => navigate(`/study-pack/${pack.id}?tab=quizzes`)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {pack.quizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onEdit={(id) => setEditQuizId(id)}
                  onMove={(id) => setMoveQuizId(id)}
                  onRemove={handleRemoveFromPack}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </CollapsibleSection>
        ))}

        {/* Uncategorized Quizzes */}
        {groupedQuizzes.noPack.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            {groupedQuizzes.noPack.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onEdit={(id) => setEditQuizId(id)}
                onMove={(id) => setMoveQuizId(id)}
                onRemove={handleRemoveFromPack}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      <MoveToStudyPackModal
        isOpen={!!moveQuizId}
        onClose={() => setMoveQuizId(null)}
        itemId={moveQuizId || ''}
        itemType="quiz"
        onMoveSuccess={(pack) => {
          if (onItemMoved) onItemMoved(moveQuizId || '', pack);
        }}
      />

      <EditTitleModal
        isOpen={!!editQuizId}
        currentTitle={editingQuiz?.title || ''}
        onClose={() => setEditQuizId(null)}
        onSave={(newTitle) => handleTitleUpdate(editQuizId || '', newTitle)}
      />
    </div>
  );
};
