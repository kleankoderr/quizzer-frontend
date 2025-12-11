import { useState, useEffect } from 'react';
import type { FlashcardGenerateRequest } from '../types';
import {
  Layers,
  Sparkles,
  FileText,
  Upload,
  ChevronDown,
  ChevronRight,
  LayoutList,
} from 'lucide-react';
import { FileSelector } from './FileSelector';
import { FileUpload } from './FileUpload';
import toast from 'react-hot-toast';

interface FlashcardGeneratorProps {
  onGenerate: (request: FlashcardGenerateRequest, files?: File[]) => void;
  loading: boolean;
  initialValues?: {
    topic?: string;
    content?: string;
    mode?: 'topic' | 'content' | 'files';
    contentId?: string;
  };
}

export const FlashcardGenerator: React.FC<FlashcardGeneratorProps> = ({
  onGenerate,
  loading,
  initialValues,
}) => {
  const [mode, setMode] = useState<'topic' | 'content' | 'files'>('topic');
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');

  const [files, setFiles] = useState<File[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [numberOfCards, setNumberOfCards] = useState(10);

  useEffect(() => {
    if (initialValues) {
      if (initialValues.topic) setTopic(initialValues.topic);
      if (initialValues.content) setContent(initialValues.content);
      if (initialValues.mode) setMode(initialValues.mode);
    }
  }, [initialValues]);

  // File handling functions removed as they are now handled by FileUpload component

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const contentId = initialValues?.contentId;

    if (mode === 'topic' && topic.trim()) {
      onGenerate({ topic, numberOfCards, contentId });
    } else if (mode === 'content' && content.trim()) {
      onGenerate({ content, numberOfCards, contentId });
    } else if (mode === 'files') {
      if (files.length === 0 && selectedFileIds.length === 0) {
        toast.error('Please select or upload at least one file');
        return;
      }
      onGenerate({ numberOfCards, contentId, selectedFileIds }, files);
    }
  };



  return (
    <div className="card border border-primary-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Layers className="w-6 h-6 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Generate New Flashcard Set
        </h2>
      </div>

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
        {mode === 'topic' ? (
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
              placeholder="e.g., French Vocabulary, Chemistry Formulas"
              className="input-field"
              required
            />
          </div>
        ) : mode === 'content' ? (
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
              placeholder="Paste your notes, article, or any text content here..."
              className="input-field min-h-[200px] resize-y"
              required
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              The system will extract key concepts and create flashcards
              automatically
            </p>
          </div>
        ) : (
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

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <label
              htmlFor="cards"
              className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"
            >
              <LayoutList className="w-4 h-4 text-primary-600" />
              Number of Cards
            </label>
            <span className="text-2xl font-bold text-primary-600">
              {numberOfCards}
            </span>
          </div>
          <input
            id="cards"
            type="range"
            min="5"
            max="30"
            value={numberOfCards}
            onChange={(e) => setNumberOfCards(Number.parseInt(e.target.value))}
            className="w-full accent-primary-600 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs font-medium text-gray-400 mt-2">
            <span>5 cards</span>
            <span>30 cards</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Flashcards
            </>
          )}
        </button>
      </form>
    </div>
  );
};
