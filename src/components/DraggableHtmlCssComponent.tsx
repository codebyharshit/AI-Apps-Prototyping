"use client";

import React, { useState, useRef, useEffect } from "react";
import { HtmlCssCanvasComponent } from "./HtmlCssCanvasComponent";
import { ComponentRequirements } from "./ComponentRequirementsForm";
import { Move } from "lucide-react";

interface HtmlCssComponent {
  id: string;
  html: string;
  requirements: ComponentRequirements;
  position?: { x: number; y: number };
}

interface DraggableHtmlCssComponentProps {
  component: HtmlCssComponent;
  onConvertToReact: (html: string) => void;
  onUpdateHtml: (html: string) => void;
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  onUpdateSize?: (id: string, size: { width: number; height: number }) => void;
  viewportState?: {
    zoomLevel: number;
    panOffset: { x: number; y: number };
  };
}

export function DraggableHtmlCssComponent({ 
  component, 
  onConvertToReact, 
  onUpdateHtml, 
  onUpdatePosition,
  onUpdateSize,
  viewportState
}: DraggableHtmlCssComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  const position = component.position || { x: 100, y: 100 };
  const size = component.size || { width: 400, height: 300 };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        const zoomLevel = viewportState?.zoomLevel || 1;
        const panOffset = viewportState?.panOffset || { x: 0, y: 0 };
        
        // Convert screen coordinates to canvas coordinates
        const canvasX = (event.clientX - panOffset.x) / zoomLevel;
        const canvasY = (event.clientY - panOffset.y) / zoomLevel;
        
        const newX = canvasX - dragOffset.x;
        const newY = canvasY - dragOffset.y;
        
        onUpdatePosition(component.id, { x: newX, y: newY });
      } else if (isResizing && onUpdateSize) {
        const zoomLevel = viewportState?.zoomLevel || 1;
        const panOffset = viewportState?.panOffset || { x: 0, y: 0 };
        
        // Convert screen coordinates to canvas coordinates for resizing
        const canvasX = (event.clientX - panOffset.x) / zoomLevel;
        const canvasY = (event.clientY - panOffset.y) / zoomLevel;
        
        let newWidth = size.width;
        let newHeight = size.height;
        
        if (resizeDirection.includes('e')) {
          newWidth = canvasX - position.x;
        }
        if (resizeDirection.includes('s')) {
          newHeight = canvasY - position.y;
        }
        
        onUpdateSize(component.id, { 
          width: Math.max(200, newWidth), 
          height: Math.max(150, newHeight) 
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeDirection, viewportState, onUpdatePosition, onUpdateSize, component.id, position.x, position.y, size.width, size.height]);

  const handleMouseDown = (event: React.MouseEvent) => {
    // Allow dragging from the drag handle or the container
    const target = event.target as HTMLElement;
    const isDragHandle = target.closest('.drag-handle');
    const isContainer = target === containerRef.current;
    
    if (!isDragHandle && !isContainer) return;
    
    setIsDragging(true);
    
    // Calculate drag offset relative to the component's current position
    const zoomLevel = viewportState?.zoomLevel || 1;
    const panOffset = viewportState?.panOffset || { x: 0, y: 0 };
    
    // Convert screen coordinates to canvas coordinates
    const canvasX = (event.clientX - panOffset.x) / zoomLevel;
    const canvasY = (event.clientY - panOffset.y) / zoomLevel;
    
    setDragOffset({
      x: canvasX - position.x,
      y: canvasY - position.y
    });
    
    event.preventDefault();
    event.stopPropagation();
  };



  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
  };

  const handleResizeStart = (event: React.MouseEvent, direction: string) => {
    setIsResizing(true);
    setResizeDirection(direction);
    event.preventDefault();
    event.stopPropagation();
  };



  return (
    <div
      ref={containerRef}
      className={`absolute cursor-move transition-all duration-200 ${isDragging ? 'shadow-2xl scale-105' : 'shadow-lg'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: isDragging ? 2000 : 1000
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="relative w-full h-full">
        {/* Drag Handle */}
        <div className="drag-handle absolute top-0 left-0 right-0 h-8 bg-blue-500 bg-opacity-30 flex items-center justify-center z-10 cursor-move hover:bg-opacity-50 transition-all duration-200 border-b border-blue-300">
          <Move className="h-4 w-4 text-blue-700" />
          <span className="text-xs text-blue-700 ml-1 font-medium">Drag to move</span>
        </div>
        
        {/* Component */}
        <div className="w-full h-full pt-6">
          <HtmlCssCanvasComponent
            html={component.html}
            requirements={component.requirements}
            onConvertToReact={onConvertToReact}
            onUpdateHtml={onUpdateHtml}
            className="w-full h-full"
          />
        </div>
        
        {/* Resize Handles */}
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 bg-opacity-70 cursor-se-resize hover:bg-opacity-90 transition-all duration-200 border border-blue-300"
          onMouseDown={(e) => handleResizeStart(e, 'se')}
        />
        <div 
          className="absolute bottom-0 left-0 w-6 h-6 bg-blue-500 bg-opacity-70 cursor-sw-resize hover:bg-opacity-90 transition-all duration-200 border border-blue-300"
          onMouseDown={(e) => handleResizeStart(e, 'sw')}
        />
        <div 
          className="absolute top-0 right-0 w-6 h-6 bg-blue-500 bg-opacity-70 cursor-ne-resize hover:bg-opacity-90 transition-all duration-200 border border-blue-300"
          onMouseDown={(e) => handleResizeStart(e, 'ne')}
        />
        <div 
          className="absolute top-0 left-0 w-6 h-6 bg-blue-500 bg-opacity-70 cursor-nw-resize hover:bg-opacity-90 transition-all duration-200 border border-blue-300"
          onMouseDown={(e) => handleResizeStart(e, 'nw')}
        />
      </div>
    </div>
  );
} 