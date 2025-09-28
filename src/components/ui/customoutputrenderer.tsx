import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const formats = [
  { label: "Plain Text", value: "text" },
  { label: "Card", value: "card" },
  { label: "Table", value: "table" },
  { label: "List", value: "list" },
];

function tryParseJSON(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

const CustomOutputRenderer: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [format, setFormat] = useState(formats[0].value);
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
          systemPrompt: "You are a helpful AI assistant. If the user asks for structured data, respond in JSON.",
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

  // Renderers
  const renderCard = (data: any) => (
    <div className="bg-white border rounded shadow p-4 max-w-xs">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="mb-2">
          <b>{key}:</b> {String(value)}
        </div>
      ))}
    </div>
  );

  const renderTable = (data: any) => {
    if (!Array.isArray(data)) return <div>Invalid table data</div>;
    if (data.length === 0) return <div>No data</div>;
    const headers = Object.keys(data[0]);
    return (
      <table className="min-w-full border text-xs">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="border px-2 py-1 bg-gray-100">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {headers.map((h) => (
                <td key={h} className="border px-2 py-1">{String(row[h])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderList = (data: any) => {
    if (!Array.isArray(data)) return <div>Invalid list data</div>;
    return (
      <ul className="list-disc pl-5">
        {data.map((item, i) => (
          <li key={i}>{typeof item === "object" ? JSON.stringify(item) : String(item)}</li>
        ))}
      </ul>
    );
  };

  let output = null;
  if (response) {
    if (format === "text") {
      output = <div className="whitespace-pre-wrap">{response}</div>;
    } else {
      const parsed = tryParseJSON(response);
      if (!parsed) {
        output = <div className="text-red-500 text-sm">Could not parse response as JSON for this format.</div>;
      } else if (format === "card") {
        output = renderCard(parsed);
      } else if (format === "table") {
        output = renderTable(parsed);
      } else if (format === "list") {
        output = renderList(parsed);
      }
    }
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Custom Output Renderer</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4">
        <div className="flex space-x-2">
          {formats.map(f => (
            <Button
              key={f.value}
              variant={format === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFormat(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter a prompt (e.g., 'List 3 features as a table')"
          rows={2}
        />
        <Button onClick={handleSubmit} disabled={loading || !prompt.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Run
        </Button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {output && (
          <div className="p-3 bg-gray-100 rounded-md mt-2">{output}</div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomOutputRenderer; 