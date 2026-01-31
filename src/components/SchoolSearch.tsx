import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Plus, School as SchoolIcon, Search } from 'lucide-react';
import { type School, schoolService } from '../services/school.service';
import { useClickOutside, useDebounce } from '../hooks';

interface SchoolSearchProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SchoolSearch = ({
  id,
  value,
  onChange,
  placeholder = 'Select or search for your school...',
  className = '',
}: SchoolSearchProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<School[]>([]);
  const [initialSchools, setInitialSchools] = useState<School[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updateCoords();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEvents = () => {
      if (isOpen) updateCoords();
    };

    window.addEventListener('resize', handleEvents);
    window.addEventListener('scroll', handleEvents, true);

    return () => {
      window.removeEventListener('resize', handleEvents);
      window.removeEventListener('scroll', handleEvents, true);
    };
  }, [isOpen]);

  const debouncedQuery = useDebounce(query, 300);

  // Load initial schools on mount
  useEffect(() => {
    const loadInitialSchools = async () => {
      try {
        const schools = await schoolService.getTopSchools();
        setInitialSchools(schools);
      } catch (error) {
        console.error('Failed to load initial schools', error);
      }
    };
    loadInitialSchools();
  }, []);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useClickOutside(wrapperRef as React.RefObject<HTMLElement>, (event) => {
    // Only close if the click wasn't inside the portal-rendered list
    const isPortalClick = !!document.getElementById('school-search-portal')?.contains(event.target as Node);
    if (!isPortalClick) {
      setIsOpen(false);
    }
  });

  useEffect(() => {
    const searchSchools = async () => {
      // If no query, show initial schools
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults(initialSchools);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await schoolService.searchSchools(debouncedQuery);
        setResults(data);
      } catch (error) {
        console.error('Failed to search schools', error);
      } finally {
        setLoading(false);
      }
    };

    searchSchools();
  }, [debouncedQuery, initialSchools]);

  const handleSelect = (schoolName: string) => {
    onChange(schoolName);
    setQuery(schoolName);
    setIsOpen(false);
  };

  const renderDropdownContent = () => {
    if (results.length > 0) {
      return (
        <ul className="py-1">
          {results.map((school) => (
            <li key={school.id}>
              <button
                type="button"
                onClick={() => handleSelect(school.name)}
                className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200 text-left transition-colors"
              >
                <Search className="w-4 h-4 text-gray-400" />
                <span>{school.name}</span>
              </button>
            </li>
          ))}
        </ul>
      );
    }

    if (!loading && query.length > 0) {
      if (query.length < 3) {
        return (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Keep typing to add your school (min 3 characters)
            </p>
          </div>
        );
      }

      if (!/^[a-zA-Z0-9\s.,&'()-]+$/.test(query)) {
        return (
          <div className="p-4 text-center">
            <p className="text-sm text-red-500 dark:text-red-400 font-medium">
              School name contains invalid characters
            </p>
          </div>
        );
      }

      return (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Not in our list?
          </p>
          <button
            type="button"
            onClick={() => handleSelect(query)}
            className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center justify-center gap-1 mx-auto bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-full transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add "{query}"
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <SchoolIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-text"
          placeholder={placeholder}
          maxLength={100}
        />
        {loading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Toggle dropdown"
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>

      {isOpen && createPortal(
        <div 
          id="school-search-portal"
          style={{
            position: 'absolute',
            top: coords.top + 4,
            left: coords.left,
            width: coords.width,
          }}
          className="z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto"
        >
          {renderDropdownContent()}
        </div>,
        document.body
      )}
    </div>
  );
};
