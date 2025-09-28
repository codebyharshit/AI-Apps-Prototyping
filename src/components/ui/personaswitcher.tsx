import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const personas = [
  {
    label: "Friendly",
    value: "friendly",
    systemPrompt: "You are a friendly and approachable assistant. Always respond with warmth and encouragement.",
    description: "Warm, approachable, and encouraging."
  },
  {
    label: "Formal",
    value: "formal",
    systemPrompt: "You are a formal and professional assistant. Use proper grammar and a respectful tone.",
    description: "Professional, respectful, and precise."
  },
  {
    label: "Concise",
    value: "concise",
    systemPrompt: "You are a concise assistant. Respond with brief, to-the-point answers.",
    description: "Brief and to the point."
  },
  {
    label: "Playful",
    value: "playful",
    systemPrompt: "You are a playful assistant. Use humor and a lighthearted tone in your responses.",
    description: "Humorous and lighthearted."
  },
];

const PersonaSwitcher: React.FC = () => {
  const [selected, setSelected] = useState(personas[0]);
  const [prompt, setPrompt] = useState("");
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
          systemPrompt: selected.systemPrompt,
          messages: [{ role: "user", content: prompt }],
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
        <CardTitle className="text-md">Persona/Style Switcher</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4">
        <div className="flex space-x-2">
          {personas.map((persona) => (
            <Button
              key={persona.value}
              variant={selected.value === persona.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelected(persona)}
            >
              {persona.label}
            </Button>
          ))}
        </div>
        <div className="text-xs text-gray-500 mb-2">{selected.description}</div>
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter a prompt to see the AI's response in this style."
          rows={2}
        />
        <Button onClick={handleSubmit} disabled={loading || !prompt.trim()}>
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

export default PersonaSwitcher; 