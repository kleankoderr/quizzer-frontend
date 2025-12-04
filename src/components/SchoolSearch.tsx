import { useState, useEffect, useRef } from 'react';
import { School as SchoolIcon, Search, Plus, Check } from 'lucide-react';
import { apiClient } from '../services/api';

interface School {
  id: string;
  name: string;
}

interface SchoolSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SchoolSearch = ({ value, onChange, placeholder = "Search for your school...", className = "" }: SchoolSearchProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<School[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchSchools = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data } = await apiClient.get(`/schools/search?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch (error) {
        console.error('Failed to search schools:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchSchools, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (schoolName: string) => {
    onChange(schoolName);
    setQuery(schoolName);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <SchoolIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value); // Allow typing new values
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder={placeholder}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="py-1">
              {results.map((school) => (
                <li
                  key={school.id}
                  onClick={() => handleSelect(school.name)}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-gray-700 dark:text-gray-200"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  {school.name}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No schools found</p>
              <button
                onClick={() => handleSelect(query)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Use "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
