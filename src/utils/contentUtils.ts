export interface Highlight {
  id: string;
  text: string;
  note?: string;
  color: 'yellow' | 'green' | 'pink';
  sectionIndex?: number;
  createdAt: string;
}

export const HIGHLIGHT_COLORS = {
  yellow: 'bg-yellow-200 dark:bg-yellow-900/50',
  green: 'bg-green-200 dark:bg-green-900/50',
  pink: 'bg-pink-200 dark:bg-pink-900/50',
};

export const NOTE_HIGHLIGHT_COLORS = {
  yellow: 'bg-blue-100/60 dark:bg-blue-900/30',
  green: 'bg-blue-100/60 dark:bg-blue-900/30',
  pink: 'bg-blue-100/60 dark:bg-blue-900/30',
};

export const HIGHLIGHT_BORDER_COLORS = {
  yellow: 'border-yellow-400 dark:border-yellow-700',
  green: 'border-green-400 dark:border-green-700',
  pink: 'border-pink-400 dark:border-pink-700',
};

export const applyHighlights = (
  markdown: string,
  highlights: Highlight[],
  currentSectionIndex?: number
) => {
  if (!highlights || highlights.length === 0) return markdown;

  // Filter highlights for the current section if sectionIndex is provided
  const relevantHighlights =
    currentSectionIndex !== undefined
      ? highlights.filter((h) => h.sectionIndex === currentSectionIndex)
      : highlights;

  if (relevantHighlights.length === 0) return markdown;

  let processed = markdown;
  const sortedHighlights = [...relevantHighlights].sort(
    (a, b) => b.text.length - a.text.length
  );
  const replacements: Map<string, string> = new Map();

  sortedHighlights.forEach((highlight) => {
    const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedText, 'g');

    const colorKey = highlight.color as keyof typeof HIGHLIGHT_COLORS;
    // Use different color for notes (with opacity)
    const colorClass = highlight.note
      ? NOTE_HIGHLIGHT_COLORS[colorKey] || 'bg-blue-100/60 dark:bg-blue-900/30'
      : HIGHLIGHT_COLORS[colorKey] || 'bg-yellow-200 dark:bg-yellow-900/50';

    processed = processed.replace(regex, (match) => {
      const placeholder = `__HL_${replacements.size}__`;
      const noteIndicator = highlight.note
        ? `<span class="note-indicator inline-flex items-center justify-center w-4 h-4 ml-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-full align-top cursor-pointer transition-colors" data-note-id="${
            highlight.id
          }" data-note-text="${highlight.note.replace(
            /"/g,
            '&quot;'
          )}" title="Click to view note">!</span>`
        : '';

      replacements.set(
        placeholder,
        `<mark class="highlight-mark ${colorClass} rounded px-0.5 cursor-pointer hover:opacity-80 transition-opacity" data-highlight-id="${highlight.id}" data-has-note="${!!highlight.note}" title="${highlight.note ? 'Click to view note' : 'Click to remove highlight'}">${match}${noteIndicator}</mark>`
      );
      return placeholder;
    });
  });

  replacements.forEach((replacement, placeholder) => {
    processed = processed.split(placeholder).join(replacement);
  });

  return processed;
};
