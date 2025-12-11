import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Command,
  FileText,
  Brain,
  Zap,
  Loader2,
} from 'lucide-react';
import { searchService, type SearchResult } from '../services/searchService';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch = ({ isOpen, onClose }: GlobalSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();

  // Debounce logic manually if hook doesn't exist, but checking for hook first is better.
  // I will assume standard debounce logic using setTimeout to be safe.

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 0) {
        setLoading(true);
        try {
          const data = await searchService.search(query);
          setResults(data);
          setSelectedIndex(0);
        } catch (error) {
          console.error('Search failed', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      } else if (query.trim()) {
        // Fallback to discover page if no specific result selected but enter pressed
        navigate(`/discover?q=${encodeURIComponent(query)}`);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-32 px-4 transition-all duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none"
            placeholder="Search quizzes, flashcards, study materials..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="text-xs font-medium border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 hidden sm:block">
              ESC
            </div>
            <X className="w-5 h-5 sm:hidden" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <ul ref={listRef} className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Results
              </div>
              {results.map((result, index) => {
                const isSelected = index === selectedIndex;

                let Icon = Brain;
                if (result.type === 'flashcard') Icon = Zap;
                if (result.type === 'content') Icon = FileText;

                return (
                  <li key={result.id}>
                    <button
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full px-4 py-3 flex items-start text-left transition-colors ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-transparent'
                      }`}
                    >
                      <div
                        className={`mt-0.5 p-2 rounded-lg mr-3 ${
                          isSelected
                            ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`text-sm font-medium truncate ${
                            isSelected
                              ? 'text-primary-900 dark:text-primary-100'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {result.title}
                        </h4>
                        {result.metadata && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {result.metadata}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="hidden sm:flex items-center text-xs text-gray-400">
                          <span className="mr-1">Select</span>
                          <kbd className="font-sans px-1 border border-gray-300 dark:border-gray-600 rounded">
                            ↵
                          </kbd>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : query.trim().length > 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No results found for "{query}"
              </p>
              <button
                onClick={() => {
                  navigate(`/discover?q=${encodeURIComponent(query)}`);
                  onClose();
                }}
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Try creating content for this topic →
              </button>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <Command className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Type to search...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 border-t border-gray-200 dark:border-gray-700 hidden sm:flex justify-between items-center text-xs text-gray-500">
          <div className="flex gap-4">
            <span className="flex items-center">
              <kbd className="font-sans px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 mr-1.5">
                ↑↓
              </kbd>{' '}
              to navigate
            </span>
            <span className="flex items-center">
              <kbd className="font-sans px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 mr-1.5">
                ↵
              </kbd>{' '}
              to select
            </span>
          </div>
          <span>
            <span className="font-medium text-primary-500">Quizzer</span> Global
            Search
          </span>
        </div>
      </div>
    </div>
  );
};
