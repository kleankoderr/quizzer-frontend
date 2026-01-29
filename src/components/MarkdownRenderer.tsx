import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import * as styles from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy } from 'lucide-react';
import { Toast } from '../utils/toast';

const vscDarkPlus =
  (styles as any).vscDarkPlus || (styles as any).default?.vscDarkPlus || styles;

/**
 * Preprocess content to convert various LaTeX delimiter formats to standard $ delimiters
 * that remark-math can parse properly
 */
const preprocessMath = (content: string): string => {
  if (!content) return content;

  let processed = content;

  // Convert \[...\] to $$...$$ (display math)
  processed = processed.replaceAll(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$');

  // Convert \(...\) to $...$ (inline math)
  processed = processed.replaceAll(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // Handle cases where parentheses are used like (P(n): formula) - common in proofs
  // Convert patterns like (P(n): ...) where there's clear math notation
  processed = processed.replaceAll(
    /\(([A-Z]\([a-z]\):\s*[^)]+(?:\^\d+|\\[a-z]+|[+\-*/=])[^)]*)\)/g,
    '$$$1$$'
  );

  return processed;
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
  useRaw?: boolean;
  HeadingRenderer?: React.FC<{ level: number; children?: any }>;
}

const CodeBlock = ({ node: _node, children, className, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const isInline = !className?.startsWith('language-');

  if (!isInline && match) {
    return (
      <div className="relative group my-6">
        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={() => {
              navigator.clipboard.writeText(String(children));
              Toast.success('Code copied!');
            }}
            className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-white backdrop-blur-sm"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <SyntaxHighlighter
          {...props}
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          className="rounded-xl !bg-gray-900 !p-4 sm:!p-6 border border-gray-700/50 overflow-x-auto shadow-lg"
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  }

  if (isInline) {
    const cleanContent = String(children).replaceAll('`', '').trim();

    return (
      <code
        {...props}
        className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800/80 text-primary-700 dark:text-primary-300 rounded font-medium text-[0.9em] border border-gray-200/50 dark:border-gray-700/50 inline transition-colors"
        style={{ fontFamily: 'Lexend, sans-serif' }}
      >
        {cleanContent}
      </code>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  useRaw = false,
  HeadingRenderer,
}) => {
  const rehypePlugins = React.useMemo(
    () =>
      [
        useRaw && rehypeRaw,
        rehypeKatex,
        [
          rehypeSanitize,
          {
            ...defaultSchema,
            tagNames: [
              ...(defaultSchema.tagNames || []),
              'mark',
              'span',
              'div',
              'math',
              'semantics',
              'mrow',
              'mi',
              'mo',
              'mn',
              'msup',
              'msub',
              'mfrac',
              'msqrt',
              'mroot',
              'mtable',
              'mtr',
              'mtd',
              'code',
              'pre',
            ],
            attributes: {
              ...defaultSchema.attributes,
              mark: [
                ['className'],
                ['data-highlight-id'],
                ['data-has-note'],
                ['title'],
              ],
              span: [
                ['className'],
                ['title'],
                ['style'],
                ['data-note-id'],
                ['data-note-text'],
              ],
              div: [['className']],
              math: [['xmlns'], ['display']],
              code: [['className']],
              pre: [['className']],
            },
          },
        ],
      ].filter(Boolean) as any,
    [useRaw]
  );

  const components = React.useMemo(() => {
    const comps: any = {
      code: CodeBlock,
    };

    if (HeadingRenderer) {
      comps.h1 = (props: any) => <HeadingRenderer {...props} level={1} />;
      comps.h2 = (props: any) => <HeadingRenderer {...props} level={2} />;
      comps.h3 = (props: any) => <HeadingRenderer {...props} level={3} />;
    }

    return comps;
  }, [HeadingRenderer]);

  // Preprocess content to handle various LaTeX delimiter formats
  const processedContent = React.useMemo(
    () => preprocessMath(content),
    [content]
  );

  if (!processedContent) return null;

  return (
    <div
      className={`prose dark:prose-invert prose-code:before:content-none prose-code:after:content-none max-w-none ${className}`}
    >
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {processedContent}
      </Markdown>
    </div>
  );
};
