import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  id?: string;
  prefixIcon?: React.ReactNode;
  renderOption?: (option: SelectOption) => React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  containerClassName = '',
  disabled = false,
  error,
  label,
  id,
  prefixIcon,
  renderOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsidePortal = document.getElementById('select-options')?.contains(target);

      if (!isInsideContainer && !isInsidePortal) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex((opt) => String(opt.value) === String(value));
      const nextIndex = (currentIndex + 1) % options.length;
      onChange(options[nextIndex].value);
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex((opt) => String(opt.value) === String(value));
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      onChange(options[prevIndex].value);
    }
  };

  return (
    <div className={`relative w-full ${containerClassName}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        id={id ? `${id}-button` : undefined}
        ref={buttonRef}
        aria-hidden="true"
        tabIndex={-1}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onClick={handleToggle}
        className={`flex items-center gap-2 w-full px-4 py-2.5 text-left bg-white dark:bg-gray-800 border rounded-xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
          isOpen ? 'border-primary-500 shadow-sm' : 'border-gray-200 dark:border-gray-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900' : 'hover:border-primary-400 dark:hover:border-primary-500'} ${
          error ? 'border-red-500 focus:ring-red-500/20' : ''
        } ${className}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {prefixIcon && <div className="text-gray-400">{prefixIcon}</div>}
          <span className={`block truncate ${selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Hidden native select for accessibility and form integration */}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        disabled={disabled}
        aria-label={label || placeholder}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

 {createPortal(
  <AnimatePresence>
    {isOpen && (
      <motion.ul
        id="select-options"
        key="options"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: coords.top + 8,
          left: coords.left,
          width: coords.width,
        }}
        className="z-[9999] overflow-auto bg-white dark:bg-gray-800
                   border border-gray-200 dark:border-gray-700 rounded-xl
                   shadow-xl max-h-60 focus:outline-none py-1"
      >
        {options.map((option) => {
          const isSelected = String(option.value) === String(value);

          return (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm
                            text-left transition-colors
                            ${
                              isSelected
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
              >
                <span className="flex-1 truncate font-medium">
                  {renderOption ? renderOption(option) : option.label}
                </span>

                {isSelected && (
                  <Check className="w-4 h-4 text-primary-500 ml-2" />
                )}
              </button>
            </li>
          );
        })}

        {options.length === 0 && (
          <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 italic">
            No options available
          </li>
        )}
      </motion.ul>
    )}
  </AnimatePresence>,
  document.body
)}


      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
};
