import { useState } from 'react';
import type { QuestionType, QuizGenerateRequest, QuizType } from '../types';
import { Toast as toast } from '../utils/toast';

export interface UseQuizGeneratorProps {
  onGenerate: (request: QuizGenerateRequest, files?: File[]) => void;
  initialValues?: {
    topic?: string;
    content?: string;
    mode?: 'topic' | 'content' | 'files';
    sourceId?: string;
    sourceTitle?: string;
    contentId?: string;
    studyPackId?: string;
  };
}

export const useQuizGenerator = ({
  onGenerate,
  initialValues,
}: UseQuizGeneratorProps) => {
  const [mode, setMode] = useState<'topic' | 'content' | 'files'>(
    initialValues?.mode || 'topic'
  );
  const [topic, setTopic] = useState(
    initialValues?.sourceTitle || initialValues?.topic || ''
  );
  const [content, setContent] = useState(initialValues?.content || '');
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showExistingFiles, setShowExistingFiles] = useState(false);
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    'medium'
  );
  const [quizType, setQuizType] = useState<QuizType>('standard');
  const [timeLimit, setTimeLimit] = useState(300);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<
    QuestionType[]
  >(['single-select', 'true-false']);
  const [selectedStudyPackId, setSelectedStudyPackId] = useState(
    initialValues?.studyPackId || ''
  );
  const [isCreatingStudyPack, setIsCreatingStudyPack] = useState(false);
  const [showStudyPackError, setShowStudyPackError] = useState(false);

  const toggleQuestionType = (type: QuestionType) => {
    setSelectedQuestionTypes((prev) => {
      if (prev.includes(type)) {
        return prev.length > 1 ? prev.filter((t) => t !== type) : prev;
      }
      return [...prev, type];
    });
  };

  const prepareRequest = (): QuizGenerateRequest | null => {
    if (isCreatingStudyPack) {
      setShowStudyPackError(true);
      return null;
    }
    setShowStudyPackError(false);

    const request: QuizGenerateRequest = {
      numberOfQuestions,
      difficulty,
      quizType,
      timeLimit: quizType === 'timed' ? timeLimit : undefined,
      questionTypes:
        selectedQuestionTypes.length > 0 ? selectedQuestionTypes : undefined,
      contentId: initialValues?.contentId,
      studyPackId: selectedStudyPackId || undefined,
    };

    if (mode === 'topic' && topic.trim()) {
      return { ...request, topic };
    } else if (mode === 'content') {
      if (content.trim()) {
        return { ...request, topic: content.substring(0, 50), content };
      }
      if (initialValues?.contentId) {
        return {
          ...request,
          contentId: initialValues.contentId,
          topic: initialValues.sourceTitle || topic || 'Study material',
        };
      }
    } else if (mode === 'files') {
      if (files.length === 0 && selectedFileIds.length === 0) {
        toast.error('Please select or upload at least one file');
        return null;
      }
      return { ...request, selectedFileIds };
    }

    return null;
  };

  const handleSubmit = (
    e?: React.FormEvent,
    extraData?: Partial<QuizGenerateRequest>
  ) => {
    if (e) e.preventDefault();

    const baseRequest = prepareRequest();
    if (baseRequest) {
      onGenerate(
        { ...baseRequest, ...extraData },
        mode === 'files' ? files : undefined
      );
    }
  };

  return {
    state: {
      mode,
      topic,
      content,
      files,
      selectedFileIds,
      showUpload,
      showExistingFiles,
      numberOfQuestions,
      difficulty,
      quizType,
      timeLimit,
      selectedQuestionTypes,
      selectedStudyPackId,
      isCreatingStudyPack,
      showStudyPackError,
    },
    actions: {
      setMode,
      setTopic,
      setContent,
      setFiles,
      setSelectedFileIds,
      setShowUpload,
      setShowExistingFiles,
      setNumberOfQuestions,
      setDifficulty,
      setQuizType,
      setTimeLimit,
      setSelectedQuestionTypes,
      setSelectedStudyPackId,
      setIsCreatingStudyPack,
      setShowStudyPackError,
      toggleQuestionType,
      handleSubmit,
    },
  };
};
