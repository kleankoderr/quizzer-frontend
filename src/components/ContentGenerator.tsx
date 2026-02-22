import React, { useCallback, useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Folder, Info, Sparkles, Upload } from 'lucide-react';
import { FileSelector } from './FileSelector';
import { FileUpload } from './FileUpload';
import { StudyPackSelector } from './StudyPackSelector';
import { InputError } from './InputError';
import { usePopularTopics } from '../hooks';
import type { GenerateContentDto } from '../services/content.service';

export interface ContentGeneratorProps {
  onGenerate: (dto: GenerateContentDto, files?: File[]) => void | Promise<void>;
  loading: boolean;
  /** Show study pack selector (e.g. hide for admin) */
  showStudyPackSelector?: boolean;
  /** Extra fields rendered above the generate button in each tab (e.g. scope, school for admin) */
  extraFields?: React.ReactNode;
  /** Title for the generator card */
  title?: string;
  /** Subtitle */
  subtitle?: string;
}

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  onGenerate,
  loading,
  showStudyPackSelector = true,
  extraFields,
  title = 'Generate Study Materials',
  subtitle = 'Choose your preferred method to create content',
}) => {
  const [activeTab, setActiveTab] = useState<'topic' | 'text' | 'file'>('topic');
  const [topic, setTopic] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [textTopic, setTextTopic] = useState('');
  const [textContent, setTextContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [selectedStudyPackId, setSelectedStudyPackId] = useState('');
  const [isCreatingStudyPack, setIsCreatingStudyPack] = useState(false);
  const [showStudyPackError, setShowStudyPackError] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showExistingFiles, setShowExistingFiles] = useState(false);

  const { data: popularTopics = [] } = usePopularTopics();

  const handleGenerateFromTopic = useCallback(async () => {
    if (showStudyPackSelector && isCreatingStudyPack) {
      setShowStudyPackError(true);
      return;
    }
    setShowStudyPackError(false);
    if (!topic.trim()) return;
    const dto: GenerateContentDto = {
      topic: topic.trim(),
      studyPackId: showStudyPackSelector ? selectedStudyPackId || undefined : undefined,
    };
    await onGenerate(dto);
  }, [topic, selectedStudyPackId, isCreatingStudyPack, showStudyPackSelector, onGenerate]);

  const handleCreateFromText = useCallback(async () => {
    if (showStudyPackSelector && isCreatingStudyPack) {
      setShowStudyPackError(true);
      return;
    }
    setShowStudyPackError(false);
    if (!textContent.trim()) return;
    const dto: GenerateContentDto = {
      content: textContent.trim(),
      title: textTitle.trim() || undefined,
      topic: textTopic.trim() || undefined,
      studyPackId: showStudyPackSelector ? selectedStudyPackId || undefined : undefined,
    };
    await onGenerate(dto);
  }, [textTitle, textContent, textTopic, selectedStudyPackId, isCreatingStudyPack, showStudyPackSelector, onGenerate]);

  const handleFileUpload = useCallback(async () => {
    if (showStudyPackSelector && isCreatingStudyPack) {
      setShowStudyPackError(true);
      return;
    }
    setShowStudyPackError(false);
    if (files.length === 0 && selectedFileIds.length === 0) return;
    const dto: GenerateContentDto = {
      selectedFileIds: selectedFileIds.length ? selectedFileIds : undefined,
      studyPackId: showStudyPackSelector ? selectedStudyPackId || undefined : undefined,
    };
    await onGenerate(dto, files.length ? files : undefined);
  }, [files, selectedFileIds, selectedStudyPackId, isCreatingStudyPack, showStudyPackSelector, onGenerate]);

  const uploadButtonLabel =
    files.length > 0 || selectedFileIds.length > 0
      ? `${files.length + selectedFileIds.length} Document(s)`
      : 'Process Documents';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-primary-100 to-blue-100 dark:from-primary-900/30 dark:to-blue-900/30 rounded-xl">
          <Sparkles className="w-7 h-7 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 md:flex md:gap-2 mb-6 md:mb-8 border-b-0 md:border-b-2 border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('topic')}
          className={`px-2 md:px-6 py-3 font-semibold transition-all rounded-lg md:rounded-none md:rounded-t-lg border-b-0 md:border-b-3 flex flex-col md:flex-row items-center justify-center gap-2 ${
            activeTab === 'topic'
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 md:border-primary-600'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 md:border-transparent'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-xs md:text-base">From Topic</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`px-2 md:px-6 py-3 font-semibold transition-all rounded-lg md:rounded-none md:rounded-t-lg border-b-0 md:border-b-3 flex flex-col md:flex-row items-center justify-center gap-2 ${
            activeTab === 'text'
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 md:border-primary-600'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 md:border-transparent'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-xs md:text-base">From Text</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('file')}
          className={`px-2 md:px-6 py-3 font-semibold transition-all rounded-lg md:rounded-none md:rounded-t-lg border-b-0 md:border-b-3 flex flex-col md:flex-row items-center justify-center gap-2 ${
            activeTab === 'file'
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 md:border-primary-600'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 md:border-transparent'
          }`}
        >
          <Upload className="w-5 h-5" />
          <span className="text-xs md:text-base">From Documents</span>
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'topic' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                What topic do you want to learn about?
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Photosynthesis, World War II, Python Programming"
                className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg transition-all"
                maxLength={200}
              />
            </div>
            {popularTopics.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Popular topics:</p>
                <div className="flex flex-wrap gap-2">
                  {popularTopics.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className="px-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-primary-400 rounded-full text-sm font-medium transition-all"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {showStudyPackSelector && (
              <>
                <StudyPackSelector
                  value={selectedStudyPackId}
                  onChange={(val) => { setSelectedStudyPackId(val); setShowStudyPackError(false); }}
                  onCreationModeChange={(v) => { setIsCreatingStudyPack(v); if (!v) setShowStudyPackError(false); }}
                  className="mb-6"
                />
                <InputError message={showStudyPackError ? 'Please create or cancel the study set before generating content' : null} />
              </>
            )}
            {extraFields}
            <button
              type="button"
              onClick={handleGenerateFromTopic}
              disabled={loading || !topic.trim()}
              className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg text-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Generate Study Content
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Title (Optional)</label>
              <input
                type="text"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="Enter content title (auto-generated if empty)"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 transition-all"
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Topic (Optional)</label>
              <input
                type="text"
                value={textTopic}
                onChange={(e) => setTextTopic(e.target.value)}
                placeholder="e.g., Science, History"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 transition-all"
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Content</label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste your study material here..."
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 resize-none h-40 md:h-64"
                maxLength={1500}
              />
            </div>
            {showStudyPackSelector && (
              <>
                <StudyPackSelector
                  value={selectedStudyPackId}
                  onChange={(val) => { setSelectedStudyPackId(val); setShowStudyPackError(false); }}
                  onCreationModeChange={(v) => { setIsCreatingStudyPack(v); if (!v) setShowStudyPackError(false); }}
                  className="mb-6"
                />
                <InputError message={showStudyPackError ? 'Please create or cancel the study set before generating content' : null} />
              </>
            )}
            {extraFields}
            <button
              type="button"
              onClick={handleCreateFromText}
              disabled={loading || !textContent.trim()}
              className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg text-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Generate Study Content
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === 'file' && (
          <div className="space-y-6">
            <div className="bg-blue-50/30 dark:bg-gray-800/30 p-4 rounded-xl border border-blue-100 dark:border-gray-700">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Upload or Select Documents</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload new PDF files or select from your previously uploaded files.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => { if (!showExistingFiles) setShowUpload(false); setShowExistingFiles(!showExistingFiles); }}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-primary-600" />
                  <span className="font-semibold text-gray-900 dark:text-white">Select Existing Documents</span>
                  {selectedFileIds.length > 0 && (
                    <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-xs px-2 py-0.5 rounded-full font-bold">
                      {selectedFileIds.length}
                    </span>
                  )}
                </div>
                {showExistingFiles ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
              </button>
              {showExistingFiles && (
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <FileSelector selectedFileIds={selectedFileIds} onSelectionChange={setSelectedFileIds} maxFiles={5} hideIfEmpty={false} />
                </div>
              )}
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => { if (!showUpload) setShowExistingFiles(false); setShowUpload(!showUpload); }}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary-600" />
                  <span className="font-semibold text-gray-900 dark:text-white">Upload New Documents</span>
                  {files.length > 0 && (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-600 text-xs px-2 py-0.5 rounded-full font-bold">
                      {files.length}
                    </span>
                  )}
                </div>
                {showUpload ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
              </button>
              {showUpload && (
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <FileUpload files={files} onFilesChange={setFiles} maxFiles={5} />
                </div>
              )}
            </div>

            {showStudyPackSelector && (
              <>
                <StudyPackSelector
                  value={selectedStudyPackId}
                  onChange={(val) => { setSelectedStudyPackId(val); setShowStudyPackError(false); }}
                  onCreationModeChange={(v) => { setIsCreatingStudyPack(v); if (!v) setShowStudyPackError(false); }}
                  className="mb-6"
                />
                <InputError message={showStudyPackError ? 'Please create or cancel the study set before processing documents' : null} />
              </>
            )}
            {extraFields}
            <button
              type="button"
              onClick={handleFileUpload}
              disabled={loading || (files.length === 0 && selectedFileIds.length === 0)}
              className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg text-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6" />
                  {uploadButtonLabel}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
