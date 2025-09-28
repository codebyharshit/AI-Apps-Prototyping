"use client";

import React, { useState, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { getComponentDefinition } from "@/lib/components-registry";
import { ComponentData, FrameData } from "@/lib/utils";
import { ResizableBox, ResizeCallbackData, ResizeHandle } from "react-resizable";
import "react-resizable/css/styles.css";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { ComponentPropertiesEditor } from "@/components/ComponentPropertiesEditor";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Selection mode interface
interface SelectionMode {
  isActive: boolean;
  type: 'input' | 'output' | 'trigger' | null;
  functionalityId: string | null;
  inputIndex?: number;
}

interface CanvasComponentProps {
  component: ComponentData;
  frames: FrameData[];
  isSelected: boolean;
  isMultiSelected?: boolean;
  isHovered: boolean;
  onSelect: (id: string, ctrlKey?: boolean) => void;
  onResize: (id: string, size: { width: number; height: number }) => void;
  onUpdateProperties: (id: string, properties: Record<string, any>) => void;
  onHoverFrame: (id: string | null) => void;
  onDelete?: (id: string) => void;
  selectionMode?: SelectionMode;
  onComponentSelected?: (componentId: string) => void;
  onOpenDesignProperties?: (componentId: string) => void;
}

interface RenderProps {
  isInteractive: boolean;
  className: string;
  id: string;
  component?: ComponentData;
  [key: string]: any;
}

const CanvasComponent: React.FC<CanvasComponentProps> = ({
  component,
  frames,
  isSelected,
  isMultiSelected = false,
  isHovered,
  onSelect,
  onResize,
  onUpdateProperties,
  onHoverFrame,
  onDelete,
  selectionMode,
  onComponentSelected,
  onOpenDesignProperties,
}) => {
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

  // Add keyboard support for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle delete if this component is selected and onDelete is available
      if (isSelected && onDelete && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        e.stopPropagation();
        onDelete(component.id);
      }
    };

    if (isSelected) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isSelected, onDelete, component.id]);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `canvas-component-${component.id}`,
    data: {
      type: component.type,
      id: component.id,
      isCanvasComponent: true,
    },
  });

  const componentDef = getComponentDefinition(component.type);
  console.log(`🎯 CanvasComponent: Looking for component type "${component.type}"`, {
    found: !!componentDef,
    componentType: component.type,
    isAIComponent: component.type.startsWith("AI"),
    componentId: component.id
  });
  if (!componentDef) {
    console.error(`❌ CanvasComponent: No component definition found for type "${component.type}"`);
    return null;
  }

  const handleResize = (
    event: React.SyntheticEvent, 
    data: ResizeCallbackData
  ) => {
    onResize(component.id, { 
      width: data.size.width, 
      height: data.size.height 
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Handle selection mode
    if (selectionMode?.isActive && onComponentSelected) {
      // Check if this component is selectable for the current selection mode
      if (isSelectableForMode(component, selectionMode.type)) {
        onComponentSelected(component.id);
        return;
      }
    }
    
    // Normal selection behavior
    onSelect(component.id, e.ctrlKey || e.metaKey);
  };

  // Helper function to determine if a component is selectable for the current mode
  const isSelectableForMode = (component: ComponentData, selectionType: string | null): boolean => {
    const componentDef = getComponentDefinition(component.type);
    if (!componentDef) return false;

    switch (selectionType) {
      case 'input':
        return componentDef.category === "Input" ||
               component.type === "Textarea" ||
               component.type === "Input" ||
               component.type === "ImageUpload" ||
               component.type === "DataTable" ||
               component.type === "InsuranceInput" ||
               component.type === "InsuranceInsight" ||
               component.type === "AIInput" ||
               component.type.startsWith("AI");
      case 'output':
        return componentDef.category === "Output" ||
               componentDef.category === "Data Display" ||
               component.type === "TextOutput" ||
               component.type === "DataTable" ||
               component.type === "InsuranceChat" ||
               component.type === "AIOutput" ||
               component.type.startsWith("AI");
      case 'trigger':
        return component.type === "Button" ||
               component.type === "InsuranceSendButton" ||
               component.type.startsWith("AI");
      default:
        return false;
    }
  };

  // Check if component is selectable in current mode
  const isSelectableInCurrentMode = selectionMode?.isActive && 
    isSelectableForMode(component, selectionMode.type);

  // Check if component is highlighted for selection
  const isHighlightedForSelection = isSelectableInCurrentMode;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(component.id);
    
    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    
    // Edit Properties option
    const editOption = document.createElement('div');
    editOption.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm';
    editOption.textContent = 'Edit Properties';
    editOption.onclick = () => {
      if (component.type.startsWith("AI")) {
        if (onOpenDesignProperties) {
          onOpenDesignProperties(component.id);
        }
      } else {
        setIsPropertiesOpen(true);
      }
      if (document.body.contains(contextMenu)) {
        document.body.removeChild(contextMenu);
      }
    };
    
    // Delete option
    const deleteOption = document.createElement('div');
    deleteOption.className = 'px-4 py-2 hover:bg-red-50 cursor-pointer text-sm text-red-600 border-t border-gray-200';
    deleteOption.textContent = '🗑️ Delete Component';
    deleteOption.onclick = () => {
      if (onDelete) {
        onDelete(component.id);
      }
      if (document.body.contains(contextMenu)) {
        document.body.removeChild(contextMenu);
      }
    };
    
    contextMenu.appendChild(editOption);
    if (onDelete) {
      contextMenu.appendChild(deleteOption);
    }
    
    document.body.appendChild(contextMenu);
    
    // Remove context menu when clicking elsewhere
    const removeMenu = (e: MouseEvent) => {
      if (!contextMenu.contains(e.target as Node)) {
        if (document.body.contains(contextMenu)) {
          if (document.body.contains(contextMenu)) {
        document.body.removeChild(contextMenu);
      }
        }
        document.removeEventListener('click', removeMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', removeMenu);
    }, 100);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(component.id);
    }
  };

  // Only show resize handles when the component is selected
  const resizeHandles: ResizeHandle[] = isSelected ? ["se", "s", "e", "ne", "n", "w", "sw", "nw"] : [];

  // Check if this is an AI-generated component
  const isAIComponent = component.type.startsWith("AI");

  // Prepare render props
  const renderProps: RenderProps = {
    isInteractive: false,
    className: "relative w-full h-full",
    id: `canvas-${component.id}`,
    // Ensure properties exists before spreading
    ...(component.properties || {}),
  };

  // Debug log for shape components
  if (component.type === "Rectangle" || component.type === "Square" || component.type === "Circle") {
    console.log(`🎨 ${component.type} component:`, {
      componentId: component.id,
      properties: component.properties,
      renderProps: renderProps,
      color: renderProps.color,
      hasProperties: !!component.properties
    });
  }

  // Pass component object to all components (needed for dynamic sizing)
  renderProps.component = component;
  
  // For AI components, add element positioning props
  if (isAIComponent) {
    renderProps.enableElementPositioning = component.properties?.enableElementPositioning || false;
    renderProps.elementPositions = component.properties?.elementPositions || {};
    renderProps.onElementPositionChange = (elementId: string, position: { x: number; y: number }) => {
      // Update component properties with new element positions
      const updatedProperties = {
        ...component.properties,
        elementPositions: {
          ...(component.properties?.elementPositions || {}),
          [elementId]: position
        }
      };
      onUpdateProperties(component.id, updatedProperties);
    };
  }

  return (
    <div
      className="fixed"
      style={{
        left: `${component.position.x}px`,
        top: `${component.position.y}px`,
        zIndex: isDragging ? 1000 : isSelected ? Math.max(10, (component.properties?.zIndex || 1) + 5) : isHovered ? Math.max(5, (component.properties?.zIndex || 1) + 2) : (component.properties?.zIndex || 1),
        opacity: component.properties?.opacity || 1,
      }}
    >
      <Popover open={isPropertiesOpen} onOpenChange={() => {}}>
        <PopoverTrigger asChild>
          <div>
            <ResizableBox
              width={component.size.width}
              height={component.size.height}
              onResizeStop={handleResize}
              onResize={handleResize} // Also handle during resize for real-time feedback
              minConstraints={[50, 20]} // More reasonable minimum size constraints
              maxConstraints={[1200, 800]} // More reasonable maximum size constraints
              resizeHandles={resizeHandles}
              draggableOpts={{ enableUserSelectHack: false }}
            >
              <div
                ref={setNodeRef}
                className={`transition-all duration-200 relative overflow-hidden ${
                  isSelected ? "ring-2 ring-blue-500" : ""
                } ${
                  isMultiSelected && !isSelected ? "ring-2 ring-purple-500 ring-dashed" : ""
                } ${
                  isHovered
                    ? "ring-2 ring-blue-400 ring-offset-2 shadow-lg"
                    : ""
                } ${
                  isHighlightedForSelection
                    ? "ring-2 ring-green-400 ring-offset-2 shadow-lg cursor-pointer"
                    : ""
                } ${
                  selectionMode?.isActive && !isSelectableInCurrentMode
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                style={{
                  width: "100%",
                  height: "100%",
                  opacity: isDragging ? 0.5 : 1,
                  transition: "all 150ms ease-in-out",
                }}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
              >
                {/* Drag handle area - positioned to not interfere with resize handles */}
                <div
                  {...listeners}
                  {...attributes}
                  className="cursor-move absolute top-0 left-6 right-6 h-6 z-10 bg-transparent hover:bg-blue-100 hover:bg-opacity-30 transition-colors duration-200 flex items-center justify-center"
                  style={{ display: isSelected ? 'block' : 'none' }}
                  title="Drag to move component"
                >
                  <div className="text-xs text-gray-500 font-medium">↕ Drag</div>
                </div>
                {/* Add delete button when component is selected */}
                {isSelected && onDelete && (
                  <div 
                    className="absolute -top-2 -right-2 z-30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="h-8 w-8 p-0 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                      onClick={handleDelete}
                      title="Delete component"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {/* Add overlay div when hovered */}
                {isHovered && (
                  <div
                    className="absolute inset-0 bg-blue-200 opacity-50 pointer-events-none z-10"
                    style={{
                      borderRadius: "inherit",
                    }}
                  />
                )}
                {componentDef.render(renderProps)}
              </div>
            </ResizableBox>
          </div>
        </PopoverTrigger>
        <ComponentPropertiesEditor
          component={component}
          frames={frames}
          onUpdateProperties={onUpdateProperties}
          onClose={() => setIsPropertiesOpen(false)}
          onHoverFrame={onHoverFrame}
        />
      </Popover>
    </div>
  );
};

export default CanvasComponent;
