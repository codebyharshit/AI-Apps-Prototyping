"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2, PlayCircle, FlaskConical, MessageSquare } from "lucide-react";
import { ComponentData } from "@/lib/utils";
import { AIFunctionality } from "@/components/AIFunctionalityConfig";
import { handleApiError } from "@/lib/api-utils";

interface AIBehaviorSimulatorProps {
  components: ComponentData[];
  onHoverComponent?: (id: string | null) => void;
  onUpdateComponentProperties?: (id: string, properties: Record<string, any>) => void;
}

interface ABTestResult {
  userInput: string;
  responseA: string;
  responseB: string;
  promptA: string;
  promptB: string;
  timestamp: Date;
}

export function AIBehaviorSimulator({ 
  components,
  onHoverComponent,
  onUpdateComponentProperties
}: AIBehaviorSimulatorProps) {
  const [prompt, setPrompt] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState<string>("You are a helpful AI assistant.");
  const [simulationType, setSimulationType] = useState<string>("text");
  const [delay, setDelay] = useState<number>(0);
  const [responseOutput, setResponseOutput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOutputComponentId, setSelectedOutputComponentId] = useState<string | null>(null);
  const [selectedAIFunctionality, setSelectedAIFunctionality] = useState<AIFunctionality | null>(null);
  const [abTestResults, setAbTestResults] = useState<ABTestResult[]>([]);
  const [isRunningABTest, setIsRunningABTest] = useState(false);
  const [aiFunctionalities, setAIFunctionalities] = useState<AIFunctionality[]>([]);

  // Load AI functionalities from localStorage
  useEffect(() => {
    const savedFunctionalities = localStorage.getItem("aiFunctionalities");
    if (savedFunctionalities) {
      try {
        const parsed = JSON.parse(savedFunctionalities);
        setAIFunctionalities(parsed);
      } catch (e) {
        console.error("Failed to parse saved AI functionalities:", e);
      }
    }
  }, []);

  // Filter components that can be used as output
  const outputComponents = components.filter(
    (component) =>
      (component.type === "TextOutput" ||
      component.type === "MarkdownOutput" ||
      component.type === "ImageDisplay" ||
      component.type === "Alert" ||
      component.type === "AIAlert" ||
      component.type === "AIOutput") &&
      component.id && 
      component.id.trim() !== ""
  );

  const handleSimulate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsRunningABTest(false);

    try {
      // Check if we have an AI functionality selected with A/B testing enabled
      if (selectedAIFunctionality && selectedAIFunctionality.isABTestEnabled) {
        setIsRunningABTest(true);
        await runABTest();
      } else {
        // Regular simulation
        const effectiveSystemPrompt = selectedAIFunctionality 
          ? selectedAIFunctionality.systemPrompt 
          : systemPrompt;

      const response = await fetch("/api/ai/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
            systemPrompt: effectiveSystemPrompt,
          responseType: simulationType,
          delay,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setResponseOutput(data?.data?.response || "");

      // If we have a selected output component, update its properties
      if (selectedOutputComponentId && onUpdateComponentProperties) {
        const outputComponent = components.find(
          (component) => component.id === selectedOutputComponentId
        );
        
        if (outputComponent) {
          // Update the component's properties based on its type
          if (outputComponent.type === "TextOutput" || outputComponent.type === "AIOutput") {
            onUpdateComponentProperties(selectedOutputComponentId, {
              content: data?.data?.response
            });
          } else if (outputComponent.type === "ImageDisplay" && simulationType === "image") {
            onUpdateComponentProperties(selectedOutputComponentId, {
              src: data?.data?.response
            });
            }
          }
        }
      }
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error || "An unknown error occurred");
    } finally {
      setIsLoading(false);
      setIsRunningABTest(false);
    }
  };

  // A/B Testing function
  const runABTest = async () => {
    if (!selectedAIFunctionality || !selectedAIFunctionality.promptA || !selectedAIFunctionality.promptB) {
      throw new Error("Both Prompt A and Prompt B must be configured for A/B testing");
    }

    console.log("🧪 Running A/B Test with two prompts...");

    // Make two parallel API calls with temperature: 0 for deterministic comparison
    const [responseA, responseB] = await Promise.all([
      fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          systemPrompt: selectedAIFunctionality.promptA,
          temperature: 0, // Deterministic for fair comparison
        }),
      }),
      fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          systemPrompt: selectedAIFunctionality.promptB,
          temperature: 0, // Deterministic for fair comparison
        }),
      }),
    ]);

    if (!responseA.ok || !responseB.ok) {
      throw new Error("One or both A/B test API calls failed");
    }

    const dataA = await responseA.json();
    const dataB = await responseB.json();

    const result: ABTestResult = {
      userInput: prompt,
      responseA: dataA?.data?.response || "No response received",
      responseB: dataB?.data?.response || "No response received",
      promptA: selectedAIFunctionality.promptA,
      promptB: selectedAIFunctionality.promptB,
      timestamp: new Date(),
    };

    // Add to results
    setAbTestResults(prev => [result, ...prev]);

    console.log("✅ A/B Test completed:", result);
  };

  const getStateIndicator = () => {
    switch (simulationType) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "loading":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  // Handle hover for highlighting components in the canvas
  const handleMouseEnter = (componentId: string) => {
    if (onHoverComponent) {
      onHoverComponent(componentId);
    }
  };

  const handleMouseLeave = () => {
    if (onHoverComponent) {
      onHoverComponent(null);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md">AI Behavior Simulator</CardTitle>
          {getStateIndicator()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Functionality Selection */}
        <div className="space-y-2">
          <Label htmlFor="ai-functionality-select">AI Functionality (Optional)</Label>
          <Select
            value={selectedAIFunctionality?.id || "none"}
            onValueChange={(value) => {
              if (value === "none") {
                setSelectedAIFunctionality(null);
              } else {
                const functionality = aiFunctionalities.find(f => f.id === value);
                setSelectedAIFunctionality(functionality || null);
              }
            }}
          >
            <SelectTrigger id="ai-functionality-select">
              <SelectValue placeholder="Select an AI functionality to test" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Use manual system prompt)</SelectItem>
              {aiFunctionalities.map((functionality) => (
                <SelectItem key={functionality.id} value={functionality.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{functionality.name}</span>
                    {functionality.isABTestEnabled && (
                      <span className="text-xs text-blue-600">A/B Test Enabled</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* System Prompt (only show if no AI functionality selected or A/B testing not enabled) */}
        {(!selectedAIFunctionality || !selectedAIFunctionality.isABTestEnabled) && (
        <div className="space-y-2">
          <Label htmlFor="system-prompt">System Prompt</Label>
          <Textarea
            id="system-prompt"
            placeholder="You are a helpful AI assistant specialized in..."
              value={selectedAIFunctionality ? selectedAIFunctionality.systemPrompt : systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={!!selectedAIFunctionality}
            />
            {selectedAIFunctionality && (
              <p className="text-xs text-gray-500">
                Using system prompt from selected AI functionality
              </p>
            )}
          </div>
        )}

        {/* A/B Test Info */}
        {selectedAIFunctionality && selectedAIFunctionality.isABTestEnabled && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <FlaskConical className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">A/B Testing Mode</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Two prompts will be tested in parallel with temperature=0 for fair comparison
            </p>
        </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="user-prompt">User Prompt</Label>
          <Textarea
            id="user-prompt"
            placeholder="Enter a prompt to test AI response..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="response-type">Response Type</Label>
            <Select
              value={simulationType}
              onValueChange={setSimulationType}
            >
              <SelectTrigger id="response-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="code">Code</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response-delay">
              Response Delay: {delay / 1000}s
            </Label>
            <Slider
              id="response-delay"
              min={0}
              max={5000}
              step={100}
              value={[delay]}
              onValueChange={(value) => setDelay(value[0])}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="output-component">Connect to Output Component</Label>
          <Select
            value={selectedOutputComponentId ?? "none"}
            onValueChange={value => setSelectedOutputComponentId(value === "none" ? null : value)}
          >
            <SelectTrigger id="output-component">
              <SelectValue placeholder="Select component" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {outputComponents.map((component) => (
                <SelectItem 
                  key={component.id} 
                  value={component.id}
                  onMouseEnter={() => handleMouseEnter(component.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  {component.properties?.name || component.id} ({component.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSimulate}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isRunningABTest ? "Running A/B Test..." : "Simulating..."}
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              {selectedAIFunctionality && selectedAIFunctionality.isABTestEnabled ? "Run A/B Test" : "Simulate"}
            </>
          )}
        </Button>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        {/* Regular simulation results */}
        {!selectedOutputComponentId && responseOutput && !isRunningABTest && (
          <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-900">
            <Label className="block mb-2">Response:</Label>
            <div className="whitespace-pre-wrap">
              {simulationType === "image" ? (
                <img 
                  src={responseOutput} 
                  alt="Generated image" 
                  className="max-w-full h-auto"
                />
              ) : (
                responseOutput
              )}
            </div>
          </div>
        )}

        {/* A/B Test Results */}
        {abTestResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">A/B Test Results</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAbTestResults([])}
              >
                Clear Results
              </Button>
            </div>
            
            {abTestResults.map((result, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                {/* Three-column layout header */}
                <div className="grid grid-cols-1 lg:grid-cols-3 bg-gray-50 border-b">
                  <div className="p-3 lg:border-r border-b lg:border-b-0">
                    <Label className="text-sm font-medium flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      User Input
                    </Label>
                  </div>
                  <div className="p-3 lg:border-r border-b lg:border-b-0">
                    <Label className="text-sm font-medium flex items-center text-blue-600">
                      <FlaskConical className="h-3 w-3 mr-1" />
                      Response from A
                    </Label>
                  </div>
                  <div className="p-3">
                    <Label className="text-sm font-medium flex items-center text-green-600">
                      <FlaskConical className="h-3 w-3 mr-1" />
                      Response from B
                    </Label>
                  </div>
                </div>
                
                {/* Three-column layout content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-0">
                  <div className="p-3 lg:border-r bg-white border-b lg:border-b-0">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {result.userInput}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {result.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="p-3 lg:border-r bg-blue-50 border-b lg:border-b-0">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {result.responseA}
                    </div>
                    <div className="text-xs text-blue-600 mt-2 font-medium flex items-center">
                      <FlaskConical className="h-3 w-3 mr-1" />
                      Prompt A ({result.responseA.length} chars)
                    </div>
                  </div>
                  <div className="p-3 bg-green-50">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {result.responseB}
                    </div>
                    <div className="text-xs text-green-600 mt-2 font-medium flex items-center">
                      <FlaskConical className="h-3 w-3 mr-1" />
                      Prompt B ({result.responseB.length} chars)
                    </div>
                  </div>
                </div>
                
                {/* Expandable prompt details */}
                <details className="border-t">
                  <summary className="p-3 cursor-pointer bg-gray-50 hover:bg-gray-100 text-sm font-medium">
                    View Prompt Details
                  </summary>
                  <div className="p-3 grid grid-cols-2 gap-4 bg-gray-50">
                    <div>
                      <Label className="text-xs font-medium text-blue-700">Prompt A:</Label>
                      <div className="text-xs text-gray-600 mt-1 p-2 bg-white rounded border">
                        {result.promptA}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-green-700">Prompt B:</Label>
                      <div className="text-xs text-gray-600 mt-1 p-2 bg-white rounded border">
                        {result.promptB}
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 