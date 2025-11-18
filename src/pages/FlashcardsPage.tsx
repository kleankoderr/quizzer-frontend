import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { flashcardService } from '../services/flashcard.service';
import type { FlashcardSet, FlashcardGenerateRequest } from '../types';
import { CreditCard, Plus, Sparkles, Layers, BookOpen } from 'lucide-react';
import { FlashcardGenerator } from '../components/FlashcardGenerator';
import { FlashcardSetList } from '../components/FlashcardSetList';

export const FlashcardsPage = () => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFlashcardSets = async () => {
      try {
        const sets = await flashcardService.getAll();
        setFlashcardSets(sets);
      } catch (error) {
        // Silently fail on initial load
      }
    };

    loadFlashcardSets();
  }, []);

  const handleGenerate = async (request: FlashcardGenerateRequest, files?: File[]) => {
    setLoading(true);
    const loadingToast = toast.loading('Generating your flashcards...');
    
    try {
      // Start generation
      const { jobId } = await flashcardService.generate(request, files);
      
      // Poll for completion
      await flashcardService.pollForCompletion(jobId);
      
      // Refresh the flashcard list to get the latest sets
      const sets = await flashcardService.getAll();
      setFlashcardSets(sets);
      
      setShowGenerator(false);
      toast.success('Flashcards generated successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to generate flashcards. Please try again.', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalSets = flashcardSets.length;
  const totalCards = flashcardSets.reduce((sum, set) => 
    sum + (Array.isArray(set.cards) ? set.cards.length : 0), 0
  );
  const studiedSets = flashcardSets.filter(set => set.lastStudiedAt).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-yellow-300" />
            <span className="text-yellow-300 font-semibold text-sm">Smart Learning Cards</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <CreditCard className="w-10 h-10" />
                Flashcard Generator
              </h1>
              <p className="text-emerald-100 text-lg">Transform any content into effective study flashcards</p>
            </div>
            <button
              onClick={() => setShowGenerator(!showGenerator)}
              className="group flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all hover:scale-105 font-semibold shadow-lg"
            >
              <Plus className="w-5 h-5" />
              {showGenerator ? 'Close Generator' : 'New Set'}
            </button>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      {totalSets > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{totalSets}</p>
                <p className="text-xs text-gray-600 mt-1">Total Sets</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{totalCards}</p>
                <p className="text-xs text-gray-600 mt-1">Total Cards</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{studiedSets}</p>
                <p className="text-xs text-gray-600 mt-1">Studied Sets</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGenerator && (
        <FlashcardGenerator onGenerate={handleGenerate} loading={loading} />
      )}

      <FlashcardSetList sets={flashcardSets} />
    </div>
  );
};
