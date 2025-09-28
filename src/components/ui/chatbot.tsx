import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { Input } from '@/components/ui/input';

interface ChatbotProps {
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  content?: string;
  [key: string]: any;
}

const Chatbot = ({ className = '', value: externalValue, onChange: externalOnChange, content, ...props }: ChatbotProps) => {
  const [internalValue, setInternalValue] = useState(externalValue || '');
  const [internalContent, setInternalContent] = useState(content || '');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const currentValue = externalValue !== undefined ? externalValue : internalValue;
  const currentContent = content !== undefined ? content : internalContent;
  
  // Update internal content when external content changes
  useEffect(() => {
    if (content !== undefined) {
      setInternalContent(content);
    }
  }, [content]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (externalOnChange) {
      externalOnChange(e);
    } else {
      setInternalValue(newValue);
    }
  };
  
  const handleSubmit = async () => {
    if (!currentValue.trim()) return;
    setIsLoading(true);
    setError(null);
    const userMessage = { role: "user", content: currentValue };
    setMessages((prev) => [...prev, userMessage]);
    setInternalValue('');
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          systemPrompt: "You are a helpful AI assistant."
        }),
      });
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.data.response }]);
      setInternalContent(data.data.response);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`${className} w-full h-full flex flex-col`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Simulation Chatbot</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-2 overflow-y-auto">
        <div id="output-chatbot-response" className="output-area p-4 border rounded-md bg-gray-50 min-h-[100px] w-full mb-2">
          <div className="text-sm text-gray-600 mb-2">Chatbot Response:</div>
          <div className="text-base whitespace-pre-wrap">
            {isLoading ? "Thinking..." : currentContent || "Ask me anything..."}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto mb-2">
          {messages.length === 0 && (
            <div className="text-gray-400 text-center mt-8">Start the conversation…</div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`rounded-lg px-3 py-2 max-w-xs ${msg.role === "user" ? "bg-blue-100 text-right" : "bg-gray-100 text-left"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-2">
              <div className="rounded-lg px-3 py-2 bg-gray-100 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating…
              </div>
            </div>
          )}
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex items-center space-x-2 mt-2">
          <Input
            id="input-chatbot-message"
            value={currentValue}
            onChange={handleChange}
            placeholder="Type your message…"
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            id="button-chatbot-submit"
            onClick={handleSubmit}
            disabled={isLoading || !currentValue.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Chatbot; 