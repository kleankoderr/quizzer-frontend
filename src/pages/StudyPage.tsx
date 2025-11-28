import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { contentService } from '../services';
import { Sparkles, FileText, Upload, Plus, BookOpen, Zap } from 'lucide-react';

export const StudyPage = () => {
  const navigate = useNavigate();
  
  // Content creation states
  const [activeTab, setActiveTab] = useState<'topic' | 'text' | 'file'>('topic');
  const [topic, setTopic] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [textTopic, setTextTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  const handleGenerateFromTopic = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setContentLoading(true);
    try {
      const content = await contentService.generateFromTopic(topic);
      toast.success('Content generated successfully!');
      navigate(`/content/${content.id}`);
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setContentLoading(false);
    }
  };

  const handleCreateFromText = async () => {
    if (!textTitle.trim() || !textContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setContentLoading(true);
    try {
      const content = await contentService.createFromText({
        title: textTitle,
        content: textContent,
        topic: textTopic || 'General',
      });
      toast.success('Content created successfully!');
      navigate(`/content/${content.id}`);
    } catch (error) {
      console.error('Error creating content:', error);
      toast.error('Failed to create content. Please try again.');
    } finally {
      setContentLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setContentLoading(true);
    try {
      const content = await contentService.createFromFile(file);
      toast.success('File uploaded and processed successfully!');
      navigate(`/content/${content.id}`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setContentLoading(false);
    }
  };

  const popularTopics = [
    'Mathematics', 'Science', 'History', 'Literature', 'Geography', 
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art'
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-600 via-primary-700 to-blue-700 p-8 md:p-10 shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <span className="text-yellow-300 font-semibold text-lg">Study Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Create Your Study Content
          </h1>
          <p className="text-primary-100 text-lg md:text-xl max-w-2xl">
            Transform any topic, text, or document into interactive learning materials powered by AI
          </p>
        </div>
      </header>

      {/* Content Creation Card */}
      <div className="card shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-primary-100 to-blue-100 rounded-xl">
            <Sparkles className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Generate Study Materials</h2>
            <p className="text-sm text-gray-600">Choose your preferred method to create content</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('topic')}
            className={`px-6 py-3 font-semibold transition-all border-b-3 -mb-0.5 ${
              activeTab === 'topic'
                ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>From Topic</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-6 py-3 font-semibold transition-all border-b-3 -mb-0.5 ${
              activeTab === 'text'
                ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span>From Text</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`px-6 py-3 font-semibold transition-all border-b-3 -mb-0.5 ${
              activeTab === 'file'
                ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              <span>From File</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'topic' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-primary-50 p-6 rounded-xl border border-primary-200">
                <div className="flex items-start gap-3 mb-4">
                  <Zap className="w-6 h-6 text-primary-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Generation</h3>
                    <p className="text-sm text-gray-600">
                      Enter any topic and our AI will generate comprehensive study materials including summaries, key points, and practice questions.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  What topic do you want to learn about?
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis, World War II, Python Programming"
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !contentLoading) {
                      handleGenerateFromTopic();
                    }
                  }}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Popular topics:</p>
                <div className="flex flex-wrap gap-2">
                  {popularTopics.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className="px-4 py-2 bg-white border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50 text-gray-700 hover:text-primary-700 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateFromTopic}
                disabled={contentLoading || !topic.trim()}
                className="w-full px-8 py-4 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:shadow-none text-lg"
              >
                {contentLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Generating Content...
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
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
                <div className="flex items-start gap-3 mb-4">
                  <FileText className="w-6 h-6 text-purple-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Create from Your Notes</h3>
                    <p className="text-sm text-gray-600">
                      Paste your study materials, lecture notes, or any text content. We'll process it into structured learning materials.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="Enter content title"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Topic (Optional)</label>
                <input
                  type="text"
                  value={textTopic}
                  onChange={(e) => setTextTopic(e.target.value)}
                  placeholder="e.g., Science, History"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste your study material here..."
                  rows={10}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all"
                />
              </div>

              <button
                onClick={handleCreateFromText}
                disabled={contentLoading || !textTitle.trim() || !textContent.trim()}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:shadow-none text-lg"
              >
                {contentLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Creating Content...
                  </>
                ) : (
                  <>
                    <Plus className="w-6 h-6" />
                    Create Study Content
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                <div className="flex items-start gap-3 mb-4">
                  <Upload className="w-6 h-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Upload Documents</h3>
                    <p className="text-sm text-gray-600">
                      Upload PDF, DOCX, or TXT files. Our AI will extract and organize the content into study materials.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`border-3 border-dashed rounded-xl p-12 text-center transition-all ${
                  file 
                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50' 
                    : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }`}
              >
                <Upload className={`w-16 h-16 mx-auto mb-4 ${file ? 'text-primary-600' : 'text-gray-400'}`} />
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-primary-600 hover:text-primary-700 font-bold text-lg"
                >
                  Click to upload
                </label>
                <span className="text-gray-600 text-lg"> or drag and drop</span>
                <p className="text-sm text-gray-500 mt-3">PDF, DOCX, or TXT (max 10MB)</p>
                {file && (
                  <div className="mt-6 p-4 bg-white rounded-xl border-2 border-primary-300 shadow-sm">
                    <p className="text-base font-semibold text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleFileUpload}
                disabled={contentLoading || !file}
                className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:shadow-none text-lg"
              >
                {contentLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Processing File...
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6" />
                    Upload & Process File
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
