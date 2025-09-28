import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";

const ResponseInspector: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [raw, setRaw] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMeta, setShowMeta] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setMeta(null);
    setRaw(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: "You are a helpful AI assistant.",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setResponse(data.data.response);
      setMeta({ model: data.data.model, usage: data.data.usage });
      setRaw(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Response Inspector</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4">
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter a prompt to inspect the AI's response and metadata."
          rows={2}
        />
        <Button onClick={handleSubmit} disabled={loading || !prompt.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Inspect
        </Button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {response && (
          <div className="p-3 bg-gray-100 rounded-md whitespace-pre-wrap">
            <b>AI Response:</b>
            <div>{response}</div>
          </div>
        )}
        {meta && (
          <div className="mt-2">
            <button className="flex items-center text-blue-600 text-sm mb-1" onClick={() => setShowMeta(v => !v)}>
              {showMeta ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}Metadata
            </button>
            {showMeta && (
              <div className="bg-slate-50 rounded p-2 text-xs">
                <div><b>Model:</b> {meta.model}</div>
                <div><b>Tokens Used:</b> {meta.usage?.total_tokens ?? "-"}</div>
                <div><b>Prompt Tokens:</b> {meta.usage?.prompt_tokens ?? "-"}</div>
                <div><b>Completion Tokens:</b> {meta.usage?.completion_tokens ?? "-"}</div>
              </div>
            )}
          </div>
        )}
        {raw && (
          <div className="mt-2">
            <button className="flex items-center text-blue-600 text-sm mb-1" onClick={() => setShowRaw(v => !v)}>
              {showRaw ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}Raw JSON
            </button>
            {showRaw && (
              <pre className="bg-slate-100 rounded p-2 text-xs overflow-x-auto max-h-40 whitespace-pre-wrap">
                {JSON.stringify(raw, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResponseInspector; 