"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Type, 
  Palette, 
  Move, 
  Square, 
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  RotateCcw
} from "lucide-react";

interface VisualManipulationToolsProps {
  html: string;
  onUpdateHtml: (html: string) => void;
  onClose: () => void;
}

interface ElementStyle {
  fontSize: string;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  color: string;
  backgroundColor: string;
  width: string;
  height: string;
  margin: string;
  padding: string;
  textAlign: string;
  position: string;
  top: string;
  left: string;
}

export function VisualManipulationTools({ html, onUpdateHtml, onClose }: VisualManipulationToolsProps) {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [elementStyles, setElementStyles] = useState<ElementStyle>({
    fontSize: "16px",
    fontFamily: "Arial, sans-serif",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    color: "#000000",
    backgroundColor: "#ffffff",
    width: "auto",
    height: "auto",
    margin: "0px",
    padding: "0px",
    textAlign: "left",
    position: "static",
    top: "0px",
    left: "0px"
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);

  const fontFamilies = [
    "Arial, sans-serif",
    "Helvetica, sans-serif",
    "Times New Roman, serif",
    "Georgia, serif",
    "Verdana, sans-serif",
    "Courier New, monospace",
    "Impact, sans-serif",
    "Comic Sans MS, cursive"
  ];

  const fontSizes = [
    "8px", "10px", "12px", "14px", "16px", "18px", "20px", "24px", 
    "28px", "32px", "36px", "48px", "64px", "72px"
  ];

  const colors = [
    "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00",
    "#ff00ff", "#00ffff", "#ffa500", "#800080", "#008000", "#ffc0cb",
    "#a52a2a", "#808080", "#000080", "#800000"
  ];

  const updateElementStyle = (property: keyof ElementStyle, value: string) => {
    setElementStyles(prev => ({ ...prev, [property]: value }));
    
    if (selectedElement && iframeRef) {
      const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
      if (iframeDoc) {
        // Update the selected element in the iframe
        const selectedElementInIframe = iframeDoc.querySelector('[data-selected]');
        if (selectedElementInIframe) {
          (selectedElementInIframe as HTMLElement).style[property as any] = value;
        }
        
        // Also update the HTML for persistence
        const updatedHtml = updateHtmlElementStyle(html, selectedElement, property, value);
        onUpdateHtml(updatedHtml);
      }
    }
  };

  const updateHtmlElementStyle = (htmlString: string, elementSelector: string, property: string, value: string): string => {
    try {
      // Extract CSS from the HTML
      const styleMatch = htmlString.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      if (!styleMatch) {
        return htmlString; // No styles found
      }
      
      let cssContent = styleMatch[1];
      
      // Find the CSS rule for the element
      const ruleRegex = new RegExp(`(${elementSelector}\\s*{[^}]*})`, 'g');
      const ruleMatch = cssContent.match(ruleRegex);
      
      if (ruleMatch) {
        let updatedRule = ruleMatch[0];
        
        // Check if the property already exists
        const propertyRegex = new RegExp(`${property}\\s*:\\s*[^;]+;?`, 'g');
        if (propertyRegex.test(updatedRule)) {
          // Replace existing property
          updatedRule = updatedRule.replace(propertyRegex, `${property}: ${value};`);
        } else {
          // Add new property
          updatedRule = updatedRule.replace('{', `{\n  ${property}: ${value};`);
        }
        
        // Update the CSS content
        cssContent = cssContent.replace(ruleRegex, updatedRule);
        
        // Update the HTML with new CSS
        return htmlString.replace(styleMatch[0], `<style>${cssContent}</style>`);
      }
      
      return htmlString;
    } catch (error) {
      console.error('Error updating HTML style:', error);
      return htmlString;
    }
  };

  const [iframeRef, setIframeRef] = useState<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (iframeRef) {
      const iframe = iframeRef;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
                 // Set up the iframe content with proper container positioning
         iframeDoc.open();
         iframeDoc.write(`
           <!DOCTYPE html>
           <html>
           <head>
             <style>
               body { 
                 margin: 0; 
                 padding: 20px; 
                 font-family: Arial, sans-serif;
                 position: relative;
                 min-height: 100vh;
               }
               .component-container {
                 position: relative;
                 min-height: 400px;
                 border: 1px solid #e5e7eb;
                 border-radius: 8px;
                 padding: 20px;
                 background: white;
               }
             </style>
           </head>
           <body>
             <div class="component-container">
               ${html.replace(/<html[^>]*>|<\/html>|<head[^>]*>|<\/head>|<body[^>]*>|<\/body>/gi, '')}
             </div>
           </body>
           </html>
         `);
         iframeDoc.close();
        
                 // Add click event listeners to all elements in the iframe
         const addClickListeners = () => {
           const elements = iframeDoc.querySelectorAll('*');
           elements.forEach((element) => {
             const target = element as HTMLElement;
             
             // Add click listener for selection
             element.addEventListener('click', (e) => {
               e.preventDefault();
               e.stopPropagation();
               
               // Get element selector (tag name or class)
               let selector = target.tagName.toLowerCase();
               if (target.className && typeof target.className === 'string' && target.className.trim()) {
                 const classes = target.className.split(' ').filter(c => c.trim());
                 if (classes.length > 0) {
                   selector = `.${classes[0]}`;
                 }
               }
               
               setSelectedElement(selector);
               
               // Extract current styles from the element
               const computedStyle = iframeDoc.defaultView?.getComputedStyle(target);
               if (computedStyle) {
                 setElementStyles({
                   fontSize: computedStyle.fontSize,
                   fontFamily: computedStyle.fontFamily,
                   fontWeight: computedStyle.fontWeight,
                   fontStyle: computedStyle.fontStyle,
                   textDecoration: computedStyle.textDecoration,
                   color: computedStyle.color,
                   backgroundColor: computedStyle.backgroundColor,
                   width: computedStyle.width,
                   height: computedStyle.height,
                   margin: computedStyle.margin,
                   padding: computedStyle.padding,
                   textAlign: computedStyle.textAlign,
                   position: computedStyle.position,
                   top: computedStyle.top,
                   left: computedStyle.left
                 });
               }
               
               console.log('Selected element:', selector);
               
               // Add visual feedback
               target.style.outline = '2px solid #3b82f6';
               target.style.outlineOffset = '2px';
               target.style.cursor = 'grab';
               
               // Remove outline from previously selected element
               const prevSelected = iframeDoc.querySelector('[data-selected]');
               if (prevSelected && prevSelected !== target) {
                 prevSelected.style.outline = '';
                 prevSelected.style.outlineOffset = '';
                 prevSelected.style.cursor = '';
                 prevSelected.removeAttribute('data-selected');
               }
               
               target.setAttribute('data-selected', 'true');
             });
             
             // Add drag and drop functionality
             element.addEventListener('mousedown', (e) => {
               if (target.getAttribute('data-selected')) {
                 e.preventDefault();
                 e.stopPropagation();
                 
                 setIsDragging(true);
                 setDraggedElement(target);
                 
                 const rect = target.getBoundingClientRect();
                 const iframeRect = iframe.getBoundingClientRect();
                 
                 setDragOffset({
                   x: e.clientX - (rect.left - iframeRect.left),
                   y: e.clientY - (rect.top - iframeRect.top)
                 });
                 
                 target.style.cursor = 'grabbing';
               }
             });
           });
           
           // Add global mouse move and up listeners to the iframe
           iframeDoc.addEventListener('mousemove', (e) => {
             if (isDragging && draggedElement) {
               e.preventDefault();
               
               const iframeRect = iframe.getBoundingClientRect();
               const newLeft = e.clientX - iframeRect.left - dragOffset.x;
               const newTop = e.clientY - iframeRect.top - dragOffset.y;
               
               draggedElement.style.position = 'absolute';
               draggedElement.style.left = `${newLeft}px`;
               draggedElement.style.top = `${newTop}px`;
               
               // Update the element styles state
               setElementStyles(prev => ({
                 ...prev,
                 position: 'absolute',
                 left: `${newLeft}px`,
                 top: `${newTop}px`
               }));
             }
           });
           
           iframeDoc.addEventListener('mouseup', () => {
             if (isDragging && draggedElement) {
               setIsDragging(false);
               setDraggedElement(null);
               draggedElement.style.cursor = 'grab';
             }
           });
         };
        
        // Wait for iframe to load
        iframe.onload = addClickListeners;
        if (iframeDoc.readyState === 'complete') {
          addClickListeners();
        }
      }
    }
  }, [html, iframeRef]);

  const handleDragStart = (event: React.MouseEvent) => {
    setIsDragging(true);
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  };

  const handleDragMove = (event: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;
    
    const newLeft = event.clientX - dragOffset.x;
    const newTop = event.clientY - dragOffset.y;
    
    updateElementStyle('left', `${newLeft}px`);
    updateElementStyle('top', `${newTop}px`);
    updateElementStyle('position', 'absolute');
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const resetStyles = () => {
    setElementStyles({
      fontSize: "16px",
      fontFamily: "Arial, sans-serif",
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      color: "#000000",
      backgroundColor: "#ffffff",
      width: "auto",
      height: "auto",
      margin: "0px",
      padding: "0px",
      textAlign: "left",
      position: "static",
      top: "0px",
      left: "0px"
    });
  };

  return (
    <div className="flex h-[600px]">
      {/* Preview Area - Left Side */}
      <div className="flex-1 border rounded-lg p-4 bg-gray-50 mr-4">
        <Label className="text-sm font-medium mb-2 block">
          Component Preview (Click elements to select)
          {selectedElement && (
            <span className="ml-2 text-blue-600">Selected: {selectedElement}</span>
          )}
        </Label>
        <div className="border rounded bg-white p-4 h-full relative overflow-auto">
          <iframe
            ref={setIframeRef}
            className="w-full h-full border-0"
            style={{ minHeight: '400px' }}
            title="Component Preview"
          />
        </div>
      </div>

      {/* Editing Controls - Right Side */}
      <div className="w-80 border rounded-lg bg-white overflow-y-auto">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Component Properties</h3>
          {selectedElement && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-600">{selectedElement}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">AI Generated</span>
            </div>
          )}
        </div>

        {selectedElement && (
          <div className="p-4 space-y-6">
            {/* Typography */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Typography</h4>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-gray-600">Font Family</Label>
                  <Select value={elementStyles.fontFamily} onValueChange={(value) => updateElementStyle('fontFamily', value)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilies.map(font => (
                        <SelectItem key={font} value={font}>{font.split(',')[0]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Size</Label>
                  <Select value={elementStyles.fontSize} onValueChange={(value) => updateElementStyle('fontSize', value)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontSizes.map(size => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Weight</Label>
                  <Input
                    value={elementStyles.fontWeight === 'bold' ? '700' : '400'}
                    onChange={(e) => updateElementStyle('fontWeight', e.target.value === '700' ? 'bold' : 'normal')}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Line Height</Label>
                  <Input
                    value="27px"
                    className="h-8 text-xs"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Letter Spacing</Label>
                  <Input
                    value="normal"
                    className="h-8 text-xs"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Alignment</Label>
                  <div className="flex gap-1 mt-1">
                    <Button
                      variant={elementStyles.textAlign === 'left' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateElementStyle('textAlign', 'left')}
                    >
                      <AlignLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={elementStyles.textAlign === 'center' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateElementStyle('textAlign', 'center')}
                    >
                      <AlignCenter className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={elementStyles.textAlign === 'right' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateElementStyle('textAlign', 'right')}
                    >
                      <AlignRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Decoration</Label>
                  <div className="flex gap-1 mt-1">
                    <Button
                      variant={elementStyles.fontWeight === 'bold' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateElementStyle('fontWeight', elementStyles.fontWeight === 'bold' ? 'normal' : 'bold')}
                    >
                      B
                    </Button>
                    <Button
                      variant={elementStyles.fontStyle === 'italic' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateElementStyle('fontStyle', elementStyles.fontStyle === 'italic' ? 'normal' : 'italic')}
                    >
                      I
                    </Button>
                    <Button
                      variant={elementStyles.textDecoration.includes('underline') ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateElementStyle('textDecoration', elementStyles.textDecoration.includes('underline') ? 'none' : 'underline')}
                    >
                      U
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      S
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Color */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Color</h4>
              <div>
                <Label className="text-xs text-gray-600">Text Color</Label>
                <Input
                  type="color"
                  value={elementStyles.color}
                  onChange={(e) => updateElementStyle('color', e.target.value)}
                  className="h-8 w-full mt-1"
                />
              </div>
            </div>

            {/* Background */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Background</h4>
              <div>
                <Label className="text-xs text-gray-600">Background Color</Label>
                <Input
                  type="color"
                  value={elementStyles.backgroundColor}
                  onChange={(e) => updateElementStyle('backgroundColor', e.target.value)}
                  className="h-8 w-full mt-1"
                />
              </div>
            </div>

            {/* Layout */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Layout</h4>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-gray-600">Position</Label>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    <div>
                      <Label className="text-xs text-gray-500">X (Left)</Label>
                      <Input 
                        value={elementStyles.left} 
                        onChange={(e) => updateElementStyle('left', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Y (Top)</Label>
                      <Input 
                        value={elementStyles.top} 
                        onChange={(e) => updateElementStyle('top', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2 h-8 text-xs"
                    onClick={() => updateElementStyle('position', 'absolute')}
                  >
                    Enable Drag & Drop
                  </Button>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Margin</Label>
                  <div className="grid grid-cols-4 gap-1 mt-1">
                    <Input placeholder="Top" className="h-8 text-xs" />
                    <Input placeholder="Right" className="h-8 text-xs" />
                    <Input placeholder="Bottom" className="h-8 text-xs" />
                    <Input placeholder="Left" className="h-8 text-xs" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Padding</Label>
                  <div className="grid grid-cols-4 gap-1 mt-1">
                    <Input value="0px" className="h-8 text-xs" />
                    <Input placeholder="Right" className="h-8 text-xs" />
                    <Input placeholder="Bottom" className="h-8 text-xs" />
                    <Input placeholder="Left" className="h-8 text-xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* Border */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Border</h4>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-gray-600">Width</Label>
                  <Input value="0px" className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Style</Label>
                  <Select defaultValue="Solid">
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Solid">Solid</SelectItem>
                      <SelectItem value="Dashed">Dashed</SelectItem>
                      <SelectItem value="Dotted">Dotted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Border Color</Label>
                  <Input
                    type="color"
                    className="h-8 w-full mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Appearance</h4>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-gray-600">Opacity</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value="100"
                      className="flex-1"
                    />
                    <span className="text-xs">100%</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Radius</Label>
                  <Select>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0px">0px</SelectItem>
                      <SelectItem value="4px">4px</SelectItem>
                      <SelectItem value="8px">8px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Shadow */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Shadow</h4>
              <div>
                <Label className="text-xs text-gray-600">Box Shadow</Label>
                <Select defaultValue="None">
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Small">Small</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {!selectedElement && (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">Click on any element in the preview to start editing</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (iframeRef) {
                    const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
                    if (iframeDoc) {
                      const updatedHtml = iframeDoc.documentElement.outerHTML;
                      onUpdateHtml(updatedHtml);
                    }
                  }
                }}
              >
                Save Changes
              </Button>
              <Button size="sm" onClick={onClose}>
                Apply & Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 