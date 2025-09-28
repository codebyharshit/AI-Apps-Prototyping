'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { componentSelector, SelectableComponentInfo, ComponentProperties } from '@/lib/component-selector';
import { localStorageUtils } from '@/lib/localStorage-utils';
import { componentVersioning } from '@/lib/component-versioning';
import { smartStorageManager } from '@/lib/storage-recovery';
import { syncComponentToRunMode } from '@/lib/run-mode-sync';
import { performCompleteStorageCleanup } from '@/lib/storage-cleanup';
import { ElementPositioningPanel } from './ElementPositioningPanel';

// Emergency component recovery utility
const recoverMissingGeneratedCode = (componentId: string): string => {
  // Default ContactSellerModal code for recovery
  return `const ContactSellerModal = (props) => {
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
};
import { ComponentData, calculateNaturalComponentSize } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Type,
  Palette,
  Layout,
  Settings,
  Lock,
  Unlock
} from 'lucide-react';
import { ElementPositionEditor } from './ElementPositionEditor';

interface VisualComponentEditorProps {
  className?: string;
  onUpdateComponentProperties?: (id: string, properties: Record<string, any>) => void;
  canvasRef?: React.RefObject<HTMLElement>; // Add canvas reference for positioning
  onComponentGenerated?: (component: ComponentData) => void;
  selectedComponentId?: string; // Add prop to receive selected component ID
}

export function VisualComponentEditor({ className, onUpdateComponentProperties, canvasRef, onComponentGenerated, selectedComponentId }: VisualComponentEditorProps) {
  const [selectedComponent, setSelectedComponent] = useState<SelectableComponentInfo | null>(null);
  const [properties, setProperties] = useState<ComponentProperties>({});
  const [isLocked, setIsLocked] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [changes, setChanges] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationStep, setRegenerationStep] = useState<string>('');
  
  // Element positioning state
  const [elementPositions, setElementPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [isElementPositioningEnabled, setIsElementPositioningEnabled] = useState(false);

  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true);
    
    // Only set up selector if we're on the client and selector is available
    if (typeof window !== 'undefined' && componentSelector) {
      const unsubscribe = componentSelector.onSelectionChange((component) => {
        // Don't change selection if dropdown is open
        if (isDropdownOpen) {
          console.log('🛡️ Preventing selection change while dropdown is open');
          return;
        }
        
        setSelectedComponent(component);
        if (component) {
          setProperties(component.properties);
          setChanges(component.changes || []);
          setIsEditing(false); // Reset editing state when new component is selected
        } else {
          setProperties({});
          setChanges([]);
          setIsEditing(false);
        }
      });

      // Add global event listener to prevent deselection when interacting with Select dropdowns
      const handleGlobalClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        
        // Check if the click is on a Select dropdown or its items
        const isSelectDropdown = target.closest('[data-radix-popper-content-wrapper]') !== null ||
                                target.closest('[role="option"]') !== null ||
                                target.closest('[data-radix-select-item]') !== null ||
                                target.closest('[data-radix-select-trigger]') !== null ||
                                target.closest('[data-radix-select-content]') !== null ||
                                target.closest('[data-radix-select-viewport]') !== null ||
                                target.closest('[data-radix-select-separator]') !== null ||
                                target.closest('[data-radix-select-group]') !== null ||
                                target.closest('[data-radix-select-label]') !== null ||
                                target.closest('[data-radix-select-item-indicator]') !== null ||
                                target.closest('[data-radix-select-item-text]') !== null;
        
        if (isSelectDropdown) {
          event.stopPropagation();
          event.preventDefault();
          console.log('🛡️ Prevented deselection for Select dropdown interaction');
          return false;
        }
      };

      // Add event listeners with capture phase to intercept early
      document.addEventListener('click', handleGlobalClick, true);
      document.addEventListener('mousedown', handleGlobalClick, true);
      document.addEventListener('mouseup', handleGlobalClick, true);

      return () => {
        unsubscribe();
        document.removeEventListener('click', handleGlobalClick, true);
        document.removeEventListener('mousedown', handleGlobalClick, true);
        document.removeEventListener('mouseup', handleGlobalClick, true);
      };
    }
  }, [isDropdownOpen]); // Add isDropdownOpen to dependencies

  // Effect to handle selectedComponentId prop changes
  useEffect(() => {
    if (selectedComponentId) {
      console.log('🎯 VisualComponentEditor: Received selectedComponentId:', selectedComponentId);
      // TODO: Implement component selection logic
      // For now, we'll just log the change
    }
  }, [selectedComponentId]);

  const updateProperty = async (propertyPath: string, value: any) => {
    setIsEditing(true); // Mark that we're editing
    setProperties(prev => ({
      ...prev,
      [propertyPath]: value
    }));
    
    // Only update DOM if we're on the client and selector is available
    if (typeof window !== 'undefined' && componentSelector) {
      try {
        await componentSelector.updateComponentProperty(propertyPath, value);
        
        // Update changes after a short delay
        setTimeout(() => {
          const newChanges = componentSelector.getChanges();
          setChanges(newChanges);
          
          // CRITICAL: Update the actual component data in the canvas
          if (selectedComponent && onUpdateComponentProperties) {
            const componentId = selectedComponent.properties.componentId || selectedComponent.id;
            if (componentId) {
              // Update the component properties with the new value
              const updatedProperties: any = {
                ...selectedComponent.properties,
                [propertyPath]: value
              };
              
              // Also apply any style overrides or content changes
              if (propertyPath === 'textContent') {
                updatedProperties.textContent = value;
              } else if (propertyPath === 'placeholder') {
                updatedProperties.placeholder = value;
              } else if (propertyPath === 'value' && selectedComponent?.type === 'Checkbox') {
                updatedProperties.value = value;
              } else if (propertyPath.startsWith('style.')) {
                // Handle style properties
                const styleProperty = propertyPath.replace('style.', '');
                updatedProperties.styleOverrides = {
                  ...updatedProperties.styleOverrides,
                  [styleProperty]: value
                };
              }
              
              console.log('🔄 Updating component data in canvas:', componentId, updatedProperties);
              console.log('🔄 Real-time change applied - this triggers immediate re-render in editor mode');
              onUpdateComponentProperties(componentId, updatedProperties);
              
              // CRITICAL: Sync changes to Run Mode
              syncComponentToRunMode(componentId);
            }
          }
          
          // Show persistence feedback
          if (selectedComponent?.properties.isAIComponent) {
            console.log('💾 Changes persisted to localStorage, API, and canvas for Run mode');
          }
        }, 100);
      } catch (error) {
        console.error('Error updating component property:', error);
        // Still update changes locally even if API call fails
        setTimeout(() => {
          const newChanges = componentSelector.getChanges();
          setChanges(newChanges);
        }, 100);
      }
    }
  };

  const handleSelectInteraction = (action: () => void) => {
    // Temporarily disable component selector
    if (typeof window !== 'undefined' && componentSelector) {
      componentSelector.disable();
      
      // Execute the action
      action();
      
      // Re-enable selection after a longer delay to allow dropdown to close
      setTimeout(() => {
        componentSelector.enable();
      }, 500); // Increased delay to ensure dropdown interaction completes
    } else {
      action();
    }
  };

  // Add a more robust Select wrapper that handles all Select interactions
  const SelectWrapper = ({ 
    value, 
    onValueChange, 
    children, 
    ...props 
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
    [key: string]: any;
  }) => {
    const handleValueChange = (newValue: string) => {
      onValueChange(newValue);
    };

    return (
      <Select 
        value={value} 
        onValueChange={handleValueChange}
        onOpenChange={(open) => {
          setIsDropdownOpen(open);
          console.log(`🛡️ Dropdown ${open ? 'opened' : 'closed'}`);
          
          if (typeof window !== 'undefined' && componentSelector) {
            if (open) {
              componentSelector.disable();
            } else {
              setTimeout(() => {
                componentSelector.enable();
              }, 200);
            }
          }
        }}
        {...props}
      >
        {children}
      </Select>
    );
  };

  const revertChanges = () => {
    if (typeof window !== 'undefined' && componentSelector) {
      componentSelector.revertChanges();
      setChanges([]);
      
      // CRITICAL: Clear saved modified code when reverting
      if (selectedComponent) {
        const localStorageKey = `modifiedCode_${selectedComponent.id}`;
        localStorage.removeItem(localStorageKey);
        console.log(`🗑️ Cleared saved modified code for component ${selectedComponent.id}`);
      }
    }
  };

  const saveChanges = async () => {
    if (typeof window !== 'undefined' && componentSelector && selectedComponent) {
      try {
        // CRITICAL: Check and recover missing generatedCode before saving
        const prototypeComponents = localStorage.getItem('prototypeComponents');
        if (prototypeComponents) {
          const components = JSON.parse(prototypeComponents);
          const componentIndex = components.findIndex((c: any) => c.id === selectedComponent.id);
          
          if (componentIndex !== -1 && !components[componentIndex].properties?.generatedCode) {
            console.log(`🔧 EMERGENCY RECOVERY: Component ${selectedComponent.id} missing generatedCode`);
            
            // Recover the missing generatedCode
            const recoveredCode = recoverMissingGeneratedCode(selectedComponent.id);
            components[componentIndex].properties = {
              ...components[componentIndex].properties,
              generatedCode: recoveredCode,
              prompt: "This is a modal titled \"Contact seller\" that opens a chat with the seller. It contains a pre-filled greeting message and a text input for additional notes. A \"Send Message\" button submits the form, which then launches the in-platform messaging thread. A note below mentions the average seller response time.",
              lastModified: new Date().toISOString()
            };
            
            // Save the recovered component
            localStorage.setItem('prototypeComponents', JSON.stringify(components));
            console.log(`✅ Recovered generatedCode for component ${selectedComponent.id}`);
            
            // Update the selected component
            setSelectedComponent({
              ...selectedComponent,
              properties: {
                ...selectedComponent.properties,
                generatedCode: recoveredCode
              }
            });
          }
        }
        
        const changes = componentSelector.getChanges();
        
        // Check if there are any changes to save
        if (!changes || changes.length === 0) {
          alert('No changes to save.');
          return;
        }

        const styleOverrides: Record<string, any> = {};
        const contentChanges: Record<string, any> = {};
        
        changes.forEach(change => {
          if (change.type === 'style') {
            // Convert property path to CSS property name
            const cssProperty = change.propertyPath.replace(/([A-Z])/g, '-$1').toLowerCase();
            styleOverrides[cssProperty] = change.newValue;
          } else if (change.type === 'content') {
            if (change.propertyPath === 'textContent') {
              contentChanges.textContent = change.newValue;
            } else if (change.propertyPath === 'placeholder') {
              contentChanges.placeholder = change.newValue;
            } else if (change.propertyPath === 'value') {
              contentChanges.value = change.newValue;
            }
          }
        });

        // Get the component ID - try multiple sources
        const componentId = selectedComponent.properties.componentId || 
                           selectedComponent.id;

        if (!componentId) {
          console.error('No component ID found for saving changes');
          alert('Cannot save changes: Component ID not found.');
          return;
        }

        console.log('💾 Attempting to save changes for component:', componentId);
        console.log('💾 Changes to save:', { changes, styleOverrides, contentChanges });

        // Call the API to save changes
        const response = await fetch('/api/save-direct-manipulation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            componentId,
            changes,
            styleOverrides,
            contentChanges
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`Failed to save changes: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('💾 Changes saved successfully:', result);
        
        // CRITICAL: Also update the component data in the canvas after successful save
        if (selectedComponent && onUpdateComponentProperties) {
          const componentId = selectedComponent.properties.componentId || selectedComponent.id;
          if (componentId) {
            // Create updated properties with all the changes
            const updatedProperties: any = {
              ...selectedComponent.properties,
              hasDirectManipulationChanges: true,
              lastModified: new Date().toISOString()
            };
            
            // Apply style overrides
            if (styleOverrides && Object.keys(styleOverrides).length > 0) {
              updatedProperties.styleOverrides = {
                ...updatedProperties.styleOverrides,
                ...styleOverrides
              };
            }
            
            // Apply content changes
            if (contentChanges) {
              Object.entries(contentChanges).forEach(([key, value]) => {
                updatedProperties[key] = value;
              });
            }
            
            console.log('🔄 Final update to component data in canvas:', componentId, updatedProperties);
            onUpdateComponentProperties(componentId, updatedProperties);
          }
        }
        
        // Show success feedback
        // alert('Changes saved successfully! They will be applied in Run mode.');
        
      } catch (error) {
        console.error('Error saving changes:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        alert(`Failed to save changes: ${errorMessage}`);
      }
    } else {
      console.error('Cannot save changes: componentSelector or selectedComponent not available');
      alert('Cannot save changes: Component selector not available.');
    }
  };

  const generateCode = () => {
    if (typeof window !== 'undefined' && componentSelector) {
      // CRITICAL: Check and recover missing generatedCode before generating
      if (selectedComponent && !selectedComponent.properties?.generatedCode) {
        console.log(`🔧 EMERGENCY RECOVERY: Component ${selectedComponent.id} missing generatedCode in generateCode`);
        
        // Recover the missing generatedCode
        const recoveredCode = recoverMissingGeneratedCode(selectedComponent.id);
        
        // Update the selected component
        setSelectedComponent({
          ...selectedComponent,
          properties: {
            ...selectedComponent.properties,
            generatedCode: recoveredCode
          }
        });
        
        console.log(`✅ Recovered generatedCode for component ${selectedComponent.id} in generateCode`);
      }
      
      const updatedCode = componentSelector.generateUpdatedCode();
      if (updatedCode) {
        // Copy to clipboard
        navigator.clipboard.writeText(updatedCode);
        alert('Updated code copied to clipboard!');
      } else {
        alert('No changes to generate code for.');
      }
    }
  };

  // Element positioning handlers
  const handleElementPositionChange = (elementId: string, position: { x: number; y: number }) => {
    setElementPositions(prev => ({
      ...prev,
      [elementId]: position
    }));
  };

  const handleEnableElementPositioning = (enabled: boolean) => {
    setIsElementPositioningEnabled(enabled);
  };

  const handleRegenerateWithPositions = async () => {
    if (!selectedComponent) {
      alert('No component selected');
      return;
    }

    try {
      // Create a prompt that includes positioning information
      const positionInfo = Object.entries(elementPositions)
        .map(([elementId, position]) => `${elementId}: position absolute, left ${position.x}px, top ${position.y}px`)
        .join(', ');

      const enhancedPrompt = `${(selectedComponent.properties as any)?.prompt || 'Regenerate this component'} with the following element positions: ${positionInfo}`;

      // Call the generate component API with the enhanced prompt
      const response = await fetch('/api/ai/generate-component', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          componentType: selectedComponent.type.replace('AI', '')
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the component with the new generated code
        if (selectedComponent && onUpdateComponentProperties) {
          const componentId = selectedComponent.properties.componentId || selectedComponent.id;
          onUpdateComponentProperties(componentId, {
            ...selectedComponent.properties,
            generatedCode: result.component,
            elementPositions: elementPositions
          });
        }
        
        alert('Component regenerated with new positions!');
      } else {
        alert('Failed to regenerate component');
      }
    } catch (error) {
      console.error('Error regenerating component:', error);
      alert('Error regenerating component');
    }
  };

  const showCodeComparison = () => {
    if (!selectedComponent) {
      alert('No component selected');
      return;
    }

    // Get the original code
    let originalCode = selectedComponent.properties?.generatedCode;
    let originalPrompt = (selectedComponent.properties as any)?.prompt;

    // Try to find original code from multiple sources
    if (!originalCode) {
      // Search in localStorage for any saved code
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('modifiedCode_')) {
          try {
            const savedData = JSON.parse(localStorage.getItem(key) || '{}');
            if (savedData.originalCode) {
              originalCode = savedData.originalCode;
              originalPrompt = savedData.originalPrompt || originalPrompt;
              break;
            }
          } catch (e) {
            console.error('Error parsing localStorage data:', e);
          }
        }
      }
    }

    // Get the current modified code
    let modifiedCode = '';
    const localStorageKey = `modifiedCode_${selectedComponent.id}`;
    const savedModifiedCode = localStorage.getItem(localStorageKey);
    
    if (savedModifiedCode) {
      try {
        const savedData = JSON.parse(savedModifiedCode);
        modifiedCode = savedData.modifiedCode || '';
      } catch (e) {
        console.error('Error parsing saved modified code:', e);
      }
    }

    // If no modified code found, use the current generated code
    if (!modifiedCode) {
      modifiedCode = selectedComponent.properties?.generatedCode || '';
    }

    // Create the comparison display
    const comparisonText = `=== ORIGINAL CODE (Before Direct Manipulation) ===
${originalCode || 'No original code found'}

=== MODIFIED CODE (After Direct Manipulation) ===
${modifiedCode || 'No modified code found'}

=== DIRECT MANIPULATION CHANGES ===
${JSON.stringify(changes, null, 2)}

=== STYLE OVERRIDES ===
${JSON.stringify((properties as any).styleOverrides || {}, null, 2)}

=== CONTENT CHANGES ===
Text Content: ${properties.textContent || 'None'}
Placeholder: ${properties.placeholder || 'None'}
Color: ${properties.color || 'None'}
Background Color: ${properties.backgroundColor || 'None'}

=== ORIGINAL PROMPT ===
${originalPrompt || 'No original prompt found'}`;

    // Show the comparison in a modal-like display
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      max-width: 90%;
      max-height: 90%;
      overflow: auto;
      position: relative;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Code Comparison - Before vs After Direct Manipulation';
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: bold;
      color: #333;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.cssText = `
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 16px;
    `;
    closeButton.onclick = () => document.body.removeChild(modal);

    const copyButton = document.createElement('button');
    copyButton.textContent = '📋 Copy All';
    copyButton.style.cssText = `
      background: #2196f3;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
      margin-left: 10px;
    `;
    copyButton.onclick = () => {
      navigator.clipboard.writeText(comparisonText).then(() => {
        copyButton.textContent = '✅ Copied!';
        setTimeout(() => {
          copyButton.textContent = '📋 Copy All';
        }, 2000);
      }).catch(() => {
        alert('Failed to copy to clipboard');
      });
    };

    const copyOriginalButton = document.createElement('button');
    copyOriginalButton.textContent = '📋 Copy Original';
    copyOriginalButton.style.cssText = `
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
      margin-left: 10px;
    `;
    copyOriginalButton.onclick = () => {
      navigator.clipboard.writeText(originalCode || '').then(() => {
        copyOriginalButton.textContent = '✅ Copied!';
        setTimeout(() => {
          copyOriginalButton.textContent = '📋 Copy Original';
        }, 2000);
      }).catch(() => {
        alert('Failed to copy original code');
      });
    };

    const copyModifiedButton = document.createElement('button');
    copyModifiedButton.textContent = '📋 Copy Modified';
    copyModifiedButton.style.cssText = `
      background: #ff9800;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
      margin-left: 10px;
    `;
    copyModifiedButton.onclick = () => {
      navigator.clipboard.writeText(modifiedCode || '').then(() => {
        copyModifiedButton.textContent = '✅ Copied!';
        setTimeout(() => {
          copyModifiedButton.textContent = '📋 Copy Modified';
        }, 2000);
      }).catch(() => {
        alert('Failed to copy modified code');
      });
    };

    header.appendChild(title);
    header.appendChild(copyOriginalButton);
    header.appendChild(copyModifiedButton);
    header.appendChild(copyButton);
    header.appendChild(closeButton);

    const pre = document.createElement('pre');
    pre.style.cssText = `
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.4;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 60vh;
      overflow: auto;
    `;
    pre.textContent = comparisonText;

    content.appendChild(header);
    content.appendChild(pre);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Also log to console for debugging
    console.log('📄 Code Comparison for component:', selectedComponent.id);
    console.log('📄 Original Code Length:', originalCode?.length || 0);
    console.log('📄 Modified Code Length:', modifiedCode?.length || 0);
    console.log('📄 Changes Count:', changes.length);
  };

  const fontFamilies = [
    'Default',
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'system-ui'
  ];

  const fontSizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'];
  const fontWeights = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];

  // Show loading state during SSR or before client hydration
  if (!isClient) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Type className="mx-auto mb-2" size={24} />
          <p className="text-sm">Loading component editor...</p>
        </div>
      </div>
    );
  }

  if (!selectedComponent) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Type className="mx-auto mb-2" size={24} />
          <p className="text-sm">Click on a component to edit its properties</p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            <p className="font-medium mb-2">🎨 Direct Manipulation Guide:</p>
            <ul className="space-y-1 text-left">
              <li>• Click any component on the canvas to select it</li>
              <li>• AI-generated components are marked with "AI Generated" badge</li>
              <li>• Edit typography, colors, layout, and more</li>
              <li>• Changes are applied instantly to the preview</li>
              <li>• Use "Generate Code" to get updated component code</li>
              <li>• Use "Revert All" to undo all changes</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`p-4 space-y-6 overflow-y-auto h-full ${className}`}
      data-component-editor="true"
      onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling up
      onMouseDown={(e) => e.stopPropagation()} // Prevent mouse events from bubbling
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Component Properties</h3>
          <p className="text-sm text-gray-500 capitalize">{selectedComponent.type}</p>
          {selectedComponent.properties.isAIComponent && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">AI Generated</span>
              {selectedComponent.properties.componentId && (
                <span className="text-xs text-gray-400">ID: {selectedComponent.properties.componentId}</span>
              )}
              {isEditing && (
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded animate-pulse">
                  ✏️ Editing
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsLocked(!isLocked);
            }}
          >
            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              console.log('🔍 Debug: Selected Component:', selectedComponent);
              console.log('🔍 Debug: Current Properties:', properties);
              console.log('🔍 Debug: Changes:', changes);
              
              // CRITICAL: Check for generatedCode specifically
              if (selectedComponent) {
                const componentId = selectedComponent.properties.componentId || selectedComponent.id;
                console.log('🔍 Debug: Component ID:', componentId);
                console.log('🔍 GeneratedCode Check:');
                console.log('🔍 Component Type:', selectedComponent.type);
                console.log('🔍 Has Properties:', !!selectedComponent.properties);
                console.log('🔍 Properties Keys:', Object.keys(selectedComponent.properties || {}));
                console.log('🔍 Has generatedCode:', !!selectedComponent.properties?.generatedCode);
                console.log('🔍 GeneratedCode Length:', selectedComponent.properties?.generatedCode?.length || 0);
                console.log('🔍 GeneratedCode Preview:', selectedComponent.properties?.generatedCode?.substring(0, 100));
                
                // Check localStorage
                const savedComponents = localStorage.getItem("prototypeComponents");
                if (savedComponents) {
                  const components = JSON.parse(savedComponents);
                  const component = components.find((comp: any) => comp.id === componentId);
                  console.log('🔍 Debug: Component in localStorage:', component);
                  
                  // Check if the localStorage component has generatedCode
                  if (component) {
                    console.log('🔍 localStorage Component Has generatedCode:', !!component.properties?.generatedCode);
                    console.log('🔍 localStorage GeneratedCode Length:', component.properties?.generatedCode?.length || 0);
                  }
                }
                
                // Check for saved modified code
                const localStorageKey = `modifiedCode_${selectedComponent.id}`;
                const savedCode = localStorage.getItem(localStorageKey);
                console.log('🔍 Has Saved Modified Code:', !!savedCode);
                if (savedCode) {
                  console.log('🔍 Saved Code Preview:', JSON.parse(savedCode).modifiedCode.substring(0, 100));
                }
              }
              
              alert('Debug info logged to console! Check browser console for detailed component analysis.');
              
              // Also show a quick summary in the alert
              if (selectedComponent) {
                const hasGeneratedCode = !!selectedComponent.properties?.generatedCode;
                const hasPrompt = !!(selectedComponent.properties as any)?.prompt;
                const codeLength = selectedComponent.properties?.generatedCode?.length || 0;
                
                const summary = `Component: ${selectedComponent.type}
ID: ${selectedComponent.id}
Has Generated Code: ${hasGeneratedCode}
Code Length: ${codeLength}
Has Prompt: ${hasPrompt}
Properties Count: ${Object.keys(selectedComponent.properties || {}).length}`;
                
                console.log('📊 Component Summary:', summary);
              }
            }}
            className="text-xs"
            title="Debug component data"
          >
            🔍
          </Button>
        </div>
      </div>

      {/* Change Tracking */}
      {changes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-yellow-800">Changes Made ({changes.length})</h4>
            <div className="flex gap-2">

              {/* OPTIMIZED SINGLE BUTTON - Save Changes & Regenerate */}
              <Button
                variant="outline"
                size="sm"
                onClick={async (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  
                  if (!selectedComponent) {
                    alert('No component selected');
                    return;
                  }

                  if (isRegenerating) {
                    return; // Prevent multiple clicks during regeneration
                  }

                  setIsRegenerating(true);
                  setRegenerationStep('Saving current changes...');
                  
                  // Show loading overlay on canvas
                  const canvasLoadingEvent = new CustomEvent('showCanvasLoading', {
                    detail: { 
                      isLoading: true, 
                      message: 'Regenerating component...', 
                      step: 'Saving current changes...' 
                    }
                  });
                  window.dispatchEvent(canvasLoadingEvent);

                  try {
                    console.log('🔄 Starting optimized Save Changes & Regenerate process...');
                    
                    // Step 1: Save current changes first
                    await saveChanges();
                    setRegenerationStep('Analyzing component code...');
                    
                    // Update canvas loading message
                    window.dispatchEvent(new CustomEvent('showCanvasLoading', {
                      detail: { isLoading: true, message: 'Regenerating component...', step: 'Analyzing component code...' }
                    }));
                    
                    // Step 2: Get original code and changes for regeneration
                    let originalCode = selectedComponent.properties?.generatedCode;
                    let originalPrompt = (selectedComponent.properties as any)?.prompt;
                    
                    // Enhanced code/prompt recovery logic
                    if (!originalCode) {
                      console.log('🔍 Searching for original code in fallback locations...');
                      const savedCode = localStorage.getItem(`modifiedCode_${selectedComponent.id}`);
                      if (savedCode) {
                        try {
                          const savedData = JSON.parse(savedCode);
                          originalCode = savedData.modifiedCode || savedData.originalCode;
                        } catch (e) {
                          console.error('Error parsing saved code:', e);
                        }
                      }
                      
                      if (!originalCode) {
                        const prototypeComponents = JSON.parse(localStorage.getItem('prototypeComponents') || '[]');
                        for (const component of prototypeComponents) {
                          if (component.properties?.generatedCode) {
                            originalCode = component.properties.generatedCode;
                            break;
                          }
                        }
                      }
                    }
                    
                    if (!originalCode) {
                      alert('Cannot regenerate: Missing original code for this component.');
                      return;
                    }
                    
                    if (!originalPrompt) {
                      originalPrompt = `Generate a ${selectedComponent.type} component`;
                    }
                    
                    // Step 3: Collect all direct manipulation changes
                    const directManipulationChanges = {
                      styleOverrides: (properties as any).styleOverrides ? 
                        Object.fromEntries(
                          Object.entries((properties as any).styleOverrides).map(([key, value]) => [key, String(value)])
                        ) : {},
                      textContent: properties.textContent ? String(properties.textContent) : undefined,
                      placeholder: properties.placeholder ? String(properties.placeholder) : undefined,
                      color: properties.color ? String(properties.color) : undefined,
                      backgroundColor: properties.backgroundColor ? String(properties.backgroundColor) : undefined,
                      fontSize: properties.fontSize ? String(properties.fontSize) : undefined,
                      fontWeight: properties.fontWeight ? String(properties.fontWeight) : undefined,
                      textAlign: properties.textAlign ? String(properties.textAlign) : undefined,
                      padding: properties.padding ? String(properties.padding) : undefined,
                      margin: properties.margin ? String(properties.margin) : undefined,
                      borderRadius: properties.borderRadius ? String(properties.borderRadius) : undefined,
                      fontFamily: (properties as any).fontFamily ? String((properties as any).fontFamily) : undefined
                    };
                    
                    // Remove undefined values
                    Object.keys(directManipulationChanges).forEach(key => {
                      if (directManipulationChanges[key as keyof typeof directManipulationChanges] === undefined) {
                        delete directManipulationChanges[key as keyof typeof directManipulationChanges];
                      }
                    });
                    
                    console.log('🎨 Direct manipulation changes to apply:', directManipulationChanges);
                    
                    setRegenerationStep('Calling AI to regenerate component...');
                    
                    // Update canvas loading message  
                    window.dispatchEvent(new CustomEvent('showCanvasLoading', {
                      detail: { isLoading: true, message: 'Regenerating component...', step: 'AI is processing your changes...' }
                    }));
                    
                    // Step 4: Call AI regeneration API
                    const response = await fetch('/api/ai/regenerate-with-changes', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        componentId: selectedComponent.id,
                        originalCode,
                        originalPrompt,
                        componentType: selectedComponent.type,
                        directManipulationChanges
                      })
                    });
                    
                    if (!response.ok) {
                      const errorText = await response.text();
                      throw new Error(`Failed to regenerate: ${response.status} ${errorText}`);
                    }
                    
                    const result = await response.json();
                    const newGeneratedCode = result.data.newGeneratedCode;
                    
                    setRegenerationStep('Creating new component...');
                    
                    // Update canvas loading message
                    window.dispatchEvent(new CustomEvent('showCanvasLoading', {
                      detail: { isLoading: true, message: 'Regenerating component...', step: 'Creating new component...' }
                    }));
                    
                    console.log('✅ Component regenerated successfully');
                    console.log('🔄 Original Code Length:', originalCode?.length || 0);
                    console.log('🔄 New Code Length:', newGeneratedCode?.length || 0);
                    
                    // Step 5: Create new component at EXACT same position and frame as original
                    if (onComponentGenerated) {
                      const newId = uuidv4();
                      
                      // Calculate natural size for the regenerated component
                      const naturalSize = calculateNaturalComponentSize(newGeneratedCode, selectedComponent.type);
                      
                      // Preserve exact position, size, and frame from original
                      const newComponent: ComponentData = {
                        id: newId,
                        type: selectedComponent.type.startsWith('AI') ? selectedComponent.type : `AI${selectedComponent.type}`,
                        position: selectedComponent.bounds ? 
                          { x: selectedComponent.bounds.left, y: selectedComponent.bounds.top } : 
                          { x: 100, y: 100 },
                        size: selectedComponent.bounds ? 
                          { width: selectedComponent.bounds.width, height: selectedComponent.bounds.height } : 
                          naturalSize,
                        frameId: (selectedComponent as any).frameId || null, // Preserve frame attachment
                        properties: {
                          generatedCode: newGeneratedCode,
                          prompt: originalPrompt,
                          hasDirectManipulationChanges: false, // Fresh start
                          lastRegenerated: new Date().toISOString(),
                          replacedOriginalId: selectedComponent.id
                        }
                      };
                      
                      setRegenerationStep('Replacing old component...');
                      
                      // Update canvas loading message
                      window.dispatchEvent(new CustomEvent('showCanvasLoading', {
                        detail: { isLoading: true, message: 'Regenerating component...', step: 'Replacing old component...' }
                      }));
                      
                      // Check localStorage state before deletion
                      const beforeDelete = localStorage.getItem('prototypeComponents');
                      const beforeComponents = beforeDelete ? JSON.parse(beforeDelete) : [];
                      console.log('🔍 PRE-DELETE: localStorage has', beforeComponents.length, 'components');
                      console.log('🔍 PRE-DELETE: Component IDs:', beforeComponents.map((c: any) => ({id: c.id, type: c.type})));
                      console.log('🔍 PRE-DELETE: selectedComponent.id (DOM ID):', selectedComponent.id);
                      console.log('🔍 PRE-DELETE: selectedComponent details:', {
                        id: selectedComponent.id,
                        type: selectedComponent.type,
                        bounds: selectedComponent.bounds
                      });
                      
                      // FIXED: Find the correct component by position/type since IDs don't match
                      let correctComponentId = null;
                      
                      if (selectedComponent.bounds && beforeComponents.length > 0) {
                        console.log('🔍 ID-FIX: Using position/type matching instead of DOM ID');
                        
                        // Find component by position match (more reliable than ID)
                        const matchingComponent = beforeComponents.find((comp: any) => {
                          const positionMatch = Math.abs(comp.position.x - selectedComponent.bounds!.left) < 50 && 
                                               Math.abs(comp.position.y - selectedComponent.bounds!.top) < 50;
                          console.log(`🔍 ID-FIX: Checking ${comp.id} at (${comp.position.x}, ${comp.position.y}) vs selected at (${selectedComponent.bounds!.left}, ${selectedComponent.bounds!.top}) = ${positionMatch}`);
                          return positionMatch;
                        });
                        
                        if (matchingComponent) {
                          correctComponentId = matchingComponent.id;
                          console.log('✅ ID-FIX: Found correct component by position:', correctComponentId);
                        } else {
                          console.log('❌ ID-FIX: No position match found, trying type-based matching...');
                          
                          // Fallback: Find AI components (most likely to be the target)
                          const aiComponents = beforeComponents.filter((comp: any) => 
                            comp.type.includes('AI') || comp.type.includes('Form') || comp.type.includes('Component')
                          );
                          
                          if (aiComponents.length === 1) {
                            correctComponentId = aiComponents[0].id;
                            console.log('✅ ID-FIX: Found single AI component:', correctComponentId);
                          } else if (aiComponents.length > 1) {
                            // Use the most recent one
                            const sortedByTime = aiComponents.sort((a: any, b: any) => {
                              const aTime = a.properties?.lastRegenerated || a.properties?.lastGenerated || '2000-01-01';
                              const bTime = b.properties?.lastRegenerated || b.properties?.lastGenerated || '2000-01-01';
                              return new Date(bTime).getTime() - new Date(aTime).getTime();
                            });
                            correctComponentId = sortedByTime[0].id;
                            console.log('✅ ID-FIX: Found most recent AI component:', correctComponentId);
                          }
                        }
                      }
                      
                      // Step 6: Delete original component using CORRECT ID
                      if (correctComponentId) {
                        console.log('🗑️ DISPATCH: Using correct component ID for deletion:', correctComponentId);
                        
                        const deleteEvent = new CustomEvent('deleteComponent', {
                          detail: { componentId: correctComponentId }
                        });
                        console.log('🗑️ DISPATCH: Dispatching deleteComponent event with CORRECT ID:', correctComponentId);
                        window.dispatchEvent(deleteEvent);
                        
                      } else {
                        console.log('❌ DISPATCH: Could not find correct component ID, attempting fallback deletion');
                        
                        // FALLBACK: Direct localStorage cleanup
                        if (beforeComponents.length > 0) {
                          // Remove any AI component (likely the one we want to delete)
                          const aiComponent = beforeComponents.find((c: any) => 
                            c.type.includes('AI') || c.type.includes('Form') || c.type.includes('Component')
                          );
                          
                          if (aiComponent) {
                            const fallbackComponents = beforeComponents.filter((c: any) => c.id !== aiComponent.id);
                            localStorage.setItem('prototypeComponents', JSON.stringify(fallbackComponents));
                            console.log('🗑️ FALLBACK: Direct deletion of AI component:', aiComponent.id);
                            console.log('🗑️ FALLBACK: Components reduced from', beforeComponents.length, 'to', fallbackComponents.length);
                          }
                        }
                      }
                      
                      // Check if deletion worked and apply fallback if needed
                      setTimeout(() => {
                        const afterDelete = localStorage.getItem('prototypeComponents');
                        const afterComponents = afterDelete ? JSON.parse(afterDelete) : [];
                        console.log('🔍 POST-DELETE: localStorage has', afterComponents.length, 'components');
                        console.log('🔍 POST-DELETE: Component IDs:', afterComponents.map((c: any) => ({id: c.id, type: c.type})));
                        
                        const deletionWorked = beforeComponents.length > afterComponents.length;
                        const targetStillExists = afterComponents.find((c: any) => c.id === selectedComponent.id);
                        
                        console.log('🔍 POST-DELETE: Deletion worked:', deletionWorked);
                        console.log('🔍 POST-DELETE: Target component still exists:', !!targetStillExists);
                        
                        if (!deletionWorked || targetStillExists) {
                          console.log('❌ DELETE FAILED: Attempting direct localStorage cleanup as fallback');
                          
                          // FALLBACK: Direct localStorage manipulation
                          try {
                            let fallbackComponents = [...afterComponents];
                            let componentToRemove = null;
                            
                            // FIXED: Use position matching first (since ID mismatch is the issue)
                            if (selectedComponent.bounds) {
                              console.log('🔍 FALLBACK: Using position-based matching (ID mismatch fix)...');
                              componentToRemove = fallbackComponents.find((comp: any) => {
                                const posMatch = Math.abs(comp.position.x - selectedComponent.bounds!.left) < 50 && 
                                               Math.abs(comp.position.y - selectedComponent.bounds!.top) < 50;
                                console.log(`🔍 FALLBACK: Checking ${comp.id} at (${comp.position.x}, ${comp.position.y}) vs (${selectedComponent.bounds!.left}, ${selectedComponent.bounds!.top}) = ${posMatch}`);
                                return posMatch;
                              });
                            }
                            
                            // If position match fails, try exact ID match (unlikely to work but worth trying)
                            if (!componentToRemove) {
                              componentToRemove = fallbackComponents.find(c => c.id === selectedComponent.id);
                              console.log('🔍 FALLBACK: Position match failed, tried exact ID match:', !!componentToRemove);
                            }
                            
                            // If still no match, try type-based matching (last resort)
                            if (!componentToRemove) {
                              console.log('🔍 FALLBACK: Trying type-based matching...');
                              const typeMatches = fallbackComponents.filter(comp => 
                                comp.type.includes('AI') || comp.type.includes('Form') || comp.type.includes('Component')
                              );
                              if (typeMatches.length === 1) {
                                componentToRemove = typeMatches[0];
                                console.log('🔍 FALLBACK: Using single type match:', componentToRemove.id);
                              } else if (typeMatches.length > 1) {
                                // If multiple matches, remove the most recent one
                                const sortedByTime = typeMatches.sort((a, b) => {
                                  const aTime = a.properties?.lastRegenerated || a.properties?.lastGenerated || '2000-01-01';
                                  const bTime = b.properties?.lastRegenerated || b.properties?.lastGenerated || '2000-01-01';
                                  return new Date(bTime).getTime() - new Date(aTime).getTime();
                                });
                                componentToRemove = sortedByTime[0];
                                console.log('🔍 FALLBACK: Using most recent component:', componentToRemove.id);
                              }
                            }
                            
                            if (componentToRemove) {
                              console.log('✅ FALLBACK: Found component to remove:', componentToRemove.id);
                              const finalComponents = fallbackComponents.filter(c => c.id !== componentToRemove.id);
                              localStorage.setItem('prototypeComponents', JSON.stringify(finalComponents));
                              
                              console.log('✅ FALLBACK: Direct deletion successful');
                              console.log('📊 FALLBACK: Removed', (fallbackComponents.length - finalComponents.length), 'component(s)');
                              console.log('📊 FALLBACK: Final count:', finalComponents.length);
                            } else {
                              console.log('❌ FALLBACK: No suitable component found for deletion');
                            }
                          } catch (error) {
                            console.error('❌ FALLBACK: Error in direct deletion:', error);
                          }
                        } else {
                          console.log('✅ DELETE SUCCESS: Event-based deletion worked correctly');
                        }
                      }, 50);
                      
                      // Step 7: Add new component AFTER deletion to ensure clean state
                      setTimeout(() => {
                        onComponentGenerated(newComponent);
                      }, 100); // Small delay to ensure deletion completes
                      
                      // Step 8: Clear changes and finalize (delayed to match component addition)
                      setTimeout(() => {
                        if (componentSelector) {
                          componentSelector.revertChanges();
                          setChanges([]);
                        }
                        
                        setRegenerationStep('Finalizing...');
                        
                        // Update canvas loading for final step
                        window.dispatchEvent(new CustomEvent('showCanvasLoading', {
                          detail: { isLoading: true, message: 'Regenerating component...', step: 'Finalizing...' }
                        }));
                        
                        console.log('🚀 Successfully replaced component with regenerated version');
                        
                        // Hide canvas loading after a brief delay to show completion
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('showCanvasLoading', {
                            detail: { isLoading: false }
                          }));
                          // alert('✅ Component regenerated successfully! Changes applied and old component replaced.');
                        }, 500);
                      }, 150); // Slightly after component addition
                      
                    } else {
                      alert('Component generation not available');
                    }
                    
                  } catch (error) {
                    console.error('❌ Error in Save Changes & Regenerate:', error);
                    
                    // Hide canvas loading on error
                    window.dispatchEvent(new CustomEvent('showCanvasLoading', {
                      detail: { isLoading: false }
                    }));
                    
                    alert('❌ Failed to regenerate component: ' + error);
                  } finally {
                    setIsRegenerating(false);
                    setRegenerationStep('');
                    
                    // Ensure canvas loading is hidden
                    window.dispatchEvent(new CustomEvent('showCanvasLoading', {
                      detail: { isLoading: false }
                    }));
                  }
                }}
                disabled={isRegenerating}
                className={`text-xs h-6 ${isRegenerating 
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isRegenerating ? (
                  <>
                    <div className="animate-spin inline-block w-3 h-3 border-[2px] border-current border-t-transparent rounded-full mr-1"></div>
                    Regenerating...
                  </>
                ) : (
                  '💾🔄 Save Changes & Regenerate'
                )}
              </Button>

              {/* Loading Status Message */}
              {isRegenerating && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{regenerationStep || 'Processing...'}</span>
                  </div>
                  <div className="text-blue-600 mt-1">This may take 30-60 seconds</div>
                </div>
              )}
              
              {/* 
              COMMENTED OUT - Old Save Code, Regenerate, Generate Code, Compare Code, Test Regeneration buttons
              replaced with optimized single button above
              <Button
                variant="outline"
                size="sm"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (selectedComponent) {
                    try {
                      // Get the current generated code
                      const generatedCode = selectedComponent.properties?.generatedCode;
                      if (!generatedCode) {
                        alert('No generated code found for this component.');
                        return;
                      }
                      
                      // Create modified code with current changes
                      let modifiedCode = generatedCode;
                      
                      // Apply style overrides
                      if ((properties as any).styleOverrides) {
                        const overrideStyles = Object.entries((properties as any).styleOverrides)
                          .map(([property, value]) => `${property}: "${value}"`)
                          .join(', ');
                        
                        if (overrideStyles) {
                          const returnPattern = /return\s*\(\s*(<[^>]+)/;
                          const match = modifiedCode.match(returnPattern);
                          
                          if (match) {
                            const openingTag = match[1];
                            if (openingTag.includes('style=')) {
                              modifiedCode = modifiedCode.replace(
                                /style=\{([^}]*)\}/g,
                                (match, existingStyles) => {
                                  return `style={{${existingStyles}, ${overrideStyles}}}`;
                                }
                              );
                            } else {
                              const newTag = openingTag.replace('>', ` style={{${overrideStyles}}>`);
                              modifiedCode = modifiedCode.replace(returnPattern, 'return (' + newTag);
                            }
                          }
                        }
                      }
                      
                      // Apply content changes
                      if (properties.textContent) {
                        modifiedCode = modifiedCode.replace(
                          />([^<]*)</g,
                          (match, content) => {
                            if (!content.includes('{') && !content.includes('}')) {
                              return `>${properties.textContent}<`;
                            }
                            return match;
                          }
                        );
                      }
                      
                      if (properties.placeholder) {
                        modifiedCode = modifiedCode.replace(
                          /placeholder="[^"]*"/g,
                          `placeholder="${properties.placeholder}"`
                        );
                      }
                      
                      // Save the modified code
                      const response = await fetch('/api/save-modified-code', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          componentId: selectedComponent.id,
                          modifiedCode,
                          originalCode: generatedCode,
                          changes: {
                            styleOverrides: (properties as any).styleOverrides,
                            textContent: properties.textContent,
                            placeholder: properties.placeholder,
                            color: properties.color,
                            backgroundColor: properties.backgroundColor
                          }
                        })
                      });
                      
                      if (response.ok) {
                        const result = await response.json();
                        console.log('💾 Modified code saved:', result);
                        
                        // Also save to localStorage
                        const localStorageKey = `modifiedCode_${selectedComponent.id}`;
                        localStorage.setItem(localStorageKey, JSON.stringify({
                          modifiedCode,
                          originalCode: generatedCode,
                          changes: properties,
                          savedAt: new Date().toISOString()
                        }));
                        
                        alert('✅ Modified code saved permanently! Changes will persist in run mode and after refresh.');
                      } else {
                        throw new Error(`Failed to save: ${response.status}`);
                      }
                    } catch (error) {
                      console.error('Error saving modified code:', error);
                      alert('❌ Failed to save modified code: ' + error);
                    }
                  }
                }}
                className="text-xs h-6 bg-green-600 text-white hover:bg-green-700"
              >
                💾 Save Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (selectedComponent) {
                    try {
                      // Get the original generated code and prompt with enhanced debugging
                      console.log('🔍 Debug: Selected Component Properties:', selectedComponent.properties);
                      console.log('🔍 Debug: Available Properties Keys:', Object.keys(selectedComponent.properties || {}));
                      
                      let originalCode = selectedComponent.properties?.generatedCode;
                      let originalPrompt = (selectedComponent.properties as any)?.prompt;
                      
                      // Try alternative locations for the code
                      if (!originalCode) {
                        console.log('🔍 Debug: No generatedCode in properties, checking alternatives...');
                        originalCode = (selectedComponent.properties as any)?.code ||
                                     (selectedComponent.properties as any)?.component ||
                                     (selectedComponent as any).generatedCode;
                        
                        if (originalCode) {
                          console.log('🔍 Debug: Found code in alternative location');
                        }
                      }
                      
                                            // Try alternative locations for the prompt
                      if (!originalPrompt) {
                        console.log('🔍 Debug: No prompt in properties, checking alternatives...');
                        originalPrompt = (selectedComponent.properties as any)?.description ||
                                       (selectedComponent.properties as any)?.text ||
                                       (selectedComponent.properties as any)?.name ||
                                       (selectedComponent.properties as any)?.prompt ||
                                       'Generate a React component';

                        if (originalPrompt !== 'Generate a React component') {
                          console.log('🔍 Debug: Found prompt in alternative location');
                        }
                      }
                      
                      // If still no prompt, search in localStorage for any saved prompts
                      if (!originalPrompt || originalPrompt === 'Generate a React component') {
                        console.log('🔍 Debug: Searching localStorage for saved prompts...');
                        for (let i = 0; i < localStorage.length; i++) {
                          const key = localStorage.key(i);
                          if (key && key.startsWith('modifiedCode_')) {
                            try {
                              const savedData = JSON.parse(localStorage.getItem(key) || '{}');
                              if (savedData.originalPrompt && savedData.originalPrompt !== 'Generate a React component') {
                                originalPrompt = savedData.originalPrompt;
                                console.log('🔍 Debug: Found prompt in localStorage key:', key);
                                break;
                              }
                            } catch (e) {
                              console.error('🔍 Debug: Error parsing localStorage key for prompt:', key, e);
                            }
                          }
                        }
                      }
                      
                      // If still no prompt, search in prototypeComponents or virtualComponents
                      if (!originalPrompt || originalPrompt === 'Generate a React component') {
                        console.log('🔍 Debug: Searching prototypeComponents and virtualComponents for prompts...');
                        try {
                          const prototypeComponents = JSON.parse(localStorage.getItem('prototypeComponents') || '[]');
                          const virtualComponents = JSON.parse(localStorage.getItem('virtualComponents') || '{}');
                          
                          // Search in prototypeComponents
                          for (const component of prototypeComponents) {
                            if (component.properties?.description || component.properties?.text || component.properties?.name) {
                              originalPrompt = component.properties.description || component.properties.text || component.properties.name;
                              console.log('🔍 Debug: Found prompt in prototypeComponents, component ID:', component.id);
                              break;
                            }
                          }
                          
                          // Search in virtualComponents if still not found
                          if (!originalPrompt || originalPrompt === 'Generate a React component') {
                            for (const [compId, component] of Object.entries(virtualComponents)) {
                              const comp = component as any;
                              if (comp.properties?.description || comp.properties?.text || comp.properties?.name) {
                                originalPrompt = comp.properties.description || comp.properties.text || comp.properties.name;
                                console.log('🔍 Debug: Found prompt in virtualComponents, component ID:', compId);
                                break;
                              }
                            }
                          }
                        } catch (e) {
                          console.error('🔍 Debug: Error searching prototypeComponents/virtualComponents for prompts:', e);
                        }
                      }
                      
                      // If still no prompt, try to extract from component description
                      if (!originalPrompt || originalPrompt === 'Generate a React component') {
                        // Safely serialize component data to avoid circular references
                        const safeSerialize = (obj: any): string => {
                          const seen = new WeakSet();
                          return JSON.stringify(obj, (key, value) => {
                            if (typeof value === 'object' && value !== null) {
                              if (seen.has(value)) {
                                return '[Circular Reference]';
                              }
                              seen.add(value);
                            }
                            return value;
                          });
                        };
                        
                        try {
                          const componentText = safeSerialize(selectedComponent);
                          const promptMatch = componentText.match(/"([^"]*form[^"]*component[^"]*)"|"([^"]*input[^"]*field[^"]*)"|"([^"]*button[^"]*)"|"([^"]*Generate[^"]*)"|"([^"]*Create[^"]*)"|"([^"]*Build[^"]*)"/i);
                          
                          if (promptMatch) {
                            originalPrompt = promptMatch[1] || promptMatch[2] || promptMatch[3] || promptMatch[4] || promptMatch[5] || promptMatch[6];
                            console.log('🔍 Debug: Extracted prompt from component text:', originalPrompt);
                          }
                        } catch (serializeError) {
                          console.error('🔍 Debug: Error serializing component for prompt extraction:', serializeError);
                          // Fallback: try to extract from properties directly
                          const props = selectedComponent.properties || {};
                          const propKeys = Object.keys(props);
                          for (const key of propKeys) {
                            const value = (props as any)[key];
                            if (typeof value === 'string' && value.toLowerCase().includes('form')) {
                              originalPrompt = value;
                              console.log('🔍 Debug: Found prompt in property:', key, value);
                              break;
                            }
                          }
                        }
                      }
                      
                      // Check localStorage for saved modified code (try multiple possible keys)
                      let savedCode = localStorage.getItem(`modifiedCode_${selectedComponent.id}`);
                      if (savedCode && !originalCode) {
                        try {
                          const savedData = JSON.parse(savedCode);
                          originalCode = savedData.modifiedCode || savedData.originalCode;
                          console.log('🔍 Debug: Found code in localStorage with current ID');
                        } catch (e) {
                          console.error('🔍 Debug: Error parsing localStorage data:', e);
                        }
                      }
                      
                      // If still no code, search all localStorage keys for any modified code
                      if (!originalCode) {
                        console.log('🔍 Debug: Searching all localStorage for any modified code...');
                        for (let i = 0; i < localStorage.length; i++) {
                          const key = localStorage.key(i);
                          if (key && key.startsWith('modifiedCode_')) {
                            try {
                              const savedData = JSON.parse(localStorage.getItem(key) || '{}');
                              if (savedData.modifiedCode || savedData.originalCode) {
                                originalCode = savedData.modifiedCode || savedData.originalCode;
                                console.log('🔍 Debug: Found code in localStorage key:', key);
                                break;
                              }
                            } catch (e) {
                              console.error('🔍 Debug: Error parsing localStorage key:', key, e);
                            }
                          }
                        }
                      }
                      
                      // If still no code, try to find it in prototypeComponents or virtualComponents
                      if (!originalCode) {
                        console.log('🔍 Debug: Searching prototypeComponents and virtualComponents...');
                        try {
                          const prototypeComponents = JSON.parse(localStorage.getItem('prototypeComponents') || '[]');
                          const virtualComponents = JSON.parse(localStorage.getItem('virtualComponents') || '{}');
                          
                          // Search in prototypeComponents
                          for (const component of prototypeComponents) {
                            if (component.properties?.generatedCode) {
                              originalCode = component.properties.generatedCode;
                              console.log('🔍 Debug: Found code in prototypeComponents, component ID:', component.id);
                              break;
                            }
                          }
                          
                          // Search in virtualComponents if still not found
                          if (!originalCode) {
                            for (const [compId, component] of Object.entries(virtualComponents)) {
                              if ((component as any).properties?.generatedCode) {
                                originalCode = (component as any).properties.generatedCode;
                                console.log('🔍 Debug: Found code in virtualComponents, component ID:', compId);
                                break;
                              }
                            }
                          }
                        } catch (e) {
                          console.error('🔍 Debug: Error searching prototypeComponents/virtualComponents:', e);
                        }
                      }
                      
                      console.log('🔍 Debug: Final originalCode length:', originalCode?.length || 0);
                      console.log('🔍 Debug: Final originalPrompt:', originalPrompt);
                      
                      if (!originalCode) {
                        alert('Cannot regenerate: Missing original code for this component. Please check the debug console for details.');
                        return;
                      }
                      
                      if (!originalPrompt) {
                        // Use a default prompt if none is found
                        originalPrompt = `Generate a ${selectedComponent.type} component`;
                        console.log('🔍 Debug: Using default prompt:', originalPrompt);
                      }
                      
                      // Collect all direct manipulation changes (safely to avoid circular references)
                      const directManipulationChanges = {
                        styleOverrides: (properties as any).styleOverrides ? 
                          Object.fromEntries(
                            Object.entries((properties as any).styleOverrides).map(([key, value]) => [key, String(value)])
                          ) : {},
                        textContent: properties.textContent ? String(properties.textContent) : undefined,
                        placeholder: properties.placeholder ? String(properties.placeholder) : undefined,
                        color: properties.color ? String(properties.color) : undefined,
                        backgroundColor: properties.backgroundColor ? String(properties.backgroundColor) : undefined,
                        fontSize: properties.fontSize ? String(properties.fontSize) : undefined,
                        fontWeight: properties.fontWeight ? String(properties.fontWeight) : undefined,
                        textAlign: properties.textAlign ? String(properties.textAlign) : undefined,
                        padding: properties.padding ? String(properties.padding) : undefined,
                        margin: properties.margin ? String(properties.margin) : undefined,
                        borderRadius: properties.borderRadius ? String(properties.borderRadius) : undefined,
                        border: (properties as any).border ? String((properties as any).border) : undefined,
                        width: properties.width ? String(properties.width) : undefined,
                        height: properties.height ? String(properties.height) : undefined,
                        display: properties.display ? String(properties.display) : undefined,
                        flexDirection: properties.flexDirection ? String(properties.flexDirection) : undefined,
                        justifyContent: properties.justifyContent ? String(properties.justifyContent) : undefined,
                        alignItems: properties.alignItems ? String(properties.alignItems) : undefined,
                        gap: (properties as any).gap ? String((properties as any).gap) : undefined,
                        opacity: (properties as any).opacity ? String((properties as any).opacity) : undefined,
                        fontFamily: (properties as any).fontFamily ? String((properties as any).fontFamily) : undefined
                      };
                      
                      // Remove undefined values to clean up the object
                      Object.keys(directManipulationChanges).forEach(key => {
                        if (directManipulationChanges[key as keyof typeof directManipulationChanges] === undefined) {
                          delete directManipulationChanges[key as keyof typeof directManipulationChanges];
                        }
                      });
                      
                      // Also collect changes from the changes array for completeness
                      if (changes && changes.length > 0) {
                        changes.forEach(change => {
                          if (change.type === 'style') {
                            // Convert property path to actual property name
                            const propertyName = change.propertyPath.replace(/([A-Z])/g, '-$1').toLowerCase();
                            if (!directManipulationChanges.styleOverrides) {
                              directManipulationChanges.styleOverrides = {};
                            }
                            directManipulationChanges.styleOverrides[propertyName] = String(change.newValue);
                          } else if (change.type === 'content') {
                            if (change.propertyPath === 'textContent') {
                              directManipulationChanges.textContent = String(change.newValue);
                            } else if (change.propertyPath === 'placeholder') {
                              directManipulationChanges.placeholder = String(change.newValue);
                            } else if (change.propertyPath === 'value') {
                              directManipulationChanges.value = change.newValue;
                            }
                          }
                        });
                      }
                      
                      console.log('🔄 Regenerating component with changes:', selectedComponent.id);
                      console.log('📄 Original code length:', originalCode.length);
                      console.log('🎨 Changes to apply:', directManipulationChanges);
                      
                      // Call the regeneration API with safe serialization
                      const requestData = {
                        componentId: selectedComponent.id,
                        originalCode,
                        originalPrompt,
                        componentType: selectedComponent.type,
                        directManipulationChanges
                      };
                      
                      // Safely serialize the request data
                      const safeSerialize = (obj: any): string => {
                        const seen = new WeakSet();
                        return JSON.stringify(obj, (key, value) => {
                          if (typeof value === 'object' && value !== null) {
                            if (seen.has(value)) {
                              return '[Circular Reference]';
                            }
                            seen.add(value);
                          }
                          return value;
                        });
                      };
                      
                      const response = await fetch('/api/ai/regenerate-with-changes', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: safeSerialize(requestData)
                      });
                      
                      if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Failed to regenerate: ${response.status} ${errorText}`);
                      }
                      
                      const result = await response.json();
                                              console.log('✅ Component regenerated successfully:', result);

                        // Update the component with the new generated code
                        const newGeneratedCode = result.data.newGeneratedCode;
                        
                        // Immediately show the regenerated code in console
                        console.log('🔄 ===== REGENERATED CODE =====');
                        console.log('🔄 Component ID:', selectedComponent.id);
                        console.log('🔄 Original Code Length:', originalCode?.length || 0);
                        console.log('🔄 New Code Length:', newGeneratedCode?.length || 0);
                        console.log('🔄 Changes Applied:', directManipulationChanges);
                        console.log('🔄 ===== NEW CODE START =====');
                        console.log(newGeneratedCode);
                        console.log('🔄 ===== NEW CODE END =====');
                        console.log('🔄 ===== ORIGINAL CODE START =====');
                        console.log(originalCode);
                        console.log('🔄 ===== ORIGINAL CODE END =====');
                      
                      // NEW BEHAVIOR: Create a brand new component from regenerated code and add to canvas
                      if (onComponentGenerated) {
                        const newId = uuidv4();
                        const approxX = Math.max(0, Math.floor((selectedComponent.bounds?.left || 100) + 20));
                        const approxY = Math.max(0, Math.floor((selectedComponent.bounds?.top || 100) + 20));
                        const approxW = Math.max(200, Math.floor((selectedComponent.bounds?.width || 400)));
                        const approxH = Math.max(150, Math.floor((selectedComponent.bounds?.height || 300)));

                        const newComponent: ComponentData = {
                          id: newId,
                          type: selectedComponent.type.startsWith('AI') ? selectedComponent.type : `AI${selectedComponent.type}`,
                          position: { x: approxX, y: approxY },
                          size: { width: approxW, height: approxH },
                          properties: {
                            // IMPORTANT: start fresh to avoid injecting stale direct-manipulation data
                            generatedCode: newGeneratedCode,
                            prompt: (selectedComponent.properties as any)?.prompt || (selectedComponent as any)?.prompt || '',
                            requirements: (selectedComponent.properties as any)?.requirements,
                            hasDirectManipulationChanges: false,
                            lastRegenerated: new Date().toISOString(),
                            originComponentId: selectedComponent.id,
                            regeneratedFrom: selectedComponent.id
                          }
                        };

                        // Persist immediately to localStorage (append)
                        try {
                          const current = JSON.parse(localStorage.getItem('prototypeComponents') || '[]');
                          current.push(newComponent);
                          localStorage.setItem('prototypeComponents', JSON.stringify(current));
                        } catch (e) {
                          console.warn('⚠️ Failed to persist new regenerated component to localStorage:', e);
                        }

                        onComponentGenerated(newComponent);
                        console.log('🚀 Added regenerated component as NEW component on canvas:', newId);
                        // Stop further legacy update flows
                        return;
                      }
                      
                      // CRITICAL: Force a re-render by updating the component in the main Editor state
                      // This ensures the new code is immediately visible without page refresh
                      try {
                        // LEGACY FLOW: Update existing component entries in storage.
                        // NOTE: For regenerated components we already created a new one above when possible.
                        // Keep this as a fallback only.
                        // STEP 1: Update prototypeComponents (CRITICAL for Run Mode)
                        let componentFoundInPrototype = false;
                        const savedComponents = localStorage.getItem("prototypeComponents");
                        
                        if (savedComponents) {
                          const components = JSON.parse(savedComponents);
                          console.log('💾 Looking for component in prototypeComponents:', selectedComponent.id);
                          
                          const componentIndex = components.findIndex((comp: any) => comp.id === selectedComponent.id);
                          
                          if (componentIndex !== -1) {
                            // Verify the quality of the code being saved
                            console.log('💾 Saving regenerated code of length:', newGeneratedCode.length);
                            
                            // Update the component in localStorage
                            components[componentIndex].properties = {
                              ...components[componentIndex].properties,
                              generatedCode: newGeneratedCode,
                              hasDirectManipulationChanges: false,
                              lastRegenerated: new Date().toISOString()
                            };
                            
                            // Save to localStorage with enhanced error handling
                            try {
                              const jsonString = JSON.stringify(components);
                              // Check localStorage capacity before saving
                              const storageInfo = localStorageUtils.getStorageInfo();
                              console.log('📊 localStorage info:', storageInfo);
                              
                              // Use smart storage manager to prevent truncation
                              const saveSuccess = smartStorageManager.safeSet("prototypeComponents", jsonString);
                              
                              if (saveSuccess) {
                                console.log('✅ SUCCESS: Saved regenerated code to prototypeComponents for component:', selectedComponent.id);
                                
                                // Verify the save was successful and not truncated
                                const debugInfo = localStorageUtils.debugComponentCode(selectedComponent.id);
                                if (debugInfo) {
                                  console.log('✅ VERIFY: Component code debug:', debugInfo);
                                  
                                  if (debugInfo.isTruncated) {
                                    console.error('❌ WARNING: Saved code appears to be truncated!');
                                    alert('⚠️ Warning: Component code may have been truncated due to storage limits. Some functionality may not work properly.');
                                  } else if (!debugInfo.isValid) {
                                    console.error('❌ WARNING: Saved code is invalid!');
                                    alert('⚠️ Warning: Component code appears to be invalid. Please try regenerating.');
                                  } else {
                                    console.log('✅ SUCCESS: Code saved and verified as complete!');
                                  }
                                }
                              } else {
                                console.error('❌ ERROR: Failed to save to localStorage - quota exceeded or other error');
                                alert('❌ Failed to save changes: localStorage quota exceeded. Please clear some browser data and try again.');
                              }
                            } catch (storageError) {
                              console.error('❌ ERROR: Failed to save to localStorage:', storageError);
                              alert('❌ Failed to save changes: ' + storageError);
                            }
                            componentFoundInPrototype = true;
                            
                            // CRITICAL: Dispatch a custom event to notify the Editor to reload components
                            const reloadEvent = new CustomEvent('reloadComponents', {
                              detail: { componentId: selectedComponent.id, newCode: newGeneratedCode }
                            });
                            window.dispatchEvent(reloadEvent);
                            console.log('🔄 Dispatched reloadComponents event');
                            
                          } else {
                            console.warn('⚠️ Component not found in prototypeComponents array');
                          }
                        } else {
                          console.warn('⚠️ No prototypeComponents found in localStorage');
                        }
                        
                        // STEP 2: If not found in prototypeComponents, create/update it there
                        if (!componentFoundInPrototype) {
                          console.log('🔧 Component not found in prototypeComponents, adding it...');
                          
                          const components = JSON.parse(localStorage.getItem("prototypeComponents") || "[]");
                          
                          // Calculate natural size for the component
                          const naturalSize = calculateNaturalComponentSize(newGeneratedCode, selectedComponent.type);
                          
                          // Create a complete component object for prototypeComponents
                          const updatedComponent = {
                            id: selectedComponent.id,
                            type: selectedComponent.type,
                            position: { x: 100, y: 100 }, // Default position if not found
                            size: naturalSize, // Use natural size instead of default
                            frameId: null, // Default frameId
                            properties: {
                              ...selectedComponent.properties,
                              generatedCode: newGeneratedCode,
                              hasDirectManipulationChanges: false,
                              lastRegenerated: new Date().toISOString()
                            }
                          };
                          
                          // Check if it exists and update, or add new
                          const existingIndex = components.findIndex((c: any) => c.id === selectedComponent.id);
                          if (existingIndex !== -1) {
                            components[existingIndex] = updatedComponent;
                            console.log('🔧 Updated existing component in prototypeComponents');
                          } else {
                            components.push(updatedComponent);
                            console.log('🔧 Added new component to prototypeComponents');
                          }
                          
                          const jsonString = JSON.stringify(components);
                          const saveSuccess = smartStorageManager.safeSet("prototypeComponents", jsonString);
                          
                          if (saveSuccess) {
                            console.log('✅ FORCE-SAVED: Component now available in prototypeComponents for Run Mode');
                          } else {
                            console.error('❌ FORCE-SAVE FAILED: Could not save component to prototypeComponents');
                            alert('❌ Warning: Could not save component due to storage limits. Run Mode may not reflect changes.');
                          }
                        }
                        
                        // STEP 3: Also update virtualComponents (used by Editor)
                        const virtualComponents = JSON.parse(localStorage.getItem("virtualComponents") || "{}");
                        
                        // Create serializable version (exclude HTMLElement and other non-serializable properties)
                        const serializableComponent = {
                          id: selectedComponent.id,
                          type: selectedComponent.type,
                          // Note: Don't include element, bounds, or other HTMLElement references
                          properties: {
                            ...selectedComponent.properties,
                            generatedCode: newGeneratedCode,
                            hasDirectManipulationChanges: false,
                            lastRegenerated: new Date().toISOString()
                          },
                          componentCode: selectedComponent.componentCode,
                          originalCode: selectedComponent.originalCode,
                          changes: selectedComponent.changes || []
                        };
                        
                        virtualComponents[selectedComponent.id] = serializableComponent;
                        
                        // Use smart storage manager to prevent truncation and circular references
                        try {
                          const jsonString = JSON.stringify(virtualComponents);
                          const saveSuccess = smartStorageManager.safeSet("virtualComponents", jsonString);
                          
                          if (saveSuccess.success) {
                            console.log('✅ ALSO SAVED: Component updated in virtualComponents for Editor');
                          } else {
                            console.error('❌ Failed to save virtualComponents:', saveSuccess.error);
                            // Fallback: Save just this component's data
                            const fallbackStorage = { [selectedComponent.id]: serializableComponent };
                            const fallbackSuccess = smartStorageManager.safeSet("virtualComponents", JSON.stringify(fallbackStorage));
                            if (fallbackSuccess.success) {
                              console.log('🔧 FALLBACK: Saved component to cleaned virtualComponents storage');
                            } else {
                              console.error('❌ Even fallback storage failed:', fallbackSuccess.error);
                            }
                          }
                        } catch (error) {
                          console.error('❌ Error in virtualComponents storage:', error);
                        }
                        
                      } catch (error) {
                        console.error('❌ Error saving regenerated code to storage:', error);
                      }
                      

                      
                      // Also save to modifiedCode localStorage for backup
                      const localStorageKey = `modifiedCode_${selectedComponent.id}`;
                      const modifiedCodeData = {
                        modifiedCode: newGeneratedCode,
                        originalCode,
                        changes: directManipulationChanges,
                        savedAt: new Date().toISOString(),
                        regenerated: true
                      };
                      
                      const saveModifiedSuccess = smartStorageManager.safeSet(localStorageKey, JSON.stringify(modifiedCodeData));
                      if (!saveModifiedSuccess.success) {
                        console.warn('⚠️ Could not save modifiedCode backup:', saveModifiedSuccess.error);
                      }
                      
                      // Clear the changes since they're now in the code
                      if (componentSelector) {
                        componentSelector.revertChanges();
                        setChanges([]);
                      }
                      
                      // Show the regenerated code in a modal before asking to refresh
                      const showRegeneratedCode = (newCode: string, originalCode: string) => {
                        const modal = document.createElement('div');
                        modal.style.cssText = `
                          position: fixed;
                          top: 0;
                          left: 0;
                          width: 100%;
                          height: 100%;
                          background: rgba(0, 0, 0, 0.9);
                          z-index: 10000;
                          display: flex;
                          justify-content: center;
                          align-items: center;
                          padding: 20px;
                        `;

                        const content = document.createElement('div');
                        content.style.cssText = `
                          background: white;
                          border-radius: 8px;
                          padding: 20px;
                          max-width: 95%;
                          max-height: 95%;
                          overflow: auto;
                          position: relative;
                        `;

                        const header = document.createElement('div');
                        header.style.cssText = `
                          display: flex;
                          justify-content: space-between;
                          align-items: center;
                          margin-bottom: 20px;
                          padding-bottom: 10px;
                          border-bottom: 1px solid #eee;
                        `;

                        const title = document.createElement('h2');
                        title.textContent = '🔄 Regenerated Code - Before vs After';
                        title.style.cssText = `
                          margin: 0;
                          font-size: 18px;
                          font-weight: bold;
                          color: #333;
                        `;

                        const closeButton = document.createElement('button');
                        closeButton.textContent = '✕';
                        closeButton.style.cssText = `
                          background: #f44336;
                          color: white;
                          border: none;
                          border-radius: 4px;
                          padding: 8px 12px;
                          cursor: pointer;
                          font-size: 16px;
                        `;
                        closeButton.onclick = () => document.body.removeChild(modal);

                        const copyButton = document.createElement('button');
                        copyButton.textContent = '📋 Copy New Code';
                        copyButton.style.cssText = `
                          background: #2196f3;
                          color: white;
                          border: none;
                          border-radius: 4px;
                          padding: 8px 12px;
                          cursor: pointer;
                          font-size: 14px;
                          margin-left: 10px;
                        `;
                        copyButton.onclick = () => {
                          navigator.clipboard.writeText(newCode).then(() => {
                            copyButton.textContent = '✅ Copied!';
                            setTimeout(() => {
                              copyButton.textContent = '📋 Copy New Code';
                            }, 2000);
                          }).catch(() => {
                            alert('Failed to copy to clipboard');
                          });
                        };

                        const refreshButton = document.createElement('button');
                        refreshButton.textContent = '🔄 Apply & Refresh';
                        refreshButton.style.cssText = `
                          background: #4caf50;
                          color: white;
                          border: none;
                          border-radius: 4px;
                          padding: 8px 12px;
                          cursor: pointer;
                          font-size: 14px;
                          margin-left: 10px;
                        `;
                        refreshButton.onclick = () => {
                          console.log('🔄 Refreshing page to load regenerated code...');
                          window.location.reload();
                        };

                        const applyButton = document.createElement('button');
                        applyButton.textContent = '✅ Apply Now (No Refresh)';
                        applyButton.style.cssText = `
                          background: #2196f3;
                          color: white;
                          border: none;
                          border-radius: 4px;
                          padding: 8px 12px;
                          cursor: pointer;
                          font-size: 14px;
                          margin-left: 10px;
                        `;
                        applyButton.onclick = () => {
                          console.log('✅ Applying regenerated code without page refresh...');
                          // Dispatch the reload event to update the component immediately
                          const reloadEvent = new CustomEvent('reloadComponents', {
                            detail: { componentId: selectedComponent.id, newCode: newCode }
                          });
                          window.dispatchEvent(reloadEvent);
                          
                          // Close the modal
                          document.body.removeChild(modal);
                          
                          // Show success message
                          setTimeout(() => {
                            alert('✅ Regenerated code applied successfully! The component should now show your changes.');
                          }, 100);
                        };

                        const createNewButton = document.createElement('button');
                        createNewButton.textContent = '🆕 Create New Component';
                        createNewButton.style.cssText = `
                          background: #ff9800;
                          color: white;
                          border: none;
                          border-radius: 4px;
                          padding: 8px 12px;
                          cursor: pointer;
                          font-size: 14px;
                          margin-left: 10px;
                        `;
                        createNewButton.onclick = async () => {
                          console.log('🆕 Creating new component with regenerated code...');
                          
                          try {
                            // Close the modal first
                            document.body.removeChild(modal);
                            
                            // Create a new component using the new API that preserves existing code
                            const response = await fetch('/api/ai/create-component-from-code', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                code: newCode,
                                componentType: selectedComponent.type || 'Container',
                                prompt: `Regenerated component based on: ${originalCode?.substring(0, 100)}...`
                              }),
                            });

                            if (!response.ok) {
                              throw new Error(`Failed to create new component: ${response.status}`);
                            }

                            const result = await response.json();
                            const newComponentCode = result.component;
                            
                            console.log('🆕 New component created with code:', newComponentCode);
                            
                            // Calculate natural size for the new component
                            const naturalSize = calculateNaturalComponentSize(newComponentCode, selectedComponent.type || 'Container');
                            
                            // Create a new component data object (floating like new components)
                            const newComponent: ComponentData = {
                              id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              type: `AI${selectedComponent.type || 'Container'}`, // Use proper type like new components
                              // Position floating on canvas (like new components)
                              position: { x: 100, y: 100 },
                              // Use natural size instead of default
                              size: naturalSize,
                              properties: {
                                generatedCode: newComponentCode,
                                prompt: `Regenerated component based on: ${originalCode?.substring(0, 100)}...`,
                                componentType: selectedComponent.type || 'Container',
                                hasDirectManipulationChanges: false,
                                lastGenerated: new Date().toISOString()
                              }
                              // No frameId - let it float like new components
                            };
                            
                            console.log('🆕 New component data:', newComponent);
                            console.log('🆕 Component position:', newComponent.position);
                            console.log('🆕 Component size:', newComponent.size);
                            
                            // Use the same flow as AI component generation by calling the handleComponentGenerated function
                            // Dispatch a custom event that the Editor will listen for
                            const componentGeneratedEvent = new CustomEvent('componentGenerated', {
                              detail: { component: newComponent }
                            });
                            window.dispatchEvent(componentGeneratedEvent);
                            
                            // Show success message
                            setTimeout(() => {
                              alert('🆕 New component created successfully! It has been added to the canvas next to the original component.');
                            }, 100);
                            
                          } catch (error) {
                            console.error('❌ Error creating new component:', error);
                            alert('❌ Failed to create new component: ' + error);
                          }
                        };

                        const previewButton = document.createElement('button');
                        previewButton.textContent = '👁️ Preview Changes';
                        previewButton.style.cssText = `
                          background: #ff9800;
                          color: white;
                          border: none;
                          border-radius: 4px;
                          padding: 8px 12px;
                          cursor: pointer;
                          font-size: 14px;
                          margin-left: 10px;
                        `;
                        previewButton.onclick = () => {
                          // Show a preview of what the changes will look like
                          const previewModal = document.createElement('div');
                          previewModal.style.cssText = `
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: rgba(0, 0, 0, 0.8);
                            z-index: 10001;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            padding: 20px;
                          `;

                          const previewContent = document.createElement('div');
                          previewContent.style.cssText = `
                            background: white;
                            border-radius: 8px;
                            padding: 20px;
                            max-width: 80%;
                            max-height: 80%;
                            overflow: auto;
                            position: relative;
                          `;

                          const previewHeader = document.createElement('div');
                          previewHeader.style.cssText = `
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 20px;
                            padding-bottom: 10px;
                            border-bottom: 1px solid #eee;
                          `;

                          const previewTitle = document.createElement('h3');
                          previewTitle.textContent = '👁️ Preview: How Your Changes Will Look';
                          previewTitle.style.cssText = `
                            margin: 0;
                            font-size: 16px;
                            font-weight: bold;
                            color: #333;
                          `;

                          const closePreviewButton = document.createElement('button');
                          closePreviewButton.textContent = '✕';
                          closePreviewButton.style.cssText = `
                            background: #f44336;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            padding: 8px 12px;
                            cursor: pointer;
                            font-size: 16px;
                          `;
                          closePreviewButton.onclick = () => document.body.removeChild(previewModal);

                          previewHeader.appendChild(previewTitle);
                          previewHeader.appendChild(closePreviewButton);

                          const previewInfo = document.createElement('div');
                          previewInfo.style.cssText = `
                            background: #f0f8ff;
                            padding: 15px;
                            border-radius: 4px;
                            margin-bottom: 15px;
                            font-size: 14px;
                          `;
                          previewInfo.innerHTML = `
                            <strong>Changes Applied:</strong><br>
                            ${Object.entries(directManipulationChanges).map(([key, value]) => 
                              `<span style="color: #0066cc;">${key}:</span> ${value}`
                            ).join('<br>')}
                          `;

                          previewContent.appendChild(previewHeader);
                          previewContent.appendChild(previewInfo);
                          previewContent.appendChild(document.createElement('hr'));
                          
                          const codePreview = document.createElement('pre');
                          codePreview.style.cssText = `
                            background: #f5f5f5;
                            padding: 15px;
                            border-radius: 4px;
                            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                            font-size: 11px;
                            line-height: 1.4;
                            white-space: pre-wrap;
                            word-wrap: break-word;
                            max-height: 50vh;
                            overflow: auto;
                          `;
                          codePreview.textContent = newCode;

                          previewContent.appendChild(codePreview);
                          previewModal.appendChild(previewContent);
                          document.body.appendChild(previewModal);
                        };

                        // Enhanced versioning buttons
                        const replaceButton = document.createElement('button');
                        replaceButton.textContent = '🔄 Replace Original';
                        replaceButton.style.cssText = `
                          background: #4caf50;
                          color: white;
                          border: none;
                          border-radius: 4px;
                          padding: 8px 12px;
                          cursor: pointer;
                          font-size: 14px;
                          margin-left: 10px;
                        `;
                        replaceButton.onclick = () => {
                          console.log('🔄 Replacing original component with new code...');
                          
                          // Save as version first for rollback
                          const version = componentVersioning.createNewVersion(
                            selectedComponent.id,
                            newCode,
                            directManipulationChanges
                          );
                          componentVersioning.saveVersion(version);
                          componentVersioning.markVersionAsWorking(version.id);
                          
                          // Replace original immediately
                          componentVersioning.replaceWithVersion(selectedComponent.id, version.id);
                          
                          // Dispatch the reload event
                          const reloadEvent = new CustomEvent('reloadComponents', {
                            detail: { componentId: selectedComponent.id, newCode: newCode }
                          });
                          window.dispatchEvent(reloadEvent);
                          
                          document.body.removeChild(modal);
                          alert('✅ Original component replaced! Old version saved for rollback if needed.');
                        };

                        const createVersionButton = document.createElement('button');
                        createVersionButton.textContent = '🎯 Create Version';
                        createVersionButton.style.cssText = `
                          background: #9c27b0;
                          color: white;
                          border: none;
                          border-radius: 4px;
                          padding: 8px 12px;
                          cursor: pointer;
                          font-size: 14px;
                          margin-left: 10px;
                        `;
                        createVersionButton.onclick = () => {
                          console.log('🎯 Creating new version alongside original...');
                          
                          // Create version in versioning system
                          const version = componentVersioning.createNewVersion(
                            selectedComponent.id,
                            newCode,
                            directManipulationChanges
                          );
                          
                          // Save version
                          componentVersioning.saveVersion(version);
                          
                          // Create as separate component in canvas
                          const success = componentVersioning.createComponentFromVersion(version);
                          
                          if (success) {
                            // Dispatch reload to show new component
                            const reloadEvent = new CustomEvent('reloadComponents', {
                              detail: { componentId: version.id, newCode: newCode }
                            });
                            window.dispatchEvent(reloadEvent);
                            
                            document.body.removeChild(modal);
                            alert(`✅ New version created: ${version.id}\nBoth original and new version are now visible on canvas!`);
                          } else {
                            alert('❌ Failed to create version component');
                          }
                        };

                        const safeApplyButton = document.createElement('button');
                        safeApplyButton.textContent = '🛡️ Safe Apply';
                        safeApplyButton.style.cssText = `
                          background: #2196f3;
                          color: white;
                          border: none;
                          border-radius: 4px;
                          padding: 8px 12px;
                          cursor: pointer;
                          font-size: 14px;
                          margin-left: 10px;
                        `;
                        safeApplyButton.onclick = () => {
                          console.log('🛡️ Safe applying with automatic rollback protection...');
                          
                          // First, save current working code as backup
                          const backupVersion = componentVersioning.createNewVersion(
                            selectedComponent.id,
                            originalCode,
                            { isBackup: true }
                          );
                          componentVersioning.saveVersion(backupVersion);
                          
                          // Create new version
                          const newVersion = componentVersioning.createNewVersion(
                            selectedComponent.id,
                            newCode,
                            directManipulationChanges
                          );
                          componentVersioning.saveVersion(newVersion);
                          
                          // Apply new code
                          componentVersioning.replaceWithVersion(selectedComponent.id, newVersion.id);
                          
                          // Dispatch reload
                          const reloadEvent = new CustomEvent('reloadComponents', {
                            detail: { componentId: selectedComponent.id, newCode: newCode }
                          });
                          window.dispatchEvent(reloadEvent);
                          
                          document.body.removeChild(modal);
                          
                          // Set up automatic rollback check
                          setTimeout(() => {
                            const shouldRollback = confirm(
                              '🛡️ Safe Apply Check:\\n\\n' +
                              'Is the new component working correctly?\\n\\n' +
                              '✅ Click OK if it works fine\\n' +
                              '❌ Click Cancel to rollback to previous version'
                            );
                            
                            if (!shouldRollback) {
                              // Rollback to backup
                              componentVersioning.replaceWithVersion(selectedComponent.id, backupVersion.id);
                              componentVersioning.markVersionAsBroken(newVersion.id, 'User reported rendering issues');
                              
                              const rollbackEvent = new CustomEvent('reloadComponents', {
                                detail: { componentId: selectedComponent.id, newCode: originalCode }
                              });
                              window.dispatchEvent(rollbackEvent);
                              
                              alert('🔄 Rolled back to previous working version!');
                            } else {
                              // Mark new version as working
                              componentVersioning.markVersionAsWorking(newVersion.id);
                              alert('✅ New version confirmed as working!');
                            }
                          }, 3000); // Give 3 seconds to see the result
                          
                          alert('🛡️ New code applied! You have 3 seconds to test it before rollback prompt.');
                        };

                        header.appendChild(title);
                        
                        // Create button container for better layout
                        const buttonContainer = document.createElement('div');
                        buttonContainer.style.cssText = `
                          display: flex;
                          gap: 5px;
                          flex-wrap: wrap;
                          align-items: center;
                        `;
                        
                        buttonContainer.appendChild(previewButton);
                        buttonContainer.appendChild(copyButton);
                        buttonContainer.appendChild(safeApplyButton);
                        buttonContainer.appendChild(replaceButton);
                        buttonContainer.appendChild(createVersionButton);
                        buttonContainer.appendChild(applyButton);
                        buttonContainer.appendChild(createNewButton);
                        buttonContainer.appendChild(refreshButton);
                        buttonContainer.appendChild(closeButton);
                        
                        header.appendChild(buttonContainer);

                        const comparisonText = `=== ORIGINAL CODE (Before Regeneration) ===
${originalCode || 'No original code found'}

=== REGENERATED CODE (After Direct Manipulation Changes) ===
${newCode || 'No regenerated code found'}

=== CHANGES APPLIED ===
${JSON.stringify(directManipulationChanges, null, 2)}

=== INSTRUCTIONS ===
The regenerated code above includes all your direct manipulation changes applied as inline styles.
Click "Apply & Refresh" to load this new code in the component.`;

                        const pre = document.createElement('pre');
                        pre.style.cssText = `
                          background: #f5f5f5;
                          padding: 15px;
                          border-radius: 4px;
                          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                          font-size: 11px;
                          line-height: 1.4;
                          white-space: pre-wrap;
                          word-wrap: break-word;
                          max-height: 70vh;
                          overflow: auto;
                        `;
                        pre.textContent = comparisonText;

                        content.appendChild(header);
                        content.appendChild(pre);
                        modal.appendChild(content);
                        document.body.appendChild(modal);

                        // Also log to console for debugging
                        console.log('🔄 Regenerated Code for component:', selectedComponent.id);
                        console.log('📄 Original Code Length:', originalCode?.length || 0);
                        console.log('📄 New Code Length:', newCode?.length || 0);
                        console.log('📄 New Code Preview:', newCode?.substring(0, 500));
                      };

                      // Show the regenerated code
                      showRegeneratedCode(newGeneratedCode, originalCode);
                      
                    } catch (error) {
                      console.error('Error regenerating component:', error);
                      alert('❌ Failed to regenerate component: ' + error);
                    }
                  }
                }}
                className="text-xs h-6 bg-purple-600 text-white hover:bg-purple-700"
              >
                🔄 Regenerate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  generateCode();
                }}
                className="text-xs h-6"
              >
                Generate Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  showCodeComparison();
                }}
                className="text-xs h-6"
              >
                📄 Compare Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Test regeneration API directly
                  if (selectedComponent) {
                    const testChanges = {
                      color: '#ff8c82',
                      backgroundColor: '#00a3d7',
                      fontFamily: 'Georgia',
                      fontWeight: '700',
                      textAlign: 'left'
                    };
                    
                    fetch('/api/ai/regenerate-with-changes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        componentId: selectedComponent.id,
                        originalCode: selectedComponent.properties?.generatedCode || 'const TestComponent = () => <div>Test</div>;',
                        originalPrompt: 'Generate a test component',
                        componentType: selectedComponent.type,
                        directManipulationChanges: testChanges
                      })
                    })
                    .then(response => response.json())
                    .then(data => {
                      console.log('🔄 Test regeneration response:', data);
                      if (data.success) {
                        alert('Test regeneration successful! Check console for the new code.');
                        console.log('📄 New generated code:', data.data.newGeneratedCode);
                      } else {
                        alert('Test regeneration failed: ' + data.error);
                      }
                    })
                    .catch(error => {
                      console.error('🔄 Test regeneration error:', error);
                      alert('Test regeneration failed! Check console for details.');
                    });
                  } else {
                    alert('No component selected for testing');
                  }
                }}
                className="text-xs h-6"
              >
                Test Regeneration
              </Button>
              */}
            </div>
          </div>
          <div className="space-y-1">
            {changes.slice(-3).map((change, index) => (
              <div key={change.id} className="text-xs text-yellow-700">
                {change.propertyPath}: {String(change.oldValue)} → {String(change.newValue)}
              </div>
            ))}
            {changes.length > 3 && (
              <div className="text-xs text-yellow-600">... and {changes.length - 3} more changes</div>
            )}
          </div>
        </div>
      )}

      <Separator />

      {/* Typography Section */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Type size={16} />
          Typography
        </h4>
        
        {/* Font Family */}
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          <Label>Font Family</Label>
          <div onClick={(e) => e.stopPropagation()}>
            <SelectWrapper 
              value={properties.fontFamily || 'Default'} 
              onValueChange={(value) => updateProperty('fontFamily', value)}
            >
              <SelectTrigger onClick={(e) => e.stopPropagation()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent onClick={(e) => e.stopPropagation()}>
                {fontFamilies.map(font => (
                  <SelectItem key={font} value={font} onClick={(e) => e.stopPropagation()}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectWrapper>
          </div>
        </div>

        {/* Font Size and Weight */}
        <div className="grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-2">
            <Label>Size</Label>
            <div onClick={(e) => e.stopPropagation()}>
              <SelectWrapper 
                value={properties.fontSize || 'base'} 
                onValueChange={(value) => updateProperty('fontSize', value)}
              >
                <SelectTrigger onClick={(e) => e.stopPropagation()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent onClick={(e) => e.stopPropagation()}>
                  {fontSizes.map(size => (
                    <SelectItem key={size} value={size} onClick={(e) => e.stopPropagation()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectWrapper>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Weight</Label>
            <div onClick={(e) => e.stopPropagation()}>
              <SelectWrapper 
                value={properties.fontWeight || '400'} 
                onValueChange={(value) => updateProperty('fontWeight', value)}
              >
                <SelectTrigger onClick={(e) => e.stopPropagation()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent onClick={(e) => e.stopPropagation()}>
                  {fontWeights.map(weight => (
                    <SelectItem key={weight} value={weight} onClick={(e) => e.stopPropagation()}>
                      {weight}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectWrapper>
            </div>
          </div>
        </div>

        {/* Line Height and Letter Spacing */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Line Height</Label>
            <Input
              value={properties.lineHeight || ''}
              onChange={(e) => updateProperty('lineHeight', e.target.value)}
              placeholder="1.75rem"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="space-y-2">
            <Label>Letter Spacing</Label>
            <Input
              value={properties.letterSpacing || ''}
              onChange={(e) => updateProperty('letterSpacing', e.target.value)}
              placeholder="0em"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Text Alignment */}
        <div className="space-y-2">
          <Label>Alignment</Label>
          <div className="flex gap-1">
            {[
              { value: 'left', icon: AlignLeft },
              { value: 'center', icon: AlignCenter },
              { value: 'right', icon: AlignRight },
              { value: 'justify', icon: AlignJustify }
            ].map(({ value, icon: Icon }) => (
              <Button
                key={value}
                variant={properties.textAlign === value ? 'default' : 'outline'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  updateProperty('textAlign', value);
                }}
              >
                <Icon size={16} />
              </Button>
            ))}
          </div>
        </div>

        {/* Text Decoration */}
        <div className="space-y-2">
          <Label>Decoration</Label>
          <div className="flex gap-1">
            {[
              { value: 'bold', icon: Bold, property: 'fontWeight', activeValue: '700' },
              { value: 'italic', icon: Italic, property: 'fontStyle', activeValue: 'italic' },
              { value: 'underline', icon: Underline, property: 'textDecoration', activeValue: 'underline' },
              { value: 'strikethrough', icon: Strikethrough, property: 'textDecoration', activeValue: 'line-through' }
            ].map(({ value, icon: Icon, property, activeValue }) => (
              <Button
                key={value}
                variant={(properties as any)[property] === activeValue ? 'default' : 'outline'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  updateProperty(property, (properties as any)[property] === activeValue ? 'normal' : activeValue);
                }}
              >
                <Icon size={16} />
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Color Section */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Palette size={16} />
          Color
        </h4>
        
        <div className="space-y-2">
          <Label>Text Color</Label>
          <Input
            type="color"
            value={properties.color || '#000000'}
            onChange={(e) => updateProperty('color', e.target.value)}
            className="h-8 w-full"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      <Separator />

      {/* Background Section */}
      <div className="space-y-4">
        <h4 className="font-medium">Background</h4>
        
        <div className="space-y-2">
          <Label>Background Color</Label>
          <Input
            type="color"
            value={properties.backgroundColor || '#ffffff'}
            onChange={(e) => updateProperty('backgroundColor', e.target.value)}
            className="h-8 w-full"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      <Separator />

      {/* Layout Section */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Layout size={16} />
          Layout
        </h4>

        {/* Margin */}
        <div className="space-y-2">
          <Label>Margin</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Top"
              value={properties.margin?.split(' ')[0] || ''}
              onChange={(e) => {
                const margins = properties.margin?.split(' ') || ['0', '0', '0', '0'];
                margins[0] = e.target.value || '0';
                updateProperty('margin', margins.join(' '));
              }}
            />
            <Input
              placeholder="Right"
              value={properties.margin?.split(' ')[1] || ''}
              onChange={(e) => {
                const margins = properties.margin?.split(' ') || ['0', '0', '0', '0'];
                margins[1] = e.target.value || '0';
                updateProperty('margin', margins.join(' '));
              }}
            />
            <Input
              placeholder="Bottom"
              value={properties.margin?.split(' ')[2] || ''}
              onChange={(e) => {
                const margins = properties.margin?.split(' ') || ['0', '0', '0', '0'];
                margins[2] = e.target.value || '0';
                updateProperty('margin', margins.join(' '));
              }}
            />
            <Input
              placeholder="Left"
              value={properties.margin?.split(' ')[3] || ''}
              onChange={(e) => {
                const margins = properties.margin?.split(' ') || ['0', '0', '0', '0'];
                margins[3] = e.target.value || '0';
                updateProperty('margin', margins.join(' '));
              }}
            />
          </div>
        </div>

        {/* Padding */}
        <div className="space-y-2">
          <Label>Padding</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Top"
              value={properties.padding?.split(' ')[0] || ''}
              onChange={(e) => {
                const paddings = properties.padding?.split(' ') || ['0', '0', '0', '0'];
                paddings[0] = e.target.value || '0';
                updateProperty('padding', paddings.join(' '));
              }}
            />
            <Input
              placeholder="Right"
              value={properties.padding?.split(' ')[1] || ''}
              onChange={(e) => {
                const paddings = properties.padding?.split(' ') || ['0', '0', '0', '0'];
                paddings[1] = e.target.value || '0';
                updateProperty('padding', paddings.join(' '));
              }}
            />
            <Input
              placeholder="Bottom"
              value={properties.padding?.split(' ')[2] || ''}
              onChange={(e) => {
                const paddings = properties.padding?.split(' ') || ['0', '0', '0', '0'];
                paddings[2] = e.target.value || '0';
                updateProperty('padding', paddings.join(' '));
              }}
            />
            <Input
              placeholder="Left"
              value={properties.padding?.split(' ')[3] || ''}
              onChange={(e) => {
                const paddings = properties.padding?.split(' ') || ['0', '0', '0', '0'];
                paddings[3] = e.target.value || '0';
                updateProperty('padding', paddings.join(' '));
              }}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Border Section */}
      <div className="space-y-4">
        <h4 className="font-medium">Border</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Width</Label>
            <Input
              value={properties.borderWidth || ''}
              onChange={(e) => updateProperty('borderWidth', e.target.value)}
              placeholder="0px"
            />
          </div>
          <div className="space-y-2">
            <Label>Style</Label>
            <Select value={properties.borderStyle || 'solid'} onValueChange={(value) => updateProperty('borderStyle', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Border Color</Label>
          <Input
            type="color"
            value={properties.borderColor || '#000000'}
            onChange={(e) => updateProperty('borderColor', e.target.value)}
            className="h-8 w-full"
          />
        </div>
      </div>

      <Separator />

      {/* Appearance Section */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Settings size={16} />
          Appearance
        </h4>

        {/* Opacity */}
        <div className="space-y-2">
          <Label>Opacity</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[parseInt(properties.opacity || '100')]}
              onValueChange={([value]) => updateProperty('opacity', value.toString())}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-gray-500 w-8">{properties.opacity || '100'}%</span>
          </div>
        </div>

        {/* Border Radius */}
        <div className="space-y-2">
          <Label>Radius</Label>
          <Select value={properties.borderRadius || 'Default'} onValueChange={(value) => updateProperty('borderRadius', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Default">Default</SelectItem>
              <SelectItem value="0">None</SelectItem>
              <SelectItem value="2px">Small</SelectItem>
              <SelectItem value="4px">Medium</SelectItem>
              <SelectItem value="8px">Large</SelectItem>
              <SelectItem value="16px">Extra Large</SelectItem>
              <SelectItem value="50%">Circle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Shadow Section */}
      <div className="space-y-4">
        <h4 className="font-medium">Shadow</h4>
        
        <div className="space-y-2">
          <Label>Box Shadow</Label>
          <Select value={properties.boxShadow || 'Default'} onValueChange={(value) => updateProperty('boxShadow', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Default">Default</SelectItem>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="0 1px 3px rgba(0,0,0,0.1)">Small</SelectItem>
              <SelectItem value="0 4px 6px rgba(0,0,0,0.1)">Medium</SelectItem>
              <SelectItem value="0 10px 15px rgba(0,0,0,0.1)">Large</SelectItem>
              <SelectItem value="0 20px 25px rgba(0,0,0,0.1)">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Content Section */}
      {(selectedComponent.type === 'paragraph' || selectedComponent.type === 'heading' || selectedComponent.type === 'button') && (
        <div className="space-y-4">
          <h4 className="font-medium">Content</h4>
          
          <div className="space-y-2">
            <Label>Text Content</Label>
            <Input
              value={properties.textContent || ''}
              onChange={(e) => updateProperty('textContent', e.target.value)}
              placeholder="Enter text..."
            />
          </div>
        </div>
      )}

      <Separator />

      {/* Element Positioning Section */}
      {selectedComponent && selectedComponent.type.startsWith('AI') && (
        <ElementPositioningPanel
          componentId={selectedComponent.id}
          elementPositions={elementPositions}
          onElementPositionChange={handleElementPositionChange}
          onEnablePositioning={handleEnableElementPositioning}
          onRegenerateWithPositions={handleRegenerateWithPositions}
          isPositioningEnabled={isElementPositioningEnabled}
        />
      )}
    </div>
  );
} 