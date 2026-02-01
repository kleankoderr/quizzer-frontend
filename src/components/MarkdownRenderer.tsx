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
import mermaid from 'mermaid';

const vscDarkPlus =
  (styles as any).vscDarkPlus || (styles as any).default?.vscDarkPlus || styles;

/**
 * Preprocess content to convert various LaTeX delimiter formats to standard $ delimiters
 * that remark-math can parse properly
 */
const preprocessMath = (content: string): string => {
  if (!content) return content;

  let processed = content;

  // Standardize LaTeX delimiters to $ and $$ for KaTeX
  // Handle both single and double backslashes
  
  // Convert \[...\] to $$...$$ (display math)
  processed = processed.replaceAll(/\\{1,2}\[([\s\S]*?)\\{1,2}\]/g, '$$$$$1$$$$');

  // Convert \(...\) to $...$ (inline math)
  processed = processed.replaceAll(/\\{1,2}\(([\s\S]*?)\\{1,2}\)/g, '$$$1$$');

  // Handle ( \sqrt... ) or other commands start inside plain parentheses
  processed = processed.replaceAll(/\(\s*(\\[a-zA-Z][\s\S]*?)\)/g, '$$$1$$');

  // Handle cases where parentheses are used like (P(n): formula) - common in proofs
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

// Initialize mermaid with configuration
(mermaid as any).initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Lexend, sans-serif',
  suppressError: true, // Suppress internal Mermaid error UI
});

// Mermaid diagram component
const MermaidDiagram: React.FC<{ chart: string }> = ({ chart }) => {
  const [svg, setSvg] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    const renderDiagram = async () => {
      if (!chart) return;

      try {
        setError('');
        setSvg(''); // Reset SVG while rendering

        // Generate a unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;

        // Validate syntax first
        try {
          await mermaid.parse(chart);
        } catch (error_) {
          console.error('Mermaid parse error:', error_);
          setError('Failed to load diagram');
          return;
        }

        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(id, chart);

        // If it still contains error indicators (some versions might return error SVG instead of throwing)
        if (
          renderedSvg.includes('aria-roledescription="error"') ||
          renderedSvg.includes('Syntax error in text')
        ) {
          setError('Failed to load diagram');
          return;
        }

        setSvg(renderedSvg);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to load diagram'); // Keep it simple
        setSvg(''); // Ensure SVG is cleared on error
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div className="my-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 text-sm">
          Failed to load diagram
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500">Loading diagram...</div>
      </div>
    );
  }

  return (
    <div
      className="my-6 p-6 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

const CodeBlock = ({
  node: _node,
  inline,
  children,
  className,
  ...props
}: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const childrenStr = String(children);
  const isInline =
    inline ||
    (!match &&
      !className?.includes('language-') &&
      !childrenStr.includes('\n'));
  const language = match?.[1];

  // Special handling for Mermaid diagrams
  if (!isInline && language === 'mermaid') {
    return <MermaidDiagram chart={childrenStr.trim()} />;
  }

  if (!isInline) {
    return (
      <div className="relative group my-6">
        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={() => {
              navigator.clipboard.writeText(childrenStr);
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
          language={language || 'text'}
          PreTag="div"
          className="rounded-xl !bg-gray-900 !p-4 sm:!p-6 border border-gray-700/50 overflow-x-auto shadow-lg"
        >
          {childrenStr.replaceAll(/\n$/g, '')}
        </SyntaxHighlighter>
      </div>
    );
  }

  const cleanContent = childrenStr.replaceAll(/(^`+)|(`+$)/g, '').trim();

  return (
    <code
      {...props}
      className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800/80 text-primary-700 dark:text-primary-300 rounded font-medium text-[0.9em] border border-gray-200/50 dark:border-gray-700/50 inline transition-colors"
      style={{ fontFamily: 'Lexend, sans-serif' }}
    >
      {cleanContent}
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
