import { useEffect } from 'react';

interface KeyboardNavigationHandlers {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSelect: () => void;
  onClose: () => void;
}

export function useKeyboardNavigation(
  isActive: boolean,
  handlers: KeyboardNavigationHandlers
) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handlers.onMoveUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handlers.onMoveDown();
          break;
        case 'Enter':
          e.preventDefault();
          handlers.onSelect();
          break;
        case 'Escape':
          e.preventDefault();
          handlers.onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handlers]);
}
