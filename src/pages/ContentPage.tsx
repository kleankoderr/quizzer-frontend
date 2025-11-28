import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { BookOpen, Highlighter, MessageSquare, Plus, Brain, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { flashcardService } from '../services/flashcard.service';
import { quizService } from '../services/quiz.service';

interface Section {
  id: string;
  title: string;
  content: string;
}

interface Content {
  id: string;
  title: string;
  sections: Section[];
}

export const ContentPage = () => {
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const topic = searchParams.get('topic');
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mock content generation/fetching
    setLoading(true);
    setTimeout(() => {
      setContent({
        id: '1',
        title: topic || 'Introduction to Photosynthesis',
        sections: [
          {
            id: 's1',
            title: 'Overview',
            content: 'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.'
          },
          {
            id: 's2',
            title: 'The Process',
            content: 'The process takes place in the chloroplasts, using chlorophyll, the green pigment involved in photosynthesis.'
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, [topic, id]);

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (sel && sel.toString().length > 0 && contentRef.current?.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(sel.toString());
        setToolbarPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10 + window.scrollY
        });
      } else {
        // Don't clear selection immediately if we're interacting with the toolbar
        // This is a simplified check; in a real app you'd check if the click target is the toolbar
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const handleHighlight = () => {
    // Implement highlighting logic
    console.log('Highlighting:', selectedText);
    setToolbarPosition(null);
  };

  const handleCreateFlashcard = async () => {
    if (!selectedText) return;
    
    try {
      setIsCreating(true);
      console.log('Creating flashcard from:', selectedText);
      
      await flashcardService.generate({
        topic: content?.title || 'General',
        content: selectedText,
        numberOfCards: 1
      });
      
      alert('Flashcard created successfully!');
    } catch (error) {
      console.error('Failed to create flashcard:', error);
      alert('Failed to create flashcard. Please try again.');
    } finally {
      setIsCreating(false);
      setToolbarPosition(null);
    }
  };

  const handleCreateQuestion = async () => {
    if (!selectedText) return;

    try {
      setIsCreating(true);
      console.log('Creating question from:', selectedText);
      
      await quizService.generate({
        topic: content?.title || 'General',
        content: selectedText,
        numberOfQuestions: 1,
        difficulty: 'medium'
      });

      alert('Question created successfully!');
    } catch (error) {
      console.error('Failed to create question:', error);
      alert('Failed to create question. Please try again.');
    } finally {
      setIsCreating(false);
      setToolbarPosition(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{content?.title}</h1>
          <button className="btn-primary flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Generate Quiz
          </button>
        </div>
      </div>

      <div ref={contentRef} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8 relative">
        {content?.sections.map((section) => (
          <section key={section.id}>
            <h2 className="text-xl font-bold text-gray-800 mb-3">{section.title}</h2>
            <p className="text-gray-600 leading-relaxed text-lg">{section.content}</p>
          </section>
        ))}
      </div>

      {/* Floating Toolbar */}
      {toolbarPosition && (
        <div
          className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-xl flex items-center gap-1 p-1 transform -translate-x-1/2 -translate-y-full"
          style={{ left: toolbarPosition.x, top: toolbarPosition.y }}
        >
          <button onClick={handleHighlight} className="p-2 hover:bg-gray-700 rounded transition-colors" title="Highlight">
            <Highlighter className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-700 mx-1"></div>
          
          {isCreating ? (
            <div className="p-2">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            <>
              <button onClick={handleCreateFlashcard} className="p-2 hover:bg-gray-700 rounded transition-colors" title="Create Flashcard">
                <BookOpen className="w-4 h-4" />
              </button>
              <button onClick={handleCreateQuestion} className="p-2 hover:bg-gray-700 rounded transition-colors" title="Create Question">
                <MessageSquare className="w-4 h-4" />
              </button>
            </>
          )}
          
          <button className="p-2 hover:bg-gray-700 rounded transition-colors" title="Add Note">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
