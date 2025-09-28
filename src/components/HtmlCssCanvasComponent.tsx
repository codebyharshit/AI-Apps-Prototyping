"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Code, 
  Edit3, 
  Play, 
  Settings,
  Eye,
  Download,
  Move
} from "lucide-react";
import { ComponentRequirements } from "./ComponentRequirementsForm";
import { VisualManipulationTools } from "./VisualManipulationTools";
import { ElementManipulator } from "./ElementManipulator";

interface HtmlCssCanvasComponentProps {
  html: string;
  requirements: ComponentRequirements;
  onConvertToReact: (html: string) => void;
  onUpdateHtml?: (html: string) => void;
  className?: string;
}

export function HtmlCssCanvasComponent({ 
  html, 
  requirements, 
  onConvertToReact,
  onUpdateHtml,
  className = ""
}: HtmlCssCanvasComponentProps) {
  const [currentHtml, setCurrentHtml] = useState(html);
  const [showEditor, setShowEditor] = useState(false);
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [showElementManipulator, setShowElementManipulator] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setCurrentHtml(html);
  }, [html]);

  const handleHtmlChange = (newHtml: string) => {
    setCurrentHtml(newHtml);
    if (onUpdateHtml) {
      onUpdateHtml(newHtml);
    }
    setPreviewKey(prev => prev + 1);
  };

  const extractCss = (htmlString: string) => {
    const styleMatch = htmlString.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    return styleMatch ? styleMatch[1] : '';
  };

  const extractHtmlBody = (htmlString: string) => {
    const bodyMatch = htmlString.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return bodyMatch ? bodyMatch[1] : htmlString;
  };

  const css = extractCss(currentHtml);
  const htmlBody = extractHtmlBody(currentHtml);

  const downloadHtml = () => {
    const blob = new Blob([currentHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${requirements.componentType.replace(/\s+/g, '-')}-component.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`relative border rounded-lg overflow-hidden bg-white ${className}`}>
      {/* Component Header */}
      <div className="bg-gray-100 px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {requirements.componentType}
          </span>
          <Badge variant="outline" className="text-xs">HTML/CSS</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEditor(true)}
            className="h-6 px-2 text-xs"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Code Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVisualEditor(true)}
            className="h-6 px-2 text-xs"
          >
            <Move className="h-3 w-3 mr-1" />
            Visual Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowElementManipulator(true)}
            className="h-6 px-2 text-xs"
          >
            <Move className="h-3 w-3 mr-1" />
            Element Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadHtml}
            className="h-6 px-2 text-xs"
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onConvertToReact(currentHtml)}
            className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700"
          >
            <Play className="h-3 w-3 mr-1" />
            Convert to React
          </Button>
        </div>
      </div>

      {/* Component Preview */}
      <div className="relative">
        <iframe
          ref={iframeRef}
          key={previewKey}
          srcDoc={currentHtml}
          className="w-full h-full min-h-[200px] border-0"
          title="Component Preview"
          style={{ minHeight: '200px' }}
        />
      </div>

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Edit {requirements.componentType}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="html" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  HTML
                </TabsTrigger>
                <TabsTrigger value="css" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  CSS
                </TabsTrigger>
                <TabsTrigger value="full" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Full Code
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="space-y-4">
                <div className="border rounded-lg overflow-hidden bg-white">
                  <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Live Preview</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewKey(prev => prev + 1)}
                      className="h-7 text-xs"
                    >
                      Refresh
                    </Button>
                  </div>
                  <div className="p-4 min-h-[400px] max-h-[500px] overflow-auto">
                    <iframe
                      key={`preview-${previewKey}`}
                      srcDoc={currentHtml}
                      className="w-full h-full min-h-[400px] border-0"
                      title="Component Preview"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="html" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">HTML Structure</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(htmlBody)}
                  >
                    Copy HTML
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Textarea
                    value={htmlBody}
                    onChange={(e) => {
                      const newHtml = currentHtml.replace(
                        /<body[^>]*>[\s\S]*?<\/body>/i,
                        `<body>${e.target.value}</body>`
                      );
                      handleHtmlChange(newHtml);
                    }}
                    className="font-mono text-sm min-h-[400px] resize-none"
                    placeholder="HTML content..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="css" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">CSS Styles</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(css)}
                  >
                    Copy CSS
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Textarea
                    value={css}
                    onChange={(e) => {
                      const newHtml = currentHtml.replace(
                        /<style[^>]*>[\s\S]*?<\/style>/i,
                        `<style>${e.target.value}</style>`
                      );
                      handleHtmlChange(newHtml);
                    }}
                    className="font-mono text-sm min-h-[400px] resize-none"
                    placeholder="CSS styles..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="full" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Complete HTML Document</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(currentHtml)}
                  >
                    Copy Full Code
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Textarea
                    value={currentHtml}
                    onChange={(e) => handleHtmlChange(e.target.value)}
                    className="font-mono text-sm min-h-[400px] resize-none"
                    placeholder="Complete HTML document..."
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditor(false)}>
                Close
              </Button>
              <Button 
                onClick={() => onConvertToReact(currentHtml)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="h-4 w-4 mr-1" />
                Convert to React
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visual Editor Dialog */}
      <Dialog open={showVisualEditor} onOpenChange={setShowVisualEditor}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Move className="h-5 w-5" />
              Visual Edit {requirements.componentType}
            </DialogTitle>
          </DialogHeader>
          <VisualManipulationTools
            html={currentHtml}
            onUpdateHtml={handleHtmlChange}
            onClose={() => setShowVisualEditor(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Element Manipulator Dialog */}
      <Dialog open={showElementManipulator} onOpenChange={setShowElementManipulator}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Move className="h-5 w-5" />
              Element Manipulator - {requirements.componentType}
            </DialogTitle>
          </DialogHeader>
          <ElementManipulator
            html={currentHtml}
            onUpdateHtml={handleHtmlChange}
            onClose={() => setShowElementManipulator(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 