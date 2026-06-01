import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
}

/**
 * Render the assistant's GitHub-flavored markdown answer with theme-matched styling.
 * react-markdown does NOT render raw HTML by default (no `rehype-raw`), so model output
 * cannot inject markup — safe to feed straight from the stream.
 */
const components: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  h1: ({ children }) => <h1 className="text-[18px] font-semibold text-on-surface mt-4 first:mt-0 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-[16px] font-semibold text-on-surface mt-4 first:mt-0 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-[14px] font-semibold text-on-surface mt-3 first:mt-0 mb-1.5">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-on-surface">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-forge-orange underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-forge-orange pl-3 my-3 text-text-muted">{children}</blockquote>
  ),
  hr: () => <hr className="my-4 border-border-subtle" />,
  pre: ({ children }) => (
    <pre className="bg-surface-container-highest border border-border-subtle rounded-lg p-3 my-3 overflow-x-auto">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    const isBlock = typeof className === 'string' && className.startsWith('language-');
    if (isBlock) {
      return <code className="font-mono text-[12.5px] leading-relaxed whitespace-pre">{children}</code>;
    }
    return (
      <code className="font-mono text-[12px] bg-surface-container-highest text-forge-orange px-1.5 py-0.5 rounded">
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full text-[13px] border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border-subtle px-3 py-1.5 text-left font-semibold bg-surface-container-high">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border border-border-subtle px-3 py-1.5 align-top">{children}</td>,
};

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="font-body-md text-text-ai">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
