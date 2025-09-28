import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const PromptPlayground: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: systemPrompt || "You are a helpful AI assistant.",
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setResponse(data.data.response);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Prompt Playground</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4">
        <Textarea
          value={systemPrompt}
          onChange={e => setSystemPrompt(e.target.value)}
          placeholder="System prompt (e.g., 'You are a helpful assistant...')"
          rows={2}
        />
        <Textarea
          value={userPrompt}
          onChange={e => setUserPrompt(e.target.value)}
          placeholder="User prompt (e.g., 'How do I reset my password?')"
          rows={2}
        />
        <Button onClick={handleSubmit} disabled={loading || !userPrompt.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Run
        </Button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {response && (
          <div className="p-3 bg-gray-100 rounded-md whitespace-pre-wrap">
            {response}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromptPlayground; 