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
  const [timeLimit, setTimeLimit] = useState(300); // 5 minutes default
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
        // Must have at least one type selected
        return prev.length > 1 ? prev.filter((t) => t !== type) : prev;
      }
      return [...prev, type];
    });
  };

  const questionTypeLabels: Record<QuestionType, string> = {
    'true-false': 'True/False',
    'single-select': 'Single Select',
    'multi-select': 'Multi Select',
    matching: 'Matching',
    'fill-blank': 'Fill in the Blank',
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

        <div>
          <label
            htmlFor="questions"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Number of Questions: {numberOfQuestions}
          </label>
          <input
            id="questions"
            type="range"
            min="3"
            max="20"
            value={numberOfQuestions}
            onChange={(e) =>
              setNumberOfQuestions(Number.parseInt(e.target.value))
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>3</span>
            <span>20</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {(['easy', 'medium', 'hard'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`w-full flex items-center justify-center py-2 px-2 sm:px-4 rounded-lg border-2 text-sm sm:text-base transition-colors ${
                  difficulty === level
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quiz Type
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {(['standard', 'timed', 'scenario'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setQuizType(type)}
                className={`w-full flex items-center justify-center py-2 px-2 sm:px-4 rounded-lg border-2 text-sm sm:text-base transition-colors ${
                  quizType === type
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {quizType === 'standard' &&
              'Standard quiz with no time constraints'}
            {quizType === 'timed' && 'Quiz with a time limit to complete'}
            {quizType === 'scenario' && 'Real-world scenario-based questions'}
          </div>
        </div>

        {quizType === 'timed' && (
          <div>
            <label
              htmlFor="timeLimit"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Time Limit: {Math.floor(timeLimit / 60)}:
              {(timeLimit % 60).toString().padStart(2, '0')}
            </label>
            <input
              id="timeLimit"
              type="range"
              min="60"
              max="3600"
              step="60"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number.parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 min</span>
              <span>60 min</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Question Types
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {(Object.keys(questionTypeLabels) as QuestionType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleQuestionType(type)}
                className={`py-2 px-4 rounded-lg border-2 text-sm transition-colors ${
                  selectedQuestionTypes.includes(type)
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                {questionTypeLabels[type]}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Select at least one question type. Questions will be distributed
            evenly.
          </p>
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
