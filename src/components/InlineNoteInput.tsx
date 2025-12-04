import React, { useEffect, useRef } from "react";
import { Save, X } from "lucide-react";

interface InlineNoteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  position: { x: number; y: number };
}

export const InlineNoteInput: React.FC<InlineNoteInputProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  position,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 animate-in fade-in zoom-in duration-200"
      style={{
        left: position.x,
        top: position.y + 10, // Offset slightly below the selection
      }}
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add a note..."
        className="w-full text-sm p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-2"
        rows={3}
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={onSave}
          disabled={!value.trim()}
          className="p-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
