import React, { useRef } from 'react';
import { X } from 'lucide-react';
import {
  useKeyboardNavigation,
  useFocusTrap,
  useBodyScrollLock,
} from '../hooks';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(isOpen);
  useFocusTrap(modalRef as React.RefObject<HTMLElement>, isOpen);

  useKeyboardNavigation(isOpen, {
    onMoveUp: () => {},
    onMoveDown: () => {},
    onSelect: () => {},
    onClose: onClose,
  });

  // Removed manual useEffect for escape and scroll lock

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200 ${className}`}
      >
        {/* Close button positioned absolutely in the top-right of the modal content */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {title && (
          <div className="flex items-center justify-between p-4 md:p-6 pb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-8">
              {title}
            </h3>
          </div>
        )}

        <div className={`px-4 md:px-6 pb-4 md:pb-6 text-gray-700 dark:text-gray-300 ${title ? '' : 'pt-6'}`}>
          {children}
        </div>

        {footer && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
