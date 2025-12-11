import { useState, useRef } from 'react';
import type { QuizGenerateRequest, QuizType, QuestionType } from '../types';
import {
  Brain,
  Sparkles,
  BookOpen,
  FileText,
  Upload,
  ChevronDown,
  ChevronRight,
  X,
  Clock,
  Target,
  ListChecks,
  CheckSquare,
  CheckCircle,
  Link as LinkIcon,
  AlignLeft,
  LayoutList,
} from 'lucide-react';
import { FileSelector } from './FileSelector';
import toast from 'react-hot-toast';

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
  const [topic, setTopic] = useState(initialValues?.topic || '');
  const [content, setContent] = useState(initialValues?.content || '');
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    'medium'
  );
  const [quizType, setQuizType] = useState<QuizType>('standard');
  const [timeLimit, setTimeLimit] = useState(300);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<
    QuestionType[]
  >(['single-select', 'true-false']);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

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

  const toggleQuestionType = (type: QuestionType) => {
    setSelectedQuestionTypes((prev) => {
      if (prev.includes(type)) {
        return prev.length > 1 ? prev.filter((t) => t !== type) : prev;
      }
      return [...prev, type];
    });
  };



  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="card border border-primary-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Brain className="w-6 h-6 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Generate New Quiz
        </h2>
      </div>

      {initialValues?.sourceTitle && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 text-blue-800">
          <BookOpen className="w-5 h-5" />
          <span className="font-medium">Generating from content:</span>
          <span className="font-bold">{initialValues.sourceTitle}</span>
        </div>
      )}

      <div className="grid grid-cols-3 md:flex md:gap-2 mb-6 md:mb-8 border-b-0 md:border-b-2 border-gray-200 dark:border-gray-700">
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
            <span className="md:hidden">Files</span>
            <span className="hidden md:inline">From Files</span>
          </span>
        </button>
      </div>

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
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., World War II, Photosynthesis, Python Programming"
              className="input-field"
              required
            />
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
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              The system will analyze your content and generate relevant
              questions
            </p>
          </div>
        )}

        {mode === 'files' && (
          <div className="space-y-4">
            {/* File Selector */}
            <FileSelector
              selectedFileIds={selectedFileIds}
              onSelectionChange={setSelectedFileIds}
              maxFiles={5}
              className="mb-4"
              hideIfEmpty={true}
            />

            {/* Collapsible Upload Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowUpload(!showUpload)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary-600" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Upload New Files
                  </span>
                </div>
                {showUpload ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {showUpload && (
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-3 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div>
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400 mb-1">
                        Click to upload
                      </p>
                      <p className="text-gray-600 dark:text-gray-100 mb-2">
                        or drag and drop PDF files
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Maximum 5 files, 5MB each
                      </p>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept="application/pdf,.pdf"
                    multiple
                    className="hidden"
                  />

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Selected files ({files.length})
                      </p>
                      {files.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              <FileText className="h-8 w-8 text-primary-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="ml-4 p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
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

          <div>
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

          <div>
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

          <div>
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
        </div>

        <button
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
