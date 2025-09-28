import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Zap, Sparkles } from "lucide-react";

interface AIModelSelectorProps {
  onModelChange?: (model: string, provider: string) => void;
  currentModel?: string;
  currentProvider?: string;
}

export const AIModelSelector: React.FC<AIModelSelectorProps> = ({ 
  onModelChange, 
  currentModel = "deepseek-chat",
  currentProvider = "deepseek"
}) => {
  const [selectedModel, setSelectedModel] = useState(currentModel);
  const [selectedProvider, setSelectedProvider] = useState(currentProvider);

  useEffect(() => {
    setSelectedModel(currentModel);
    setSelectedProvider(currentProvider);
  }, [currentModel, currentProvider]);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    if (onModelChange) {
      onModelChange(model, selectedProvider);
    }
  };

  const handleProviderChange = (provider: string) => {
    console.log(`Provider changing from ${selectedProvider} to ${provider}`);
    setSelectedProvider(provider);
    // Reset model to default for the selected provider
    const defaultModel = provider === "claude" ? "claude-3-5-sonnet-20241022" : "deepseek-chat";
    console.log(`Setting default model to: ${defaultModel}`);
    setSelectedModel(defaultModel);
    if (onModelChange) {
      onModelChange(defaultModel, provider);
    }
  };

  const models = {
    deepseek: [
      { value: "deepseek-chat", label: "DeepSeek Chat", description: "Fast and efficient chat model" },
      { value: "deepseek-coder", label: "DeepSeek Coder", description: "Specialized for code generation" }
    ],
    claude: [
      { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", description: "Latest Claude model, excellent reasoning" },
      { value: "claude-3-opus-20240229", label: "Claude 3 Opus", description: "Most capable Claude model" },
      { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku", description: "Fastest Claude model" }
    ]
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "claude":
        return <Sparkles className="h-4 w-4" />;
      case "deepseek":
        return <Zap className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "claude":
        return "text-purple-600";
      case "deepseek":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center">
          <Bot className="h-4 w-4 mr-2" />
          AI Model Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai-provider">AI Provider</Label>
          <Select value={selectedProvider} onValueChange={handleProviderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select AI provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deepseek">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span>DeepSeek</span>
                </div>
              </SelectItem>
              <SelectItem value="claude">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span>Claude</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Choose your preferred AI provider for generating responses.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-model">AI Model</Label>
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select AI model" />
            </SelectTrigger>
            <SelectContent>
              {models[selectedProvider as keyof typeof models]?.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{model.label}</span>
                    <span className="text-xs text-gray-500">{model.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Select the specific model variant for your chosen provider.
          </p>
          {/* Debug info */}
          <p className="text-xs text-gray-400">
            Available models for {selectedProvider}: {models[selectedProvider as keyof typeof models]?.length || 0}
          </p>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            {getProviderIcon(selectedProvider)}
            <span className={`font-medium ${getProviderColor(selectedProvider)}`}>
              {selectedProvider === "claude" ? "Claude" : "DeepSeek"}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            Current selection: <strong>{selectedModel}</strong>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {selectedProvider === "claude" 
              ? "Claude excels at reasoning, analysis, and creative tasks."
              : "DeepSeek is great for coding, analysis, and general assistance."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
