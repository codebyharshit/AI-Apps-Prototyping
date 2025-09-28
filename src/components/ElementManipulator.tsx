"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Move, 
  Type, 
  Palette, 
  Square,
  RotateCcw,
  X
} from "lucide-react";

interface ElementManipulatorProps {
  html: string;
  onUpdateHtml: (html: string) => void;
  onClose: () => void;
}

interface ElementData {
  id: string;
  tagName: string;
  className: string;
  textContent: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  styles: {
    fontSize: string;
    fontFamily: string;
    color: string;
    backgroundColor: string;
    width: string;
    height: string;
    margin: string;
    padding: string;
    position: string;
    top: string;
    left: string;
  };
}

export function ElementManipulator({ html, onUpdateHtml, onClose }: ElementManipulatorProps) {
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [elements, setElements] = useState<ElementData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Extract elements from HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;
    
    const extractElements = (element: Element, parentX = 0, parentY = 0): ElementData[] => {
      const results: ElementData[] = [];
      
      // Skip script and style tags
      if (element.tagName.toLowerCase() === 'script' || element.tagName.toLowerCase() === 'style') {
        return results;
      }
      
      // Create element data
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      
      const elementData: ElementData = {
        id: `element-${Math.random().toString(36).substr(2, 9)}`,
        tagName: element.tagName.toLowerCase(),
        className: element.className || '',
        textContent: element.textContent?.trim() || '',
        position: { x: rect.left - parentX, y: rect.top - parentY },
        size: { width: rect.width, height: rect.height },
        styles: {
          fontSize: computedStyle.fontSize,
          fontFamily: computedStyle.fontFamily,
          color: computedStyle.color,
          backgroundColor: computedStyle.backgroundColor,
          width: computedStyle.width,
          height: computedStyle.height,
          margin: computedStyle.margin,
          padding: computedStyle.padding,
          position: computedStyle.position,
          top: computedStyle.top,
          left: computedStyle.left
        }
      };
      
      results.push(elementData);
      
      // Recursively process child elements
      for (const child of Array.from(element.children)) {
        results.push(...extractElements(child, rect.left, rect.top));
      }
      
      return results;
    };
    
    const extractedElements = extractElements(body);
    setElements(extractedElements);
  }, [html]);

  const handleElementClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const elementId = target.getAttribute('data-element-id');
    
    if (elementId) {
      const element = elements.find(e => e.id === elementId);
      if (element) {
        setSelectedElement(element);
      }
    }
  };

  const handleElementDragStart = (event: React.MouseEvent, elementId: string) => {
    const element = elements.find(e => e.id === elementId);
    if (!element) return;
    
    setIsDragging(true);
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    setSelectedElement(element);
    event.preventDefault();
    event.stopPropagation();
  };

  const handleElementDragMove = (event: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;
    
    const newX = event.clientX - dragOffset.x;
    const newY = event.clientY - dragOffset.y;
    
    // Update element position
    const updatedElements = elements.map(e => 
      e.id === selectedElement.id 
        ? { ...e, position: { x: newX, y: newY } }
        : e
    );
    
    setElements(updatedElements);
    
    // Update HTML with new positions
    updateHtmlWithElementPositions(updatedElements);
  };

  const handleElementDragEnd = () => {
    setIsDragging(false);
  };

  const updateHtmlWithElementPositions = (updatedElements: ElementData[]) => {
    // This is a simplified approach - in a real implementation, you'd want a more robust HTML parser
    let updatedHtml = html;
    
    updatedElements.forEach(element => {
      // Add inline styles for positioning
      const styleString = `position: absolute; left: ${element.position.x}px; top: ${element.position.y}px;`;
      
      // Find the element in the HTML and update its style
      const elementRegex = new RegExp(`<${element.tagName}[^>]*class="[^"]*${element.className}[^"]*"[^>]*>`, 'g');
      updatedHtml = updatedHtml.replace(elementRegex, (match) => {
        if (match.includes('style=')) {
          return match.replace(/style="[^"]*"/, `style="$&; ${styleString}"`);
        } else {
          return match.replace('>', ` style="${styleString}">`);
        }
      });
    });
    
    onUpdateHtml(updatedHtml);
  };

  const updateElementStyle = (property: keyof ElementData['styles'], value: string) => {
    if (!selectedElement) return;
    
    const updatedElements = elements.map(e => 
      e.id === selectedElement.id 
        ? { 
            ...e, 
            styles: { ...e.styles, [property]: value }
          }
        : e
    );
    
    setElements(updatedElements);
    setSelectedElement({ ...selectedElement, styles: { ...selectedElement.styles, [property]: value } });
    
    // Update HTML with new styles
    updateHtmlWithElementStyles(updatedElements);
  };

  const updateHtmlWithElementStyles = (updatedElements: ElementData[]) => {
    // Simplified HTML style update
    let updatedHtml = html;
    
    updatedElements.forEach(element => {
      const styleString = Object.entries(element.styles)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');
      
      const elementRegex = new RegExp(`<${element.tagName}[^>]*class="[^"]*${element.className}[^"]*"[^>]*>`, 'g');
      updatedHtml = updatedHtml.replace(elementRegex, (match) => {
        if (match.includes('style=')) {
          return match.replace(/style="[^"]*"/, `style="${styleString}"`);
        } else {
          return match.replace('>', ` style="${styleString}">`);
        }
      });
    });
    
    onUpdateHtml(updatedHtml);
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Move className="h-5 w-5" />
          Element Manipulator
          <Button variant="outline" size="sm" onClick={onClose} className="ml-auto">
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Preview Area */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Component Preview (Click elements to select)</Label>
            <div 
              ref={previewRef}
              className="border rounded bg-white p-4 min-h-[400px] relative"
              onClick={handleElementClick}
              onMouseMove={handleElementDragMove}
              onMouseUp={handleElementDragEnd}
              style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
            >
              <div dangerouslySetInnerHTML={{ __html: html }} />
              
              {/* Element Overlays */}
              {elements.map((element) => (
                <div
                  key={element.id}
                  data-element-id={element.id}
                  className={`absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 cursor-move ${
                    selectedElement?.id === element.id ? 'border-red-500 bg-red-100' : ''
                  }`}
                  style={{
                    left: `${element.position.x}px`,
                    top: `${element.position.y}px`,
                    width: `${element.size.width}px`,
                    height: `${element.size.height}px`,
                    pointerEvents: 'auto'
                  }}
                  onMouseDown={(e) => handleElementDragStart(e, element.id)}
                >
                  <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-1 rounded">
                    {element.tagName}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Element Properties */}
          {selectedElement && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Selected: {selectedElement.tagName}</Label>
                <Button variant="outline" size="sm" onClick={() => setSelectedElement(null)}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Position Controls */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Move className="h-4 w-4" />
                    Position
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">X Position</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedElement.position.x)}
                        onChange={(e) => {
                          const newX = parseInt(e.target.value) || 0;
                          const updatedElements = elements.map(el => 
                            el.id === selectedElement.id 
                              ? { ...el, position: { ...el.position, x: newX } }
                              : el
                          );
                          setElements(updatedElements);
                          setSelectedElement({ ...selectedElement, position: { ...selectedElement.position, x: newX } });
                          updateHtmlWithElementPositions(updatedElements);
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y Position</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedElement.position.y)}
                        onChange={(e) => {
                          const newY = parseInt(e.target.value) || 0;
                          const updatedElements = elements.map(el => 
                            el.id === selectedElement.id 
                              ? { ...el, position: { ...el.position, y: newY } }
                              : el
                          );
                          setElements(updatedElements);
                          setSelectedElement({ ...selectedElement, position: { ...selectedElement.position, y: newY } });
                          updateHtmlWithElementPositions(updatedElements);
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Typography Controls */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Typography
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Font Size</Label>
                    <Input
                      value={selectedElement.styles.fontSize}
                      onChange={(e) => updateElementStyle('fontSize', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Font Family</Label>
                    <Select value={selectedElement.styles.fontFamily} onValueChange={(value) => updateElementStyle('fontFamily', value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                        <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                        <SelectItem value="Georgia, serif">Georgia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Color Controls */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Colors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Text Color</Label>
                    <Input
                      type="color"
                      value={selectedElement.styles.color}
                      onChange={(e) => updateElementStyle('color', e.target.value)}
                      className="h-8 w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Background Color</Label>
                    <Input
                      type="color"
                      value={selectedElement.styles.backgroundColor}
                      onChange={(e) => updateElementStyle('backgroundColor', e.target.value)}
                      className="h-8 w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Size Controls */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Square className="h-4 w-4" />
                    Size
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Width</Label>
                      <Input
                        value={selectedElement.styles.width}
                        onChange={(e) => updateElementStyle('width', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Height</Label>
                      <Input
                        value={selectedElement.styles.height}
                        onChange={(e) => updateElementStyle('height', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 