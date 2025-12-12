import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Command,
  FileText,
  Brain,
  Zap,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { searchService, type SearchResult } from '../services/searchService';
import { useDebounce } from '../hooks/useDebounce';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useFocusTrap } from '../hooks/useFocusTrap';

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
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounced query for API calls
  const debouncedQuery = useDebounce(query, 300);

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  // Focus trap within modal
  useFocusTrap(modalRef, isOpen);

  // Focus input when modal opens
  useMemo(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Perform search when debounced query changes
  useMemo(() => {
    const performSearch = async () => {
      if (debouncedQuery.trim().length === 0) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchService.search(debouncedQuery);
        setResults(data);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search failed', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Handle result selection
  const handleSelect = useCallback(
    (result: SearchResult) => {
      navigate(result.url);
      onClose();
    },
    [navigate, onClose]
  );

  // Handle enter key when no result selected
  const handleDefaultEnter = useCallback(() => {
    if (query.trim()) {
      navigate(`/discover?q=${encodeURIComponent(query)}`);
      onClose();
    }
  }, [query, navigate, onClose]);

  // Keyboard navigation handlers
  const navigationHandlers = {
    onMoveUp: useCallback(() => {
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    }, [results.length]),
    onMoveDown: useCallback(() => {
      setSelectedIndex((prev) => (prev + 1) % results.length);
    }, [results.length]),
    onSelect: useCallback(() => {
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      } else {
        handleDefaultEnter();
      }
    }, [results, selectedIndex, handleSelect, handleDefaultEnter]),
    onClose: onClose,
  };

  // Setup keyboard navigation
  useKeyboardNavigation(isOpen, navigationHandlers);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Get icon for result type
  const getResultIcon = useCallback((type: string) => {
    switch (type) {
      case 'flashcard':
        return Zap;
      case 'content':
        return FileText;
      case 'study-pack':
        return FolderOpen;
      default:
        return Brain;
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-32 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            id="search-title"
            type="text"
            className="flex-1 bg-transparent text-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none"
            placeholder="Search quizzes, flashcards, study materials..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
            aria-controls="search-results"
            aria-expanded={results.length > 0}
          />
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-2"
            aria-label="Close search"
          >
            <div className="text-xs font-medium border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 hidden sm:block">
              ESC
            </div>
            <X className="w-5 h-5 sm:hidden" />
          </button>
        </div>

        {/* Results List */}
        <SearchResults
          loading={loading}
          results={results}
          query={query}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
          onHover={setSelectedIndex}
          onNavigateToDiscover={handleDefaultEnter}
          getResultIcon={getResultIcon}
        />

        {/* Footer */}
        <SearchFooter />
      </div>
    </div>
  );
};

// Extracted Components
interface SearchResultsProps {
  loading: boolean;
  results: SearchResult[];
  query: string;
  selectedIndex: number;
  onSelect: (result: SearchResult) => void;
  onHover: (index: number) => void;
  onNavigateToDiscover: () => void;
  getResultIcon: (type: string) => typeof Brain;
}

const SearchResults = ({
  loading,
  results,
  query,
  selectedIndex,
  onSelect,
  onHover,
  onNavigateToDiscover,
  getResultIcon,
}: SearchResultsProps) => {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Searching...</span>
      </div>
    );
  }

  if (results.length > 0) {
    return (
      <div
        className="flex-1 overflow-y-auto"
        id="search-results"
        role="listbox"
      >
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Results
        </div>
        {results.map((result, index) => (
          <SearchResultItem
            key={result.id}
            result={result}
            index={index}
            isSelected={index === selectedIndex}
            onSelect={onSelect}
            onHover={onHover}
            Icon={getResultIcon(result.type)}
          />
        ))}
      </div>
    );
  }

  if (query.trim().length > 0) {
    return (
      <div className="flex-1 py-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          No results found for "{query}"
        </p>
        <button
          onClick={onNavigateToDiscover}
          className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
        >
          Try creating content for this topic →
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 py-12 text-center text-gray-500 dark:text-gray-400">
      <Command className="w-12 h-12 mx-auto mb-3 opacity-20" />
      <p>Type to search...</p>
    </div>
  );
};

interface SearchResultItemProps {
  result: SearchResult;
  index: number;
  isSelected: boolean;
  onSelect: (result: SearchResult) => void;
  onHover: (index: number) => void;
  Icon: typeof Brain;
}

const SearchResultItem = ({
  result,
  index,
  isSelected,
  onSelect,
  onHover,
  Icon,
}: SearchResultItemProps) => {
  return (
    <button
      role="option"
      aria-selected={isSelected}
      onClick={() => onSelect(result)}
      onMouseEnter={() => onHover(index)}
      className={`w-full px-4 py-3 flex items-start text-left transition-colors ${
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-transparent'
      }`}
    >
      <div
        className={`mt-0.5 p-2 rounded-lg mr-3 flex-shrink-0 ${
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
        <div className="hidden sm:flex items-center text-xs text-gray-400 ml-2">
          <span className="mr-1">Select</span>
          <kbd className="font-sans px-1 border border-gray-300 dark:border-gray-600 rounded">
            ↵
          </kbd>
        </div>
      )}
    </button>
  );
};

const SearchFooter = () => (
  <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 border-t border-gray-200 dark:border-gray-700 hidden sm:flex justify-between items-center text-xs text-gray-500">
    <div className="flex gap-4">
      <span className="flex items-center">
        <kbd className="font-sans px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 mr-1.5">
          ↑↓
        </kbd>
        to navigate
      </span>
      <span className="flex items-center">
        <kbd className="font-sans px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 mr-1.5">
          ↵
        </kbd>
        to select
      </span>
    </div>
    <span>
      <span className="font-medium text-primary-500">Quizzer</span> Global
      Search
    </span>
  </div>
);
