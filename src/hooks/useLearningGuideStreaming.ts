import { useEffect, useRef, useState } from 'react';
import { eventsService } from '../services';

interface LearningGuideSectionState {
  isGenerating: boolean;
  content: string;
  example: string;
  knowledgeCheck: any | null;
}

interface UseLearningGuideStreamingOptions {
  contentId: string;
  onOutlineCompleted?: (sections: any[]) => void;
  onAllSectionsCompleted?: () => void;
}

export const useLearningGuideStreaming = ({
  contentId,
  onOutlineCompleted,
  onAllSectionsCompleted,
}: UseLearningGuideStreamingOptions) => {
  const [sections, setSections] = useState<LearningGuideSectionState[]>([]);
  const [isOutlineReady, setIsOutlineReady] = useState(false);
  const [allSectionsComplete, setAllSectionsComplete] = useState(false);
  const [generatingSections, setGeneratingSections] = useState<Set<number>>(
    new Set()
  );
  const [loadedSections, setLoadedSections] = useState<Set<number>>(new Set());

  // Track current section being streamed for accumulation
  const sectionBuffers = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    // Outline completed - initialize sections
    const unsubscribeOutline = eventsService.on(
      'learning-guide.outline.completed',
      (event: any) => {
        if (event.contentId !== contentId) return;

        console.log('[LearningGuide] Outline completed:', event.sections);

        const initialSections = event.sections.map(() => ({
          isGenerating: false,
          content: '',
          example: '',
          knowledgeCheck: null,
        }));

        setSections(initialSections);
        setIsOutlineReady(true);
        onOutlineCompleted?.(event.sections);
      }
    );

    // Section started
    const unsubscribeSectionStarted = eventsService.on(
      'learning-guide.section.started',
      (event: any) => {
        if (event.contentId !== contentId) return;

        console.log(
          `[LearningGuide] Section ${event.sectionIndex} started:`,
          event.sectionTitle
        );

        // Mark section as generating
        setGeneratingSections((prev) => new Set(prev).add(event.sectionIndex));

        setSections((prev) =>
          prev.map((s, idx) =>
            idx === event.sectionIndex ? { ...s, isGenerating: true } : s
          )
        );

        // Initialize buffer for this section
        sectionBuffers.current.set(event.sectionIndex, '');
      }
    );

    // Section chunk - accumulate streamed content
    const unsubscribeSectionChunk = eventsService.on(
      'learning-guide.section.chunk',
      (event: any) => {
        if (event.contentId !== contentId) return;

        const currentBuffer =
          sectionBuffers.current.get(event.sectionIndex) || '';
        const newBuffer = currentBuffer + event.chunk;
        sectionBuffers.current.set(event.sectionIndex, newBuffer);

        // Try to parse if it looks complete (ends with })
        if (newBuffer.trim().endsWith('}')) {
          try {
            const parsed = JSON.parse(newBuffer);
            setSections((prev) =>
              prev.map((s, idx) =>
                idx === event.sectionIndex
                  ? {
                      ...s,
                      content: parsed.content || s.content,
                      example: parsed.example || s.example,
                      knowledgeCheck: parsed.knowledgeCheck || s.knowledgeCheck,
                    }
                  : s
              )
            );
          } catch {
            // Not valid JSON yet, keep accumulating
          }
        }
      }
    );

    // Section completed
    const unsubscribeSectionCompleted = eventsService.on(
      'learning-guide.section.completed',
      (event: any) => {
        if (event.contentId !== contentId) return;

        console.log(`[LearningGuide] Section ${event.sectionIndex} completed`);

        // Mark section as loaded and no longer generating
        setGeneratingSections((prev) => {
          const next = new Set(prev);
          next.delete(event.sectionIndex);
          return next;
        });
        setLoadedSections((prev) => new Set(prev).add(event.sectionIndex));

        setSections((prev) =>
          prev.map((s, idx) =>
            idx === event.sectionIndex ? { ...s, isGenerating: false } : s
          )
        );

        // Clear buffer for this section
        sectionBuffers.current.delete(event.sectionIndex);
      }
    );

    // All sections completed
    const unsubscribeAllCompleted = eventsService.on(
      'learning-guide.all-sections.completed',
      (event: any) => {
        if (event.contentId !== contentId) return;

        console.log('[LearningGuide] All sections completed');

        setAllSectionsComplete(true);
        onAllSectionsCompleted?.();
      }
    );

    return () => {
      unsubscribeOutline();
      unsubscribeSectionStarted();
      unsubscribeSectionChunk();
      unsubscribeSectionCompleted();
      unsubscribeAllCompleted();

      // Clear buffers
      sectionBuffers.current.clear();
    };
  }, [contentId, onOutlineCompleted, onAllSectionsCompleted]);

  return {
    sections,
    isOutlineReady,
    allSectionsComplete,
    generatingSections,
    loadedSections,
  };
};
