"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, ExternalLink } from "lucide-react";
import { ComponentData, FrameData } from "@/lib/utils";
import { AIFunctionality } from "@/components/AIFunctionalityConfig";

interface PromptToPrototypeProps {
  onPrototypeGenerated: (data: {
    components: ComponentData[];
    frames: FrameData[];
    aiFunctionalities: AIFunctionality[];
    title: string;
  }) => void;
}

const examplePrompts = [
  "Create a customer support chatbot with file upload and FAQ section",
  "Build an expense tracker with charts, categories, and CSV export",
  "Make a real estate listing app with property search and filters",
  "Design a food delivery app with restaurant menu and cart",
  "Create a fitness tracker with workout logging and progress charts",
  "Build a todo app with drag & drop, categories, and due dates"
];

export const PromptToPrototype: React.FC<PromptToPrototypeProps> = ({
  onPrototypeGenerated,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePrototype = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-prototype', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate prototype');
      }

      const result = await response.json();
      const prototypeSpec = result.data;

      // Pass the generated prototype to the parent
      onPrototypeGenerated({
        components: prototypeSpec.components || [],
        frames: prototypeSpec.frames || [],
        aiFunctionalities: prototypeSpec.aiFunctionalities || [],
        title: prototypeSpec.title || "Generated Prototype"
      });

      setIsOpen(false);
      setPrompt("");
      
    } catch (err: any) {
      console.error('Error generating prototype:', err);
      setError(err.message || 'Failed to generate prototype');
    } finally {
      setIsGenerating(false);
    }
  };

  const useExamplePrompt = (example: string) => {
    setPrompt(example);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center" variant="default">
          <Sparkles className="mr-2 h-4 w-4" />
          Generate from Prompt
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5" />
            Generate Prototype from Prompt
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe your app or prototype</Label>
            <Textarea
              id="prompt"
              placeholder="E.g., Create a customer support chatbot with file upload capabilities and a knowledge base search..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={isGenerating}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Example Prompts */}
          <div className="space-y-2">
            <Label>Try these examples</Label>
            <div className="grid grid-cols-1 gap-2">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => useExamplePrompt(example)}
                  disabled={isGenerating}
                  className="text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>

          {/* AI Capabilities Notice */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🤖 AI-Powered Generation</h4>
            <p className="text-sm text-blue-700">
              This feature uses AI to generate complete prototypes including:
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Interactive components and layouts</li>
              <li>• Multiple screens/frames with navigation</li>
              <li>• AI functionality integration</li>
              <li>• Realistic content and styling</li>
            </ul>
          </div>

          {/* Generate Button */}
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            
            <Button 
              onClick={generatePrototype}
              disabled={isGenerating || !prompt.trim()}
              className="min-w-[140px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Prototype
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500">
            💡 Tip: Be specific about features, user flows, and any special requirements. 
            The more detail you provide, the better your prototype will be!
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 