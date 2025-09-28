import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Define the ChatMessage interface
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TextOutputProps extends React.HTMLAttributes<HTMLDivElement> {
  placeholder: string;
  content?: string;
  variant?: "default" | "heading" | "subheading" | "caption";
  maxLines?: number;
  enableMarkdown?: boolean; // Optional markdown support
}

const TextOutput = React.forwardRef<HTMLDivElement, TextOutputProps>(
  (
    {
      className,
      placeholder,
      content,
      variant = "default",
      maxLines,
      enableMarkdown = false,
      ...props
    },
    ref
  ) => {
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

    return (
      <div
        ref={ref}
        className={cn(
          "w-full p-3 rounded-md border border-gray-200 bg-white shadow-sm overflow-auto",
          variantClasses[variant],
          className
        )}
        style={
          maxLines && !isChatHistory
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
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              ))}
            </div>
          ) : (
            content
          )
        ) : (
          placeholder
        )}
      </div>
    );
  }
);

TextOutput.displayName = "TextOutput";

export { TextOutput };
