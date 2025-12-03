import { useState, useRef } from 'react';
import type { QuizGenerateRequest, QuizType, QuestionType } from '../types';
import { Brain, Sparkles, BookOpen } from 'lucide-react';

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

export const QuizGenerator: React.FC<QuizGeneratorProps> = ({ onGenerate, loading, initialValues }) => {
  const [mode, setMode] = useState<'topic' | 'content' | 'files'>(initialValues?.mode || 'topic');
  const [topic, setTopic] = useState(initialValues?.topic || '');
  const [content, setContent] = useState(initialValues?.content || '');
  const [files, setFiles] = useState<File[]>([]);
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizType, setQuizType] = useState<QuizType>('standard');
  const [timeLimit, setTimeLimit] = useState(300); // 5 minutes default
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>(['single-select', 'true-false']);
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
      questionTypes: selectedQuestionTypes.length > 0 ? selectedQuestionTypes : undefined,
      contentId: initialValues?.contentId
    };

    if (mode === 'topic' && topic.trim()) {
      onGenerate({ ...request, topic });
    } else if (mode === 'content' && content.trim()) {
      onGenerate({ ...request, topic: content.substring(0, 50), content });
    } else if (mode === 'files' && files.length > 0) {
      onGenerate(request, files);
    }
  };

  const toggleQuestionType = (type: QuestionType) => {
    setSelectedQuestionTypes(prev => {
      if (prev.includes(type)) {
        // Must have at least one type selected
        return prev.length > 1 ? prev.filter(t => t !== type) : prev;
      }
      return [...prev, type];
    });
  };

  const questionTypeLabels: Record<QuestionType, string> = {
    'true-false': 'True/False',
    'single-select': 'Single Select',
    'multi-select': 'Multi Select',
    'matching': 'Matching',
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Generate New Quiz</h2>
      </div>

      {initialValues?.sourceTitle && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 text-blue-800">
          <BookOpen className="w-5 h-5" />
          <span className="font-medium">Generating from content:</span>
          <span className="font-bold">{initialValues.sourceTitle}</span>
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => setMode('topic')}
          className={`px-4 md:px-6 py-3 font-semibold transition-all rounded-t-lg whitespace-nowrap ${
            mode === 'topic'
              ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          From Topic
        </button>
        <button
          type="button"
          onClick={() => setMode('content')}
          className={`px-4 md:px-6 py-3 font-semibold transition-all rounded-t-lg whitespace-nowrap ${
            mode === 'content'
              ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          From Content
        </button>
        <button
          type="button"
          onClick={() => setMode('files')}
          className={`px-4 md:px-6 py-3 font-semibold transition-all rounded-t-lg whitespace-nowrap ${
            mode === 'files'
              ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          From Files
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'topic' && (
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              AI will analyze your content and generate relevant questions
            </p>
          </div>
        )}

        {mode === 'files' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Files
            </label>
            
            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900">
                  Drop PDF files here or click to browse
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF files only (max 5MB each, up to 5 files)
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
                        {file.type === 'application/pdf' ? (
                          <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h10l4 4v16H2v-1z"/>
                          </svg>
                        ) : (
                          <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h10l4 4v16H2v-1z"/>
                          </svg>
                        )}
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
                      className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <label htmlFor="questions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Number of Questions: {numberOfQuestions}
          </label>
          <input
            id="questions"
            type="range"
            min="3"
            max="20"
            value={numberOfQuestions}
            onChange={(e) => setNumberOfQuestions(Number.parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>3</span>
            <span>20</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {(['easy', 'medium', 'hard'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quiz Type</label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {(['standard', 'timed', 'scenario'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setQuizType(type)}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
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
            {quizType === 'standard' && 'Standard quiz with no time constraints'}
            {quizType === 'timed' && 'Quiz with a time limit to complete'}
            {quizType === 'scenario' && 'Real-world scenario-based questions'}
          </div>
        </div>

        {quizType === 'timed' && (
          <div>
            <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Limit: {Math.floor(timeLimit / 60)}:{(timeLimit % 60).toString().padStart(2, '0')}
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
            Select at least one question type. Questions will be distributed evenly.
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
