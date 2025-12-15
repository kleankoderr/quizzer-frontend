import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Brain, X, ChevronRight, ArrowRight } from 'lucide-react';
import { QuestionRenderer } from './QuestionRenderer';
import type { QuizQuestion, AnswerValue, QuestionType } from '../types';

interface KnowledgeCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  knowledgeCheck: {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
    userAnswer?: string;
    userScore?: number;
  };
  onUpdate: (updates: any) => void;
  onComplete: () => void;
}

export const KnowledgeCheckModal: React.FC<KnowledgeCheckModalProps> = ({
  isOpen,
  onClose,
  sectionTitle,
  knowledgeCheck,
  onUpdate,
  onComplete,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>(
    knowledgeCheck.userAnswer
  );
  const [showResult, setShowResult] = useState(
    knowledgeCheck.userScore !== undefined
  );
  
  // Sync local state with prop when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedAnswer(knowledgeCheck.userAnswer);
      setShowResult(knowledgeCheck.userScore !== undefined);
      setIsClosing(false);
    }
  }, [isOpen, knowledgeCheck]);

  // Construct QuizQuestion object for the renderer
  const questionData: QuizQuestion = useMemo(() => {
    // Determine type based on options content or length
    // Default to 'single-select' as knowledge checks are typically multiple choice
    let type: QuestionType = 'single-select';
    
    // Heuristic for True/False
    if (
        knowledgeCheck.options.length === 2 && 
        knowledgeCheck.options.some(o => o.toLowerCase() === 'true') && 
        knowledgeCheck.options.some(o => o.toLowerCase() === 'false')
    ) {
      type = 'true-false';
    }

    // Find correct answer index
    const correctIndex = knowledgeCheck.options.indexOf(knowledgeCheck.answer);

    return {
      questionType: type,
      question: knowledgeCheck.question,
      options: knowledgeCheck.options,
      correctAnswer: correctIndex === -1 ? knowledgeCheck.answer : correctIndex,
      explanation: knowledgeCheck.explanation,
    };
  }, [knowledgeCheck]);

  // Derived state for renderer
  const selectedAnswerIndex = useMemo(() => {
    if (selectedAnswer === undefined) return null;
    const idx = knowledgeCheck.options.indexOf(selectedAnswer);
    return idx === -1 ? null : idx;
  }, [selectedAnswer, knowledgeCheck.options]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleDisplayAnswerSelect = (val: AnswerValue) => {
    // Convert index back to string
    if (typeof val === 'number') {
      const option = knowledgeCheck.options[val];
      if (option) setSelectedAnswer(option);
    }
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === knowledgeCheck.answer;
    
    // Update parent state
    onUpdate({
      knowledgeCheck: {
        ...knowledgeCheck,
        userAnswer: selectedAnswer,
        userScore: isCorrect ? 1 : 0
      }
    });

    setShowResult(true);
  };

  const handleRetry = () => {
    setSelectedAnswer(undefined);
    setShowResult(false);
    onUpdate({
        knowledgeCheck: {
            ...knowledgeCheck,
            userAnswer: undefined,
            userScore: undefined
        }
    });
  };

  const handleContinue = () => {
    handleClose();
    // Short delay to allow modal close animation to start before transitions
    setTimeout(onComplete, 300);
  };

  if (!isOpen && !isClosing) return null;

  const isCorrect = selectedAnswer === knowledgeCheck.answer;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div 
        className={`relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 flex flex-col max-h-[90vh] ${isClosing ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'}`}
      >
        {/* Header - Clean & Minimal */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                Knowledge Check
              </span>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                {sectionTitle}
              </h3>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
            <QuestionRenderer 
                question={questionData}
                questionIndex={0} 
                selectedAnswer={selectedAnswerIndex}
                onAnswerSelect={handleDisplayAnswerSelect}
                showResults={showResult}
                correctAnswer={questionData.correctAnswer}
                showExplanation={showResult}
                hideQuestionNumber={true}
            />
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          {!showResult ? (
            <button
               onClick={handleCheckAnswer}
               disabled={!selectedAnswer}
               className="w-full py-3.5 px-6 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl shadow-primary-600/20 active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
            >
               <span>Check Answer</span>
               <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            isCorrect ? (
                <button
                    onClick={handleContinue}
                    className="w-full py-3.5 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl shadow-primary-600/20 active:scale-[0.98] flex items-center justify-center gap-2 text-lg animate-in fade-in zoom-in duration-300"
                >
                    <span>Continue to Next Section</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            ) : (
                <button
                    onClick={handleRetry}
                    className="w-full py-3.5 px-6 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
                >
                    <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin hidden" />
                    <span>Try Again</span>
                </button>
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
