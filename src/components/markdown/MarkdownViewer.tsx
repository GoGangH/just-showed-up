import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

export function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="space-y-4 text-sm leading-7 text-neutral-800">
      <ReactMarkdown
        rehypePlugins={[rehypeSanitize]}
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-semibold">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          a: ({ children, href }) => (
            <a className="font-medium text-neutral-900 underline underline-offset-4" href={href}>
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.92em]">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-md bg-neutral-950 p-4 text-neutral-50">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-neutral-300 pl-4 text-neutral-600">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
