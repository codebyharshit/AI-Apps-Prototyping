"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Eye, 
  Code, 
  Download, 
  Copy, 
  CheckCircle,
  Edit3,
  MessageSquare,
  Maximize2,
  ExternalLink,
  ArrowUp,
  Loader2
} from "lucide-react";
import { ComponentRequirements, ComponentRequirementsForm } from "./ComponentRequirementsForm";

interface HtmlCssEditorProps {
  html: string;
  onSave: (html: string) => void;
  onCancel?: () => void;
  onGenerateReact?: (html: string) => void;
  onAddToCanvas?: (html: string, requirements: ComponentRequirements) => void;
  requirements?: ComponentRequirements;
  onUpdateRequirements?: (requirements: ComponentRequirements) => void;
}

export function HtmlCssEditor({ 
  html, 
  onSave, 
  onCancel,
  onGenerateReact,
  onAddToCanvas, 
  requirements,
  onUpdateRequirements 
}: HtmlCssEditorProps) {
  const [editedHtml, setEditedHtml] = useState(html);
  const [currentRequirements, setCurrentRequirements] = useState<ComponentRequirements | null>(requirements || null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [showDirectEdit, setShowDirectEdit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    setEditedHtml(html);
  }, [html]);

  // Add keyboard shortcut for maximizing preview (F11 or Ctrl+M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11' || (e.ctrlKey && e.key === 'm')) {
        e.preventDefault();
        setIsPreviewMaximized(!isPreviewMaximized);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewMaximized]);

  // Extract HTML and CSS from the full HTML document
  const extractHtmlAndCss = (fullHtml: string) => {
    const htmlMatch = fullHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const cssMatch = fullHtml.match(/<style[^>]*>([\s\S]*)<\/style>/i);
    
    const htmlContent = htmlMatch ? htmlMatch[1] : fullHtml;
    const cssContent = cssMatch ? cssMatch[1] : '';
    
    return { htmlContent, cssContent };
  };

  // Create scrollable HTML content for iframe
  const createScrollableHtml = (html: string) => {
    // Ensure the body has proper scrolling styles
    let scrollableHtml = html;
    
    // Add scrolling styles to body if not present
    if (!scrollableHtml.includes('overflow-y')) {
      scrollableHtml = scrollableHtml.replace(
        /<body([^>]*)>/i,
        '<body$1 style="min-height: 100vh; overflow-y: auto; padding: 20px;">'
      );
    }
    
    // Add viewport meta tag if not present
    if (!scrollableHtml.includes('viewport')) {
      scrollableHtml = scrollableHtml.replace(
        /<head>/i,
        '<head><meta name="viewport" content="width=device-width, initial-scale=1.0">'
      );
    }
    
    return scrollableHtml;
  };

  const { htmlContent, cssContent } = extractHtmlAndCss(editedHtml);

  const handleSave = () => {
    onSave(editedHtml);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([editedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'component.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddToCanvas = () => {
    if (onAddToCanvas) {
      if (currentRequirements) {
        onAddToCanvas(editedHtml, currentRequirements);
      } else {
        // Create default requirements if none exist
        const defaultRequirements: ComponentRequirements = {
          idea: "Generated HTML/CSS Component",
          componentType: "Custom Component",
          features: [],
          styling: "Modern and Clean",
          targetAudience: "General Users",
          additionalNotes: "Component generated from HTML/CSS editor"
        };
        onAddToCanvas(editedHtml, defaultRequirements);
      }
    }
  };

  const handleMaximizePreview = () => {
    setIsPreviewMaximized(!isPreviewMaximized);
  };

  const handleOpenInNewWindow = () => {
    const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    if (newWindow) {
      // Ensure the HTML content has proper scrolling
      const scrollableHtml = editedHtml.replace(
        /<body([^>]*)>/i,
        '<body$1 style="min-height: 100vh; overflow-y: auto;">'
      );
      newWindow.document.write(scrollableHtml);
      newWindow.document.title = 'Component Preview';
      newWindow.document.close();
    }
  };

  const handleScrollToTop = () => {
    const iframe = document.querySelector('iframe[title="Component Preview"]') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleUpdateRequirements = async (newRequirements: ComponentRequirements) => {
    setCurrentRequirements(newRequirements);
    if (onUpdateRequirements) {
      onUpdateRequirements(newRequirements);
    }
    setShowPromptEditor(false);
    
    // Regenerate the component with new requirements
    setIsRegenerating(true);
    try {
      const response = await fetch('/api/ai/generate-html-css', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRequirements)
      });

      if (response.ok) {
        const result = await response.json();
        setEditedHtml(result.html);
        console.log('✅ Component regenerated with updated requirements');
      } else {
        console.error('❌ Failed to regenerate component');
        alert('Failed to regenerate component with new requirements');
      }
    } catch (error) {
      console.error('❌ Error regenerating component:', error);
      alert('Error regenerating component with new requirements');
    } finally {
      setIsRegenerating(false);
    }
  };

  const updateHtmlContent = (newHtmlContent: string) => {
    const newFullHtml = editedHtml.replace(
      /<body[^>]*>[\s\S]*<\/body>/i,
      `<body>${newHtmlContent}</body>`
    );
    setEditedHtml(newFullHtml);
  };

  const updateCssContent = (newCssContent: string) => {
    if (editedHtml.includes('<style>')) {
      const newFullHtml = editedHtml.replace(
        /<style[^>]*>[\s\S]*<\/style>/i,
        `<style>${newCssContent}</style>`
      );
      setEditedHtml(newFullHtml);
    } else {
      // Insert style tag in head if it doesn't exist
      const newFullHtml = editedHtml.replace(
        /<\/head>/i,
        `<style>${newCssContent}</style>\n</head>`
      );
      setEditedHtml(newFullHtml);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium">HTML/CSS Editor</span>
          <Badge variant="outline" className="text-xs">Enhanced</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPromptEditor(true)}
            className="flex items-center gap-1"
          >
            <MessageSquare className="h-3 w-3" />
            Edit Prompt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDirectEdit(true)}
            className="flex items-center gap-1"
          >
            <Edit3 className="h-3 w-3" />
            Direct Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-1"
          >
            {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-1"
          >
            <Download className="h-3 w-3" />
            Download
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="flex items-center gap-1"
            >
              Cancel
            </Button>
          )}
          {onGenerateReact && (
            <Button
              size="sm"
              onClick={() => onGenerateReact(editedHtml)}
              className="flex items-center gap-1"
            >
              Generate React
            </Button>
          )}
          {onAddToCanvas && (
            <Button
              size="sm"
              onClick={handleAddToCanvas}
              className="flex items-center gap-1"
            >
              Add to Canvas
            </Button>
          )}
        </div>
      </div>

      {/* Main Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Component Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="preview" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="html" className="flex items-center gap-1">
                <Code className="h-3 w-3" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="css" className="flex items-center gap-1">
                <Code className="h-3 w-3" />
                CSS
              </TabsTrigger>
              <TabsTrigger value="full" className="flex items-center gap-1">
                <Code className="h-3 w-3" />
                Full Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              <div className={`border rounded-lg overflow-hidden ${isPreviewMaximized ? 'fixed inset-4 z-50 bg-white shadow-2xl' : ''}`}>
                <div className="bg-gray-100 px-3 py-2 border-b flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Live Preview
                    {isRegenerating && (
                      <span className="ml-2 text-blue-600 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Regenerating...
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenInNewWindow}
                      className="h-6 px-2"
                      title="Open in new window"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMaximizePreview}
                      className="h-6 px-2"
                      title={isPreviewMaximized ? "Minimize" : "Maximize"}
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                    {isPreviewMaximized && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMaximizePreview}
                        className="h-6 px-2"
                        title="Close"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>
                <div className={`${isPreviewMaximized ? 'h-[calc(100vh-8rem)]' : 'h-96'} overflow-auto relative`}>
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      Scroll to see full component
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleScrollToTop}
                      className="h-6 px-2 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                      title="Scroll to top"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                  </div>
                  <iframe
                    srcDoc={createScrollableHtml(editedHtml)}
                    className="w-full min-h-full border-0"
                    title="Component Preview"
                    style={{ minHeight: '100%' }}
                    scrolling="yes"
                  />
                </div>
              </div>
              {isPreviewMaximized && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleMaximizePreview} />
              )}
            </TabsContent>

            <TabsContent value="html" className="mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">HTML Structure</label>
                <Textarea
                  value={htmlContent}
                  onChange={(e) => updateHtmlContent(e.target.value)}
                  className="h-80 font-mono text-sm"
                  placeholder="Edit HTML structure..."
                />
              </div>
            </TabsContent>

            <TabsContent value="css" className="mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">CSS Styles</label>
                <Textarea
                  value={cssContent}
                  onChange={(e) => updateCssContent(e.target.value)}
                  className="h-80 font-mono text-sm"
                  placeholder="Edit CSS styles..."
                />
              </div>
            </TabsContent>

            <TabsContent value="full" className="mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full HTML Document</label>
                <Textarea
                  value={editedHtml}
                  onChange={(e) => setEditedHtml(e.target.value)}
                  className="h-80 font-mono text-sm"
                  placeholder="Edit full HTML document..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between mt-4 gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>💡 Tip: Press F11 or Ctrl+M to maximize preview • Scroll to see the complete component</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Editor Dialog */}
      {showPromptEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Component Requirements</h3>
              <Button variant="outline" onClick={() => setShowPromptEditor(false)}>
                ✕
              </Button>
            </div>
            <ComponentRequirementsForm
              onSubmit={handleUpdateRequirements}
              onCancel={() => setShowPromptEditor(false)}
              initialRequirements={currentRequirements || undefined}
              isLoading={isRegenerating}
            />
          </div>
        </div>
      )}

      {/* Direct Edit Dialog */}
      {showDirectEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Direct HTML/CSS Edit</h3>
              <Button variant="outline" onClick={() => setShowDirectEdit(false)}>
                Close
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">HTML</label>
                <Textarea
                  value={htmlContent}
                  onChange={(e) => updateHtmlContent(e.target.value)}
                  className="h-96 font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">CSS</label>
                <Textarea
                  value={cssContent}
                  onChange={(e) => updateCssContent(e.target.value)}
                  className="h-96 font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowDirectEdit(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowDirectEdit(false)}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Preview Button */}
      {!isPreviewMaximized && (
        <div className="fixed bottom-4 right-4 z-30">
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleMaximizePreview}
              size="sm"
              className="rounded-full w-12 h-12 shadow-lg"
              title="Maximize Preview (F11)"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleOpenInNewWindow}
              size="sm"
              variant="outline"
              className="rounded-full w-12 h-12 shadow-lg"
              title="Open in New Window"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 