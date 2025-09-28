'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Move, 
  MousePointer, 
  Square, 
  RotateCcw,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Trash2
} from 'lucide-react';

interface ElementPosition {
  id: string;
  element: HTMLElement;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
}

// Serializable version for localStorage (without HTMLElement reference)
interface SerializableElementPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
}

interface ElementPositionEditorProps {
  containerRef: React.RefObject<HTMLElement>;
  onPositionChange?: (elementId: string, position: ElementPosition) => void;
  onCodeRegenerate?: (positions: SerializableElementPosition[]) => void;
  className?: string;
}

export function ElementPositionEditor({ 
  containerRef, 
  onPositionChange, 
  onCodeRegenerate, 
  className 
}: ElementPositionEditorProps) {
  const [isActive, setIsActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementPosition | null>(null);
  const [elements, setElements] = useState<ElementPosition[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalPosition, setOriginalPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const selectionBoxRef = useRef<HTMLDivElement>(null);

  // Initialize overlay system
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Create overlay div
    const overlay = document.createElement('div');
    overlay.id = 'element-position-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      background: rgba(0, 0, 255, 0.05);
    `;
    
    containerRef.current.style.position = 'relative';
    containerRef.current.appendChild(overlay);
    overlayRef.current = overlay;

    // Scan for elements
    scanElements();

    return () => {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };
  }, [isActive, containerRef]);

  // Scan container for interactive elements
  const scanElements = useCallback(() => {
    if (!containerRef.current) return;

    const interactiveElements = containerRef.current.querySelectorAll(
      'button, input, textarea, select, div[id*="output"], div[id*="display"], div[id*="result"], .ai-live-preview > div > div, [data-ai-element="true"]'
    ) as NodeListOf<HTMLElement>;

    const newElements: ElementPosition[] = [];

    interactiveElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const containerRect = containerRef.current!.getBoundingClientRect();
      
      // Skip if element is too small or hidden
      if (rect.width < 10 || rect.height < 10) return;

      const elementId = element.id || `element-${index}-${Date.now()}`;
      if (!element.id) element.id = elementId;

      newElements.push({
        id: elementId,
        element,
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
        zIndex: parseInt(getComputedStyle(element).zIndex) || index,
        locked: false,
        visible: true
      });
    });

    setElements(newElements);
    console.log(`🎯 Found ${newElements.length} interactive elements for positioning`);
  }, [containerRef]);

  // Create selection overlays for each element
  useEffect(() => {
    if (!isActive || !overlayRef.current) return;

    // Clear existing overlays
    overlayRef.current.innerHTML = '';

    elements.forEach((elementPos) => {
      if (!elementPos.visible) return;

      const selectionBox = document.createElement('div');
      selectionBox.className = 'element-selection-box';
      selectionBox.style.cssText = `
        position: absolute;
        left: ${elementPos.x}px;
        top: ${elementPos.y}px;
        width: ${elementPos.width}px;
        height: ${elementPos.height}px;
        border: 2px dashed ${selectedElement?.id === elementPos.id ? '#2563eb' : '#94a3b8'};
        background: ${selectedElement?.id === elementPos.id ? 'rgba(37, 99, 235, 0.1)' : 'rgba(148, 163, 184, 0.05)'};
        pointer-events: all;
        cursor: ${elementPos.locked ? 'not-allowed' : 'move'};
        z-index: ${elementPos.zIndex + 1000};
        box-sizing: border-box;
      `;

      // Add element info label
      const label = document.createElement('div');
      label.style.cssText = `
        position: absolute;
        top: -20px;
        left: 0;
        background: #1f2937;
        color: white;
        padding: 2px 6px;
        font-size: 10px;
        border-radius: 2px;
        white-space: nowrap;
        pointer-events: none;
      `;
      label.textContent = elementPos.id;
      selectionBox.appendChild(label);

      // Add resize handles if selected
      if (selectedElement?.id === elementPos.id && !elementPos.locked) {
        ['nw', 'ne', 'sw', 'se'].forEach(direction => {
          const handle = document.createElement('div');
          handle.className = `resize-handle-${direction}`;
          handle.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: #2563eb;
            border: 1px solid white;
            cursor: ${direction === 'nw' || direction === 'se' ? 'nw-resize' : 'ne-resize'};
            ${direction.includes('n') ? 'top: -4px;' : 'bottom: -4px;'}
            ${direction.includes('w') ? 'left: -4px;' : 'right: -4px;'}
          `;
          
          // Add resize functionality
          handle.addEventListener('mousedown', (e) => {
            if (elementPos.locked) return;
            e.stopPropagation();
            startResize(e, elementPos, direction);
          });
          
          selectionBox.appendChild(handle);
        });
      }

      // Add click to select
      selectionBox.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedElement(elementPos);
        console.log(`📍 Selected element: ${elementPos.id}`);
      });

      // Add drag functionality
      selectionBox.addEventListener('mousedown', (e) => {
        if (elementPos.locked || e.target !== selectionBox) return;
        e.preventDefault();
        startDrag(e, elementPos);
      });

      overlayRef.current!.appendChild(selectionBox);
    });
  }, [elements, selectedElement, isActive]);

  // Start dragging
  const startDrag = (e: MouseEvent, elementPos: ElementPosition) => {
    setIsDragging(true);
    setSelectedElement(elementPos);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOriginalPosition({ 
      x: elementPos.x, 
      y: elementPos.y, 
      width: elementPos.width, 
      height: elementPos.height 
    });

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const newX = Math.max(0, originalPosition.x + deltaX);
      const newY = Math.max(0, originalPosition.y + deltaY);

      // Update element position
      updateElementPosition(elementPos.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Apply final position to actual element
      applyPositionToElement(elementPos.id);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Start resizing
  const startResize = (e: MouseEvent, elementPos: ElementPosition, direction: string) => {
    setIsResizing(true);
    setSelectedElement(elementPos);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOriginalPosition({ 
      x: elementPos.x, 
      y: elementPos.y, 
      width: elementPos.width, 
      height: elementPos.height 
    });

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      let newX = originalPosition.x;
      let newY = originalPosition.y;
      let newWidth = originalPosition.width;
      let newHeight = originalPosition.height;

      switch (direction) {
        case 'se': // Bottom-right
          newWidth = Math.max(20, originalPosition.width + deltaX);
          newHeight = Math.max(20, originalPosition.height + deltaY);
          break;
        case 'sw': // Bottom-left
          newX = Math.max(0, originalPosition.x + deltaX);
          newWidth = Math.max(20, originalPosition.width - deltaX);
          newHeight = Math.max(20, originalPosition.height + deltaY);
          break;
        case 'ne': // Top-right
          newY = Math.max(0, originalPosition.y + deltaY);
          newWidth = Math.max(20, originalPosition.width + deltaX);
          newHeight = Math.max(20, originalPosition.height - deltaY);
          break;
        case 'nw': // Top-left
          newX = Math.max(0, originalPosition.x + deltaX);
          newY = Math.max(0, originalPosition.y + deltaY);
          newWidth = Math.max(20, originalPosition.width - deltaX);
          newHeight = Math.max(20, originalPosition.height - deltaY);
          break;
      }

      // Update element position and size
      updateElementPosition(elementPos.id, { x: newX, y: newY, width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Apply final position to actual element
      applyPositionToElement(elementPos.id);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Update element position in state
  const updateElementPosition = (elementId: string, updates: Partial<ElementPosition>) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  };

  // Apply position changes to actual DOM element
  const applyPositionToElement = (elementId: string) => {
    const elementPos = elements.find(el => el.id === elementId);
    if (!elementPos) return;

    const { element, x, y, width, height } = elementPos;
    
    // Apply CSS transforms and styles
    element.style.position = 'absolute';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.transform = 'none'; // Clear any existing transforms
    
    // Notify parent component
    if (onPositionChange) {
      onPositionChange(elementId, elementPos);
    }

    console.log(`📍 Applied position to element ${elementId}:`, { x, y, width, height });
  };

  // Reset element to original position
  const resetElementPosition = (elementId: string) => {
    const elementPos = elements.find(el => el.id === elementId);
    if (!elementPos) return;

    // Remove position styling
    elementPos.element.style.position = '';
    elementPos.element.style.left = '';
    elementPos.element.style.top = '';
    elementPos.element.style.width = '';
    elementPos.element.style.height = '';
    elementPos.element.style.transform = '';

    // Rescan to get original position
    scanElements();
  };

  // Generate code with new positions
  const regenerateCodeWithPositions = async () => {
    if (onCodeRegenerate) {
      // Convert to serializable format (without HTMLElement references)
      const serializableElements = elements.map(el => ({
        id: el.id,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        zIndex: el.zIndex,
        locked: el.locked,
        visible: el.visible
      }));
      onCodeRegenerate(serializableElements);
    }

    // Also save positions for persistence
    const positionData = elements.map(el => ({
      id: el.id,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      zIndex: el.zIndex
    }));

    localStorage.setItem('elementPositions', JSON.stringify(positionData));
    console.log('💾 Saved element positions:', positionData);
  };

  // Load saved positions
  useEffect(() => {
    const savedPositions = localStorage.getItem('elementPositions');
    if (savedPositions) {
      try {
        const positions = JSON.parse(savedPositions);
        // Apply saved positions after a short delay to ensure elements are rendered
        setTimeout(() => {
          positions.forEach((pos: any) => {
            const element = document.getElementById(pos.id);
            if (element) {
              element.style.position = 'absolute';
              element.style.left = `${pos.x}px`;
              element.style.top = `${pos.y}px`;
              element.style.width = `${pos.width}px`;
              element.style.height = `${pos.height}px`;
            }
          });
          scanElements();
        }, 100);
      } catch (error) {
        console.error('Error loading saved positions:', error);
      }
    }
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <Move size={16} />
          Element Positioning
        </h4>
        <div className="flex items-center gap-2">
          <Button
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsActive(!isActive);
              if (!isActive) {
                scanElements();
              } else {
                setSelectedElement(null);
              }
            }}
          >
            {isActive ? <Eye size={16} /> : <EyeOff size={16} />}
            {isActive ? 'Disable' : 'Enable'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={scanElements}
            disabled={!isActive}
          >
            🔄 Scan
          </Button>
        </div>
      </div>

      {isActive && (
        <>
          <Separator />
          
          {/* Element List */}
          <div className="space-y-2">
            <Label>Elements ({elements.length})</Label>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {elements.map((elementPos) => (
                <div
                  key={elementPos.id}
                  className={`p-2 border rounded cursor-pointer text-xs ${
                    selectedElement?.id === elementPos.id ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
                  }`}
                  onClick={() => setSelectedElement(elementPos)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{elementPos.id}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateElementPosition(elementPos.id, { locked: !elementPos.locked });
                        }}
                      >
                        {elementPos.locked ? <Lock size={10} /> : <Unlock size={10} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateElementPosition(elementPos.id, { visible: !elementPos.visible });
                        }}
                      >
                        {elementPos.visible ? <Eye size={10} /> : <EyeOff size={10} />}
                      </Button>
                    </div>
                  </div>
                  <div className="text-gray-500 mt-1">
                    x: {Math.round(elementPos.x)}, y: {Math.round(elementPos.y)}, 
                    w: {Math.round(elementPos.width)}, h: {Math.round(elementPos.height)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Element Controls */}
          {selectedElement && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label>Selected: {selectedElement.id}</Label>
                
                {/* Position Controls */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">X Position</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElement.x)}
                      onChange={(e) => {
                        const newX = parseInt(e.target.value) || 0;
                        updateElementPosition(selectedElement.id, { x: newX });
                        applyPositionToElement(selectedElement.id);
                      }}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Y Position</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElement.y)}
                      onChange={(e) => {
                        const newY = parseInt(e.target.value) || 0;
                        updateElementPosition(selectedElement.id, { y: newY });
                        applyPositionToElement(selectedElement.id);
                      }}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>

                {/* Size Controls */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Width</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElement.width)}
                      onChange={(e) => {
                        const newWidth = parseInt(e.target.value) || 20;
                        updateElementPosition(selectedElement.id, { width: newWidth });
                        applyPositionToElement(selectedElement.id);
                      }}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Height</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElement.height)}
                      onChange={(e) => {
                        const newHeight = parseInt(e.target.value) || 20;
                        updateElementPosition(selectedElement.id, { height: newHeight });
                        applyPositionToElement(selectedElement.id);
                      }}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>

                {/* Z-Index */}
                <div className="space-y-1">
                  <Label className="text-xs">Z-Index (Layer)</Label>
                  <Input
                    type="number"
                    value={selectedElement.zIndex}
                    onChange={(e) => {
                      const newZIndex = parseInt(e.target.value) || 0;
                      updateElementPosition(selectedElement.id, { zIndex: newZIndex });
                      selectedElement.element.style.zIndex = newZIndex.toString();
                    }}
                    className="h-7 text-xs"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resetElementPosition(selectedElement.id)}
                    className="text-xs h-7"
                  >
                    <RotateCcw size={12} className="mr-1" />
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Duplicate element logic here
                      console.log('Duplicate element:', selectedElement.id);
                    }}
                    className="text-xs h-7"
                  >
                    <Copy size={12} className="mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Code Generation */}
          <div className="space-y-2">
            <Button
              onClick={regenerateCodeWithPositions}
              disabled={elements.length === 0}
              className="w-full"
            >
              🔄 Regenerate Code with New Positions
            </Button>
            <p className="text-xs text-gray-500">
              This will regenerate the component code with absolute positioning based on your changes.
            </p>
          </div>
        </>
      )}
    </div>
  );
}