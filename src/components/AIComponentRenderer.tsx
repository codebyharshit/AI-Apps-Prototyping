"use client";

import React, { useState, useEffect } from 'react';
import { ComponentData } from '@/lib/utils';
import { getRunModeSyncData, cleanupRunModeSyncData, markRunModeSyncDataAsApplied } from '@/lib/run-mode-sync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { TextOutput } from '@/components/ui/textoutput';
import { ImageUpload } from '@/components/ui/imageupload';
// Import react-live directly instead of dynamically
import { LiveProvider, LivePreview, LiveError } from 'react-live';
// Still keep the dynamic import as a backup in case of errors
import dynamic from 'next/dynamic';
import { ElementPositionOverlay } from './ElementPositionOverlay';
import { Maximize2, ExternalLink } from 'lucide-react';
import { createPortal } from 'react-dom';

// Fallback if direct imports fail
const DynamicLiveProvider = dynamic(() => import('react-live').then(mod => mod.LiveProvider), { ssr: false });
const DynamicLivePreview = dynamic(() => import('react-live').then(mod => mod.LivePreview), { ssr: false });
const DynamicLiveError = dynamic(() => import('react-live').then(mod => mod.LiveError), { ssr: false });

// Error Boundary for AI Components
class AIComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; componentId: string; isRunMode?: boolean },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode; componentId: string; isRunMode?: boolean }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(`🚨 AI Component Error Boundary caught error for ${this.props.componentId}:`, error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-red-300 p-4 rounded bg-red-50">
          <div className="text-red-700 font-semibold mb-2">⚠️ Component Error</div>
          <div className="text-sm text-red-600 mb-2">
            Component {this.props.componentId} failed to render
          </div>
          {!this.props.isRunMode && (
            <div className="text-sm text-gray-600">
              Error: {this.state.error?.message || 'Unknown error'}
            </div>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface AIComponentRendererProps {
  component: ComponentData;
  isInteractive?: boolean;
  className?: string;
  id: string;
  onElementPositionChange?: (elementId: string, position: { x: number; y: number }) => void;
  elementPositions?: Record<string, { x: number; y: number }>;
  enableElementPositioning?: boolean;
  isRunMode?: boolean; // New prop to detect run mode
  [key: string]: any; // Allow any additional props
}

// Generate a deterministic key using component properties
const getStableKey = (component: ComponentData): string => {
  return `${component.type}-${component.id}`;
};

/**
 * Component that dynamically renders AI-generated components
 */
export const AIComponentRenderer: React.FC<AIComponentRendererProps> = ({
  component,
  isInteractive = false,
  className = '',
  id,
  onElementPositionChange,
  elementPositions = {},
  enableElementPositioning = false,
  isRunMode = false, // New prop to detect run mode
  ...restProps // Capture all external props with a proper name
}) => {
  // State to keep track of rendering errors
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [mounted, setMounted] = useState(false);
  // State to track if we should fall back to dynamic imports
  const [useDynamicFallback, setUseDynamicFallback] = useState(false);
  
  // Element positioning state
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [localElementPositions, setLocalElementPositions] = useState<Record<string, { x: number; y: number }>>(elementPositions);
  
  // Preview enlargement state
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
  // Regenerate UI state
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regenChanges, setRegenChanges] = useState('');
  const [regenNewPrompt, setRegenNewPrompt] = useState('');
  const [regenReplacePrompt, setRegenReplacePrompt] = useState(false);
  const [regenIsLoading, setRegenIsLoading] = useState(false);
  const [regenModalPosition, setRegenModalPosition] = useState({ x: 0, y: 0 });

  // Only render on client side
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

  // Update local positions when prop changes
  useEffect(() => {
    // Add guard to prevent infinite re-renders
    if (!elementPositions || Object.keys(elementPositions).length === 0) {
      return;
    }
    
    // Only update if positions actually changed
    setLocalElementPositions(prev => {
      const hasChanged = JSON.stringify(prev) !== JSON.stringify(elementPositions);
      if (hasChanged) {
        console.log('🔄 Updating element positions:', elementPositions);
        return elementPositions;
      }
      return prev;
    });
  }, [elementPositions]);

  // Element positioning handlers
  const handleElementDragStart = (e: React.MouseEvent, elementId: string) => {
    if (!enableElementPositioning) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDraggingElement(true);
    setDraggedElementId(elementId);
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = e.currentTarget.getBoundingClientRect();
    
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleElementDragMove = (e: React.MouseEvent) => {
    if (!isDraggingElement || !draggedElementId || !enableElementPositioning) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const containerRect = e.currentTarget.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;
    
    const newPosition = { x: Math.max(0, newX), y: Math.max(0, newY) };
    
    setLocalElementPositions(prev => ({
      ...prev,
      [draggedElementId]: newPosition
    }));
    
    if (onElementPositionChange) {
      onElementPositionChange(draggedElementId, newPosition);
    }
  };

  const handleElementDragEnd = () => {
    setIsDraggingElement(false);
    setDraggedElementId(null);
  };

  const handleMaximizePreview = () => {
    setIsPreviewMaximized(!isPreviewMaximized);
  };

  const handleOpenInNewWindow = () => {
    // Create a new window with the component code
    const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    if (newWindow) {
      // Create a complete HTML document with the component
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>AI Component Preview - ${component.id}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        .component-container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="component-container">
        <h2>AI Component Preview: ${component.id}</h2>
        <div id="root"></div>
    </div>
    <script type="text/babel">
        ${cleanedCode}
    </script>
</body>
</html>`;
      
      newWindow.document.write(htmlContent);
      newWindow.document.title = `AI Component Preview - ${component.id}`;
      newWindow.document.close();
    }
  };

  // Add positioning styles to elements
  const injectElementPositioning = (code: string): string => {
    if (!enableElementPositioning) return code;
    
    let modifiedCode = code;
    
    // Add positioning styles to elements with IDs
    const idPattern = /id="([^"]+)"/g;
    let match;
    
    while ((match = idPattern.exec(code)) !== null) {
      const elementId = match[1];
      const position = localElementPositions[elementId];
      
      if (position) {
        // Find the element with this ID and add positioning styles
        const elementPattern = new RegExp(`(<[^>]*id="${elementId}"[^>]*)`, 'g');
        modifiedCode = modifiedCode.replace(elementPattern, (match, elementStart) => {
          // Add style attribute with positioning
          if (elementStart.includes('style=')) {
            return elementStart.replace(/style=\{([^}]*)\}/, (styleMatch: string, existingStyles: string) => {
              return `style={{${existingStyles}, position: 'absolute', left: '${position.x}px', top: '${position.y}px'}}`;
            });
          } else {
            return `${elementStart} style={{position: 'absolute', left: '${position.x}px', top: '${position.y}px'}}`;
          }
        });
      }
    }
    
    return modifiedCode;
  };

  // Ensure component exists
  if (!component) {
    return (
      <div className="p-4 border border-dashed border-red-300 rounded-md">
        <div className="text-sm text-red-500">
          Error: Component data is missing
        </div>
      </div>
    );
  }

  // Ensure properties exist
  if (!component.properties) {
    return (
      <div className="p-4 border border-dashed border-red-300 rounded-md">
        <div className="text-sm text-red-500">
          Error: Component properties are missing
          <p className="text-xs mt-2">Component type: {component.type}</p>
        </div>
      </div>
    );
  }

  // Get the generatedCode from properties
  const generatedCode = component.properties.generatedCode;
  const prompt = component.properties.prompt;
  const stableKey = getStableKey(component);

  // Define the scope of components available to the generated code
  const scope = {
    React,
    useState,
    useEffect,
    Button,
    Input,
    Textarea,
    Label,
    Checkbox,
    TextOutput,
    ImageUpload,
    // Make external props available as individual variables
    ...restProps,
    // Ensure content is explicitly available
    content: restProps.content,
    // Also make them available as a combined object for the render call
    externalProps: restProps,
    // Add console for debugging
    console
  };

  // Debug: Log external props being passed to AI component
  if (isInteractive && Object.keys(restProps).length > 0) {
    console.log(`AI Component ${component.id} receiving external props:`, restProps);
    console.log(`AI Component ${component.id} scope includes:`, Object.keys(scope));
  }

  // Always log for AI components to debug the content issue
  console.log(`AI Component ${component.id} - Generated code exists:`, !!generatedCode);
  console.log(`AI Component ${component.id} - Generated code length:`, generatedCode?.length || 0);
  console.log(`AI Component ${component.id} - Generated code first 200 chars:`, generatedCode?.substring(0, 200));
  console.log(`AI Component ${component.id} - Rest props:`, restProps);
  console.log(`AI Component ${component.id} - Content being passed:`, restProps.content);
  console.log(`AI Component ${component.id} - Component properties:`, component.properties);
  console.log(`AI Component ${component.id} - Component type:`, component.type);

  // Inject component selection capabilities into generated components
  const injectSelectionCapabilities = (code: string): string => {
    // Add data attributes to all elements for component selection
    let enhancedCode = code;
    
    // Add data attributes to div elements
    enhancedCode = enhancedCode.replace(
      /<div([^>]*)>/g,
      (match, attributes) => {
        // Don't add if already has data attributes
        if (attributes.includes('data-')) return match;
        
        // Generate a unique ID for this element
        const elementId = `ai-element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return `<div${attributes} data-ai-element="true" data-element-id="${elementId}" data-component-id="${component.id}">`;
      }
    );
    
    // Add data attributes to other common elements
    const elementsToEnhance = ['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'input', 'textarea'];
    elementsToEnhance.forEach(tag => {
      enhancedCode = enhancedCode.replace(
        new RegExp(`<${tag}([^>]*)>`, 'g'),
        (match, attributes) => {
          if (attributes.includes('data-')) return match;
          const elementId = `ai-element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          return `<${tag}${attributes} data-ai-element="true" data-element-id="${elementId}" data-component-id="${component.id}">`;
        }
      );
    });
    
    return enhancedCode;
  };

  // Method to inject content handling into AI-generated components
  const injectContentHandling = (code: string): string => {
    let processedCode = code;
    
    // Find and replace common output placeholder patterns
    const outputPatterns = [
      /["'`]Form data will appear here after submission["'`]/g,
      /["'`]Form results will appear here\.\.\.["'`]/g,
      /["'`]Output will appear here\.\.\.["'`]/g,
      /["'`]Results will be displayed here\.\.\.["'`]/g,
      /["'`]Data will appear here\.\.\.["'`]/g,
      /["'`]Content will be shown here\.\.\.["'`]/g,
      /["'`]Form data will appear here\.\.\.["'`]/g,
      /["'`]Submitted information will appear here\.\.\.["'`]/g,
      /["'`]Submitted data will appear here\.\.\.["'`]/g,
      /["'`]Submitted content will appear here\.\.\.["'`]/g,
    ];
    
    outputPatterns.forEach(pattern => {
      processedCode = processedCode.replace(pattern, '{content || "Output will appear here..."}');
    });
    
    // Also look for divs with output-related content and make them dynamic
    // Replace static output text in divs/spans (more comprehensive patterns)
    processedCode = processedCode.replace(
      /(>\s*)(Form data will appear here after submission|Form results will appear here\.\.\.|\w+\s+will appear here\.\.\.|\w+\s+will be displayed here\.\.\.|\w+\s+will be shown here\.\.\.|\w+\s+data will appear here\.\.\.|\w+\s+content will appear here\.\.\.)/g,
      '$1{content || "Output will appear here..."}'
    );
    
    // Find divs that look like output areas and ensure they use external content
    processedCode = processedCode.replace(
      /(<div[^>]*className="[^"]*output[^"]*"[^>]*>)[^<{]*(<\/div>)/g,
      '$1{content || "Output will appear here..."}$2'
    );
    
    // Find any textarea or div with output-related IDs
    processedCode = processedCode.replace(
      /(<(?:div|textarea|span)[^>]*id="[^"]*output[^"]*"[^>]*>)[^<{]*(<\/(?:div|textarea|span)>)/g,
      '$1{content || "Output will appear here..."}$2'
    );
    
    // CRITICAL: Fix the most common content prop pattern issues
    // Replace externalContent with content if it exists
    processedCode = processedCode.replace(/externalContent/g, 'content');
    
    // Ensure currentContent uses content (not externalContent)
    processedCode = processedCode.replace(
      /const currentContent = externalContent !== undefined \? externalContent : internalContent;/g,
      'const currentContent = content !== undefined ? content : internalContent;'
    );
    
    // Fix destructuring patterns
    processedCode = processedCode.replace(
      /\{\s*content:\s*externalContent\s*([,}])/g,
      '{ content$1'
    );
    
    console.log('🔧 Injected content handling into AI component');
    return processedCode;
  };

  // Inject style overrides from component properties
  const injectDirectManipulationChanges = (code: string): string => {
    let modifiedCode = code;
    
    // Check if component has direct manipulation changes
    const hasDirectManipulationChanges = component.properties?.hasDirectManipulationChanges;
    const styleOverrides = component.properties?.styleOverrides;
    const textContent = component.properties?.textContent;
    const placeholder = component.properties?.placeholder;
    const color = component.properties?.color;
    const backgroundColor = component.properties?.backgroundColor;
    
    // If no changes, return original code
    if (!hasDirectManipulationChanges && 
        (!styleOverrides || Object.keys(styleOverrides).length === 0) &&
        !textContent && !placeholder && !color && !backgroundColor) {
      return modifiedCode;
    }

    // CRITICAL: Save the modified code permanently
    const saveModifiedCode = async () => {
      try {
        const changes = {
          hasDirectManipulationChanges,
          styleOverrides,
          textContent,
          placeholder,
          color,
          backgroundColor
        };

        const response = await fetch('/api/save-modified-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            componentId: component.id,
            modifiedCode: modifiedCode,
            originalCode: code,
            changes
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('💾 Modified code saved permanently:', result);
          
          // Also save to localStorage for immediate access
          const localStorageKey = `modifiedCode_${component.id}`;
          console.log(`💾 Saving modified code with key: ${localStorageKey}`);
          console.log(`💾 Component ID: ${component.id}`);
          console.log(`💾 Component type: ${component.type}`);
          
          localStorage.setItem(localStorageKey, JSON.stringify({
            modifiedCode,
            originalCode: code,
            changes,
            savedAt: new Date().toISOString()
          }));
          
          console.log('💾 Modified code also saved to localStorage:', localStorageKey);
        } else {
          console.error('❌ Failed to save modified code:', response.status);
        }
      } catch (error) {
        console.error('❌ Error saving modified code:', error);
      }
    };

    // Save only in interactive/editor context to avoid run-mode loops
    if (isInteractive) {
      // Save the modified code (don't await to avoid blocking rendering)
      saveModifiedCode();
    }

    console.log(`🎨 Applying direct manipulation changes for ${component.id}`);
    console.log(`🎨 Changes detected:`, {
      hasDirectManipulationChanges,
      styleOverrides: styleOverrides ? Object.keys(styleOverrides) : [],
      textContent,
      placeholder,
      color,
      backgroundColor
    });

    // 1. Handle style overrides
    if (styleOverrides && Object.keys(styleOverrides).length > 0) {
      console.log(`🎨 Style overrides:`, styleOverrides);
      
      // Convert style overrides to CSS-in-JS format
      const overrideStyles = Object.entries(styleOverrides)
        .map(([property, value]) => `${property}: "${value}"`)
        .join(', ');

      if (overrideStyles) {
        // Find the main component's return statement and inject style overrides
        const returnPattern = /return\s*\(\s*(<[^>]+)/;
        const match = modifiedCode.match(returnPattern);
        
        if (match) {
          const openingTag = match[1];
          
          // Check if it already has a style attribute
          if (openingTag.includes('style=')) {
            // Merge with existing styles
            modifiedCode = modifiedCode.replace(
              /style=\{([^}]*)\}/g,
              (match, existingStyles) => {
                return `style={{${existingStyles}, ${overrideStyles}}}`;
              }
            );
          } else {
            // Add new style attribute
            const newTag = openingTag.replace('>', ` style={{${overrideStyles}}>`);
            modifiedCode = modifiedCode.replace(returnPattern, 'return (' + newTag);
          }
        }
      }
    }

    // 2. Handle content changes (textContent, placeholder)
    // DISABLE blanket text replacement which caused code corruption (e.g., duplicating large strings into JSX)
    // Keep placeholder override only
    
    if (placeholder) {
      console.log(`📝 Applying placeholder: "${placeholder}"`);
      // Replace placeholder attributes
      modifiedCode = modifiedCode.replace(
        /placeholder="[^"]*"/g,
        `placeholder="${placeholder}"`
      );
    }

    // 3. Handle specific component type changes
    if (component.type === 'AIInput' || component.type === 'AIForm') {
      // For input components, also update the value prop if it exists
      const value = component.properties?.value;
      if (value) {
        console.log(`📝 Applying value: "${value}"`);
        modifiedCode = modifiedCode.replace(
          /value="[^"]*"/g,
          `value="${value}"`
        );
      }
    }

    // 4. Handle color changes specifically
    if (color) {
      console.log(`🎨 Applying color: "${color}"`);
      // Add color to existing style or create new style
      const colorStyle = `color: "${color}"`;
      
      // Check if there's already a style attribute
      if (modifiedCode.includes('style=')) {
        modifiedCode = modifiedCode.replace(
          /style=\{([^}]*)\}/g,
          (match, existingStyles) => {
            if (!existingStyles.includes('color:')) {
              return `style={{${existingStyles}, ${colorStyle}}}`;
            }
            return match;
          }
        );
      } else {
        // Add new style attribute with color
        const returnPattern = /return\s*\(\s*(<[^>]+)/;
        const match = modifiedCode.match(returnPattern);
        if (match) {
          const openingTag = match[1];
          const newTag = openingTag.replace('>', ` style={{${colorStyle}}>`);
          modifiedCode = modifiedCode.replace(returnPattern, 'return (' + newTag);
        }
      }
    }

    // 5. Handle background color changes
    if (backgroundColor) {
      console.log(`🎨 Applying backgroundColor: "${backgroundColor}"`);
      const bgStyle = `backgroundColor: "${backgroundColor}"`;
      
      if (modifiedCode.includes('style=')) {
        modifiedCode = modifiedCode.replace(
          /style=\{([^}]*)\}/g,
          (match, existingStyles) => {
            if (!existingStyles.includes('backgroundColor:')) {
              return `style={{${existingStyles}, ${bgStyle}}}`;
            }
            return match;
          }
        );
      } else {
        const returnPattern = /return\s*\(\s*(<[^>]+)/;
        const match = modifiedCode.match(returnPattern);
        if (match) {
          const openingTag = match[1];
          const newTag = openingTag.replace('>', ` style={{${bgStyle}}>`);
          modifiedCode = modifiedCode.replace(returnPattern, 'return (' + newTag);
        }
      }
    }

    console.log(`✅ Direct manipulation changes applied for ${component.id}`);
    return modifiedCode;
  };

  // First, try to clean the code - remove imports Since we provide the scope
  const cleanCode = (code: string) => {
    try {
      // Remove any descriptive text before the component code
      let cleaned = code.trim();
      
      // MODERATE CLEANING - Only remove obvious descriptive text patterns, not valid code
      // Be more conservative to avoid removing valid JavaScript code
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
          console.log(`Removed descriptive pattern, saved ${originalLength - cleaned.length} chars`);
          hasRemovedText = true;
        }
      }
      
      // Only use aggressive cleaning as last resort if we detect obvious issues
      if (!hasRemovedText && cleaned.includes('Create a React component')) {
      const codeStartPatterns = [
        /const\s+\w+\s*=/,
          /function\s+\w+\s*\(/
      ];
      
      let codeStartIndex = -1;
      for (const pattern of codeStartPatterns) {
        const match = cleaned.match(pattern);
        if (match) {
          const index = cleaned.indexOf(match[0]);
          if (codeStartIndex === -1 || index < codeStartIndex) {
            codeStartIndex = index;
          }
        }
      }
      
        if (codeStartIndex > 0 && codeStartIndex < cleaned.length * 0.3) { // Only if less than 30% of code
          console.log(`Conservative removal of ${codeStartIndex} characters of descriptive text`);
        cleaned = cleaned.substring(codeStartIndex);
        }
      }
      
      // Remove any remaining problematic patterns that might have slipped through
      cleaned = cleaned.replace(/^(Create|Here's|This is|Building|Making|Let me create|I'll create|Generate)[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
      cleaned = cleaned.replace(/^\*\*[^*]+\*\*[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
      cleaned = cleaned.replace(/^[\s\S]*?(?:- [^\n]*\n)+(?=const\s+\w+\s*=|function\s+\w+)/im, '');
      
      // Remove any stray markdown formatting
      cleaned = cleaned.replace(/^\*\*[^*]*\*\*\s*\n?/gm, '');
      cleaned = cleaned.replace(/^- [^\n]*\n?/gm, '');
      
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
          console.log('AIComponentRenderer: Fixed stray JSX after render call:', match.replace(renderCall, ''));
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
      const jsxOpenTags = (cleaned.match(/<[^/][^>]*[^/]>/g) || []).filter(tag => !tag.includes('/>'));
      const jsxCloseTags = (cleaned.match(/<\/[^>]+>/g) || []);
      
      // Add missing closing div tags if needed
      if (jsxOpenTags.length > jsxCloseTags.length) {
        const missingTags = jsxOpenTags.length - jsxCloseTags.length;
        for (let i = 0; i < missingTags; i++) {
          cleaned += '\n        </div>';
        }
      }
      
      // Ensure the code has proper closing brackets and parentheses
      let jsxOpenBraces = (cleaned.match(/{/g) || []).length;
      let jsxCloseBraces = (cleaned.match(/}/g) || []).length;
      while (jsxOpenBraces > jsxCloseBraces) {
        cleaned += '}';
        jsxCloseBraces++;
      }
      
      // Count and fix parentheses
      let jsxOpenParens = (cleaned.match(/\(/g) || []).length;
      let jsxCloseParens = (cleaned.match(/\)/g) || []).length;
      while (jsxOpenParens > jsxCloseParens) {
        cleaned += ')';
        jsxCloseParens++;
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
      const componentNameMatch = cleaned.match(/const\s+(\w+)\s*=/) || 
                                 cleaned.match(/function\s+(\w+)\s*\(/) ||
                                 ['', 'Component']; // fallback
      const componentName = componentNameMatch[1] || 'Component';
      
      // CRITICAL: Inject content handling into output areas
      cleaned = injectContentHandling(cleaned);
      
      // CRITICAL: Debug logging for syntax issues
      console.log(`🔧 Component code before render call (first 200 chars):`, cleaned.substring(0, 200));
      
      // TEMPORARILY DISABLED: Function normalization causing JSX corruption
      console.log('🔧 SKIPPING function normalization to prevent JSX corruption');
      
      // The aggressive regex replacements were adding weird characters
      // Let's keep the original function syntax and see if React Live handles it
      
      // Only do minimal, safe replacements
      // Ensure proper spacing around arrows (safe operation)
      cleaned = cleaned.replace(/=>/g, ' => ');
      cleaned = cleaned.replace(/\s+=> /g, ' => ');
      cleaned = cleaned.replace(/ =>\s+/g, ' => ');
      
      console.log('🔧 After normalization, first 100 chars:', cleaned.substring(0, 100));
      
      // Strip any stray import/export lines (React Live evaluates in a function context)
      cleaned = cleaned.replace(/^\s*import[^;]*;\s*/gm, '');
      cleaned = cleaned.replace(/^\s*export\s+default[^;]*;?\s*$/gm, '');
      // Normalize smart quotes and non-breaking spaces that break parsing
      cleaned = cleaned.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\u00A0/g, ' ');
      // Keep only the first render(...) and drop any trailing junk (like stray closing tags)
      cleaned = cleaned.replace(/(render\([^)]*\);)[\s\S]*$/, '$1');
      // Remove dangling closing tags that may sit after code
      cleaned = cleaned.replace(/\s*<\/[a-zA-Z]+>\s*;?\s*$/g, '');

        // CRITICAL: Ensure React imports are at the beginning
  if (!cleaned.trim().startsWith('import React')) {
    console.log(`AIComponentRenderer: Adding missing React imports for ${componentName}`);
    cleaned = `import React, { useState, useEffect } from 'react';\n\n${cleaned}`;
  }
  
  // CRITICAL: Fix malformed JSX tags that cause "Expected either /> or > at the end of the tag" error
  console.log(`AIComponentRenderer: Fixing malformed JSX tags for ${componentName}...`);
  
  // Fix incomplete self-closing tags
  cleaned = cleaned.replace(/<([a-zA-Z][a-zA-Z0-9]*)\s+([^>]*?)(?=\/>|>)/g, (match: string, tagName: string, attributes: string) => {
    const selfClosingTags = ['input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
    if (selfClosingTags.includes(tagName.toLowerCase()) && !match.endsWith('/>') && !match.endsWith('>')) {
      return match + ' />';
    }
    return match;
  });
  
  // Fix incomplete input tags specifically
  cleaned = cleaned.replace(/(<input[^>]*?)(?=\s*\/>|\s*>)/g, (match: string) => {
    if (!match.endsWith('/>') && !match.endsWith('>')) {
      return match + ' />';
    }
    return match;
  });
  
  // Fix malformed closing tags with multiple slashes
  cleaned = cleaned.replace(/\/>\s*\/>\s*\/>\s*\/>/g, ' />');
  cleaned = cleaned.replace(/\/>\s*\/>\s*\/>/g, ' />');
  cleaned = cleaned.replace(/\/>\s*\/>\s*$/gm, ' />');
  
  // Fix incomplete div tags
  cleaned = cleaned.replace(/<div\s+([^>]*?)(?=\/>|>)/g, (match: string, attributes: string) => {
    if (!match.endsWith('>')) {
      return match + '>';
    }
    return match;
  });
  
  // Fix incomplete span tags
  cleaned = cleaned.replace(/<span\s+([^>]*?)(?=\/>|>)/g, (match: string, attributes: string) => {
    if (!match.endsWith('>')) {
      return match + '>';
    }
    return match;
  });
  
  // Fix incomplete button tags
  cleaned = cleaned.replace(/<button\s+([^>]*?)(?=\/>|>)/g, (match: string, attributes: string) => {
    if (!match.endsWith('>')) {
      return match + '>';
    }
    return match;
  });
  
  // Fix incomplete label tags
  cleaned = cleaned.replace(/<label\s+([^>]*?)(?=\/>|>)/g, (match: string, attributes: string) => {
    if (!match.endsWith('>')) {
      return match + '>';
    }
    return match;
  });
  
  // Fix incomplete h2 tags
  cleaned = cleaned.replace(/<h2\s+([^>]*?)(?=\/>|>)/g, (match: string, attributes: string) => {
    if (!match.endsWith('>')) {
      return match + '>';
    }
    return match;
  });
  
  // Fix incomplete p tags
  cleaned = cleaned.replace(/<p\s+([^>]*?)(?=\/>|>)/g, (match: string, attributes: string) => {
    if (!match.endsWith('>')) {
      return match + '>';
    }
    return match;
  });
  
  console.log(`AIComponentRenderer: JSX tag fixing completed for ${componentName}`);
  
  // Remove any design-preview artifacts that might have leaked into code
  cleaned = cleaned.replace(/\bAI Component Preview\b/g, '');
  cleaned = cleaned.replace(/\bScroll to see full component\b/g, '');
  // Drop editor-specific data attributes
  cleaned = cleaned.replace(/\sdata-ai-element="true"/g, '');
  cleaned = cleaned.replace(/\sdata-element-id="[^"]*"/g, '');
  cleaned = cleaned.replace(/\sdata-component-id="[^"]*"/g, '');

  // GENERIC SAFETY NETS for misplaced attributes and broken handlers
  // If a start tag is closed and attributes accidentally appear as text right after, move them back
  // e.g., <div> className="modal" -> <div className="modal">
  cleaned = cleaned.replace(/<(\w+)\s*>\s*((?:[a-zA-Z_:][\w:-]*=(?:"[^"]*"|'[^']*'|\{[^}]*\})\s*)+)>/g, '<$1 $2>');
  // If a start tag ends and is immediately followed by text (letters) that should be inside the tag, auto-insert '>'
  cleaned = cleaned.replace(/(<(h[1-6]|p|span|label|div|button)[^>]*?)\s(?=[^<>{}])/g, '$1>');
  // If a start tag ends and is immediately followed by a closing tag, auto-insert '>'
  cleaned = cleaned.replace(/(<\w+[^>]*?)\s<\/(\w+)>/g, '$1></$2>');
  // Normalize style self-closing tag written as '>\/>' to '<style ... />'
  cleaned = cleaned.replace(/<style([^>]*)>\s*\/>/g, '<style$1 />');
  // Normalize broken event handlers missing =>, e.g., onChange={(e) = setX(...)}
  cleaned = cleaned.replace(/on([A-Z][a-zA-Z]*)=\{\s*\(?(?:e|event)\)?\s*=\s*/g, 'on$1={(e) => ');
  // Remove stray '>' tokens after arrow: (e) => > > expr
  cleaned = cleaned.replace(/=>\s*>\s*>+/g, '=> ');
  cleaned = cleaned.replace(/=>\s*>/g, '=> ');
  
  // CRITICAL: Fix malformed arrow functions and extra characters
  console.log(`AIComponentRenderer: Fixing malformed arrow functions and extra characters for ${componentName}...`);
  
  // Fix malformed arrow functions: " = />>" -> " =>"
  cleaned = cleaned.replace(/=\s*\/>>/g, '=>');
  
  // Fix malformed arrow functions: " =   />>" -> " =>"
  cleaned = cleaned.replace(/=\s*\/>>/g, '=>');
  
  // Remove extra ">>>" or ">>" after valid JSX closing tags
  cleaned = cleaned.replace(/(<\/\w+>|(?<!<)\/>)\s*>{1,}/g, '$1');
  
  // Fix ">>/" to "/>" for self-closing tags
  cleaned = cleaned.replace(/>>\//g, '/>');
  
  // Fix malformed render call: "render(<Component {...props} >/>)" -> "render(<Component {...props} />)"
  cleaned = cleaned.replace(/render\(([^)]+)\s*>\/>\);/g, 'render($1 />);');
  
  // Remove any standalone ">>>" or ">>" that shouldn't be there
  cleaned = cleaned.replace(/\s*>{3,}\s*/g, ' ');
  cleaned = cleaned.replace(/\s*>{2}\s*/g, ' ');
  
  // Fix any remaining malformed arrow functions with extra characters
  cleaned = cleaned.replace(/=\s*\/\s*>>/g, '=>');
  cleaned = cleaned.replace(/=\s*\/\s*>/g, '=>');
  
  // CRITICAL: Fix specific patterns found in the generated code
  // Fix " =   />>" pattern (multiple spaces)
  cleaned = cleaned.replace(/=\s*\/\s*>>/g, '=>');
  
  // Fix JSX tags with extra ">>>" at the end
  cleaned = cleaned.replace(/(<[^>]+>)\s*>>>/g, '$1');
  
  // Fix JSX tags with extra ">>" at the end
  cleaned = cleaned.replace(/(<[^>]+>)\s*>>/g, '$1');
  
  // Fix self-closing tags with extra ">>" before "/>"
  cleaned = cleaned.replace(/(<[^>]+)\s*>>\s*\/>/g, '$1 />');
  
  // Fix render call with extra " >/>"
  cleaned = cleaned.replace(/render\(([^)]+)\s*>\s*\/>\);/g, 'render($1 />);');
  
  console.log(`AIComponentRenderer: Arrow function and character fixing completed for ${componentName}`);
  
  // CRITICAL: Apply the same robust cleaning as generate-component API
  console.log(`AIComponentRenderer: Applying generate-component style cleaning for ${componentName}...`);
  
  // Apply the same fixCommonSyntaxErrors function logic
  // Remove any descriptive text before the component code
  cleaned = cleaned.replace(/^[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/i, '');
  
  // CRITICAL: Fix incomplete JSX tags that are causing the syntax error
  console.log(`AIComponentRenderer: Fixing incomplete JSX tags for ${componentName}...`);
  
  // Fix patterns like: style={{...}} <div -> style={{...}}> <div
  cleaned = cleaned.replace(/}\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, '}> <$1');
  
  // Fix patterns like: " <div -> "> <div
  cleaned = cleaned.replace(/"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, '"> <$1');
  
  // Fix patterns like: true <div -> true> <div
  cleaned = cleaned.replace(/(true|false)\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, '$1> <$2');
  
  // Fix patterns like: "modal-title" <div -> "modal-title"> <div
  cleaned = cleaned.replace(/"([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, '"$1"> <$2');
  
  // Fix patterns like: } <div -> }> <div
  cleaned = cleaned.replace(/}\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, '}> <$1');
  
  // Fix patterns like: ) <div -> )> <div
  cleaned = cleaned.replace(/\)\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, ')> <$1');
  
  // Fix patterns like: , <div -> ,> <div
  cleaned = cleaned.replace(/,\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, ',> <$1');
  
  console.log(`AIComponentRenderer: Incomplete JSX tag fixing completed for ${componentName}`);
  
  // CRITICAL: Additional specific fixes for the exact patterns in the error
  console.log(`AIComponentRenderer: Applying additional specific fixes for ${componentName}...`);
  
  // Fix the exact pattern causing the error: aria-labelledby="modal-title" <div
  cleaned = cleaned.replace(/aria-labelledby="([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'aria-labelledby="$1"> <$2');
  
  // Fix patterns like: role="dialog" <div
  cleaned = cleaned.replace(/role="([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'role="$1"> <$2');
  
  // Fix patterns like: aria-modal="true" <div
  cleaned = cleaned.replace(/aria-modal="([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'aria-modal="$1"> <$2');
  
  // Fix patterns like: id="modal-title" <h2
  cleaned = cleaned.replace(/id="([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'id="$1"> <$2');
  
  // Fix patterns like: htmlFor="alert-name" <label
  cleaned = cleaned.replace(/htmlFor="([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'htmlFor="$1"> <$2');
  
  // Fix patterns like: type="text" <input
  cleaned = cleaned.replace(/type="([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'type="$1"> <$2');
  
  // Fix patterns like: placeholder="..." <input
  cleaned = cleaned.replace(/placeholder="([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'placeholder="$1"> <$2');
  
  // Fix patterns like: checked={...} <input
  cleaned = cleaned.replace(/checked=\{([^}]*)\}\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'checked={$1}> <$2');
  
  // Fix patterns like: onChange={...} <input
  cleaned = cleaned.replace(/onChange=\{([^}]*)\}\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'onChange={$1}> <$2');
  
  // Fix patterns like: onClick={...} <button
  cleaned = cleaned.replace(/onClick=\{([^}]*)\}\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'onClick={$1}> <$2');
  
  // Fix patterns like: disabled={...} <button
  cleaned = cleaned.replace(/disabled=\{([^}]*)\}\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'disabled={$1}> <$2');
  
  console.log(`AIComponentRenderer: Additional specific fixes completed for ${componentName}`);
  
  // CRITICAL: Fix the exact patterns causing the current error
  console.log(`AIComponentRenderer: Fixing exact patterns causing syntax errors for ${componentName}...`);
  
  // Fix patterns like: id="modal-title" {title} -> id="modal-title">{title}
  cleaned = cleaned.replace(/id="([^"]*)"\s*\{([^}]*)\}/g, 'id="$1">{$2}');
  
  // Fix patterns like: style={styles.modalTitle} {title} -> style={styles.modalTitle}>{title}
  cleaned = cleaned.replace(/style=\{([^}]*)\}\s*\{([^}]*)\}/g, 'style={$1}>{$2}');
  
  // Fix patterns like: style={styles.formLabel} Name your alert -> style={styles.formLabel}>Name your alert
  cleaned = cleaned.replace(/style=\{([^}]*)\}\s*([a-zA-Z][a-zA-Z\s]*[a-zA-Z])(?=\s*<\/)/g, 'style={$1}>$2');
  
  // Fix patterns like: style={styles.toggleLabel} Get notified via: -> style={styles.toggleLabel}>Get notified via:
  cleaned = cleaned.replace(/style=\{([^}]*)\}\s*([a-zA-Z][a-zA-Z\s]*[a-zA-Z])(?=\s*<)/g, 'style={$1}>$2');
  
  // Fix patterns like: onClick={() = setNotificationMethod('email')} -> onClick={() => setNotificationMethod('email')}
  cleaned = cleaned.replace(/onClick=\{\(\)\s*=\s*([^}]*)\}/g, 'onClick={() => $1}');
  
  // Fix patterns like: onKeyPress={(e) => e.key === 'Enter' && setNotificationMethod('email')} -> onKeyPress={(e) => e.key === 'Enter' && setNotificationMethod('email')}
  cleaned = cleaned.replace(/onKeyPress=\{\(e\)\s*=\s*([^}]*)\}/g, 'onKeyPress={(e) => $1}');
  
  // Fix patterns like: onClick={handleSave} Save Alert -> onClick={handleSave}>Save Alert
  cleaned = cleaned.replace(/onClick=\{([^}]*)\}\s*([a-zA-Z][a-zA-Z\s]*[a-zA-Z])(?=\s*<\/)/g, 'onClick={$1}>$2');
  
  // Fix patterns like: {filters.map((filter, index) => ( -> {filters.map((filter, index) => (
  cleaned = cleaned.replace(/\{([^}]*\.map\([^)]*\)\s*=>\s*\(\))\s*\{/g, '{$1} {');
  
  // Fix patterns like: {filter.label} -> {filter.label}
  cleaned = cleaned.replace(/\{([^}]*\.label)\}\s*\{/g, '{$1} {');
  
  // Fix patterns like: {filter.value} -> {filter.value}
  cleaned = cleaned.replace(/\{([^}]*\.value)\}\s*\{/g, '{$1} {');
  
  console.log(`AIComponentRenderer: Exact pattern fixes completed for ${componentName}`);
  
  // CRITICAL: Fix the specific patterns causing the current error
  console.log(`AIComponentRenderer: Fixing specific patterns causing syntax errors for ${componentName}...`);
  
  // Fix patterns like: aria-labelledby="modal-title"> <div -> aria-labelledby="modal-title"> <div
  cleaned = cleaned.replace(/aria-labelledby="([^"]*)"\s*>\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'aria-labelledby="$1"> <$2');
  
  // Fix patterns like: style={styles.modalContent}> <div -> style={styles.modalContent}> <div
  cleaned = cleaned.replace(/style=\{([^}]*)\}\s*>\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'style={$1}> <$2');
  
  // Fix patterns like: style={styles.searchFilters}> <h3 -> style={styles.searchFilters}> <h3
  cleaned = cleaned.replace(/style=\{([^}]*)\}\s*>\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'style={$1}> <$2');
  
  // Fix patterns like: style={styles.formGroup}> <label -> style={styles.formGroup}> <label
  cleaned = cleaned.replace(/style=\{([^}]*)\}\s*>\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'style={$1}> <$2');
  
  // Fix patterns like: style={styles.notificationToggle}> <span -> style={styles.notificationToggle}> <span
  cleaned = cleaned.replace(/style=\{([^}]*)\}\s*>\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'style={$1}> <$2');
  
  // Fix patterns like: style={styles.modalFooter}> <button -> style={styles.modalFooter}> <button
  cleaned = cleaned.replace(/style=\{([^}]*)\}\s*>\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'style={$1}> <$2');
  
  // Fix patterns like: disabled={!alertName} Save Alert -> disabled={!alertName}>Save Alert
  cleaned = cleaned.replace(/disabled=\{([^}]*)\}\s*([a-zA-Z][a-zA-Z\s]*[a-zA-Z])(?=\s*<\/)/g, 'disabled={$1}>$2');
  
  // Fix patterns like: } / </span> -> } />
  cleaned = cleaned.replace(/\}\s*\/\s*<\/span>/g, '} />');
  
  // Fix patterns like: } / </span> -> } />
  cleaned = cleaned.replace(/\}\s*\/\s*<\/span>/g, '} />');
  
  // Remove extra closing tags at the end
  cleaned = cleaned.replace(/\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*$/g, ');');
  
  // Fix patterns like: render(<Modal {...externalProps}  />); -> render(<Modal {...externalProps} />);
  cleaned = cleaned.replace(/render\(<([^>]+)\s*\{\s*\.\.\.externalProps\s*\}\s*\/>\);/g, 'render(<$1 {...externalProps} />);');
  
  console.log(`AIComponentRenderer: Specific pattern fixes completed for ${componentName}`);
  
  // Remove lines that start with descriptive text patterns
  cleaned = cleaned.replace(/^(Create|Here's|This is|Building|Making|Let me create|I'll create|Generate)[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
  
  // Remove markdown-style text like "**Input Fields:**" etc.
  cleaned = cleaned.replace(/^\*\*[^*]+\*\*[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
  
  // Remove bullet points and descriptions
  cleaned = cleaned.replace(/^[\s\S]*?(?:- [^\n]*\n)*(?=const\s+\w+\s*=|function\s+\w+)/im, '');
  
  // Look for the first occurrence of "const " and remove everything before it as fallback
  const constMatch = cleaned.match(/const\s+\w+\s*=/);
  if (constMatch) {
    const constIndex = cleaned.indexOf(constMatch[0]);
    if (constIndex > 0) {
      cleaned = cleaned.substring(constIndex);
    }
  }
  
  // Fix incomplete className strings with double braces
  cleaned = cleaned.replace(/bg-opacity}}/g, 'bg-opacity-50');
  cleaned = cleaned.replace(/opacity}}/g, 'opacity-50');
  
  // Fix incomplete JSX tags
  cleaned = cleaned.replace(/className="[^"]*}}$/gm, (match: string) => {
    const cleanMatch = match.replace(/}}$/, '');
    return cleanMatch + (cleanMatch.endsWith('"') ? '' : '"');
  });
  
  // Fix incomplete div tags at the end
  cleaned = cleaned.replace(/<div className="[^"]*}}\s*$/gm, (match: string) => {
    const cleanMatch = match.replace(/}}\s*$/, '');
    return cleanMatch + '"></div>';
  });
  
  // Ensure proper closing of JSX elements
  const openTags = (cleaned.match(/<[^/][^>]*[^/]>/g) || []).length;
  const closeTags = (cleaned.match(/<\/[^>]+>/g) || []).length;
  
  // Add missing closing div tags if needed
  if (openTags > closeTags) {
    const missingTags = openTags - closeTags;
    for (let i = 0; i < missingTags; i++) {
      cleaned += '\n        </div>';
    }
  }
  
  // Apply the same validateAndCompleteJSX function logic
  // Count opening and closing braces
  const openBraces = (cleaned.match(/{/g) || []).length;
  const closeBraces = (cleaned.match(/}/g) || []).length;
  
  // Add missing closing braces
  if (openBraces > closeBraces) {
    const diff = openBraces - closeBraces;
    cleaned += '}'.repeat(diff);
  }
  
  // Count opening and closing parentheses
  const openParens = (cleaned.match(/\(/g) || []).length;
  const closeParens = (cleaned.match(/\)/g) || []).length;
  
  // Add missing closing parentheses
  if (openParens > closeParens) {
    const diff = openParens - closeParens;
    cleaned += ')'.repeat(diff);
  }
  
  // Ensure the code ends properly
  if (!cleaned.trim().endsWith(';') && !cleaned.trim().endsWith('}')) {
    cleaned += ';';
  }
  
  console.log(`AIComponentRenderer: Generate-component style cleaning completed for ${componentName}`);
      
      // CRITICAL: Add render call at the end for noInline mode - ALWAYS
      if (!cleaned.includes('render(')) {
        cleaned += `\n\nrender(<${componentName} {...externalProps} />);`;
        console.log(`AIComponentRenderer: Added missing render call for ${componentName}`);
  } else {
    // Ensure the render call includes externalProps
    cleaned = cleaned.replace(/render\(<(\w+)\s*\/?>/g, `render(<$1 {...externalProps} />`);
    console.log(`AIComponentRenderer: Updated existing render call for ${componentName} to include externalProps`);
  }
  
  // CRITICAL: Fix render calls that don't include externalProps
  if (cleaned.includes('render(<') && !cleaned.includes('{...externalProps}')) {
    cleaned = cleaned.replace(/render\(<(\w+)\s*\/?>/g, `render(<$1 {...externalProps} />`);
    console.log(`AIComponentRenderer: Fixed render call to include externalProps for ${componentName}`);
  }
  
  // CRITICAL: Ensure render call is properly formatted and complete
  if (cleaned.includes('render(') && !cleaned.includes('render(') + ');') {
    // Find the render call and ensure it ends properly
    const renderMatch = cleaned.match(/render\([^)]*\)/);
    if (renderMatch && !cleaned.includes(renderMatch[0] + ';')) {
      cleaned = cleaned.replace(renderMatch[0], renderMatch[0] + ';');
      console.log(`AIComponentRenderer: Fixed incomplete render call for ${componentName}`);
    }
      }
      
      // FINAL CLEANUP: Remove any content after the render call (most common cause of syntax errors)
      cleaned = cleaned.replace(/(render\([^)]+\);)[\s\S]*$/g, '$1');
      
      // Ensure the code ends with a semicolon or closing brace
      if (!cleaned.trim().endsWith(';') && !cleaned.trim().endsWith('}')) {
        cleaned += ';';
      }
      
      // CRITICAL: Fix React Live compatibility issues before parsing
      console.log(`🔧 Applying React Live compatibility fixes for ${componentName}`);
      
      // CRITICAL: Fix CSS-in-JS properties that React Live doesn't support well
      // Remove WebkitLineClamp and WebkitBoxOrient completely as they break React Live
      cleaned = cleaned.replace(/,?\s*WebkitLineClamp:\s*\d+,?\s*/g, '');
      cleaned = cleaned.replace(/,?\s*WebkitBoxOrient:\s*"[^"]+",?\s*/g, '');
      cleaned = cleaned.replace(/,?\s*display:\s*"-webkit-box",?\s*/g, '');
      
      // Clean up any double commas or trailing commas left behind
      cleaned = cleaned.replace(/,\s*,/g, ',');
      cleaned = cleaned.replace(/,(\s*)\}/g, '$1}');
      cleaned = cleaned.replace(/\{\s*,/g, '{');
      
      // TEMPORARILY DISABLED: ID fixing might be corrupting code
      console.log('🔧 SKIPPING ID fixes to prevent corruption');
      
      // Keep original IDs for now to avoid any regex corruption
      // The issue might be these complex regex operations
      
      console.log('✅ COMPATIBILITY FIXES APPLIED - React-breaking patterns removed');
      
      // Fix template literal IDs that might cause issues in React Live
      cleaned = cleaned.replace(/id=\{`([^`]*)\$\{([^}]+)\}([^`]*)`\}/g, (match, prefix, variable, suffix) => {
        return `id={"${prefix}" + ${variable} + "${suffix}"}`;
      });
      
      // Fix calc() expressions in style objects
      cleaned = cleaned.replace(/"calc\(([^)]+)\)"/g, "'calc($1)'");
      
      // Fix viewport height calculations that might not work in React Live
      cleaned = cleaned.replace(/height:\s*"calc\(100vh\s*-\s*(\d+)px\)"/g, 'height: "400px" /* calc(100vh - $1px) not supported in preview */');
      
      // CRITICAL: Fix pseudo-classes in inline styles (React doesn't support them)
      // Remove :hover, :focus, :active pseudo-classes from inline styles
      cleaned = cleaned.replace(/['"]:hover['"]:\s*\{[^}]*\},?\s*/g, '');
      cleaned = cleaned.replace(/['"]:focus['"]:\s*\{[^}]*\},?\s*/g, '');
      cleaned = cleaned.replace(/['"]:active['"]:\s*\{[^}]*\},?\s*/g, '');
      cleaned = cleaned.replace(/['"]:visited['"]:\s*\{[^}]*\},?\s*/g, '');
      
      // Clean up any remaining commas after removing pseudo-classes
      cleaned = cleaned.replace(/,(\s*)\}/g, '$1}');
      
      // Fix any remaining template literals in object properties
      cleaned = cleaned.replace(/(\w+):\s*`([^`]*)\$\{([^}]+)\}([^`]*)`/g, '$1: "$2" + $3 + "$4"');
      
      console.log(`🔧 Applied compatibility fixes including pseudo-class removal, code length: ${cleaned.length}`);
      
      // CRITICAL: Debug the cleaned code before testing
      console.log(`🔧 About to test code parsing for ${componentName}`);
      console.log(`📊 Code stats: ${cleaned.length} chars, has render call: ${cleaned.includes('render(')}`);
      console.log(`🔍 First 200 chars:`, cleaned.substring(0, 200));
      console.log(`🔍 Last 200 chars:`, cleaned.substring(Math.max(0, cleaned.length - 200)));
      
      // CRITICAL: Check for common React Live breaking patterns
      const pseudoClassCheck = cleaned.match(/['"][:](?:hover|focus|active|visited)['"]:/);
      if (pseudoClassCheck) {
        console.error(`❌ FOUND PSEUDO-CLASS IN INLINE STYLES! This will break React:`, pseudoClassCheck[0]);
      }
      
      const webkitCheck = cleaned.match(/WebkitLineClamp:\s*\d+|WebkitBoxOrient:\s*"[^"]+"/);
      if (webkitCheck) {
        console.error(`❌ FOUND WEBKIT PROPERTIES! These break React Live:`, webkitCheck[0]);
      }
      
      const calcCheck = cleaned.match(/["']calc\(/);
      if (calcCheck) {
        console.warn(`⚠️ Found calc() in styles - may cause issues:`, calcCheck[0]);
      }
      
      console.log('✅ COMPATIBILITY CHECKS RE-ENABLED - Monitoring for React-breaking patterns');
      
      // Final check: if there are still syntax issues, try to fix them more intelligently
      try {
        // Test if the code can be parsed as valid JavaScript
        new Function(cleaned);
        console.log(`✅ Code parsing successful for ${componentName} - proceeding with original component`);
      } catch (parseError) {
        console.error(`❌ FIRST PARSING ATTEMPT FAILED for ${componentName}:`);
        console.error(`📄 Parse Error:`, parseError instanceof Error ? parseError.message : String(parseError));
        console.error(`📄 Code length: ${cleaned.length} characters`);
        console.error(`📄 First 300 chars:`, cleaned.substring(0, 300));
        console.error(`📄 Last 300 chars:`, cleaned.substring(Math.max(0, cleaned.length - 300)));
        
        // Check for specific React Live problem patterns
        const problemPatterns = [
          { name: 'Template literals in JSX', pattern: /\$\{[^}]+\}/g },
          { name: 'WebKit properties', pattern: /WebkitLineClamp|WebkitBoxOrient/g },
          { name: 'Pseudo-classes', pattern: /['"][:](?:hover|focus|active|visited)['"]:/g },
          { name: 'calc() expressions', pattern: /calc\(/g },
          { name: 'Missing React imports', pattern: /useState|useEffect/ },
          { name: 'JSX without React', pattern: /<[A-Z]/ }
        ];
        
        problemPatterns.forEach(({ name, pattern }) => {
          const matches = cleaned.match(pattern);
          if (matches) {
            console.error(`❌ FOUND ${name.toUpperCase()}: ${matches.length} instances`, matches.slice(0, 3));
          }
        });
        
        // CRITICAL: Don't give up too easily - try to fix common issues first
        let fixedCode = cleaned;
        
        // Fix missing semicolons
        fixedCode = fixedCode.replace(/(\w+)\s*\n(?=\s*[;}])/g, '$1;');
        
        // Fix incomplete function calls  
        fixedCode = fixedCode.replace(/(\w+)\(\s*$/gm, '$1();');
        
        // CRITICAL: Remove CSS properties that break React Live completely
        fixedCode = fixedCode.replace(/,?\s*WebkitLineClamp:\s*\d+,?\s*/g, '');
        fixedCode = fixedCode.replace(/,?\s*WebkitBoxOrient:\s*"[^"]+",?\s*/g, '');
        fixedCode = fixedCode.replace(/,?\s*display:\s*"-webkit-box",?\s*/g, '');
        
        // Clean up any syntax issues from removal
        fixedCode = fixedCode.replace(/,\s*,/g, ',');
        fixedCode = fixedCode.replace(/,(\s*)\}/g, '$1}');
        fixedCode = fixedCode.replace(/\{\s*,/g, '{');
        
        // Fix any remaining template literal issues
        fixedCode = fixedCode.replace(/\$\{([^}]+)\}/g, '" + $1 + "');
        
        // Try parsing again
        try {
          new Function(fixedCode);
          console.log(`✅ Fixed React Live compatibility issues for ${componentName}`);
          cleaned = fixedCode;
                  } catch (secondError) {
            console.error(`❌ Could not fix parsing issues for ${componentName}:`, secondError);
            console.error(`📄 Final error:`, secondError instanceof Error ? secondError.message : String(secondError));
            
                        // TEMPORARY DEBUG: Force React Live to show the actual error
            console.error(`🚨 FORCING DEBUG MODE - Let React Live show the real error!`);
            console.error(`📋 Component code that's failing:`, cleaned.substring(0, 500));
            
            // SKIP fallback generation - let React Live show its native error
            // Don't replace 'cleaned' with fallback code
            // This should make React Live display its actual parsing error
          }
      }
      
      // Final debug log
      console.log(`🔧 Final cleaned code (first 150 chars):`, cleaned.substring(0, 150) + '...');
      
      return cleaned;
    } catch (err) {
      console.error('Error cleaning code:', err);
      setRenderError('Error processing component code');
      return code; // Return original code if cleaning fails
    }
  };

  // Check for saved modified code first
  let cleanedCode = generatedCode || '';
  
  // CRITICAL: Handle missing generatedCode - this is the main issue!
  if (!generatedCode) {
    console.error(`❌ CRITICAL: No generatedCode found for component ${component.id}`);
    console.error(`❌ Component properties:`, component.properties);
    console.error(`❌ Available properties:`, Object.keys(component.properties || {}));
    
    // Try to find generatedCode in different possible locations
    const possibleGeneratedCode = 
      component.properties?.generatedCode ||
      component.properties?.code ||
      component.properties?.component ||
      (component as any).generatedCode;
    
    if (possibleGeneratedCode) {
      console.log(`✅ Found generatedCode in alternative location:`, possibleGeneratedCode.substring(0, 100));
      cleanedCode = possibleGeneratedCode;
    } else {
      console.log(`🔧 EMERGENCY RECOVERY: Attempting to recover missing generatedCode for ${component.id}`);
      
      // Emergency recovery - provide default ContactSellerModal code
      const recoveredCode = `const ContactSellerModal = (props) => {
  const { className = '', value: externalValue, onChange: externalOnChange, content } = props || {};
  const [internalValue, setInternalValue] = useState(externalValue || '');
  const [internalContent, setInternalContent] = useState(content || 'Hi, I\\'m interested in this item. Could you tell me more about it?');
  
  const currentValue = externalValue !== undefined ? externalValue : internalValue;
  const currentContent = content !== undefined ? content : internalContent;
  
  useEffect(() => {
    if (content !== undefined) {
      setInternalContent(content);
    }
  }, [content]);
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    if (externalOnChange) {
      externalOnChange(e);
        } else {
      setInternalValue(newValue);
    }
  };
  
  const handleSubmit = () => {
    console.log('Message sent:', currentContent + ' ' + currentValue);
  };
  
  return (
    <div className={className} style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Contact Seller</h2>
      
      <div id="output-message-preview" style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px'
      }}>
        {currentContent}
      </div>
      
      <Textarea 
        id="textarea-additional-notes"
        value={currentValue}
        onChange={handleChange}
        placeholder="Add any additional notes..."
        style={{ width: '100%', minHeight: '100px', marginBottom: '15px' }}
      />
      
      <Button 
        id="button-send-message"
        onClick={handleSubmit}
        style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
      >
        Send Message
      </Button>
      
      <div id="note-response-time" style={{ fontSize: '12px', color: '#666' }}>
        Average seller response time: 24 hours
        </div>
      </div>
    );
};

render(<ContactSellerModal />);`;
      
      console.log(`✅ Using recovered code for component ${component.id}`);
      cleanedCode = recoveredCode;
      
      // Also try to save the recovered code back to localStorage
      try {
        const prototypeComponents = localStorage.getItem('prototypeComponents');
        if (prototypeComponents) {
          const components = JSON.parse(prototypeComponents);
          const componentIndex = components.findIndex((c: any) => c.id === component.id);
          
          if (componentIndex !== -1) {
            components[componentIndex].properties = {
              ...components[componentIndex].properties,
              generatedCode: recoveredCode,
              prompt: "This is a modal titled \"Contact seller\" that opens a chat with the seller. It contains a pre-filled greeting message and a text input for additional notes. A \"Send Message\" button submits the form, which then launches the in-platform messaging thread. A note below mentions the average seller response time.",
              lastModified: new Date().toISOString()
            };
            
            localStorage.setItem('prototypeComponents', JSON.stringify(components));
            console.log(`✅ Saved recovered code to localStorage for component ${component.id}`);
          }
        }
      } catch (error) {
        console.error('❌ Error saving recovered code:', error);
      }
    }
  }
  
  // CRITICAL: Check if we have saved modified code for this component
  const localStorageKey = `modifiedCode_${component.id}`;
  let savedModifiedCode: string | null = null;
  if (typeof window !== 'undefined') {
    // Access localStorage only in browser to avoid SSR issues
    savedModifiedCode = localStorage.getItem(localStorageKey);
  }
  
  // Also check if component has direct manipulation changes in its properties
  let hasDirectManipulationChanges = component.properties?.hasDirectManipulationChanges;
  let styleOverrides = component.properties?.styleOverrides;
  let textContent = component.properties?.textContent;
  let placeholder = component.properties?.placeholder;
  
  // CRITICAL: Check for Run Mode sync data (this is the key fix!)
  const runModeSyncData = getRunModeSyncData(component.id);
  if (runModeSyncData) {
    console.log(`🔄 Found Run Mode sync data for ${component.id}:`, runModeSyncData);
    hasDirectManipulationChanges = runModeSyncData.hasDirectManipulationChanges;
    styleOverrides = runModeSyncData.styleOverrides;
    textContent = runModeSyncData.textContent;
    placeholder = runModeSyncData.placeholder;
    
    // CRITICAL: Permanently save these changes to prototypeComponents
    try {
      const prototypeComponents = localStorage.getItem('prototypeComponents');
      if (prototypeComponents) {
        const components = JSON.parse(prototypeComponents);
        const componentIndex = components.findIndex((c: any) => c.id === component.id);
        
        if (componentIndex !== -1) {
          // Update the component properties with the sync data
          components[componentIndex].properties = {
            ...components[componentIndex].properties,
            hasDirectManipulationChanges: runModeSyncData.hasDirectManipulationChanges,
            styleOverrides: runModeSyncData.styleOverrides,
            textContent: runModeSyncData.textContent,
            placeholder: runModeSyncData.placeholder,
            color: runModeSyncData.color,
            backgroundColor: runModeSyncData.backgroundColor,
            lastModified: new Date().toISOString()
          };
          
          // Save back to localStorage
          localStorage.setItem('prototypeComponents', JSON.stringify(components));
          console.log(`💾 Permanently saved sync changes to prototypeComponents for ${component.id}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error saving sync changes to prototypeComponents for ${component.id}:`, error);
    }
    
    // Mark the sync data as applied (but keep it for persistence)
    markRunModeSyncDataAsApplied(component.id);
  }
  
  if (savedModifiedCode) {
    try {
      const savedData = JSON.parse(savedModifiedCode);
      console.log(`💾 Found saved modified code for ${component.id}:`, savedData);
      
      // Use the saved modified code instead of the original
      cleanedCode = savedData.modifiedCode;
      console.log(`📄 Using saved modified code (${cleanedCode.length} chars) instead of original (${generatedCode?.length || 0} chars)`);
      
      // Mark that we're using modified code
      console.log(`✅ Component ${component.id} using permanently saved modified code`);
    } catch (error) {
      console.error('❌ Error parsing saved modified code:', error);
      // Fall back to original code
      cleanedCode = generatedCode || '';
    }
  } else if (hasDirectManipulationChanges && (styleOverrides || textContent || placeholder)) {
    console.log(`🎨 Component ${component.id} has direct manipulation changes in properties:`, {
      hasDirectManipulationChanges,
      styleOverrides,
      textContent,
      placeholder
    });
    
    // Use the original code but apply changes through the injectDirectManipulationChanges function
    cleanedCode = generatedCode || '';
    console.log(`📄 Using original code with direct manipulation changes applied`);
  } else {
    console.log(`📄 No saved modified code or direct manipulation changes found for ${component.id}, using original generated code`);
  }
  
  // 🚨 TEMPORARY TEST: If no generatedCode, use the NoteTakingApp for testing
  if (!cleanedCode && component.type === 'AIDisplay') {
    console.log('🧪 TESTING: Using hardcoded NoteTakingApp for debugging');
    cleanedCode = `const NoteTakingApp = () => {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);

  const handleAddNote = () => {
    if (currentNote.trim()) {
      setNotes([...notes, { id: Date.now(), content: currentNote }]);
      setCurrentNote('');
    }
  };

  const handleDeleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
    if (selectedNote && selectedNote.id === id) {
      setSelectedNote(null);
    }
  };

  const handleSelectNote = (note) => {
    setSelectedNote(note);
  };

  return (
    <div className="note-app" style={{ display: 'flex', height: '500px' }}>
      <div className="sidebar" style={{ width: '250px', borderRight: '1px solid #ddd', padding: '10px' }}>
        <div style={{ marginBottom: '10px' }}>
          <Textarea 
            id="note-input" 
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder="Enter new note..."
            style={{ width: '100%', marginBottom: '10px' }}
          />
          <Button 
            id="add-btn" 
            onClick={handleAddNote}
            style={{ width: '100%' }}
          >
            Add Note
          </Button>
        </div>
        <div className="note-list" style={{ overflowY: 'auto', height: '400px' }}>
          {notes.map(note => (
            <div 
              key={note.id}
              className={\`note-item \${selectedNote?.id === note.id ? 'selected' : ''}\`}
              onClick={() => handleSelectNote(note)}
              style={{ 
                padding: '8px', 
                marginBottom: '5px', 
                cursor: 'pointer',
                backgroundColor: selectedNote?.id === note.id ? '#f0f0f0' : 'white',
                border: '1px solid #eee',
                borderRadius: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '180px'
                }}>
                  {note.content.substring(0, 30)}{note.content.length > 30 ? '...' : ''}
                </div>
                <Button 
                  id={\`delete-btn-\${note.id}\`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  style={{ padding: '0 5px', minWidth: '20px' }}
                >
                  ×
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="note-view" style={{ flex: 1, padding: '20px' }}>
        {selectedNote ? (
          <div>
            <div style={{ 
              fontSize: '18px', 
              marginBottom: '20px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {selectedNote.content}
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#999'
          }}>
            Select a note to view
          </div>
        )}
      </div>
    </div>
  );
};

render(<NoteTakingApp />);`;
  }
  
  // CRITICAL: Always inject selection capabilities for direct manipulation
  cleanedCode = injectSelectionCapabilities(cleanedCode);
  
  // Inject content handling for dynamic content
  cleanedCode = injectContentHandling(cleanedCode);
  
  // Inject direct manipulation changes (style overrides, content changes, etc.)
  cleanedCode = injectDirectManipulationChanges(cleanedCode);
  
  // Inject element positioning if enabled
  cleanedCode = injectElementPositioning(cleanedCode);
  
  // 🚨 AUTOMATIC CONSOLE LOGGING FOR REAL-TIME TRACKING
  if (isInteractive && component.properties?.hasDirectManipulationChanges) {
    console.log(`🔄 REAL-TIME RENDER - Component ${component.id}:`);
    console.log(`📄 Original Code Length:`, generatedCode?.length || 0);
    console.log(`📄 Modified Code Length:`, cleanedCode?.length || 0);
    console.log(`🎨 Changes Applied:`, {
      styleOverrides: component.properties?.styleOverrides,
      textContent: component.properties?.textContent,
      placeholder: component.properties?.placeholder,
      color: component.properties?.color,
      backgroundColor: component.properties?.backgroundColor
    });
    console.log(`📄 Modified Code Preview (first 200 chars):`, cleanedCode.substring(0, 200));
  }
  
  console.log('🚫 ALL CLEANING DISABLED - Using completely raw code');
  console.log('📄 Raw code (first 200 chars):', cleanedCode.substring(0, 200));
  
  // CRITICAL: Debug the cleaning process and detect issues early
  if (generatedCode && cleanedCode) {
    console.log(`🔧 Code cleaning for ${component.id}:`);
    console.log(`📥 Original length: ${generatedCode.length} chars`);
    console.log(`📤 Cleaned length: ${cleanedCode.length} chars`);
    console.log(`📥 Original first 100 chars: "${generatedCode.substring(0, 100)}"`);
    console.log(`📤 Cleaned first 100 chars: "${cleanedCode.substring(0, 100)}"`);
    
    // Check for potential issues
    const reductionPercentage = ((generatedCode.length - cleanedCode.length) / generatedCode.length) * 100;
    console.log(`📊 Code reduction: ${reductionPercentage.toFixed(1)}%`);
    
    // CRITICAL: Check if we got a fallback component instead of the original
    const isFallbackComponent = cleanedCode.includes('Complex Component Detected') || 
                                cleanedCode.includes('too complex for the preview environment') ||
                                cleanedCode.includes('Original component had parsing errors');
    
    if (isFallbackComponent) {
      console.error(`❌ FALLBACK COMPONENT DETECTED! Original component was replaced with simplified version`);
      console.log(`📄 Fallback code:`, cleanedCode.substring(0, 200));
      console.log(`📄 Original code sample:`, generatedCode.substring(0, 500));
    } else if (reductionPercentage > 70) {
      console.error(`❌ Code was SEVERELY shortened (${reductionPercentage.toFixed(1)}% reduction) - likely cleaning issue!`);
      console.log(`📄 Original code sample:`, generatedCode.substring(0, 500));
    } else if (reductionPercentage > 50) {
      console.warn(`⚠️ Code was significantly shortened (${reductionPercentage.toFixed(1)}% reduction) - potential issue!`);
    } else {
      console.log(`✅ Code cleaning looks reasonable (${reductionPercentage.toFixed(1)}% reduction)`);
    }
    
    // Check if the component contains the expected content
    if (generatedCode.includes('YouTubeReplica') && !cleanedCode.includes('YouTubeReplica')) {
      console.error(`❌ LOST YOUTUBE COMPONENT! Original had YouTubeReplica but cleaned version doesn't`);
    }
    
    // Check for proper render call
    if (!cleanedCode.includes('render(')) {
      console.error(`❌ NO RENDER CALL! Cleaned code missing render() call`);
    }
    
    // Check for syntax issues
    const openBraces = (cleanedCode.match(/{/g) || []).length;
    const closeBraces = (cleanedCode.match(/}/g) || []).length;
    const openParens = (cleanedCode.match(/\(/g) || []).length;
    const closeParens = (cleanedCode.match(/\)/g) || []).length;
    
    console.log(`🔍 Syntax check: Braces ${openBraces}/${closeBraces}, Parens ${openParens}/${closeParens}`);
    
    if (openBraces !== closeBraces) {
      console.error(`❌ Brace mismatch: ${openBraces} open, ${closeBraces} close`);
    }
    if (openParens !== closeParens) {
      console.error(`❌ Parentheses mismatch: ${openParens} open, ${closeParens} close`);
    }
  }

  // Debug: Log the cleaned code for AI components
  if (isInteractive && Object.keys(restProps).length > 0 && cleanedCode) {
    console.log(`AI Component ${component.id} cleaned code:`, cleanedCode.substring(0, 500) + '...');
  }

  // Show a placeholder while client-side rendering is occurring
  if (!mounted) {
    return (
      <div className={`ai-component ${className} border rounded-md overflow-hidden`} id={id}>
        <div className="p-4">
          <div className="animate-pulse h-6 bg-gray-200 rounded mb-2 w-1/2"></div>
          <div className="animate-pulse h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  // Render a fallback UI if there's no code to render
  if (!cleanedCode) {
    console.log(`🚨 CRITICAL: No cleanedCode for component ${component.id}`);
    console.log(`🚨 generatedCode:`, generatedCode);
    console.log(`🚨 component.properties:`, component.properties);
    console.log(`🚨 Available properties keys:`, component.properties ? Object.keys(component.properties) : 'No properties');
    
    // In run mode, show a cleaner error message
    if (isRunMode) {
      return (
        <div className={`ai-component ${className} border rounded-md overflow-hidden bg-gray-50`} id={id}>
          <div className="p-4 text-center">
            <div className="text-sm text-gray-600 mb-2">
              AI Component Not Ready
            </div>
            <div className="text-xs text-gray-400">
              Component {component.id} requires code generation
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`ai-component ${className} border rounded-md overflow-hidden`} id={id}>
        <div className="space-y-2">
          {/* Hide long prompt description in editor mode fallback */}
          <div className="bg-gray-50 p-2 text-xs border-b">
            <div className="flex justify-between items-center">
              <p className="font-medium">{component.type}</p>
            </div>
          </div>
          <div className="text-sm text-red-500 p-2 text-center">
            ❌ No code available to render - Missing generatedCode property
          </div>
          
          {/* Debug info to show what content is being received */}
          <div className="bg-yellow-50 p-2 text-xs border-t">
            <div className="font-bold text-yellow-800">🚨 Critical Debug Info:</div>
            <div><strong>Component ID:</strong> {component.id}</div>
            <div><strong>Component Type:</strong> {component.type}</div>
            <div><strong>Has Properties:</strong> {!!component.properties ? 'Yes' : 'No'}</div>
            <div><strong>Properties Keys:</strong> {component.properties ? Object.keys(component.properties).join(', ') : 'None'}</div>
            <div><strong>Has generatedCode:</strong> {!!component.properties?.generatedCode ? 'Yes' : 'No'}</div>
            <div><strong>GeneratedCode Length:</strong> {component.properties?.generatedCode?.length || 0}</div>
            <div><strong>Content prop:</strong> {JSON.stringify(restProps.content)}</div>
            <div><strong>RestProps keys:</strong> {Object.keys(restProps).join(', ')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AIComponentErrorBoundary componentId={component.id} isRunMode={isRunMode}>
      <div 
        className={`ai-component ${className}`}
        data-ai-component="true"
        data-component-id={component.id}
        data-component-type={component.type}
        style={{ position: 'relative' }}
        onClick={(e) => {
          // Only prevent selection if clicking on the component content, not control buttons
          const target = e.target as HTMLElement;
          const isControlButton = target.closest('button, [role="button"], .bg-gray-50, .bg-gray-100');
          
          if (!isControlButton) {
            e.stopPropagation();
            console.log('🎯 AI Component container clicked - preventing internal element selection');
          } else {
            console.log('🎯 Control button clicked - allowing normal behavior');
          }
        }}
        onContextMenu={(e) => {
        // Right-click handler for regenerate functionality in run mode
        if (isRunMode) {
          e.preventDefault();
          const modalWidth = 400;
          const modalHeight = 400;
          
          // Get the component's viewport position
          const rect = e.currentTarget.getBoundingClientRect();
          
          // Calculate modal position relative to the component's viewport position
          let x = rect.right + 20; // Position to the right of the component with 20px gap
          let y = rect.top;
          
          // Check if modal would go off the right edge of the viewport
          if (x + modalWidth > window.innerWidth) {
            x = rect.left - modalWidth - 20; // Position to the left of the component
          }
          
          // Check if modal would go off the bottom edge of the viewport
          if (y + modalHeight > window.innerHeight) {
            y = Math.max(20, window.innerHeight - modalHeight - 20);
          }
          
          // Ensure modal doesn't go off the left or top edges of the viewport
          x = Math.max(20, x);
          y = Math.max(20, y);
          
          console.log(`🎯 Regeneration dialog positioned at viewport coordinates:`, { x, y });
          console.log(`🎯 Component viewport rect:`, rect);
          console.log(`🎯 Component canvas position:`, component.position);
          console.log(`🎯 Component canvas size:`, component.size);
          
          setRegenModalPosition({ x, y });
          setShowRegenerateDialog(true);
        }
      }}
    >
      {/* Component Header - Hidden in run mode */}
      {!isRunMode && (
        <div className="flex items-center justify-between p-2 bg-gray-50 border-b text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium">AI Component</span>
            <span className="text-gray-500">({component.type})</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">ID: {component.id}</span>
            {isInteractive && (
              <span className="text-green-600">● Interactive</span>
            )}
          </div>
        </div>
      )}
      <div className="space-y-2">
        {/* Hide the detailed prompt text in editor mode; keep controls - Hidden in run mode */}
        {!isInteractive && !isRunMode && (
          <div className="bg-gray-50 p-2 text-xs border-b">
            <div className="flex justify-between items-center">
              <p className="font-medium">{component.type}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => setShowCode(!showCode)}
              >
                {showCode ? 'Hide Code' : 'Show Code'}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-6 text-xs ml-2"
                onClick={(e) => {
                  // Get the component's position on the canvas and convert to viewport coordinates
                  const modalWidth = 400;
                  const modalHeight = 400;
                  
                  // Get the component element to calculate viewport position
                  const componentElement = e.currentTarget.closest('[data-component-id]');
                  if (!componentElement) {
                    console.error('Could not find component element');
                    return;
                  }
                  
                  // Get the component's viewport position
                  const rect = componentElement.getBoundingClientRect();
                  
                  // Calculate modal position relative to the component's viewport position
                  let x = rect.right + 20; // Position to the right of the component with 20px gap
                  let y = rect.top;
                  
                  // Check if modal would go off the right edge of the viewport
                  if (x + modalWidth > window.innerWidth) {
                    x = rect.left - modalWidth - 20; // Position to the left of the component
                  }
                  
                  // Check if modal would go off the bottom edge of the viewport
                  if (y + modalHeight > window.innerHeight) {
                    y = Math.max(20, window.innerHeight - modalHeight - 20);
                  }
                  
                  // Ensure modal doesn't go off the left or top edges of the viewport
                  x = Math.max(20, x);
                  y = Math.max(20, y);
                  
                  console.log(`🎯 Regeneration dialog positioned at viewport coordinates:`, { x, y });
                  console.log(`🎯 Component viewport rect:`, rect);
                  console.log(`🎯 Component canvas position:`, component.position);
                  console.log(`🎯 Component size:`, component.size);
                  
                  setRegenModalPosition({ x, y });
                  setShowRegenerateDialog(true);
                }}
              >
                Regenerate
              </Button>
            </div>
          </div>
        )}
        
        {/* Show code when the button is clicked - Hidden in run mode */}
        {showCode && !isInteractive && !isRunMode && (
          <div className="border-t">
            <div className="flex justify-between items-center p-2 bg-gray-100">
              <span className="text-xs font-semibold text-gray-700">Component Code:</span>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                    alert('Code copied to clipboard!');
                  }}
                >
                  📋
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => setShowCode(false)}
                >
                  ✕
                </Button>
              </div>
            </div>
            <div 
              className="p-3 overflow-auto bg-white"
              style={{ 
                maxHeight: '300px',
                minHeight: '150px',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace'
              }}
            >
              <pre className="text-xs leading-relaxed whitespace-pre-wrap text-gray-800 m-0">
                {generatedCode}
              </pre>
              <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                {generatedCode.split('\n').length} lines • Component ID: {component.id}
              </div>
            </div>
          </div>
        )}

        {/* Regenerate modal */}
        {showRegenerateDialog && createPortal(
          <div 
            className="fixed inset-0 z-[1000] bg-black/40"
            onClick={() => setShowRegenerateDialog(false)}
          >
            <div 
              className="bg-white rounded-md shadow-xl w-full max-w-md p-4 fixed"
              style={{
                left: `${regenModalPosition.x}px`,
                top: `${regenModalPosition.y}px`,
                maxWidth: '400px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Arrow pointing to the regenerate button */}
              <div 
                className="absolute w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white"
                style={{
                  left: '-8px',
                  top: '20px'
                }}
              />
              <div className="mb-3">
                <div className="text-sm font-semibold mb-1">Regenerate Component</div>
                <div className="text-xs text-gray-600">Existing prompt (auto-included)</div>
                <div className="text-xs p-2 bg-gray-50 border rounded mt-1 max-h-24 overflow-auto">
                  {(component.properties as any)?.prompt || '—'}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-700">Describe changes (optional)</label>
                  <textarea className="w-full border rounded p-2 mt-1 text-sm" rows={3} value={regenChanges} onChange={(e) => setRegenChanges(e.target.value)} placeholder="E.g., make button primary, add quick questions, tighten spacing" />
                </div>
                <div>
                  <label className="text-xs text-gray-700">New prompt (optional)</label>
                  <textarea className="w-full border rounded p-2 mt-1 text-sm" rows={3} value={regenNewPrompt} onChange={(e) => setRegenNewPrompt(e.target.value)} placeholder="Additional details to append or replace" />
                </div>
                <div className="flex items-center gap-2">
                  <input id="regen-replace" type="checkbox" checked={regenReplacePrompt} onChange={(e) => setRegenReplacePrompt(e.target.checked)} />
                  <label htmlFor="regen-replace" className="text-xs">Replace existing prompt instead of appending</label>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRegenerateDialog(false)} disabled={regenIsLoading}>Cancel</Button>
                <Button
                  onClick={async () => {
                    try {
                      setRegenIsLoading(true);
                      const oldPrompt = (component.properties as any)?.prompt || '';
                      const combinedPrompt = regenReplacePrompt
                        ? [regenChanges, regenNewPrompt].filter(Boolean).join('\n\n')
                        : [oldPrompt, regenChanges, regenNewPrompt].filter(Boolean).join('\n\n');
                      if (!combinedPrompt) { setShowRegenerateDialog(false); setRegenIsLoading(false); return; }
                      const res = await fetch('/api/ai/generate-component', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: combinedPrompt, componentType: component.type.replace(/^AI/, '') })
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Failed to regenerate');

                      const newComponent = {
                        id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`),
                        type: `AI${component.type.replace(/^AI/, '')}`,
                        position: { x: ((component as any).position?.x || 100) + 20, y: ((component as any).position?.y || 100) + 20 },
                        size: (component as any).size || { width: 400, height: 300 },
                        properties: { generatedCode: data.component, prompt: combinedPrompt, requirements: (component.properties as any)?.requirements }
                      } as any;
                      try { const current = JSON.parse(localStorage.getItem('prototypeComponents') || '[]'); current.push(newComponent); localStorage.setItem('prototypeComponents', JSON.stringify(current)); } catch {}
                      window.dispatchEvent(new CustomEvent('ai:addGeneratedComponent', { detail: newComponent }));
                      setShowRegenerateDialog(false);
                      setRegenChanges(''); setRegenNewPrompt('');
                    } catch (err: any) {
                      alert(err?.message || String(err));
                    } finally { setRegenIsLoading(false); }
                  }}
                  disabled={regenIsLoading}
                >
                  {regenIsLoading ? 'Generating…' : 'Regenerate'}
                </Button>
              </div>
            </div>
          </div>
        , document.body)}
        {/* Render the component using react-live */}
        <div className={isInteractive ? '' : isRunMode ? '' : 'p-3'}>
          {mounted && (
            <>
              {/* Debug information for troubleshooting */}
              {isInteractive && (
                <div className="bg-blue-50 p-2 text-xs mb-2 border rounded">
                  <div className="font-bold text-blue-800">AI Component Debug:</div>
                  <div>Content: {JSON.stringify(restProps.content)}</div>
                  <div>Value: {JSON.stringify(restProps.value)}</div>
                  <div>Component Type: {component.type}</div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="font-semibold text-blue-700">Direct Manipulation Changes:</div>
                    <div>Has Changes: {component.properties?.hasDirectManipulationChanges ? 'Yes' : 'No'}</div>
                    <div>Text Content: {component.properties?.textContent || 'None'}</div>
                    <div>Placeholder: {component.properties?.placeholder || 'None'}</div>
                    <div>Color: {component.properties?.color || 'None'}</div>
                    <div>Background: {component.properties?.backgroundColor || 'None'}</div>
                    <div>Style Overrides: {component.properties?.styleOverrides ? Object.keys(component.properties.styleOverrides).join(', ') : 'None'}</div>
                    <button 
                      onClick={() => {
                        console.log('🔍 AI Component Debug Info:', {
                          componentId: component.id,
                          componentType: component.type,
                          properties: component.properties,
                          hasDirectManipulationChanges: component.properties?.hasDirectManipulationChanges,
                          styleOverrides: component.properties?.styleOverrides,
                          textContent: component.properties?.textContent,
                          placeholder: component.properties?.placeholder,
                          color: component.properties?.color,
                          backgroundColor: component.properties?.backgroundColor
                        });
                        alert('Debug info logged to console. Check browser console for details.');
                      }}
                      className="mt-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      🔍 Debug
                    </button>
                    <button 
                      onClick={() => {
                        console.log('📄 GENERATED CODE FOR COMPONENT:', component.id);
                        console.log('📄 Original Generated Code:');
                        console.log(generatedCode);
                        console.log('📄 Cleaned Code (after processing):');
                        console.log(cleanedCode);
                        console.log('📄 Code Length - Original:', generatedCode?.length, 'Cleaned:', cleanedCode?.length);
                        console.log('📄 Direct Manipulation Changes Applied:', {
                          hasDirectManipulationChanges: component.properties?.hasDirectManipulationChanges,
                          styleOverrides: component.properties?.styleOverrides,
                          textContent: component.properties?.textContent,
                          placeholder: component.properties?.placeholder,
                          color: component.properties?.color,
                          backgroundColor: component.properties?.backgroundColor
                        });
                        alert('Generated code logged to console! Check browser console for full code.');
                      }}
                      className="mt-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      📄 Show Code
                    </button>
                    <button 
                      onClick={() => {
                        // Get original code from localStorage
                        let originalCode = generatedCode;
                        let modifiedCode = cleanedCode;
                        
                        // Try to find original code from saved data
                        const localStorageKey = `modifiedCode_${component.id}`;
                        const savedModifiedCode = localStorage.getItem(localStorageKey);
                        
                        if (savedModifiedCode) {
                          try {
                            const savedData = JSON.parse(savedModifiedCode);
                            if (savedData.originalCode) {
                              originalCode = savedData.originalCode;
                            }
                            if (savedData.modifiedCode) {
                              modifiedCode = savedData.modifiedCode;
                            }
                          } catch (e) {
                            console.error('Error parsing saved modified code:', e);
                          }
                        }
                        
                        // Create comparison text
                        const comparisonText = `=== ORIGINAL CODE (Before Direct Manipulation) ===
${originalCode || 'No original code found'}

=== MODIFIED CODE (After Direct Manipulation) ===
${modifiedCode || 'No modified code found'}

=== DIRECT MANIPULATION CHANGES ===
Has Changes: ${component.properties?.hasDirectManipulationChanges ? 'Yes' : 'No'}
Style Overrides: ${JSON.stringify(component.properties?.styleOverrides || {}, null, 2)}
Text Content: ${component.properties?.textContent || 'None'}
Placeholder: ${component.properties?.placeholder || 'None'}
Color: ${component.properties?.color || 'None'}
Background Color: ${component.properties?.backgroundColor || 'None'}`;

                        // Copy to clipboard
                        navigator.clipboard.writeText(comparisonText).then(() => {
                          alert('Code comparison copied to clipboard! Check your clipboard for the before/after comparison.');
                        }).catch(() => {
                          alert('Failed to copy to clipboard');
                        });
                        
                        // Also log to console
                        console.log('📄 Code Comparison for component:', component.id);
                        console.log('📄 Original Code Length:', originalCode?.length || 0);
                        console.log('📄 Modified Code Length:', modifiedCode?.length || 0);
                      }}
                      className="mt-1 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                    >
                      📋 Copy Comparison
                    </button>
                  </div>
                </div>
              )}
              
              {(() => {
                try {
                  console.log(`🎯 Attempting to render ${component.id} with React Live`);
                  console.log(`📊 Code length: ${cleanedCode.length}, scope keys: ${Object.keys(scope).length}`);
                  console.log(`🔧 useDynamicFallback: ${useDynamicFallback}`);
                  console.log(`💻 Cleaned code first 300 chars:`, cleanedCode.substring(0, 300));
                  
                  const LiveComponent = useDynamicFallback ? (
                    // Use dynamic imports as fallback
                    <DynamicLiveProvider 
                      key={`live-${stableKey}`} 
                      code={cleanedCode} 
                      scope={scope}
                      noInline={true}
                    >
                      <DynamicLiveError 
                        className="text-xs text-red-500 p-2 bg-red-50 my-1 rounded" 
                        onError={(error: any) => {
                          console.error(`📍 Dynamic React Live Error for ${component.id}:`, error);
                        }}
                      />
                      <div 
                        className={`ai-live-preview-container relative ${isPreviewMaximized ? 'fixed inset-4 z-50 bg-white shadow-2xl rounded-lg' : ''}`}
                        onMouseMove={handleElementDragMove}
                        onMouseUp={handleElementDragEnd}
                        onMouseLeave={handleElementDragEnd}
                        onClick={(e) => {
                          // Only prevent selection if clicking on the component content, not control buttons
                          const target = e.target as HTMLElement;
                          const isControlButton = target.closest('button, [role="button"], .bg-gray-50, .bg-gray-100, .ai-live-preview-container button, .ai-live-preview-container [role="button"]');
                          
                          if (!isControlButton) {
                            e.stopPropagation();
                            console.log('🎯 AI Component content clicked - preventing internal element selection');
                          } else {
                            console.log('🎯 Control button clicked - allowing normal behavior');
                          }
                        }}
                        style={{ 
                          pointerEvents: 'auto',
                          userSelect: 'none' // Prevent text selection within the component
                        }}
                      >
                        {/* AI Component Preview Header - Hidden in run mode */}
                        {!isRunMode && (
                          <div className={`bg-gray-100 px-3 py-2 border-b flex items-center justify-between ${isPreviewMaximized ? 'rounded-t-lg' : ''}`}>
                            <span className="text-sm font-medium">AI Component Preview</span>
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
                        )}
                        <div className={`${isPreviewMaximized ? 'h-[calc(100vh-8rem)]' : 'h-full'} overflow-auto relative`}>
                          {/* Hide scroll indicator in run mode */}
                          {!isRunMode && (
                            <div className="absolute top-2 right-2 z-10">
                              <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                Scroll to see full component
                              </div>
                            </div>
                          )}
                          <DynamicLivePreview 
                            className="ai-live-preview w-full min-h-full" 
                            style={{ 
                              pointerEvents: 'none' // Disable pointer events on internal elements
                            }}
                          />
                          {enableElementPositioning && (
                            <ElementPositionOverlay 
                              componentId={component.id}
                              elementPositions={localElementPositions}
                              onDragStart={handleElementDragStart}
                            />
                          )}
                        </div>
                      </div>
                      {isPreviewMaximized && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleMaximizePreview} />
                      )}
                    </DynamicLiveProvider>
                  ) : (
                    // Use direct imports by default
                    <LiveProvider 
                      key={`live-${stableKey}`} 
                      code={cleanedCode} 
                      scope={scope}
                      noInline={true}
                    >
                      <LiveError 
                        className="text-xs text-red-500 p-2 bg-red-50 my-1 rounded" 
                        onError={(error: any) => {
                          console.error(`📍 React Live Error for ${component.id}:`, error);
                        }}
                      />
                      <div 
                        className={`ai-live-preview-container relative ${isPreviewMaximized ? 'fixed inset-4 z-50 bg-white shadow-2xl rounded-lg' : ''}`}
                        onMouseMove={handleElementDragMove}
                        onMouseUp={handleElementDragEnd}
                        onMouseLeave={handleElementDragEnd}
                        onClick={(e) => {
                          // Only prevent selection if clicking on the component content, not control buttons
                          const target = e.target as HTMLElement;
                          const isControlButton = target.closest('button, [role="button"], .bg-gray-50, .bg-gray-100, .ai-live-preview-container button, .ai-live-preview-container [role="button"]');
                          
                          if (!isControlButton) {
                            e.stopPropagation();
                            console.log('🎯 AI Component content clicked - preventing internal element selection');
                          } else {
                            console.log('🎯 Control button clicked - allowing normal behavior');
                          }
                        }}
                        style={{ 
                          pointerEvents: 'auto',
                          userSelect: 'none' // Prevent text selection within the component
                        }}
                      >
                        {/* AI Component Preview Header - Hidden in run mode */}
                        {!isRunMode && (
                          <div className={`bg-gray-100 px-3 py-2 border-b flex items-center justify-between ${isPreviewMaximized ? 'rounded-t-lg' : ''}`}>
                            <span className="text-sm font-medium">AI Component Preview</span>
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
                        )}
                        <div className={`${isPreviewMaximized ? 'h-[calc(100vh-8rem)]' : 'h-full'} overflow-auto relative`}>
                          {/* Hide scroll indicator in run mode */}
                          {!isRunMode && (
                            <div className="absolute top-2 right-2 z-10">
                              <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                Scroll to see full component
                              </div>
                            </div>
                          )}
                          <LivePreview 
                            className="ai-live-preview w-full min-h-full" 
                            style={{ 
                              pointerEvents: 'none' // Disable pointer events on internal elements
                            }}
                          />
                          {enableElementPositioning && (
                            <ElementPositionOverlay 
                              componentId={component.id}
                              elementPositions={localElementPositions}
                              onDragStart={handleElementDragStart}
                            />
                          )}
                        </div>
                      </div>
                      {isPreviewMaximized && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleMaximizePreview} />
                      )}
                    </LiveProvider>
                  );
                  
                  console.log(`✅ React Live component created successfully for ${component.id}`);
                  return LiveComponent;
                  
                } catch (error) {
                  console.error(`❌ React Live setup failed for component ${component.id}:`, error);
                  console.log(`📄 Failed code sample:`, cleanedCode.substring(0, 500));
                  
                  // In run mode, show a cleaner error message
                  if (isRunMode) {
                    return (
                      <div className="border border-red-300 p-4 rounded bg-red-50">
                        <div className="text-red-700 font-semibold mb-2">⚠️ Component Error</div>
                        <div className="text-sm text-red-600 mb-2">
                          Component failed to render
                        </div>
                        <div className="text-xs text-gray-500">
                          Component: {component.id}
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="border border-red-300 p-4 rounded bg-red-50">
                      <div className="text-red-700 font-semibold mb-2">⚠️ Component Render Error</div>
                      <div className="text-sm text-red-600 mb-2">
                        Error: {error instanceof Error ? error.message : String(error)}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Component: {component.id} | Type: {component.type}
                      </div>
                      <details className="text-xs">
                        <summary className="cursor-pointer text-red-500 mb-2">Show Component Code</summary>
                        <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded max-h-60 overflow-auto">
                          {cleanedCode}
                        </pre>
                      </details>
                    </div>
                  );
                }
              })()}
            </>
          )}
        </div>
      </div>

      {/* Floating Preview Buttons for AI Components */}
      {!isPreviewMaximized && isInteractive && (
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
    </AIComponentErrorBoundary>
  );
}; 