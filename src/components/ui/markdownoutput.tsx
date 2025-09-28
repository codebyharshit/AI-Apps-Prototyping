"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github.css'; // You can change this to any highlight.js theme

// Define the ChatMessage interface
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MarkdownOutputProps extends React.HTMLAttributes<HTMLDivElement> {
  placeholder: string;
  content?: string;
  variant?: "default" | "heading" | "subheading" | "caption";
  maxLines?: number;
  enableMarkdown?: boolean; // New prop to enable/disable markdown
  enableCodeHighlight?: boolean; // Enable syntax highlighting
}

const MarkdownOutput = React.forwardRef<HTMLDivElement, MarkdownOutputProps>(
  (
    {
      className,
      placeholder,
      content,
      variant = "default",
      maxLines,
      enableMarkdown = true,
      enableCodeHighlight = true,
      ...props
    },
    ref
  ) => {
    // Debug logging to see what content we're receiving
    console.log(`🔍 MarkdownOutput Debug:`, {
      content: content ? content.substring(0, 100) + '...' : 'NO CONTENT',
      contentLength: content?.length || 0,
      enableMarkdown,
      enableCodeHighlight,
      placeholder
    });

    const variantClasses = {
      default: "text-base text-gray-900",
      heading: "text-2xl font-bold text-gray-900",
      subheading: "text-lg font-semibold text-gray-800",
      caption: "text-sm text-gray-500",
    };

    // Try to parse content as chat history JSON
    const isChatHistory = React.useMemo(() => {
      if (!content) return false;
      try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) && parsed.length > 0 && parsed[0].hasOwnProperty('role');
      } catch (e) {
        return false;
      }
    }, [content]);

    // Parse messages if it's chat history
    const messages = React.useMemo(() => {
      if (!isChatHistory || !content) return [];
      try {
        return JSON.parse(content) as ChatMessage[];
      } catch (e) {
        return [];
      }
    }, [isChatHistory, content]);

    // Check if content looks like markdown
    const isMarkdownContent = React.useMemo(() => {
      if (!content || isChatHistory) return false;
      // Simple heuristics to detect markdown
      const markdownPatterns = [
        /^#{1,6}\s/, // Headers
        /\*\*[^*]+\*\*/, // Bold
        /\*[^*]+\*/, // Italic
        /`[^`]+`/, // Inline code
        /```[\s\S]*?```/, // Code blocks
        /^\s*[-*+]\s/, // Lists
        /^\s*\d+\.\s/, // Numbered lists
        /\[([^\]]+)\]\(([^)]+)\)/, // Links
        /!\[([^\]]*)\]\(([^)]+)\)/, // Images
      ];
      return markdownPatterns.some(pattern => pattern.test(content));
    }, [content, isChatHistory]);

    // Custom markdown components for better styling
    const markdownComponents = {
      h1: ({ children, ...props }: any) => (
        <h1 className="text-2xl font-bold mb-4 mt-2 text-gray-900 border-b border-gray-300 pb-2" {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }: any) => (
        <h2 className="text-xl font-semibold mb-3 mt-4 text-gray-800 border-b border-gray-200 pb-1" {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }: any) => (
        <h3 className="text-lg font-semibold mb-2 mt-3 text-gray-800" {...props}>
          {children}
        </h3>
      ),
      h4: ({ children, ...props }: any) => (
        <h4 className="text-base font-semibold mb-2 text-gray-700" {...props}>
          {children}
        </h4>
      ),
      p: ({ children, ...props }: any) => (
        <p className="mb-2 leading-relaxed text-gray-700" {...props}>
          {children}
        </p>
      ),
      strong: ({ children, ...props }: any) => (
        <strong className="font-bold text-gray-900" {...props}>
          {children}
        </strong>
      ),
      em: ({ children, ...props }: any) => (
        <em className="italic text-gray-700" {...props}>
          {children}
        </em>
      ),
      ul: ({ children, ...props }: any) => (
        <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700 pl-2" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }: any) => (
        <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-700 pl-2" {...props}>
          {children}
        </ol>
      ),
      li: ({ children, ...props }: any) => (
        <li className="text-gray-700 ml-2" {...props}>
          {children}
        </li>
      ),
      blockquote: ({ children, ...props }: any) => (
        <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-3 bg-blue-50 py-2" {...props}>
          {children}
        </blockquote>
      ),
      code: ({ children, className, ...props }: any) => {
        const isInline = !className;
        if (isInline) {
          return (
            <code className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono" {...props}>
              {children}
            </code>
          );
        }
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
      pre: ({ children, ...props }: any) => (
        <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto mb-3 text-sm" {...props}>
          {children}
        </pre>
      ),
      a: ({ children, href, ...props }: any) => (
        <a 
          href={href} 
          className="text-blue-600 hover:text-blue-800 underline" 
          target="_blank" 
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      ),
      table: ({ children, ...props }: any) => (
        <div className="overflow-x-auto mb-3">
          <table className="min-w-full border border-gray-300" {...props}>
            {children}
          </table>
        </div>
      ),
      th: ({ children, ...props }: any) => (
        <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left" {...props}>
          {children}
        </th>
      ),
      td: ({ children, ...props }: any) => (
        <td className="border border-gray-300 px-3 py-2" {...props}>
          {children}
        </td>
      ),
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-full p-3 rounded-md border border-gray-200 bg-white shadow-sm overflow-auto",
          variantClasses[variant],
          className
        )}
        style={
          maxLines && !isChatHistory && !isMarkdownContent
            ? {
                display: "-webkit-box",
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: "vertical",
              }
            : undefined
        }
        {...props}
      >
        {content ? (
          content === "Loading..." ? (
            <div className="space-y-2">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-3/4 h-4" />
            </div>
          ) : isChatHistory ? (
            <div className="flex flex-col space-y-3">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={cn(
                    "px-3 py-2 rounded-lg max-w-[85%]",
                    message.role === "user" 
                      ? "bg-blue-500 text-white self-end"
                      : message.role === "assistant"
                      ? "bg-gray-100 text-gray-800 self-start"
                      : "bg-yellow-100 text-gray-800 self-start italic text-xs"
                  )}
                >
                  <div className="text-xs mb-1 font-semibold">
                    {message.role === "user" ? "You" : message.role === "assistant" ? "AI" : "System"}
                  </div>
                  <div className="whitespace-pre-wrap">
                    {enableMarkdown ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={enableCodeHighlight ? [rehypeHighlight, rehypeRaw] : [rehypeRaw]}
                        components={markdownComponents}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // ALWAYS render as markdown for MarkdownOutput component
            <div className="prose prose-sm max-w-none markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={enableCodeHighlight ? [rehypeHighlight, rehypeRaw] : [rehypeRaw]}
                components={markdownComponents}
              >
                {content || ""}
              </ReactMarkdown>
            </div>
          )
        ) : (
          <div className="text-gray-400 italic">{placeholder}</div>
        )}
      </div>
    );
  }
);

MarkdownOutput.displayName = "MarkdownOutput";

export { MarkdownOutput };
