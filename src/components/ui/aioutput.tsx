import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIOutputProps {
  id?: string;
  className?: string;
  content?: string;
  isInteractive?: boolean;
}

export const AIOutput: React.FC<AIOutputProps> = ({
  id,
  className,
  content = "",
  isInteractive = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // When content changes, try to parse it as JSON to see if it's a messages array
  // If not, treat it as a single message
  useEffect(() => {
    if (!content) {
      setMessages([]);
      return;
    }
    
    try {
      // Try to parse as JSON array of messages
      const parsedContent = JSON.parse(content);
      if (Array.isArray(parsedContent)) {
        setMessages(parsedContent);
      } else {
        // If it's just a JSON object but not an array, treat as a single message
        setMessages([{ role: 'assistant', content }]);
      }
    } catch (e) {
      // If parsing fails, it's just a plain text message
      // Add it as an assistant message (the default)
      setMessages([{ role: 'assistant', content }]);
    }
  }, [content]);

  return (
    <div
      id={id}
      className={cn(
        "w-full h-full p-4 rounded-md border border-gray-200 bg-white overflow-y-auto",
        !isInteractive && "pointer-events-none",
        className
      )}
    >
      {messages.length === 0 ? (
        <div className="text-gray-400 italic">No messages yet</div>
      ) : (
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
      )}
    </div>
  );
}; 