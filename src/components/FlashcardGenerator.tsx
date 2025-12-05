import { useState, useRef, useEffect } from "react";
import type { FlashcardGenerateRequest } from "../types";
import { Layers, Sparkles, FileText, Upload } from "lucide-react";

interface FlashcardGeneratorProps {
  onGenerate: (request: FlashcardGenerateRequest, files?: File[]) => void;
  loading: boolean;
  initialValues?: {
    topic?: string;
    content?: string;
    mode?: "topic" | "content" | "files";
    contentId?: string;
  };
}

export const FlashcardGenerator: React.FC<FlashcardGeneratorProps> = ({
  onGenerate,
  loading,
  initialValues,
}) => {
  const [mode, setMode] = useState<"topic" | "content" | "files">("topic");
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [numberOfCards, setNumberOfCards] = useState(10);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValues) {
      if (initialValues.topic) setTopic(initialValues.topic);
      if (initialValues.content) setContent(initialValues.content);
      if (initialValues.mode) setMode(initialValues.mode);
    }
  }, [initialValues]);

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
    const contentId = initialValues?.contentId;

    if (mode === "topic" && topic.trim()) {
      onGenerate({ topic, numberOfCards, contentId });
    } else if (mode === "content" && content.trim()) {
      onGenerate({ content, numberOfCards, contentId });
    } else if (mode === "files" && files.length > 0) {
      onGenerate({ numberOfCards, contentId }, files);
    }
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
          <Layers className="w-6 h-6 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Generate New Flashcard Set
        </h2>
      </div>

      <div className="grid grid-cols-3 md:flex md:gap-2 mb-6 md:mb-8 border-b-0 md:border-b-2 border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setMode("topic")}
          className={`px-2 md:px-6 py-3 font-semibold transition-all rounded-lg md:rounded-none md:rounded-t-lg border-b-0 md:border-b-3 -mb-0 md:-mb-0.5 flex flex-col md:flex-row items-center justify-center gap-2 ${
            mode === "topic"
              ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 md:border-primary-600 dark:md:border-primary-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 md:border-transparent"
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
          onClick={() => setMode("content")}
          className={`px-2 md:px-6 py-3 font-semibold transition-all rounded-lg md:rounded-none md:rounded-t-lg border-b-0 md:border-b-3 -mb-0 md:-mb-0.5 flex flex-col md:flex-row items-center justify-center gap-2 ${
            mode === "content"
              ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 md:border-primary-600 dark:md:border-primary-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 md:border-transparent"
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
          onClick={() => setMode("files")}
          className={`px-2 md:px-6 py-3 font-semibold transition-all rounded-lg md:rounded-none md:rounded-t-lg border-b-0 md:border-b-3 -mb-0 md:-mb-0.5 flex flex-col md:flex-row items-center justify-center gap-2 ${
            mode === "files"
              ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 md:border-primary-600 dark:md:border-primary-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 md:border-transparent"
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
        {mode === "topic" ? (
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
        ) : mode === "content" ? (
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
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
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
                <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                  Drop PDF files here or click to browse
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                        {file.type === "application/pdf" ? (
                          <svg
                            className="h-8 w-8 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h10l4 4v16H2v-1z" />
                          </svg>
                        ) : (
                          <svg
                            className="h-8 w-8 text-blue-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h10l4 4v16H2v-1z" />
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
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="cards"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Number of Cards: {numberOfCards}
          </label>
          <input
            id="cards"
            type="range"
            min="5"
            max="30"
            value={numberOfCards}
            onChange={(e) => setNumberOfCards(Number.parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5</span>
            <span>30</span>
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
