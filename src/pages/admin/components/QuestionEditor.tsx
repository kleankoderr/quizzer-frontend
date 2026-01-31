import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Files, Trash2 } from 'lucide-react';
import { Select } from '../../ui/Select';
import type { QuestionType, QuizQuestion } from '../../../types';

interface QuestionEditorProps {
  index: number;
  question: QuizQuestion & { id: string };
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onChange: (updates: Partial<QuizQuestion>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const typeStylesMap: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  'single-select': {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-400',
    label: 'Single Choice',
  },
  'multi-select': {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-700 dark:text-purple-400',
    label: 'Multiple Choice',
  },
  'true-false': {
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    label: 'True/False',
  },
  matching: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-400',
    label: 'Matching',
  },
  'fill-blank': {
    bg: 'bg-rose-100 dark:bg-rose-900/40',
    text: 'text-rose-700 dark:text-rose-400',
    label: 'Fill Blank',
  },
};

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  index,
  question,
  isSelected,
  onSelect,
  onDeselect,
  onChange,
  onDelete,
  onDuplicate,
}) => {
  const [isExpanded, setIsExpanded] = useState(index === 0);

  const handleToggle = () => setIsExpanded((prev) => !prev);

  const handleCorrectAnswerChange = (val: number | number[] | string) => {
    onChange({ correctAnswer: val });
  };

  const handleQuestionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as QuestionType;
    const updates: Partial<QuizQuestion> = { questionType: newType };

    if (
      newType === 'matching' &&
      (!question.leftColumn || !question.rightColumn)
    ) {
      updates.leftColumn = ['Item 1', 'Item 2'];
      updates.rightColumn = ['Match 1', 'Match 2'];
      updates.options = undefined;
    } else if (newType === 'fill-blank') {
      updates.options = undefined;
      updates.correctAnswer = '';
    } else if (!question.options || question.options.length === 0) {
      if (newType === 'true-false') {
        updates.options = ['True', 'False'];
      } else {
        updates.options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
      }
    }

    onChange(updates);
  };

  const renderCorrectAnswerInput = () => {
    const { questionType, options, correctAnswer } = question;

    if (questionType === 'true-false' || questionType === 'single-select') {
      return (
        <div className="space-y-3">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Correct Option
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {options?.map((_, i) => {
              let label = String.fromCodePoint(65 + i);
              if (questionType === 'true-false') {
                label = i === 0 ? 'T' : 'F';
              }
              return (
                <button
                  key={`correct-${question.id}-${i}`}
                  type="button"
                  onClick={() => handleCorrectAnswerChange(i)}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-bold transition-all ${
                    correctAnswer === i
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (questionType === 'multi-select') {
      const selected = (correctAnswer as number[]) || [];
      return (
        <div className="space-y-3">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Correct Options (Select all)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {options?.map((_, i) => {
              const isActiveChoice = selected.includes(i);
              const label = String.fromCodePoint(65 + i);
              return (
                <button
                  key={`correct-multi-${question.id}-${i}`}
                  type="button"
                  onClick={() => {
                    const newSelected = isActiveChoice
                      ? selected.filter((val) => val !== i)
                      : [...selected, i];
                    handleCorrectAnswerChange(newSelected);
                  }}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-bold transition-all ${
                    isActiveChoice
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (questionType === 'fill-blank') {
      return (
        <div className="space-y-2">
          <label
            htmlFor={`correct-fill-${question.id}`}
            className="block text-sm font-bold text-gray-700 dark:text-gray-300"
          >
            Correct Answer
          </label>
          <input
            id={`correct-fill-${question.id}`}
            type="text"
            value={(correctAnswer as string) || ''}
            onChange={(e) => handleCorrectAnswerChange(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:border-primary-500 outline-none dark:text-white"
            placeholder="Type correct answer..."
          />
        </div>
      );
    }

    return (
      <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs">
        <AlertCircle className="w-4 h-4" />
        Correct answer configuration not supported for this type yet.
      </div>
    );
  };

  const typeStyle =
    typeStylesMap[question.questionType] || typeStylesMap['fill-blank'];

  return (
    <div
      className={`group rounded-xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-primary-500 bg-primary-50/10 dark:bg-primary-900/5 shadow-md'
          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="flex-shrink-0">
          <input
            id={`select-q-${question.id}`}
            type="checkbox"
            checked={isSelected}
            onChange={(e) => (e.target.checked ? onSelect() : onDeselect())}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
          />
        </div>

        <button
          onClick={handleToggle}
          className="flex-1 min-w-0 text-left focus:outline-none group/toggle"
          type="button"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Question {index + 1}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${typeStyle.bg} ${typeStyle.text}`}
            >
              {question.questionType.replace('-', ' ')}
            </span>
          </div>
          <h4 className="text-gray-900 dark:text-white font-medium truncate group-hover/toggle:text-primary-600 transition-colors">
            {question.question || (
              <span className="text-gray-400 italic">No question text</span>
            )}
          </h4>
        </button>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
            title="Duplicate"
            type="button"
          >
            <Files className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            title="Delete"
            type="button"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleToggle}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200"
          type="button"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Expanded Editor Content */}
      <div
        className={`transition-all duration-200 ${
          isExpanded
            ? 'max-h-[2000px] border-t border-gray-100 dark:border-gray-800'
            : 'max-h-0 overflow-hidden text-[0px]'
        }`}
      >
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-1.5">
                <label
                  htmlFor={`q-text-${question.id}`}
                  className="text-xs font-bold text-gray-500 uppercase tracking-wider"
                >
                  Question Text
                </label>
                <textarea
                  id={`q-text-${question.id}`}
                  value={question.question}
                  onChange={(e) => onChange({ question: e.target.value })}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:border-primary-500 transition-all outline-none dark:text-white text-lg font-medium min-h-[100px] resize-y"
                  placeholder="Enter your question here..."
                />
              </div>

              {question.questionType === 'matching' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Left Column
                    </span>
                    {(question.leftColumn || []).map((item, i) => (
                      <input
                        key={`left-${question.id}-${i}`}
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newCol = [...(question.leftColumn || [])];
                          newCol[i] = e.target.value;
                          onChange({ leftColumn: newCol });
                        }}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:border-primary-500 transition-all outline-none dark:text-white text-sm"
                        placeholder={`Item ${i + 1}`}
                      />
                    ))}
                  </div>
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Right Column (Matches)
                    </span>
                    {(question.rightColumn || []).map((item, i) => (
                      <input
                        key={`right-${question.id}-${i}`}
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newCol = [...(question.rightColumn || [])];
                          newCol[i] = e.target.value;
                          onChange({ rightColumn: newCol });
                        }}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:border-primary-500 transition-all outline-none dark:text-white text-sm"
                        placeholder={`Match ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ) : question.options ? (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Options
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {question.options.map((option, i) => {
                      const isCorrect = Array.isArray(question.correctAnswer)
                        ? question.correctAnswer.includes(i)
                        : question.correctAnswer === i;

                      return (
                        <div
                          key={`opt-container-${question.id}-${i}`}
                          className="flex items-center gap-2 group/opt"
                        >
                          <div
                            className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                            }`}
                          >
                            {String.fromCodePoint(65 + i)}
                          </div>
                          <input
                            key={`opt-input-${question.id}-${i}`}
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(question.options || [])];
                              newOptions[i] = e.target.value;
                              onChange({ options: newOptions });
                            }}
                            className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:border-primary-500 transition-all outline-none dark:text-white text-sm"
                            placeholder={`Option ${i + 1}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Config & Meta */}
            <div className="space-y-6 bg-gray-50/50 dark:bg-gray-800/20 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor={`q-type-${question.id}`}
                      className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
                    >
                      Question Type
                    </label>
                    <Select
                      id={`q-type-${question.id}`}
                      value={question.questionType}
                      onChange={(val) => {
                        const fakeEvent = {
                          target: { value: val },
                        } as React.ChangeEvent<HTMLSelectElement>;
                        handleQuestionTypeChange(fakeEvent);
                      }}
                      options={[
                        { label: 'Single Choice', value: 'single-select' },
                        { label: 'Multi Choice', value: 'multi-select' },
                        { label: 'True/False', value: 'true-false' },
                        { label: 'Matching', value: 'matching' },
                        { label: 'Fill in the Blank', value: 'fill-blank' },
                      ]}
                    />
                  </div>

                  {renderCorrectAnswerInput()}

                  <div>
                    <label
                      htmlFor={`q-expl-${question.id}`}
                      className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
                    >
                      Explanation
                    </label>
                    <textarea
                      id={`q-expl-${question.id}`}
                      value={question.explanation || ''}
                      onChange={(e) => onChange({ explanation: e.target.value })}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:border-primary-500 transition-all outline-none dark:text-white text-sm min-h-[80px] resize-y"
                      placeholder="Why is this answer correct?"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
