"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Download, Maximize2, Minimize2 } from "lucide-react";

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  title?: string;
  componentType?: string;
}

export function CodeViewerModal({ 
  isOpen, 
  onClose, 
  code, 
  title = "Generated Component Code",
  componentType = "Component"
}: CodeViewerModalProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      alert('Code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${componentType}Component.js`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${isFullScreen ? 'max-w-full h-full m-0 rounded-none' : 'max-w-4xl max-h-[80vh]'} p-0`}
      >
        <DialogHeader className="p-4 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-8"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullScreen}
                className="h-8"
              >
                {isFullScreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <div 
            className="h-full overflow-auto p-4 bg-gray-900 text-green-400"
            style={{ 
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
              fontSize: '13px',
              lineHeight: '1.6'
            }}
          >
            <pre className="whitespace-pre-wrap m-0 text-green-300">
              {code}
            </pre>
          </div>
        </div>
        
        <div className="p-3 border-t bg-gray-50 text-xs text-gray-600 flex justify-between items-center">
          <span>
            Lines: {code.split('\n').length} • 
            Characters: {code.length} • 
            Type: {componentType}
          </span>
          <span className="text-gray-400">
            Use Ctrl+F to search within the code
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
} 