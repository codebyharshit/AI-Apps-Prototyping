"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wand2, PlusCircle, Eye, Copy, Download, Code, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ComponentData, calculateNaturalComponentSize } from "@/lib/utils";
// Import react-live directly
import { LiveProvider, LivePreview, LiveError } from 'react-live';
// Fallback dynamic imports
import dynamic from 'next/dynamic';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TextOutput } from "@/components/ui/textoutput";
import { ImageUpload } from "@/components/ui/imageupload";
import { CodeViewerModal } from "@/components/CodeViewerModal";
import { EnhancedAIComponentGenerator } from "./EnhancedAIComponentGenerator";
import { ComponentRequirements } from "./ComponentRequirementsForm";
import { Switch } from "@/components/ui/switch";

// Fallback components if direct imports fail
const DynamicLiveProvider = dynamic(() => import('react-live').then(mod => mod.LiveProvider), { ssr: false });
const DynamicLivePreview = dynamic(() => import('react-live').then(mod => mod.LivePreview), { ssr: false });
const DynamicLiveError = dynamic(() => import('react-live').then(mod => mod.LiveError), { ssr: false });

interface AIComponentGeneratorProps {
  onComponentGenerated: (component: ComponentData) => void;
  onAddHtmlCssToCanvas?: (html: string, requirements: ComponentRequirements) => void;
  isEmbedded?: boolean; // New prop to control header display
  useEnhancedWorkflow?: boolean; // Prop to control enhanced workflow from parent
  onEnhancedWorkflowChange?: (enabled: boolean) => void; // Callback for parent
}

export function AIComponentGenerator({ 
  onComponentGenerated, 
  onAddHtmlCssToCanvas, 
  isEmbedded = false,
  useEnhancedWorkflow: externalUseEnhancedWorkflow,
  onEnhancedWorkflowChange
}: AIComponentGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [componentType, setComponentType] = useState<string>("Input");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  // State to track if we should fall back to dynamic imports
  const [useDynamicFallback, setUseDynamicFallback] = useState(false);
  // State to track enhanced workflow - use external if provided, otherwise internal
  const [internalUseEnhancedWorkflow, setInternalUseEnhancedWorkflow] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const useEnhancedWorkflow = externalUseEnhancedWorkflow !== undefined ? externalUseEnhancedWorkflow : internalUseEnhancedWorkflow;
  
  // Handle enhanced workflow changes
  const handleEnhancedWorkflowChange = (enabled: boolean) => {
    if (onEnhancedWorkflowChange) {
      onEnhancedWorkflowChange(enabled);
    } else {
      setInternalUseEnhancedWorkflow(enabled);
    }
  };

  // Use effect to handle client-side initialization
  useEffect(() => {
    setMounted(true);
    // If there's an error with direct imports, we'll fall back to dynamic
    try {
      // Check if LiveProvider is available
      if (typeof LiveProvider !== 'function') {
        setUseDynamicFallback(true);
      }
    } catch (error) {
      console.error('Error initializing react-live:', error);
      setUseDynamicFallback(true);
    }
  }, []);

  // Clean the generated code for preview
  const cleanCode = (code: string) => {
    try {
      // MODERATE CLEANING - Only remove obvious descriptive text patterns, not valid code
      let cleaned = code.trim();
      
      const descriptivePatterns = [
        /^[\s\S]*?(Create|Here's|This is|Building|Making|Let me create|I'll create|Generate)\s+a\s+React\s+component[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im,
        /^[\s\S]*?\*\*[^*]+\*\*[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im,
        /^[\s\S]*?(?:- [^\n]*\n){2,}(?=const\s+\w+\s*=|function\s+\w+)/im
      ];
      
      let hasRemovedText = false;
      for (const pattern of descriptivePatterns) {
        const originalLength = cleaned.length;
        cleaned = cleaned.replace(pattern, '');
        if (cleaned.length < originalLength) {
          console.log(`Generator: Removed descriptive pattern, saved ${originalLength - cleaned.length} chars`);
          hasRemovedText = true;
        }
      }
      
      // Only use aggressive cleaning as last resort
      if (!hasRemovedText && cleaned.includes('Create a React component')) {
      const constMatch = cleaned.match(/const\s+\w+\s*=/);
      if (constMatch) {
        const constIndex = cleaned.indexOf(constMatch[0]);
          if (constIndex > 0 && constIndex < cleaned.length * 0.3) {
            console.log(`Generator: Conservative removal of ${constIndex} characters`);
          cleaned = cleaned.substring(constIndex);
          }
        }
      }
      
      // Remove import statements as we provide components via scope
      cleaned = cleaned.replace(/import.*?from.*?;(\r\n|\r|\n)/g, '');
      
      // Remove export statements
      cleaned = cleaned.replace(/export\s+default\s+/g, '');
      cleaned = cleaned.replace(/export\s+const\s+/g, 'const ');
      
      // CRITICAL: Fix incomplete const declarations followed by stray JSX before render calls
      // This handles cases like: "const\n        </div>}\n\nrender(<Component />);"
      cleaned = cleaned.replace(/\s+(const|let|var)\s*\n[\s\S]*?(?=render\()/g, '\n\n');
      
      // CRITICAL: Fix stray JSX syntax after render calls - this is the main issue!
      // Remove any stray JSX closing tags after render() calls
      cleaned = cleaned.replace(/render\([^)]+\);\s*(<\/[^>]+>;\s*)+/g, (match) => {
        const renderCallMatch = match.match(/render\([^)]+\);/);
        if (renderCallMatch) {
          const renderCall = renderCallMatch[0];
          console.log('AIComponentGenerator: Fixed stray JSX after render call:', match.replace(renderCall, ''));
          return renderCall;
        }
        return match;
      });
      
      // Remove any stray JSX closing tags at the end of the file
      cleaned = cleaned.replace(/\s*<\/[^>]+>;\s*$/g, '');
      
      // Remove any stray JSX opening or closing tags not within proper JSX context
      cleaned = cleaned.replace(/^[^{]*<\/[^>]+>;\s*$/gm, '');
      
      // Fix common syntax errors that might come from AI generation
      // Fix incomplete className strings with double braces
      cleaned = cleaned.replace(/bg-opacity}}/g, 'bg-opacity-50');
      cleaned = cleaned.replace(/opacity}}/g, 'opacity-50');
      
      // Fix incomplete JSX tags
      cleaned = cleaned.replace(/className="[^"]*}}$/gm, (match) => {
        const cleanMatch = match.replace(/}}$/, '');
        return cleanMatch + (cleanMatch.endsWith('"') ? '' : '"');
      });
      
      // Fix incomplete div tags at the end
      cleaned = cleaned.replace(/<div className="[^"]*}}\s*$/gm, (match) => {
        const cleanMatch = match.replace(/}}\s*$/, '');
        return cleanMatch + '"></div>';
      });
      
      // Ensure proper closing of JSX elements by counting tags
      const openTags = (cleaned.match(/<[^/][^>]*[^/]>/g) || []).filter(tag => !tag.includes('/>'));
      const closeTags = (cleaned.match(/<\/[^>]+>/g) || []);
      
      // Add missing closing div tags if needed
      if (openTags.length > closeTags.length) {
        const missingTags = openTags.length - closeTags.length;
        for (let i = 0; i < missingTags; i++) {
          cleaned += '\n        </div>';
        }
      }
      
      // Ensure the code has proper closing brackets and parentheses
      let openBraces = (cleaned.match(/{/g) || []).length;
      let closeBraces = (cleaned.match(/}/g) || []).length;
      while (openBraces > closeBraces) {
        cleaned += '}';
        closeBraces++;
      }
      
      // Count and fix parentheses
      let openParens = (cleaned.match(/\(/g) || []).length;
      let closeParens = (cleaned.match(/\)/g) || []).length;
      while (openParens > closeParens) {
        cleaned += ')';
        closeParens++;
      }
      
      // Make sure function has a return statement if it doesn't already
      if (cleaned.includes('=>') && !cleaned.includes('return')) {
        // Only add if there isn't already a return statement
        cleaned = cleaned.replace(/(\s*=>\s*{)(?!\s*return)/g, '$1 return (');
        
        // Check if we need to add a closing parenthesis for the return
        const lastBraceIndex = cleaned.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          cleaned = cleaned.slice(0, lastBraceIndex) + ');' + cleaned.slice(lastBraceIndex);
        }
      }
      
      // Extract the component name for render call
      const componentMatch = cleaned.match(/const\s+(\w+)\s*=/) || 
                             cleaned.match(/function\s+(\w+)\s*\(/) ||
                             ['', 'Component']; // fallback
      const componentName = componentMatch[1] || 'Component';
      
      // CRITICAL: Add render call at the end for noInline mode - ALWAYS
      if (!cleaned.includes('render(')) {
        cleaned += `\n\nrender(<${componentName} />);`;
        console.log(`AIComponentGenerator: Added missing render call for ${componentName}`);
      }
      
      // FINAL CLEANUP: Remove any content after the render call (most common cause of syntax errors)
      cleaned = cleaned.replace(/(render\([^)]+\);)[\s\S]*$/g, '$1');
      
      // Ensure the code ends with a semicolon or closing brace
      if (!cleaned.trim().endsWith(';') && !cleaned.trim().endsWith('}')) {
        cleaned += ';';
      }
      
      return cleaned;
    } catch (err) {
      console.error('Error cleaning code:', err);
      return code; // Return original code if cleaning fails
    }
  };

  // For live preview
  const scope = {
    React,
    useState,
    useEffect: React.useEffect,
    Button,
    Input,
    Textarea,
    Label,
    Checkbox,
    TextOutput,
    ImageUpload,
    // Provide a default externalProps object for react-live previews.
    // Many generated components render with {...externalProps} per API spec.
    externalProps: {
      content: "",
      className: "",
      value: "",
      onChange: () => {},
    },
  };

  const handleGenerate = async () => {
    if (!prompt) {
      setError("Please enter a prompt to generate a component");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setShowPreview(false);
    
    // Show canvas loading overlay
    window.dispatchEvent(new CustomEvent('showCanvasLoading', {
      detail: { 
        isLoading: true, 
        message: 'Generating AI Component...', 
        step: 'Analyzing your prompt...' 
      }
    }));
    
    try {
      const response = await fetch("/api/ai/generate-component", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt, 
          componentType 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate component");
      }

      // Update loading step
      window.dispatchEvent(new CustomEvent('showCanvasLoading', {
        detail: { 
          isLoading: true, 
          message: 'Generating AI Component...', 
          step: 'Validating generated code...' 
        }
      }));

      // Validate the generated code for common errors
      try {
        // Simple validation - check for mismatched braces
        const codeToValidate = data.component;
        const openBraces = (codeToValidate.match(/{/g) || []).length;
        const closeBraces = (codeToValidate.match(/}/g) || []).length;
        
        if (openBraces !== closeBraces) {
          console.warn("Generated code has mismatched braces, attempting to fix...");
        }
      } catch (validationErr) {
        console.warn("Code validation warning:", validationErr);
      }

      setGeneratedCode(data.component);
      setShowPreview(true);
      
      // Hide canvas loading overlay
      window.dispatchEvent(new CustomEvent('showCanvasLoading', {
        detail: { isLoading: false }
      }));
      
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

  const handleAddComponent = () => {
    if (!generatedCode) {
      setError("No component has been generated yet");
      return;
    }

    console.log("Creating new component with generated code");
    
    // Calculate natural size based on the generated code
    const naturalSize = calculateNaturalComponentSize(generatedCode, componentType);
    
    // Create a new component data object that will be automatically attached to a frame
    const newComponent: ComponentData = {
      id: uuidv4(),
      type: `AI${componentType}`,
      // Initial position - will be adjusted by automatic frame attachment logic
      position: { x: 100, y: 100 },
      // Use natural size instead of fixed dimensions
      size: naturalSize,
      properties: {
        generatedCode: generatedCode,
        prompt: prompt,
        componentType: componentType,
        isNewGeneration: true,
        lastGenerated: new Date().toISOString()
      }
      // frameId will be set by automatic frame attachment logic in Editor
    };
    
    console.log("New component created:", newComponent);
    console.log("Component position:", newComponent.position);
    console.log("Component size:", newComponent.size);
    
    try {
      // Add the component to the canvas
      onComponentGenerated(newComponent);
      console.log("onComponentGenerated callback called");
      
      // CRITICAL: Dispatch reloadComponents event to automatically refresh the canvas
      // This eliminates the need for manual page refresh
      setTimeout(() => {
        console.log('🔄 Dispatching reloadComponents event for automatic refresh...');
        const reloadEvent = new CustomEvent('reloadComponents', {
          detail: { 
            componentId: newComponent.id, 
            newCode: generatedCode,
            autoRefresh: true 
          }
        });
        window.dispatchEvent(reloadEvent);
        console.log('✅ reloadComponents event dispatched - canvas will refresh automatically');
      }, 200); // Small delay to ensure component is fully added
      
      // Provide clear visual feedback
      setError(null);
      // Reset the prompt and generated code so user knows the component was added
      setPrompt("");
      setGeneratedCode(null);
      setShowPreview(false);
      
      // Show success message with frame attachment info
      const successMessage = "✅ Component added to canvas! It has been automatically attached to an available frame. You can drag it to other frames or reposition it as needed.";
      alert(successMessage);
    } catch (err) {
      console.error("Error adding component to canvas:", err);
      setError("Error adding component to canvas");
    }
  };

  // If enhanced workflow is enabled, show the enhanced component
  if (useEnhancedWorkflow) {
    return (
      <Card className={`mb-4 ${isEmbedded ? 'max-w-none shadow-none border-0' : 'max-w-4xl mx-auto'}`}>
        {!isEmbedded && (
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-800">Generate AI Component</CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">Enhanced Workflow</span>
                <Switch
                  checked={useEnhancedWorkflow}
                  onCheckedChange={handleEnhancedWorkflowChange}
                />
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className={isEmbedded ? 'p-4' : 'p-6'}>
          <EnhancedAIComponentGenerator 
            onComponentGenerated={onComponentGenerated} 
            onAddHtmlCssToCanvas={onAddHtmlCssToCanvas}
          />
        </CardContent>
      </Card>
    );
  }

  // Original workflow
  return (
    <Card className={`mb-6 w-full ${isEmbedded ? 'max-w-none shadow-none border-0' : 'max-w-6xl mx-auto shadow-lg border-0'} bg-gradient-to-br from-white to-gray-50`}>
      {!isEmbedded && (
        <CardHeader className="pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-gray-800 mb-3">Generate AI Component</CardTitle>
              <p className="text-gray-600 text-base">Create custom React components with AI assistance</p>
            </div>
            <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-xl shadow-sm border border-blue-200">
              <span className="text-base text-gray-700 font-medium">Enhanced Workflow</span>
              <Switch
                checked={useEnhancedWorkflow}
                onCheckedChange={handleEnhancedWorkflowChange}
              />
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={`${isEmbedded ? 'p-6' : 'p-8'} space-y-8`}>
        {/* Input Section */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="component-type" className="text-base font-semibold text-gray-700">
                Component Type
              </Label>
              <Select 
                value={componentType} 
                onValueChange={setComponentType}
                defaultValue="Input"
              >
                <SelectTrigger id="component-type" className="h-14 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base">
                  <SelectValue placeholder="Select component type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Input">Input</SelectItem>
                  <SelectItem value="Output">Output</SelectItem>
                  <SelectItem value="Container">Container</SelectItem>
                  <SelectItem value="Form">Form</SelectItem>
                  <SelectItem value="Display">Display</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="component-prompt" className="text-base font-semibold text-gray-700">
                Component Description
              </Label>
              <div className="relative">
                <Textarea
                  id="component-prompt"
                  placeholder="Describe your component idea..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="h-32 resize-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base p-4"
                />
                <div className="absolute bottom-4 right-4 text-sm text-gray-400 bg-white px-2 py-1 rounded">
                  {prompt.length}/500
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-base text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt}
          className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
        >
          <Wand2 className="mr-4 h-6 w-6" />
          {isGenerating ? "Generating..." : "Generate Component"}
        </Button>

        {/* Generated Content */}
        {generatedCode && (
          <div className="space-y-8">
            {/* Live Preview */}
            {showPreview && mounted && (
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">Live Preview</h3>
                  <div className="flex items-center gap-3 text-base text-gray-500">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Live
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 overflow-hidden">
                  {useDynamicFallback ? (
                    <DynamicLiveProvider 
                      key={`preview-${Date.now()}`}
                      code={cleanCode(generatedCode)} 
                      scope={scope}
                      noInline={true}
                    >
                      <DynamicLiveError className="text-sm text-red-500 p-4 bg-red-50 my-3 rounded-lg border border-red-200" />
                      <DynamicLivePreview className="ai-live-preview min-h-[300px] flex items-center justify-center" />
                    </DynamicLiveProvider>
                  ) : (
                    <LiveProvider 
                      key={`preview-${Date.now()}`} 
                      code={cleanCode(generatedCode)} 
                      scope={scope}
                      noInline={true}
                    >
                      <LiveError className="text-sm text-red-500 p-4 bg-red-50 my-3 rounded-lg border border-red-200" />
                      <LivePreview className="ai-live-preview min-h-[300px] flex items-center justify-center" />
                    </LiveProvider>
                  )}
                </div>
              </div>
            )}

            {/* Code Display */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Generated Code</h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 px-4 text-base border-gray-300 hover:bg-gray-50"
                    onClick={() => setShowCodeModal(true)}
                  >
                    <Code className="mr-2 h-4 w-4" />
                    View Full
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 px-4 text-base border-gray-300 hover:bg-gray-50"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      alert('Code copied to clipboard!');
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 px-4 text-base border-gray-300 hover:bg-gray-50"
                    onClick={() => {
                      const blob = new Blob([generatedCode], { type: 'text/javascript' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${componentType}Component.js`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <div 
                  className="p-8 overflow-auto bg-gray-900 text-gray-100"
                  style={{ 
                    maxHeight: '500px',
                    minHeight: '300px',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace'
                  }}
                >
                  <pre className="text-base leading-relaxed whitespace-pre-wrap m-0">
                    {generatedCode}
                  </pre>
                </div>
                <div className="absolute bottom-4 right-4 text-sm text-gray-400 bg-gray-800 px-3 py-2 rounded">
                  {generatedCode.split('\n').length} lines
                </div>
              </div>
            </div>

            {/* Add to Canvas Button */}
            <Button 
              onClick={handleAddComponent}
              className="w-full h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-xl shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
            >
              <PlusCircle className="mr-4 h-6 w-6" />
              Add Component to Canvas
            </Button>
          </div>
        )}
      </CardContent>
      
      {/* Code Viewer Modal */}
      {generatedCode && (
        <CodeViewerModal
          isOpen={showCodeModal}
          onClose={() => setShowCodeModal(false)}
          code={generatedCode}
          title={`${componentType} Component Code`}
          componentType={componentType}
        />
      )}
    </Card>
  );
} 