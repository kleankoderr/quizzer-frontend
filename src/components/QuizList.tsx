import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import type { Quiz, StudyPack } from '../types';
import { Brain, Plus, Pencil, Folder, Trash2 } from 'lucide-react';
import { MoveToStudyPackModal } from './MoveToStudyPackModal';
import { CollapsibleSection } from './CollapsibleSection';
import { CardMenu } from './CardMenu';
import { EditTitleModal } from './EditTitleModal';
import { quizService } from '../services/quiz.service';
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
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onDelete, onEdit, onMove }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const navigate = useNavigate();
  const latestAttempt = quiz.attempts?.[0] ?? null;

  const navigateToQuiz = () => {
    navigate(
      `/quiz/${quiz.id}${quiz.attemptCount && quiz.attemptCount > 0 ? '?view=history' : ''}`
    );
  };

  const toggleExpand = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsExpanded(!isExpanded);
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
      icon={<Brain className="w-6 h-6 text-primary-600 dark:text-primary-400" />}
      onClick={toggleExpand}
      onTitleClick={navigateToQuiz}
      onIconClick={navigateToQuiz}
      actions={<CardMenu items={menuItems} />}
    >
      <div
        className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-60 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
      >
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
          {/* Tags */}
          {quiz.tags && quiz.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {quiz.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-[10px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Brain className="w-4 h-4" />
                <span>
                  {quiz.questionCount || quiz.questions?.length || 0} questions
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs">
                  {quiz.createdAt ? formatDate(quiz.createdAt) : 'Unknown date'}
                </span>
              </div>
            </div>

            {latestAttempt && (
              <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                Last attempt: {formatDate(latestAttempt.completedAt)} •{' '}
                {latestAttempt.score}/
                {quiz.questionCount || quiz.questions?.length} correct
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateToQuiz();
            }}
            className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 mt-2"
          >
            Start Quiz
            <Brain className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isExpanded && (
        <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
          <span>
            {quiz.questionCount || quiz.questions?.length || 0} Questions
          </span>
          <span>Click to expand</span>
        </div>
      )}
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
