import { useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import {
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_MODIFIER_COMMAND,
  type EditorState,
} from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { mergeRegister } from "@lexical/utils";

interface RichTextEditorProps {
  initialContent: string;
  onChange: (markdown: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

// Plugin to handle keyboard shortcuts
function KeyboardShortcutsPlugin({
  onSave,
  onCancel,
}: {
  onSave?: () => void;
  onCancel?: () => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      // Ctrl/Cmd + S to save
      editor.registerCommand(
        KEY_MODIFIER_COMMAND,
        (event: KeyboardEvent) => {
          const { code, ctrlKey, metaKey } = event;
          if ((ctrlKey || metaKey) && code === "KeyS") {
            event.preventDefault();
            onSave?.();
            return true;
          }
          // Ctrl/Cmd + U for underline
          if ((ctrlKey || metaKey) && code === "KeyU") {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      // Escape to cancel
      editor.registerRootListener((rootElement, prevRootElement) => {
        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel?.();
          }
        };

        if (rootElement) {
          rootElement.addEventListener("keydown", handleKeyDown);
        }

        if (prevRootElement) {
          prevRootElement.removeEventListener("keydown", handleKeyDown);
        }
      }),
    );
  }, [editor, onSave, onCancel]);

  return null;
}

// Plugin to initialize content from markdown
function InitialContentPlugin({ content }: { content: string }) {
  const [editor] = useLexicalComposerContext();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && content) {
      editor.update(() => {
        $convertFromMarkdownString(content, TRANSFORMERS);
      });
      initialized.current = true;
    }
  }, [editor, content]);

  return null;
}

// Plugin to convert content to markdown on change
function MarkdownConverterPlugin({
  onChange,
}: {
  onChange: (markdown: string) => void;
}) {
  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const markdown = $convertToMarkdownString(TRANSFORMERS);
      onChange(markdown);
    });
  };

  return <OnChangePlugin onChange={handleChange} ignoreSelectionChange />;
}

export function RichTextEditor({
  initialContent,
  onChange,
  onSave,
  onCancel,
  placeholder = "Start writing...",
}: RichTextEditorProps) {
  const initialConfig = {
    namespace: "ContentEditor",
    theme: {
      paragraph: "mb-4",
      heading: {
        h1: "text-4xl font-bold mb-6 mt-8",
        h2: "text-3xl font-bold mb-5 mt-7",
        h3: "text-2xl font-bold mb-4 mt-6",
        h4: "text-xl font-bold mb-3 mt-5",
        h5: "text-lg font-bold mb-2 mt-4",
        h6: "text-base font-bold mb-2 mt-3",
      },
      list: {
        ul: "list-disc ml-6 mb-4",
        ol: "list-decimal ml-6 mb-4",
        listitem: "mb-1",
      },
      link: "text-primary-600 hover:underline cursor-pointer",
      text: {
        bold: "font-bold",
        italic: "italic",
        underline: "underline",
        strikethrough: "line-through",
        code: "bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-red-600",
      },
      code: "bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm block my-4 overflow-x-auto",
      quote: "border-l-4 border-gray-300 pl-4 italic my-4 text-gray-700",
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
    ],
    onError: () => {},
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="prose prose-lg max-w-none content-markdown outline-none min-h-[400px] focus:outline-none"
              aria-placeholder={placeholder}
              placeholder={
                <div className="absolute top-0 left-0 text-gray-400 pointer-events-none">
                  {placeholder}
                </div>
              }
            />
          }
          ErrorBoundary={LexicalErrorBoundary as any}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <InitialContentPlugin content={initialContent} />
        <MarkdownConverterPlugin onChange={onChange} />
        <KeyboardShortcutsPlugin onSave={onSave} onCancel={onCancel} />
      </div>
    </LexicalComposer>
  );
}
