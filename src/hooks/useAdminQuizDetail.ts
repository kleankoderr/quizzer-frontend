import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services';
import { Toast as toast } from '../utils/toast';
import type { QuestionType, QuizQuestion } from '../types';

export const useAdminQuizDetail = (quizId: string | undefined) => {
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<(QuizQuestion & { id: string })[]>(
    []
  );
  const [originalQs, setOriginalQs] = useState<
    (QuizQuestion & { id: string })[]
  >([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [scope, setScope] = useState<'GLOBAL' | 'SCHOOL'>('GLOBAL');
  const [schoolId, setSchoolId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [schools, setSchools] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: adminQuiz,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-quiz', quizId],
    queryFn: () => adminService.getAdminQuizDetails(quizId!),
    enabled: !!quizId,
  });

  useEffect(() => {
    if (adminQuiz) {
      const qs = (adminQuiz.quiz.questions || []).map((q: any) => ({
        ...q,
        id: q.id || crypto.randomUUID(),
      }));
      setQuestions(qs);
      setOriginalQs([...qs]);
      setTitle(adminQuiz.quiz.title || '');
      setTopic(adminQuiz.quiz.topic || '');
      setScope(adminQuiz.scope || 'GLOBAL');
      setSchoolId(adminQuiz.schoolId || '');
      setIsActive(adminQuiz.isActive);
    }
  }, [adminQuiz]);

  useEffect(() => {
    const fetchSchools = async () => {
      if (scope === 'SCHOOL') {
        try {
          const data = await adminService.getSchools();
          setSchools(data || []);
        } catch (error) {
          console.error('Failed to fetch schools:', error);
        }
      }
    };
    fetchSchools();
  }, [scope]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminService.updateAdminQuiz(quizId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quiz', quizId] });
      toast.success('Quiz updated successfully');
      setIsSaving(false);
    },
    onError: () => {
      toast.error('Failed to update quiz');
      setIsSaving(false);
    },
  });

  const deleteQuestionsMutation = useMutation({
    mutationFn: (questionIds: string[]) =>
      adminService.deleteQuestions(quizId!, questionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quiz', quizId] });
      toast.success('Questions deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete questions from server');
    },
  });

  const handleSave = () => {
    if (!adminQuiz) return;
    setIsSaving(true);

    const areEqual = (q1: any, q2: any) => {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      const { id: _id1, ...rest1 } = q1;
      const { id: _id2, ...rest2 } = q2;
      return JSON.stringify(rest1) === JSON.stringify(rest2);
    };

    const updatedOrNewQuestions = questions.filter((q) => {
      const original = originalQs.find((oq) => oq.id === q.id);
      if (!original) return true;
      return !areEqual(q, original);
    });

    const deletedQuestionIds = originalQs
      .filter((oq) => !questions.some((q) => q.id === oq.id))
      .map((oq) => oq.id)
      .filter((id): id is string => typeof id === 'string');

    const payload: any = {
      scope,
      schoolId: scope === 'SCHOOL' ? schoolId : null,
      isActive,
    };

    if (title !== adminQuiz.quiz.title) payload.title = title;
    if (topic !== adminQuiz.quiz.topic) payload.topic = topic;
    if (updatedOrNewQuestions.length > 0)
      payload.questions = updatedOrNewQuestions;
    if (deletedQuestionIds.length > 0)
      payload.deletedQuestionIds = deletedQuestionIds;

    updateMutation.mutate(payload);
  };

  const addQuestion = (type: QuestionType = 'single-select') => {
    const newQuestion: QuizQuestion & { id: string } = {
      id: crypto.randomUUID(),
      questionType: type,
      question: 'New Question',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 0,
      explanation: '',
    };
    if (type === 'true-false') {
      newQuestion.options = ['True', 'False'];
    } else if (type === 'matching') {
      newQuestion.options = undefined;
      newQuestion.leftColumn = ['Item 1', 'Item 2'];
      newQuestion.rightColumn = ['Match 1', 'Match 2'];
    } else if (type === 'fill-blank') {
      newQuestion.options = undefined;
      newQuestion.correctAnswer = '';
    }
    setQuestions([newQuestion, ...questions]);
    setSelectedQuestions(selectedQuestions.map((selectedIndex) => selectedIndex + 1));
  };

  const deleteQuestion = (index: number) => {
    const questionId = questions[index].id;
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
    setSelectedQuestions(
      selectedQuestions
        .filter((selectedIndex) => selectedIndex !== index)
        .map((selectedIndex) => (selectedIndex > index ? selectedIndex - 1 : selectedIndex))
    );

    if (questionId) {
      deleteQuestionsMutation.mutate([questionId]);
    } else {
      toast.success('Question removed locally');
    }
  };

  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = questions[index];
    const newQuestion = {
      ...questionToDuplicate,
      id: crypto.randomUUID(),
    };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, newQuestion);
    setQuestions(newQuestions);
    toast.success('Question duplicated');
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const bulkDelete = () => {
    const idsToDelete = selectedQuestions
      .map((index) => questions[index]?.id)
      .filter((id): id is string => !!id);

    const newQuestions = questions.filter(
      (_, index) => !selectedQuestions.includes(index)
    );
    setQuestions(newQuestions);
    const count = selectedQuestions.length;
    setSelectedQuestions([]);

    if (idsToDelete.length > 0) {
      deleteQuestionsMutation.mutate(idsToDelete);
    } else {
      toast.success(`${count} questions removed locally`);
    }
  };

  const selectAllQuestions = () => {
    setSelectedQuestions(questions.map((_, index) => index));
  };

  const deselectAllQuestions = () => {
    setSelectedQuestions([]);
  };

  const toggleSelectQuestion = (index: number) => {
    if (selectedQuestions.includes(index)) {
      setSelectedQuestions(selectedQuestions.filter((selectedIndex) => selectedIndex !== index));
    } else {
      setSelectedQuestions([...selectedQuestions, index]);
    }
  };

  return {
    state: {
      questions,
      selectedQuestions,
      title,
      topic,
      scope,
      schoolId,
      isActive,
      schools,
      isSaving,
      isLoading,
      error,
      adminQuiz,
    },
    actions: {
      setTitle,
      setTopic,
      setScope,
      setSchoolId,
      setIsActive,
      addQuestion,
      deleteQuestion,
      duplicateQuestion,
      updateQuestion,
      bulkDelete,
      selectAllQuestions,
      deselectAllQuestions,
      toggleSelectQuestion,
      handleSave,
    },
  };
};
