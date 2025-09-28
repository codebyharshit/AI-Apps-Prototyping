"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wand2, 
  PlusCircle, 
  Eye, 
  Code, 
  ArrowRight,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ComponentData, calculateNaturalComponentSize } from "@/lib/utils";
import { ComponentRequirementsForm, ComponentRequirements } from "./ComponentRequirementsForm";
import { HtmlCssEditor } from "./HtmlCssEditor";
import { CodeViewerModal } from "./CodeViewerModal";

interface EnhancedAIComponentGeneratorProps {
  onComponentGenerated: (component: ComponentData) => void;
  onAddHtmlCssToCanvas?: (html: string, requirements: ComponentRequirements) => void;
}

type GenerationStep = "requirements" | "html-css" | "react" | "complete";

export function EnhancedAIComponentGenerator({ onComponentGenerated, onAddHtmlCssToCanvas }: EnhancedAIComponentGeneratorProps) {
  const [currentStep, setCurrentStep] = useState<GenerationStep>("requirements");
  const [requirements, setRequirements] = useState<ComponentRequirements | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [generatedReactCode, setGeneratedReactCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const handleRequirementsSubmit = async (req: ComponentRequirements) => {
    // DIRECT GENERATION MODE: bypass HTML/CSS, call generate-component and add to canvas
    setRequirements(req);
    setIsGenerating(true);
    setError(null);

    // Show canvas loading overlay
    window.dispatchEvent(new CustomEvent('showCanvasLoading', {
      detail: { 
        isLoading: true, 
        message: 'Generating Enhanced AI Component...', 
        step: 'Processing requirements...' 
      }
    }));

    try {
      // Build a concise prompt from requirements
      const featuresText = (req.features || []).map((f, i) => `${i + 1}. ${f}`).join("\n");
      const prompt = `Build a ${req.componentType || "UI"} React component.\n` +
        `Idea: ${req.idea}.\n` +
        (featuresText ? `Key features:\n${featuresText}\n` : "") +
        (req.styling ? `Styling preference: ${req.styling}.\n` : "") +
        (req.targetAudience ? `Target audience: ${req.targetAudience}.\n` : "") +
        (req.additionalNotes ? `Additional notes: ${req.additionalNotes}.` : "");

      // Update loading step
      window.dispatchEvent(new CustomEvent('showCanvasLoading', {
        detail: { 
          isLoading: true, 
          message: 'Generating Enhanced AI Component...', 
          step: 'Calling AI service...' 
        }
      }));

      const response = await fetch("/api/ai/generate-component", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, componentType: req.componentType })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate component");
      }

      // Update loading step
      window.dispatchEvent(new CustomEvent('showCanvasLoading', {
        detail: { 
          isLoading: true, 
          message: 'Generating Enhanced AI Component...', 
          step: 'Creating component on canvas...' 
        }
      }));

      // Calculate natural size based on the generated code
      const naturalSize = calculateNaturalComponentSize(data.component, req.componentType || 'Component');
      
      // Immediately add to canvas
      const newComponent: ComponentData = {
        id: uuidv4(),
        type: `AI${(req.componentType || 'Component').replace(/\s+/g, '')}`,
        position: { x: 100, y: 100 },
        size: naturalSize,
        properties: {
          generatedCode: data.component,
          prompt: req.idea,
          requirements: req
        }
      };

      onComponentGenerated(newComponent);
      setCurrentStep("complete");

      // Hide canvas loading overlay
      window.dispatchEvent(new CustomEvent('showCanvasLoading', {
        detail: { isLoading: false }
      }));

      // CRITICAL: Dispatch reloadComponents event to automatically refresh the canvas
      // This eliminates the need for manual page refresh
      setTimeout(() => {
        console.log('🔄 Dispatching reloadComponents event for automatic refresh...');
        const reloadEvent = new CustomEvent('reloadComponents', {
          detail: { 
            componentId: newComponent.id, 
            newCode: data.component,
            autoRefresh: true 
          }
        });
        window.dispatchEvent(reloadEvent);
        console.log('✅ reloadComponents event dispatched - canvas will refresh automatically');
      }, 200); // Small delay to ensure component is fully added

      // Reset after a short delay for UX
      setTimeout(() => {
        setCurrentStep("requirements");
        setRequirements(null);
        setGeneratedHtml("");
        setGeneratedReactCode("");
        setError(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred while generating the component");
      
      // Hide canvas loading overlay on error
      window.dispatchEvent(new CustomEvent('showCanvasLoading', {
        detail: { isLoading: false }
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleHtmlSave = (html: string) => {
    setGeneratedHtml(html);
  };

  const handleAddToCanvas = (html: string, req: ComponentRequirements) => {
    if (onAddHtmlCssToCanvas) {
      onAddHtmlCssToCanvas(html, req);
      setCurrentStep("complete");
      
      // Reset after a delay to show success
      setTimeout(() => {
        setCurrentStep("requirements");
        setRequirements(null);
        setGeneratedHtml("");
        setGeneratedReactCode("");
        setError(null);
      }, 3000);
    }
  };

  const handleGenerateReact = async (html: string) => {
    setIsGenerating(true);
    setError(null);

    // Show canvas loading overlay
    window.dispatchEvent(new CustomEvent('showCanvasLoading', {
      detail: { 
        isLoading: true, 
        message: 'Converting HTML to React...', 
        step: 'Processing HTML structure...' 
      }
    }));

    try {
      const componentName = requirements?.componentType.replace(/\s+/g, "") || "GeneratedComponent";
      
      // Update loading step
      window.dispatchEvent(new CustomEvent('showCanvasLoading', {
        detail: { 
          isLoading: true, 
          message: 'Converting HTML to React...', 
          step: 'Calling conversion service...' 
        }
      }));
      
      const response = await fetch("/api/ai/html-to-react", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          html,
          componentName
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to convert to React");
      }

      setGeneratedReactCode(data.component);
      setCurrentStep("react");
      
      // Hide canvas loading overlay
      window.dispatchEvent(new CustomEvent('showCanvasLoading', {
        detail: { isLoading: false }
      }));
      
    } catch (err: any) {
      setError(err.message || "An error occurred while converting to React");
      
      // Hide canvas loading overlay on error
      window.dispatchEvent(new CustomEvent('showCanvasLoading', {
        detail: { isLoading: false }
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddComponent = () => {
    if (!generatedReactCode || !requirements) {
      setError("No React component has been generated yet");
      return;
    }

    // Show canvas loading overlay
    window.dispatchEvent(new CustomEvent('showCanvasLoading', {
      detail: { 
        isLoading: true, 
        message: 'Adding Component to Canvas...', 
        step: 'Creating component data...' 
      }
    }));

    const newComponent: ComponentData = {
      id: uuidv4(),
      type: `AI${requirements.componentType.replace(/\s+/g, "")}`,
      position: { x: 100, y: 100 },
      size: { width: 400, height: 300 },
      properties: {
        generatedCode: generatedReactCode,
        prompt: requirements.idea,
        requirements: requirements,
        originalHtml: generatedHtml
      }
    };
    
    onComponentGenerated(newComponent);
    setCurrentStep("complete");
    
    // Hide canvas loading overlay
    window.dispatchEvent(new CustomEvent('showCanvasLoading', {
      detail: { isLoading: false }
    }));
    
    // CRITICAL: Dispatch reloadComponents event to automatically refresh the canvas
    // This eliminates the need for manual page refresh
    setTimeout(() => {
      console.log('🔄 Dispatching reloadComponents event for automatic refresh...');
      const reloadEvent = new CustomEvent('reloadComponents', {
        detail: { 
          componentId: newComponent.id, 
          newCode: generatedReactCode,
          autoRefresh: true 
        }
      });
      window.dispatchEvent(reloadEvent);
      console.log('✅ reloadComponents event dispatched - canvas will refresh automatically');
    }, 200); // Small delay to ensure component is fully added
    
    // Reset after a delay to show success
    setTimeout(() => {
      setCurrentStep("requirements");
      setRequirements(null);
      setGeneratedHtml("");
      setGeneratedReactCode("");
      setError(null);
    }, 3000);
  };

  const handleReset = () => {
    setCurrentStep("requirements");
    setRequirements(null);
    setGeneratedHtml("");
    setGeneratedReactCode("");
    setError(null);
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: "requirements", label: "Requirements", icon: Wand2 },
      { key: "html-css", label: "HTML/CSS", icon: Code },
      { key: "react", label: "React", icon: Eye },
      { key: "complete", label: "Complete", icon: CheckCircle }
    ];

    return (
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.key;
            const isCompleted = steps.findIndex(s => s.key === currentStep) > index;
            
            return (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive 
                    ? "border-blue-500 bg-blue-50 text-blue-600" 
                    : isCompleted 
                    ? "border-green-500 bg-green-50 text-green-600"
                    : "border-gray-300 bg-gray-50 text-gray-400"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                }`}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-300 mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentStep) {
      case "requirements":
        return (
          <ComponentRequirementsForm
            onSubmit={handleRequirementsSubmit}
            onCancel={() => setCurrentStep("requirements")}
            isLoading={isGenerating}
          />
        );

      case "html-css":
        return (
          <HtmlCssEditor
            html={generatedHtml}
            requirements={requirements!}
            onSave={handleHtmlSave}
            onCancel={handleReset}
            onGenerateReact={handleGenerateReact}
            onAddToCanvas={handleAddToCanvas}
            onUpdateRequirements={(req) => setRequirements(req)}
          />
        );

      case "react":
        return (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                React Component Generated
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{requirements?.componentType}</Badge>
                <Badge variant="secondary">React Component</Badge>
              </div>

              <div className="border rounded-md bg-gray-50">
                <div className="flex justify-between items-center p-3 border-b bg-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">Generated React Code:</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowCodeModal(true)}
                    >
                      🔍 View Full Code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedReactCode);
                        alert('Code copied to clipboard!');
                      }}
                    >
                      📋 Copy
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <div 
                    className="p-4 overflow-auto bg-white border rounded-b-md"
                    style={{ 
                      maxHeight: '400px',
                      minHeight: '200px',
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace'
                    }}
                  >
                    <pre className="text-xs leading-relaxed whitespace-pre-wrap text-gray-800 m-0">
                      {generatedReactCode}
                    </pre>
                  </div>
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded shadow">
                    {generatedReactCode.split('\n').length} lines
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button variant="outline" onClick={handleReset}>
                  Start Over
                </Button>
                <Button 
                  onClick={handleAddComponent}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add to Canvas
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "complete":
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Component Added Successfully!</h3>
              <p className="text-gray-600 mb-4">
                Your component has been added to the canvas. You can now drag it to any frame or position.
              </p>
              <Button onClick={handleReset} variant="outline">
                Generate Another Component
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderStepIndicator()}
      
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {renderContent()}

      {/* Code Viewer Modal */}
      {generatedReactCode && (
        <CodeViewerModal
          isOpen={showCodeModal}
          onClose={() => setShowCodeModal(false)}
          code={generatedReactCode}
          title={`${requirements?.componentType} React Component`}
          componentType={requirements?.componentType || "Generated"}
        />
      )}
    </div>
  );
} 