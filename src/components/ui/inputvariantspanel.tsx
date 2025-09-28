import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2, Plus } from "lucide-react";

interface Variant {
  id: string;
  label: string;
  value: string;
}

const defaultVariants: Variant[] = [
  { id: "1", label: "Typical", value: "How do I reset my password?" },
  { id: "2", label: "Edge Case", value: "My account was deleted but I still get emails." },
  { id: "3", label: "Bad Input", value: "asdfghjkl" },
];

const InputVariantsPanel: React.FC = () => {
  const [variants, setVariants] = useState<Variant[]>(defaultVariants);
  const [selectedId, setSelectedId] = useState<string>(variants[0].id);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleSend = async (variant: Variant) => {
    setLoadingId(variant.id);
    setError(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: "You are a helpful AI assistant.",
          messages: [{ role: "user", content: variant.value }],
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setResponses((prev) => ({ ...prev, [variant.id]: data.data.response }));
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoadingId(null);
    }
  };

  const handleAddVariant = () => {
    if (!newLabel.trim() || !newValue.trim()) return;
    const newVariant: Variant = {
      id: Date.now().toString(),
      label: newLabel,
      value: newValue,
    };
    setVariants((prev) => [...prev, newVariant]);
    setNewLabel("");
    setNewValue("");
    setSelectedId(newVariant.id);
  };

  const handleDeleteVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
    setResponses((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (selectedId === id && variants.length > 1) {
      setSelectedId(variants[0].id);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Input Variants Panel</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2">
          {variants.map((variant) => (
            <div key={variant.id} className={`flex items-center space-x-2 ${selectedId === variant.id ? "bg-blue-50" : ""}`}>
              <Button
                variant={selectedId === variant.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedId(variant.id)}
              >
                {variant.label}
              </Button>
              <Textarea
                className="flex-1"
                rows={1}
                value={variant.value}
                onChange={e => {
                  setVariants((prev) => prev.map(v => v.id === variant.id ? { ...v, value: e.target.value } : v));
                }}
              />
              <Button variant="ghost" size="icon" onClick={() => handleDeleteVariant(variant.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button onClick={() => handleSend(variant)} disabled={loadingId === variant.id}>
                {loadingId === variant.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <input
            className="border rounded px-2 py-1 text-sm flex-1"
            placeholder="Label (e.g., Edge Case)"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
          />
          <input
            className="border rounded px-2 py-1 text-sm flex-1"
            placeholder="Input value"
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
          />
          <Button onClick={handleAddVariant} size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {selectedId && responses[selectedId] && (
          <div className="p-3 bg-gray-100 rounded-md whitespace-pre-wrap mt-2">
            <b>AI Response:</b>
            <div>{responses[selectedId]}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InputVariantsPanel; 