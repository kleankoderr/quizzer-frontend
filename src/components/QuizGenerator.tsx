import React, { useState } from 'react';
import type { QuizGenerateRequest, QuizType, QuestionType } from '../types';
import {
  Brain,
  Sparkles,
  BookOpen,
  FileText,
  Upload,
  ChevronDown,
  ChevronRight,
  Clock,
  Target,
  ListChecks,
  CheckSquare,
  CheckCircle,
  Link as LinkIcon,
  AlignLeft,
  LayoutList,
  Folder,
} from 'lucide-react';
import { FileSelector } from './FileSelector';
import { FileUpload } from './FileUpload';
import { StudyPackSelector } from './StudyPackSelector';
import { Toast as toast } from '../utils/toast';

interface QuizGeneratorProps {
  onGenerate: (request: QuizGenerateRequest, files?: File[]) => void;
  loading: boolean;
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

export const QuizGenerator: React.FC<QuizGeneratorProps> = ({
  onGenerate,
  loading,
  initialValues,
}) => {
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

  const toggleQuestionType = (type: QuestionType) => {
    setSelectedQuestionTypes((prev) => {
      if (prev.includes(type)) {
        return prev.length > 1 ? prev.filter((t) => t !== type) : prev;
      }
      return [...prev, type];
    });
  };

  // File handling functions removed as they are now handled by FileUpload component

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
      onGenerate({ ...request, topic });
    } else if (mode === 'content' && content.trim()) {
      onGenerate({ ...request, topic: content.substring(0, 50), content });
    } else if (mode === 'files') {
      if (files.length === 0 && selectedFileIds.length === 0) {
        toast.error('Please select or upload at least one file');
        return;
      }
      onGenerate({ ...request, selectedFileIds }, files);
    }
  };

  return (
    <div className="card border border-primary-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Brain className="w-6 h-6 text-primary-600" />
        </div>
        <h2
          id="quiz-generator-title"
          className="text-2xl font-bold text-gray-900 dark:text-white"
        >
          Generate New Quiz
        </h2>
      </div>

      {initialValues?.sourceTitle && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl shadow-sm">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex-shrink-0 p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 mb-0.5">
                Generating quiz from study material
              </p>
              <p className="text-sm sm:text-base md:text-lg font-bold text-blue-900 dark:text-blue-100 break-words">
                {initialValues.sourceTitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {!initialValues?.sourceTitle && (
        <div
          id="quiz-mode-tabs"
          className="grid grid-cols-3 md:flex md:gap-2 mb-6 md:mb-8 border-b-0 md:border-b-2 border-gray-200 dark:border-gray-700"
        >
          <button
            type="button"
            onClick={() => setMode('topic')}
            className={`px-2 md:px-6 py-3 font-semibold transition-all rounded-lg md:rounded-none md:rounded-t-lg border-b-0 md:border-b-3 -mb-0 md:-mb-0.5 flex flex-col md:flex-row items-center justify-center gap-2 ${
              mode === 'topic'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 md:border-primary-600 dark:md:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 md:border-transparent'
            }`}
          >
            <Sparkles className="w-5 h-5 md:w-5 md:h-5" />
            <span className="text-xs md:text-base">
              <span className="md:hidden">Topic</span>
              <span className="hidden md:inline">From Topic</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode('content')}
            className={`px-2 md:px-6 py-3 font-semibold transition-all rounded-lg md:rounded-none md:rounded-t-lg border-b-0 md:border-b-3 -mb-0 md:-mb-0.5 flex flex-col md:flex-row items-center justify-center gap-2 ${
              mode === 'content'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 md:border-primary-600 dark:md:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 md:border-transparent'
            }`}
          >
            <FileText className="w-5 h-5 md:w-5 md:h-5" />
            <span className="text-xs md:text-base">
              <span className="md:hidden">Content</span>
              <span className="hidden md:inline">From Content</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode('files')}
            className={`px-2 md:px-6 py-3 font-semibold transition-all rounded-lg md:rounded-none md:rounded-t-lg border-b-0 md:border-b-3 -mb-0 md:-mb-0.5 flex flex-col md:flex-row items-center justify-center gap-2 ${
              mode === 'files'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 md:border-primary-600 dark:md:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 md:border-transparent'
            }`}
          >
            <Upload className="w-5 h-5 md:w-5 md:h-5" />
            <span className="text-xs md:text-base">
              <span className="md:hidden">Docs</span>
              <span className="hidden md:inline">From Documents</span>
            </span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'topic' && (
          <div>
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Topic
            </label>
            <input
              id="quiz-topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                initialValues?.sourceTitle
                  ? 'Topic from study material'
                  : 'e.g., World War II, Photosynthesis, Python Programming'
              }
              className="input-field"
              required
              maxLength={200}
              readOnly={!!initialValues?.sourceTitle}
              disabled={!!initialValues?.sourceTitle}
            />
            {initialValues?.sourceTitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                Topic is set from your study material and cannot be changed
              </p>
            )}
          </div>
        )}

        {mode === 'content' && (
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your study notes, article, or any text content here..."
              className="input-field min-h-[200px] resize-y"
              required
              maxLength={1500}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              The system will analyze your content and generate relevant
              questions
            </p>
          </div>
        )}

        {mode === 'files' && (
          <div className="space-y-4">
            {/* Collapsible Existing Files Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  if (!showExistingFiles) setShowUpload(false);
                  setShowExistingFiles(!showExistingFiles);
                }}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-primary-600" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Select Existing Files
                  </span>
                  {selectedFileIds.length > 0 && (
                    <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs px-2 py-0.5 rounded-full font-bold">
                      {selectedFileIds.length}
                    </span>
                  )}
                </div>
                {showExistingFiles ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {showExistingFiles && (
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <FileSelector
                    selectedFileIds={selectedFileIds}
                    onSelectionChange={setSelectedFileIds}
                    maxFiles={5}
                    hideIfEmpty={false}
                  />
                </div>
              )}
            </div>

            {/* Collapsible Upload Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  if (!showUpload) setShowExistingFiles(false);
                  setShowUpload(!showUpload);
                }}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary-600" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Upload New Files
                  </span>
                  {files.length > 0 && (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs px-2 py-0.5 rounded-full font-bold">
                      {files.length}
                    </span>
                  )}
                </div>
                {showUpload ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {showUpload && (
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <FileUpload
                    files={files}
                    onFilesChange={setFiles}
                    maxFiles={5}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div
            id="quiz-questions-config"
            className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <label
                htmlFor="questions"
                className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"
              >
                <LayoutList className="w-4 h-4 text-primary-600" />
                Number of Questions
              </label>
              <span className="text-2xl font-bold text-primary-600">
                {numberOfQuestions}
              </span>
            </div>
            <input
              id="questions"
              type="range"
              min="3"
              max="20"
              value={numberOfQuestions}
              onChange={(e) =>
                setNumberOfQuestions(Number.parseInt(e.target.value))
              }
              className="w-full accent-primary-600 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs font-medium text-gray-400 mt-2">
              <span>3 questions</span>
              <span>20 questions</span>
            </div>
          </div>

          <div id="quiz-difficulty-config">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Difficulty Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                    difficulty === level
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700/50 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-1 h-1.5 w-12 mb-1">
                      <div
                        className={`flex-1 rounded-full ${
                          level === 'easy' ||
                          level === 'medium' ||
                          level === 'hard'
                            ? 'bg-primary-500'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                      <div
                        className={`flex-1 rounded-full ${
                          level === 'medium' || level === 'hard'
                            ? 'bg-primary-500'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                      <div
                        className={`flex-1 rounded-full ${
                          level === 'hard'
                            ? 'bg-primary-500'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    </div>
                    <span
                      className={`font-bold ${
                        difficulty === level
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div id="quiz-format-config">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Quiz Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'standard',
                  label: 'Standard',
                  icon: ListChecks,
                  desc: 'Untimed practice',
                },
                {
                  id: 'timed',
                  label: 'Timed',
                  icon: Clock,
                  desc: 'Speed challenge',
                },
                {
                  id: 'scenario',
                  label: 'Scenario',
                  icon: Target,
                  desc: 'Real-world application',
                },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setQuizType(type.id as QuizType)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                    quizType === type.id
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700/50 bg-white dark:bg-gray-800'
                  }`}
                >
                  <type.icon
                    className={`w-6 h-6 mb-3 ${
                      quizType === type.id
                        ? 'text-primary-600'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  />
                  <div className="font-bold text-gray-900 dark:text-white mb-0.5">
                    {type.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {type.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {quizType === 'timed' && (
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-5 border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center justify-between mb-4">
                <label
                  htmlFor="timeLimit"
                  className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Time Limit
                </label>
                <div className="font-mono text-lg font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-blue-900/50 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                  {Math.floor(timeLimit / 60)}:
                  {(timeLimit % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <input
                id="timeLimit"
                type="range"
                min="60"
                max="3600"
                step="60"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number.parseInt(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-blue-200 dark:bg-blue-900/50 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs font-medium text-blue-400/80 mt-2">
                <span>1 min</span>
                <span>60 min</span>
              </div>
            </div>
          )}

          <div id="quiz-types-config">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Included Question Types
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                {
                  id: 'single-select',
                  label: 'Single Choice',
                  icon: CheckCircle,
                },
                {
                  id: 'multi-select',
                  label: 'Multi Choice',
                  icon: CheckSquare,
                },
                { id: 'true-false', label: 'True/False', icon: CheckSquare },
                { id: 'matching', label: 'Matching', icon: LinkIcon },
                { id: 'fill-blank', label: 'Fill Blanks', icon: AlignLeft },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => toggleQuestionType(type.id as QuestionType)}
                  className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                    selectedQuestionTypes.includes(type.id as QuestionType)
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700/50 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    <type.icon
                      className={`w-5 h-5 ${
                        selectedQuestionTypes.includes(type.id as QuestionType)
                          ? 'text-primary-600'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-bold block ${
                      selectedQuestionTypes.includes(type.id as QuestionType)
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
            {selectedQuestionTypes.length === 0 && (
              <p className="text-xs text-red-500 mt-2 font-medium">
                * Please select at least one question type
              </p>
            )}
          </div>

          <div id="quiz-study-set-config">
            <StudyPackSelector
              value={selectedStudyPackId}
              onChange={setSelectedStudyPackId}
            />
          </div>
        </div>

        <button
          id="quiz-generate-btn"
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 sm:py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md text-base sm:text-lg touch-manipulation"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Quiz
            </>
          )}
        </button>
      </form>
    </div>
  );
};
