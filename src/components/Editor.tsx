"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  getClientRect,
} from "@dnd-kit/core";
import { ComponentPicker } from "@/components/ComponentPicker";
import { Canvas } from "@/components/Canvas";
import { ComponentData, FrameData, ComponentGroup, calculateNaturalComponentSize, groupUtils } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { getComponentDefinition } from "@/lib/components-registry";
import { AIConfigurator } from "@/components/AIConfigurator";
import { AIComponentGenerator } from "@/components/AIComponentGenerator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { componentSelector } from "@/lib/component-selector";
import { ComponentRequirements } from "@/components/ComponentRequirementsForm";
import { Switch } from "@/components/ui/switch";

// Selection mode interface
interface SelectionMode {
  isActive: boolean;
  type: 'input' | 'output' | 'trigger' | null;
  functionalityId: string | null;
  inputIndex?: number;
}

export const Editor: React.FC = () => {
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<any>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null
  );
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [groups, setGroups] = useState<ComponentGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [homeFrameId, setHomeFrameId] = useState<string | null>(null);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(
    null
  );
  const [hoveredFrameId, setHoveredFrameId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const canvasOuterRef = useRef<HTMLDivElement>(null);
  const [viewportState, setViewportState] = useState({
    zoomLevel: 1,
    panOffset: { x: 0, y: 0 }, // Will be updated after mounting
    isPanning: false,
  });
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [useEnhancedWorkflow, setUseEnhancedWorkflow] = useState(false);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>({
    isActive: false,
    type: null,
    functionalityId: null,
    inputIndex: undefined,
  });
  const [htmlCssComponents, setHtmlCssComponents] = useState<Array<{
    id: string;
    html: string;
    requirements: ComponentRequirements;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    frameId?: string;
  }>>([]);
  
  // Canvas loading state for regeneration feedback
  const [isCanvasLoading, setIsCanvasLoading] = useState(false);
  const [canvasLoadingMessage, setCanvasLoadingMessage] = useState('');
  const [canvasLoadingStep, setCanvasLoadingStep] = useState('');
  
  const canvasSize = 10000;

  const centerCanvas = (canvasSize: number, zoomLevel: number) => {
    if (canvasOuterRef.current) {
      const rect = canvasOuterRef.current.getBoundingClientRect();
      const centerX = (rect.width / zoomLevel - canvasSize) / 2;
      const centerY = (rect.height / zoomLevel - canvasSize) / 2;

      setViewportState((prev) => ({
        ...prev,
        panOffset: { x: centerX, y: centerY },
      }));
    }
  };

  // Calculate center position on mount and when dimensions change
  useEffect(() => {
    centerCanvas(canvasSize, viewportState.zoomLevel);
  }, [canvasOuterRef.current]);

  // Window resize handler to update center position
  useEffect(() => {
    const handleResize = () => {
      centerCanvas(canvasSize, viewportState.zoomLevel);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [viewportState.zoomLevel]);

  // Add event listener for the custom event
  useEffect(() => {
    const handleShowAIGenerator = (event: CustomEvent) => {
      if (event.detail && event.detail.show) {
        setShowAIGenerator(true);
      }
    };

    const handleReloadComponents = (event: CustomEvent) => {
      console.log('🔄 Received reloadComponents event:', event.detail);
      
      // CRITICAL FIX: Use simple reloading like the old version
      const savedComponents = localStorage.getItem("prototypeComponents");
      if (savedComponents) {
        try {
          const parsed = JSON.parse(savedComponents);
          
          // Simple reload - just set the components directly like the old version
          setComponents(parsed);
          console.log('🔄 Reloaded components from localStorage (simple approach)');
          
        } catch (e) {
          console.error("Failed to parse saved components after reload:", e);
        }
      }
    };

    const handleComponentGeneratedEvent = (event: CustomEvent) => {
      console.log('🚀 Received componentGenerated event:', event.detail);
      const { component } = event.detail;
      
      if (component) {
        console.log('🚀 Component received in event handler:', component);
        console.log('🚀 Component position:', component.position);
        console.log('🚀 Component size:', component.size);
        console.log('🚀 Component ID:', component.id);
        console.log('🚀 Component type:', component.type);
        // Use the same handleComponentGenerated function that AI component generation uses
        handleComponentGenerated(component);
        
        // Verify the component was saved by checking localStorage
        setTimeout(() => {
          const savedComponents = localStorage.getItem("prototypeComponents");
          if (savedComponents) {
            const components = JSON.parse(savedComponents);
            const savedComponent = components.find((c: any) => c.id === component.id);
            if (savedComponent) {
              console.log('✅ Component successfully saved to localStorage:', savedComponent.id);
            } else {
              console.error('❌ Component not found in localStorage after saving');
            }
          }
        }, 100);
      } else {
        console.error('❌ No component found in event detail');
      }
    };

    window.addEventListener("showAIComponentGenerator", handleShowAIGenerator as EventListener);
    window.addEventListener("reloadComponents", handleReloadComponents as EventListener);
    window.addEventListener("componentGenerated", handleComponentGeneratedEvent as EventListener);
    
    // Handle deleteComponent event for regeneration workflow
    const handleDeleteComponentEvent = (event: CustomEvent) => {
      console.log('🗑️ EVENT HANDLER: Received deleteComponent event:', event.detail);
      
      // Handle test events
      if (event.detail?.test) {
        console.log('🧪 EVENT HANDLER: Test event received - listener is working!');
        return;
      }
      
      const { componentId } = event.detail;
      
      if (!componentId) {
        console.error('❌ EVENT HANDLER: No componentId in event detail');
        return;
      }
      
      console.log('🗑️ EVENT HANDLER: Attempting to delete component:', componentId);
      
      // Check current state before deletion
      setComponents((prevComponents) => {
        console.log('🗑️ EVENT HANDLER: Current React state has', prevComponents.length, 'components');
        console.log('🗑️ EVENT HANDLER: Component IDs in state:', prevComponents.map(c => ({id: c.id, type: c.type})));
        
        const componentExists = prevComponents.find(comp => comp.id === componentId);
        if (componentExists) {
          console.log('✅ EVENT HANDLER: Target component FOUND in React state:', componentExists.id);
        } else {
          console.log('❌ EVENT HANDLER: Target component NOT FOUND in React state');
          console.log('🔍 EVENT HANDLER: This could be an ID mismatch issue');
        }
        
        // Remove from React state
        const updatedComponents = prevComponents.filter((comp) => comp.id !== componentId);
        
        console.log('🗑️ EVENT HANDLER: After filter - React state will have', updatedComponents.length, 'components');
        console.log('🗑️ EVENT HANDLER: Removed', (prevComponents.length - updatedComponents.length), 'component(s)');
        
        if (prevComponents.length === updatedComponents.length) {
          console.log('⚠️ EVENT HANDLER: WARNING - No components were removed from React state');
          console.log('⚠️ EVENT HANDLER: This indicates ID mismatch between selectedComponent and localStorage');
        }
        
        // Immediately update localStorage with the new state to prevent race conditions
        localStorage.setItem("prototypeComponents", JSON.stringify(updatedComponents));
        console.log('🗑️ EVENT HANDLER: Updated localStorage with', updatedComponents.length, 'components');
        
        // Verify localStorage was actually updated
        const verification = localStorage.getItem("prototypeComponents");
        const verifiedComponents = verification ? JSON.parse(verification) : [];
        console.log('🔍 EVENT HANDLER: localStorage verification - actual count:', verifiedComponents.length);
        
        return updatedComponents;
      });
      
      // Clear selection if this component was selected
      if (selectedComponentId === componentId) {
        setSelectedComponentId(null);
        console.log('🗑️ EVENT HANDLER: Cleared component selection for:', componentId);
      }
    };
    
    window.addEventListener("deleteComponent", handleDeleteComponentEvent as EventListener);

    // Handle canvas loading events for regeneration feedback
    const handleCanvasLoadingEvent = (event: CustomEvent) => {
      console.log('🔄 Canvas loading event received:', event.detail);
      const { isLoading, message, step } = event.detail;
      
      setIsCanvasLoading(isLoading);
      setCanvasLoadingMessage(message || '');
      setCanvasLoadingStep(step || '');
    };
    
    window.addEventListener("showCanvasLoading", handleCanvasLoadingEvent as EventListener);

    // Initialize component selector for direct manipulation
    if (typeof window !== 'undefined' && componentSelector) {
      console.log('🔧 Initializing component selector in Editor');
    }

    return () => {
      window.removeEventListener("showAIComponentGenerator", handleShowAIGenerator as EventListener);
      window.removeEventListener("reloadComponents", handleReloadComponents as EventListener);
      window.removeEventListener("componentGenerated", handleComponentGeneratedEvent as EventListener);
      window.removeEventListener("deleteComponent", handleDeleteComponentEvent as EventListener);
      window.removeEventListener("showCanvasLoading", handleCanvasLoadingEvent as EventListener);
    };
  }, []);

  // Load components and frames from localStorage only once on mount
  useEffect(() => {
    // Clean up incorrect localStorage keys first
    cleanupIncorrectLocalStorageKeys();
    
    const savedComponents = localStorage.getItem("prototypeComponents");
    if (savedComponents) {
      try {
        const parsed = JSON.parse(savedComponents);
        
        // Migration: Add default properties to existing components that don't have them
        const migratedComponents = parsed.map((component: ComponentData) => {
          const needsPropertiesMigration = !component.properties || Object.keys(component.properties).length === 0;
          const needsLayerMigration = component.properties && (component.properties.zIndex === undefined || component.properties.opacity === undefined);
          
          if (needsPropertiesMigration || needsLayerMigration) {
            const getDefaultProperties = (componentType: string): Record<string, any> => {
              const shapeDefaults: Record<string, Record<string, any>> = {
                'Rectangle': { variant: 'filled', color: 'bg-blue-200', borderColor: 'border-blue-300', borderWidth: 1 },
                'Square': { variant: 'filled', color: 'bg-green-200', borderColor: 'border-green-300', borderWidth: 1 },
                'Circle': { variant: 'filled', color: 'bg-purple-200', borderColor: 'border-purple-300', borderWidth: 1 },
                'Triangle': { variant: 'filled', color: 'bg-red-200', borderColor: 'border-red-300', borderWidth: 1 },
                'Diamond': { variant: 'filled', color: 'bg-yellow-200', borderColor: 'border-yellow-300', borderWidth: 1 },
                'Hexagon': { variant: 'filled', color: 'bg-orange-200', borderColor: 'border-orange-300', borderWidth: 1 },
                'Star': { variant: 'filled', color: 'bg-pink-200', borderColor: 'border-pink-300', borderWidth: 1 },
                'Ellipse': { variant: 'filled', color: 'bg-indigo-200', borderColor: 'border-indigo-300', borderWidth: 1 }
              };
              
              // Composite components defaults
              const compositeDefaults: Record<string, Record<string, any>> = {
                'TextBox': { textContent: 'Text Box', backgroundColor: '#f3f4f6', borderColor: '#d1d5db', borderWidth: 1, borderRadius: 8, textColor: '#374151', fontSize: 16, fontWeight: 'normal', textAlign: 'center', padding: 16 },
                'ButtonComponent': { textContent: 'Button', backgroundColor: '#3b82f6', borderColor: '#2563eb', borderWidth: 1, borderRadius: 6, textColor: '#ffffff', fontSize: 14, fontWeight: '500', textAlign: 'center', padding: 12 },
                'CardComponent': { textContent: 'Card Title\n\nCard content goes here.', backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 12, textColor: '#374151', fontSize: 14, fontWeight: 'normal', textAlign: 'left', padding: 20 },
                'LabelComponent': { textContent: 'Label Text', backgroundColor: '#ffffff', borderColor: '#d1d5db', borderWidth: 1, borderRadius: 6, textColor: '#374151', fontSize: 14, fontWeight: '500', textAlign: 'left', padding: 8 },
                'TagComponent': { textContent: 'Tag', backgroundColor: '#f3f4f6', borderColor: '#d1d5db', borderWidth: 1, borderRadius: 20, textColor: '#374151', fontSize: 12, fontWeight: '500', textAlign: 'center', padding: 6 },
                'AlertBox': { textContent: '⚠️ Alert Message\n\nThis is an important message.', backgroundColor: '#fef3c7', borderColor: '#f59e0b', borderWidth: 2, borderRadius: 8, textColor: '#92400e', fontSize: 14, fontWeight: 'normal', textAlign: 'left', padding: 16 },
                'DropdownComponent': { placeholder: 'Select an option...', options: 'Option 1\nOption 2\nOption 3', selectedValue: '', backgroundColor: '#ffffff', borderColor: '#d1d5db', borderWidth: 1, borderRadius: 6, textColor: '#374151', fontSize: 14, fontWeight: 'normal', padding: 12 }
              };
              
              // Universal layer properties for all components
              const baseProperties = {
                zIndex: 1,
                opacity: 1
              };
              
              return {
                ...baseProperties,
                ...(shapeDefaults[componentType] || {}),
                ...(compositeDefaults[componentType] || {})
              };
            };
            
            const defaultProps = getDefaultProperties(component.type);
            console.log(`🔄 Migrating ${component.type} component ${component.id} - adding missing properties`);
            
            return {
              ...component,
              properties: {
                ...(component.properties || {}),
                ...Object.fromEntries(
                  Object.entries(defaultProps).filter(([key]) => 
                    !component.properties || component.properties[key] === undefined
                  )
                )
              }
            };
          }
          
          return component;
        });
        
        // Save migrated components back to localStorage if any changes were made
        const needsMigration = migratedComponents.some((comp: ComponentData, index: number) => 
          JSON.stringify(comp) !== JSON.stringify(parsed[index])
        );
        
        if (needsMigration) {
          console.log("💾 Saving migrated components to localStorage");
          localStorage.setItem("prototypeComponents", JSON.stringify(migratedComponents));
        }
        
        console.log("📦 Loading components from localStorage:", migratedComponents.length);
        setComponents(migratedComponents);
        
      } catch (e) {
        console.error("Failed to parse saved components:", e);
      }
    }

    const savedFrames = localStorage.getItem("prototypeFrames");
    if (savedFrames) {
      try {
        const parsed = JSON.parse(savedFrames);
        setFrames(parsed);
      } catch (e) {
        console.error("Failed to parse saved frames:", e);
      }
    }

    const savedHomeFrameId = localStorage.getItem("homeFrameId");
    if (savedHomeFrameId) {
      setHomeFrameId(savedHomeFrameId);
    }

    const savedHtmlCssComponents = localStorage.getItem("htmlCssComponents");
    if (savedHtmlCssComponents) {
      try {
        const parsedHtmlCssComponents = JSON.parse(savedHtmlCssComponents);
        console.log("📦 Loaded HTML/CSS components from localStorage:", parsedHtmlCssComponents.length);
        setHtmlCssComponents(parsedHtmlCssComponents);
      } catch (e) {
        console.error("Failed to parse saved HTML/CSS components:", e);
      }
    }

    setIsInitialized(true);
  }, []);

  // Save components and frames to localStorage whenever they change, but only after initial load
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("prototypeComponents", JSON.stringify(components));
      localStorage.setItem("prototypeFrames", JSON.stringify(frames));
      localStorage.setItem("htmlCssComponents", JSON.stringify(htmlCssComponents));
    }
  }, [components, frames, htmlCssComponents, isInitialized]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
    setActiveData(event.active.data.current);
    // Deselect component when starting to drag
    setSelectedComponentId(null);
    setSelectedFrameId(null);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    // Optional: You can add logic here if needed during the drag
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeData = active.data.current;

    setActiveId(null);
    setActiveData(null);

    if (!activeData) return;

    // Get canvas boundaries
    if (!canvasOuterRef.current) {
      console.error("Canvas element not found");
      return;
    }
    const canvasRect = canvasOuterRef.current.getBoundingClientRect();

    // Function to calculate drop position
    const getDropPosition = (containerRect: DOMRect) => {
      if (!active.rect.current.translated) {
        // Fallback: if translated is null, return a default position
        return { x: 0, y: 0 };
      }
      const absoluteX = active.rect.current.translated.left;
      const absoluteY = active.rect.current.translated.top;

      // Calculate position relative to canvas, accounting for zoom and pan
      const canvasRelativeX =
        (absoluteX - containerRect.left) / viewportState.zoomLevel -
        viewportState.panOffset.x;
      const canvasRelativeY =
        (absoluteY - containerRect.top) / viewportState.zoomLevel -
        viewportState.panOffset.y;

      return {
        x: Math.max(
          0,
          Math.min(
            canvasRelativeX,
            canvasSize - active.rect.current.translated.width
          )
        ),
        y: Math.max(
          0,
          Math.min(
            canvasRelativeY,
            canvasSize - active.rect.current.translated.height
          )
        ),
      };
    };

    // Function to update component position
    const updateComponentPosition = (
      componentId: string,
      newPos: { x: number; y: number },
      frameId?: string
    ) => {
      setComponents((prev) =>
        prev.map((comp) =>
          comp.id === componentId
            ? { ...comp, position: newPos, frameId }
            : comp
        )
      );
    };

    // Function to add a new component
    const addNewComponent = (
      type: string,
      newPos: { x: number; y: number },
      frameId?: string
    ) => {
      let newId = uuidv4();
      if (!newId || typeof newId !== "string" || !newId.trim()) {
        // Fallback in case uuidv4 fails
        newId = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      const componentDef = getComponentDefinition(type);
      if (!componentDef) {
        console.error("Component definition not found for type:", type);
        return;
      }

      // Get default properties for the component type
      const getDefaultProperties = (componentType: string): Record<string, any> => {
        const shapeDefaults: Record<string, Record<string, any>> = {
          'Rectangle': {
            variant: 'filled',
            color: 'bg-blue-200',
            borderColor: 'border-blue-300',
            borderWidth: 1,
            zIndex: 1,
            opacity: 1
          },
          'Square': {
            variant: 'filled',
            color: 'bg-green-200',
            borderColor: 'border-green-300',
            borderWidth: 1,
            zIndex: 1,
            opacity: 1
          },
          'Circle': {
            variant: 'filled',
            color: 'bg-purple-200',
            borderColor: 'border-purple-300',
            borderWidth: 1,
            zIndex: 1,
            opacity: 1
          },
          'Triangle': {
            variant: 'filled',
            color: 'bg-red-200',
            borderColor: 'border-red-300',
            borderWidth: 1,
            zIndex: 1,
            opacity: 1
          },
          'Diamond': {
            variant: 'filled',
            color: 'bg-yellow-200',
            borderColor: 'border-yellow-300',
            borderWidth: 1,
            zIndex: 1,
            opacity: 1
          },
          'Hexagon': {
            variant: 'filled',
            color: 'bg-orange-200',
            borderColor: 'border-orange-300',
            borderWidth: 1,
            zIndex: 1,
            opacity: 1
          },
          'Star': {
            variant: 'filled',
            color: 'bg-pink-200',
            borderColor: 'border-pink-300',
            borderWidth: 1,
            zIndex: 1,
            opacity: 1
          },
          'Ellipse': {
            variant: 'filled',
            color: 'bg-indigo-200',
            borderColor: 'border-indigo-300',
            borderWidth: 1,
            zIndex: 1,
            opacity: 1
          }
        };
        
        // Composite components defaults
        const compositeDefaults: Record<string, Record<string, any>> = {
          'TextBox': {
            textContent: 'Text Box',
            backgroundColor: '#f3f4f6',
            borderColor: '#d1d5db',
            borderWidth: 1,
            borderRadius: 8,
            textColor: '#374151',
            fontSize: 16,
            fontWeight: 'normal',
            textAlign: 'center',
            padding: 16,
            zIndex: 1,
            opacity: 1
          },
          'ButtonComponent': {
            textContent: 'Button',
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            borderWidth: 1,
            borderRadius: 6,
            textColor: '#ffffff',
            fontSize: 14,
            fontWeight: '500',
            textAlign: 'center',
            padding: 12,
            zIndex: 1,
            opacity: 1
          },
          'CardComponent': {
            textContent: 'Card Title\n\nCard content goes here. You can edit this text and adjust the card size.',
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            borderRadius: 12,
            textColor: '#374151',
            fontSize: 14,
            fontWeight: 'normal',
            textAlign: 'left',
            padding: 20,
            zIndex: 1,
            opacity: 1
          },
          'LabelComponent': {
            textContent: 'Label Text',
            backgroundColor: '#ffffff',
            borderColor: '#d1d5db',
            borderWidth: 1,
            borderRadius: 6,
            textColor: '#374151',
            fontSize: 14,
            fontWeight: '500',
            textAlign: 'left',
            padding: 8,
            zIndex: 1,
            opacity: 1
          },
          'TagComponent': {
            textContent: 'Tag',
            backgroundColor: '#f3f4f6',
            borderColor: '#d1d5db',
            borderWidth: 1,
            borderRadius: 20,
            textColor: '#374151',
            fontSize: 12,
            fontWeight: '500',
            textAlign: 'center',
            padding: 6,
            zIndex: 1,
            opacity: 1
          },
          'AlertBox': {
            textContent: '⚠️ Alert Message\n\nThis is an important message.',
            backgroundColor: '#fef3c7',
            borderColor: '#f59e0b',
            borderWidth: 2,
            borderRadius: 8,
            textColor: '#92400e',
            fontSize: 14,
            fontWeight: 'normal',
            textAlign: 'left',
            padding: 16,
            zIndex: 1,
            opacity: 1
          },
          'DropdownComponent': {
            placeholder: 'Select an option...',
            options: 'Option 1\nOption 2\nOption 3',
            selectedValue: '',
            backgroundColor: '#ffffff',
            borderColor: '#d1d5db',
            borderWidth: 1,
            borderRadius: 6,
            textColor: '#374151',
            fontSize: 14,
            fontWeight: 'normal',
            padding: 12,
            zIndex: 1,
            opacity: 1
          }
        };
        
        // Add universal layer properties to all component types
        const baseProperties = {
          zIndex: 1,
          opacity: 1
        };
        
        return {
          ...baseProperties,
          ...(shapeDefaults[componentType] || {}),
          ...(compositeDefaults[componentType] || {})
        };
      };

      // Default component data
      const newComponent: ComponentData = {
        id: newId,
        type,
        position: newPos,
        size: {
          height: componentDef.defaultSize.height,
          width: componentDef.defaultSize.width,
        },
        frameId,
        properties: getDefaultProperties(type), // ← Each instance gets its own properties
      };

      // Debug log for shape components
      if (type === "Rectangle" || type === "Square" || type === "Circle") {
        console.log(`🎨 Creating new ${type}:`, {
          componentId: newId,
          type: type,
          properties: newComponent.properties,
          defaultProperties: getDefaultProperties(type)
        });
      }

      // Don't add empty properties for AI components - they should be created through AI generation
      // AI components from sidebar should not be created without proper generatedCode

      setComponents((prev) => [...prev, newComponent]);
      setSelectedComponentId(newId);
    };

    // Handle frame movement
    if (activeData.isFrame) {
      const frameId = activeData.id;
      const frame = frames.find((f) => f.id === frameId);
      if (!frame) return;

      const dropPos = getDropPosition(canvasRect);
      const deltaX = dropPos.x - frame.position.x;
      const deltaY = dropPos.y - frame.position.y;

      // Update frame position
      setFrames((prevFrames) =>
        prevFrames.map((frame) =>
          frame.id === frameId ? { ...frame, position: dropPos } : frame
        )
      );

      // Move all components within this frame
      setComponents((prevComponents) =>
        prevComponents.map((comp) =>
          comp.frameId === frameId
            ? {
                ...comp,
                position: {
                  x: comp.position.x + deltaX,
                  y: comp.position.y + deltaY,
                },
              }
            : comp
        )
      );

      return;
    }

    // Handle dropping onto canvas
    if (over?.id === "canvas-drop-area") {
      const dropPos = getDropPosition(canvasRect);
      activeData.isCanvasComponent
        ? updateComponentPosition(activeData.id, dropPos)
        : addNewComponent(activeData.type, dropPos);
      return;
    }

    // Handle dropping onto a frame
    if (over?.id.toString().startsWith("frame-drop-")) {
      const frameId = over.id.toString().replace("frame-drop-", "");
      const frame = frames.find((f) => f.id === frameId);
      if (!frame) return;

      const dropPos = getDropPosition(canvasRect);
      activeData.isCanvasComponent
        ? updateComponentPosition(activeData.id, dropPos, frameId)
        : addNewComponent(activeData.type, dropPos, frameId);
    }
  };

  // Update component properties
  const handleUpdateProperties = (
    id: string,
    properties: Record<string, any>,
    type: "component" | "frame"
  ) => {
    if (type === "component") {
      setComponents((prevComponents) =>
        prevComponents.map((comp) =>
          comp.id === id ? { 
            ...comp, 
            properties: {
              ...comp.properties, // CRITICAL: Keep existing properties (including generatedCode)
              ...properties // Apply new properties
            }
          } : comp
        )
      );
    } else if (type == "frame") {
      setFrames((prevFrames) =>
        prevFrames.map((frame) =>
          frame.id === id ? { ...frame, ...properties } : frame
        )
      );
    }
  };

  const handleHoverComponent = (id: string | null) => {
    setHoveredComponentId(id);
  };

  const handleHoverFrame = (id: string | null) => {
    setHoveredFrameId(id);
  };

  const handleSetHomeFrame = (frameId: string) => {
    setHomeFrameId(frameId);
    localStorage.setItem("homeFrameId", frameId);
  };

  const handleSelectItem = (id: string | null, type: "component" | "frame", ctrlKey = false) => {
    if (type === "component") {
      if (ctrlKey && id) {
        // Multi-selection with Ctrl+Click
        setSelectedComponentIds(prev => {
          if (prev.includes(id)) {
            // Remove from selection
            return prev.filter(componentId => componentId !== id);
          } else {
            // Add to selection
            return [...prev, id];
          }
        });
        // Clear single selection when multi-selecting
        setSelectedComponentId(null);
      } else {
        // Single selection
        setSelectedComponentId(id);
        setSelectedComponentIds(id ? [id] : []);
      }
      if (id) {
        setSelectedFrameId(null); // Deselect frame if component is selected
        setSelectedGroupId(null); // Deselect group if component is selected
      }
    } else if (type === "frame") {
      setSelectedFrameId(id);
      if (id) {
        setSelectedComponentId(null); // Deselect component if frame is selected
        setSelectedComponentIds([]);
        setSelectedGroupId(null);
      }
    }
  };

  const handleDeleteItem = (id: string) => {
    if (selectedComponentId === id) {
      setComponents((prevComponents) =>
        prevComponents.filter((comp) => comp.id !== id)
      );
      setSelectedComponentId(null);
    } else if (selectedFrameId === id) {
      // Delete compoments on the deleted frame
      setComponents((prevComponents) =>
        prevComponents.filter((comp) => comp.frameId !== id)
      );

      setFrames((prevFrames) => prevFrames.filter((frame) => frame.id !== id));
      setSelectedFrameId(null);

      // Handle home frame deletion
      if (homeFrameId === id) {
        if (frames.length > 1) {
          handleSetHomeFrame(frames.filter((frame) => frame.id !== id)[0].id);
        } else {
          setHomeFrameId(null);
          localStorage.removeItem("homeFrameId");
        }
      }
    }
  };

  const handleResizeItem = (
    id: string,
    size: { width: number; height: number }
  ) => {
    if (selectedComponentId === id) {
      setComponents((prevComponents) =>
        prevComponents.map((comp) =>
          comp.id === id ? { ...comp, size } : comp
        )
      );
    } else if (selectedFrameId === id) {
      setFrames((prevFrames) =>
        prevFrames.map((frame) =>
          frame.id === id ? { ...frame, size } : frame
        )
      );
    }
  };

  // Handle adding a frame
  const handleAddFrame = (frame: FrameData) => {
    setFrames((prev) => {
      const newFrames = [...prev, frame];
      // Check if this is the first frame being added
      if (prev.length === 0) {
        handleSetHomeFrame(frame.id);
      }
      return newFrames;
    });
    setSelectedFrameId(frame.id);
  };

  const handlePrototypeGenerated = (data: {
    components: ComponentData[];
    frames: FrameData[];
    aiFunctionalities: any[];
    title: string;
  }) => {
    // Replace current prototype with generated one
    setComponents(data.components);
    setFrames(data.frames);
    
    // Set home frame to first frame if available
    if (data.frames.length > 0) {
      handleSetHomeFrame(data.frames[0].id);
    }
    
    // Save AI functionalities to localStorage
    localStorage.setItem("aiFunctionalities", JSON.stringify(data.aiFunctionalities));
    
    // Clear selections
    setSelectedComponentId(null);
    setSelectedFrameId(null);
  };

  const getNewPanOffsetForZoom = (
    newZoomLevel: number,
    zoomOrigin?: { x: number; y: number }
  ) => {
    if (!canvasOuterRef.current) {
      console.error("Canvas element not found");
      // Fallback: always return the current panOffset so we never return undefined
      return viewportState.panOffset;
    }
    // Both canvasRect and zoomOrigin are in global coordinates
    // If no zoomOrigin is given, zooming is around the center of the canvas
    const canvasRect = canvasOuterRef.current.getBoundingClientRect();
    const xFraction = zoomOrigin
      ? (zoomOrigin.x - canvasRect.left) / canvasRect.width
      : 0.5;
    const yFraction = zoomOrigin
      ? (zoomOrigin.y - canvasRect.top) / canvasRect.height
      : 0.5;

    return {
      x:
        viewportState.panOffset.x -
        (canvasRect.width / viewportState.zoomLevel -
          canvasRect.width / newZoomLevel) *
          xFraction,
      y:
        viewportState.panOffset.y -
        (canvasRect.height / viewportState.zoomLevel -
          canvasRect.height / newZoomLevel) *
          yFraction,
    };
  };

  const handleZoomIn = () => {
    const newZoomLevel = Math.min(3, viewportState.zoomLevel + 0.1);
    const newPanOffset = getNewPanOffsetForZoom(newZoomLevel);

    setViewportState((prev) => ({
      ...prev,
      zoomLevel: newZoomLevel,
      panOffset: newPanOffset,
    }));
  };

  const handleZoomOut = () => {
    const newZoomLevel = Math.max(0.1, viewportState.zoomLevel - 0.1);
    const newPanOffset = getNewPanOffsetForZoom(newZoomLevel);

    setViewportState((prev) => ({
      ...prev,
      zoomLevel: newZoomLevel,
      panOffset: newPanOffset,
    }));
  };

  const handleResetZoom = () => {
    const newPanOffset = getNewPanOffsetForZoom(1);

    setViewportState((prev) => ({
      ...prev,
      zoomLevel: 1,
      panOffset: newPanOffset,
    }));
  };

  const handleResetPanOffset = () => {
    centerCanvas(canvasSize, viewportState.zoomLevel);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Prevent default browser behavior
    e.preventDefault();

    if (e.ctrlKey) {
      // This is a pinch-to-zoom gesture (ctrl key is pressed) for ctrl + mouse wheel
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoomLevel = Math.min(
        Math.max(viewportState.zoomLevel * scaleFactor, 0.1),
        3
      );

      const newPanOffset = getNewPanOffsetForZoom(newZoomLevel, {
        x: e.clientX,
        y: e.clientY,
      });

      setViewportState((prev) => ({
        ...prev,
        zoomLevel: newZoomLevel,
        panOffset: newPanOffset,
      }));
    } else {
      // This is a two-finger pan gesture
      setViewportState((prev) => ({
        ...prev,
        panOffset: {
          x: prev.panOffset.x - e.deltaX / prev.zoomLevel,
          y: prev.panOffset.y - e.deltaY / prev.zoomLevel,
        },
      }));
    }
  };

  // Add touch event handling with proper non-passive listeners
  useEffect(() => {
    const canvasElement = canvasOuterRef.current;
    if (!canvasElement) return;

    // Add non-passive touch event listeners to prevent default touch behavior
    const handleTouchStart = (e: TouchEvent) => {
      // Only prevent default if we actually need to (e.g., for specific gestures)
      if (e.touches.length > 1) {
        // Multi-touch gesture, prevent default
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Only prevent default for multi-touch gestures
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Only prevent default if needed
      if (e.changedTouches.length > 1) {
        e.preventDefault();
      }
    };

    // Add event listeners with passive: false to allow preventDefault
    canvasElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvasElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvasElement.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Cleanup
    return () => {
      canvasElement.removeEventListener('touchstart', handleTouchStart);
      canvasElement.removeEventListener('touchmove', handleTouchMove);
      canvasElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const handlePanStart = () => {
    setViewportState((prev) => ({
      ...prev,
      isPanning: true,
    }));
  };

  const handlePanEnd = () => {
    setViewportState((prev) => ({
      ...prev,
      isPanning: false,
    }));
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (viewportState.isPanning) {
      setViewportState((prev) => ({
        ...prev,
        panOffset: {
          x: prev.panOffset.x + e.movementX / prev.zoomLevel,
          y: prev.panOffset.y + e.movementY / prev.zoomLevel,
        },
      }));
    }
  };
  // Render the drag overlay based on the active component
  const renderDragOverlay = () => {
    if (!activeId) return null;

    let componentType: string | null = null;
    let componentSize: { width: number; height: number } | null = null;
    let componentProperties: Record<string, any> | undefined = {};
    let frameData: FrameData | null = null;

    if (activeData && activeData.isFrame) {
      // This is a frame being moved
      frameData = frames.find((f) => f.id === activeData.id) ?? null;
      if (!frameData) return null;
      componentSize = frameData.size;
    } else if (activeData && activeData.isCanvasComponent) {
      // This is a canvas component being moved
      const componentId = activeData.id;
      const component = components.find((c) => c.id === componentId);
      if (!component) return null;
      componentType = component.type;
      componentSize = component.size;
      componentProperties = component.properties;
    } else {
      // This is a new component from the sidebar
      const match = activeId.match(/^draggable-(.+)$/);
      if (!match) return null;
      componentType = match[1];
    }

    if (frameData) {
      return (
        <div
          className="absolute border-2 border-dashed border-gray-400 rounded-md"
          style={{
            width: componentSize!.width * viewportState.zoomLevel,
            height: componentSize!.height * viewportState.zoomLevel,
          }}
        />
      );
    }

    if (componentType) {
      const componentDef = getComponentDefinition(componentType);
      if (!componentDef) return null;
      if (componentSize == null) {
        componentSize = componentDef.defaultSize;
      }
      return (
        <div
          className="absolute"
          style={{
            width: componentSize.width,
            height: componentSize.height,
            transform: `scale(${viewportState.zoomLevel})`,
          }}
        >
          {componentDef.render({
            className: "relative w-full h-full",
            id: `overlay-${activeId}`,
            isInteractive: false,
            ...(componentProperties || {}),
          })}
        </div>
      );
    }

    return null;
  };

  // REMOVED: Complex frame attachment function - using simple approach like old version

  // Add a new function to handle generated components from AI
  const handleComponentGenerated = (component: ComponentData) => {
    console.log("🚀 Editor: Adding AI-generated component:", component);
    console.log("🚀 Component position:", component.position);
    console.log("🚀 Component size:", component.size);
    console.log("🚀 Component type:", component.type);
    console.log("🚀 Current viewport state:", viewportState);
    
    // CRITICAL FIX: Use simple validation like the old version
    if (!component.position || typeof component.position.x !== 'number' || typeof component.position.y !== 'number') {
      console.warn("⚠️ Component has invalid position, setting default position");
      component.position = { x: 100, y: 100 };
    }
    
    if (!component.size || typeof component.size.width !== 'number' || typeof component.size.height !== 'number') {
      console.warn("⚠️ Component has invalid size, calculating natural size");
      // Calculate natural size based on generated code if available
      if (component.properties?.generatedCode) {
        component.size = calculateNaturalComponentSize(component.properties.generatedCode, component.type);
      } else {
        component.size = { width: 400, height: 300 };
      }
    }
    
    // CRITICAL FIX: Attach component to the last added frame and position it properly within that frame
    let finalComponent = component;
    
    // Only attach to frame if no frameId exists and frames are available
    if (!component.frameId && frames.length > 0) {
      // Find the last added frame (most recent) for attachment
      const lastFrame = frames[frames.length - 1];
      
      console.log(`🎯 Frames available:`, frames.length);
      console.log(`🎯 Last frame:`, lastFrame);
      console.log(`🎯 Attaching component to last frame ${lastFrame.id} and positioning within it`);
      
      // Calculate position within the frame (center the component in the frame)
      const frameCenterX = lastFrame.position.x + (lastFrame.size.width / 2);
      const frameCenterY = lastFrame.position.y + (lastFrame.size.height / 2);
      
      // Position component at the center of the frame
      const componentPosition = {
        x: frameCenterX - (component.size.width / 2),
        y: frameCenterY - (component.size.height / 2)
      };
      
      finalComponent = {
        ...component,
        frameId: lastFrame.id,
        position: componentPosition
      };
      
      console.log(`🎯 Component positioned at frame center:`, componentPosition);
      console.log(`🎯 Frame position:`, lastFrame.position);
      console.log(`🎯 Frame size:`, lastFrame.size);
      console.log(`🎯 Frame center:`, { x: frameCenterX, y: frameCenterY });
    } else if (frames.length === 0) {
      console.log(`⚠️ No frames available, component will be positioned at default location`);
    } else if (component.frameId) {
      console.log(`ℹ️ Component already has frameId: ${component.frameId}`);
    }
    
    // Log the final component state for debugging
    console.log("🚀 Final component state after processing:");
    console.log("🚀 - ID:", finalComponent.id);
    console.log("🚀 - Type:", finalComponent.type);
    console.log("🚀 - Position:", finalComponent.position);
    console.log("🚀 - Size:", finalComponent.size);
    console.log("🚀 - Frame ID:", finalComponent.frameId);
    
    // Add the component to the existing components array
    setComponents((prev) => {
      const newComponents = [...prev, finalComponent];
      console.log("🚀 Updated components count:", newComponents.length);
      console.log("🚀 All components:", newComponents.map(c => ({ id: c.id, type: c.type, position: c.position })));
      
      // CRITICAL: Save to localStorage immediately to ensure persistence
      localStorage.setItem("prototypeComponents", JSON.stringify(newComponents));
      console.log("💾 Saved new component to localStorage immediately");
      
      // CRITICAL: Trigger internal component detection immediately
      if (component.type.startsWith('AI') && component.properties?.generatedCode) {
        // Import and test internal component extraction
        import('@/lib/ai-component-tracker').then(({ extractInternalComponents, generateComponentReport, validateComponentIDs }) => {
          const generatedCode = component.properties?.generatedCode;
          if (generatedCode) {
            const internalComponents = extractInternalComponents(generatedCode, component);
            const validation = validateComponentIDs(generatedCode);
            const report = generateComponentReport(component);
            
            console.log(`🎯 Detected ${internalComponents.length} internal components in new AI component:`, internalComponents);
            console.log(`📊 Component Validation Report:\n${report}`);
            
            if (internalComponents.length === 0) {
              console.warn(`⚠️ No internal components detected in AI component!`);
              console.warn(`🔍 Validation issues:`, validation.issues);
              console.warn(`📄 Generated code (first 500 chars):`, generatedCode.substring(0, 500));
            } else {
              console.log(`✅ Successfully detected internal components! These should now be available for selection.`);
            }
          }
        });
      }
      
      return newComponents;
    });
    
    // Select the component so it's immediately editable
    setSelectedComponentId(component.id);
    console.log("🚀 Selected component ID:", component.id);
    
    // Close the dialog after generating a component
    setShowAIGenerator(false);
    
    // Check if component will be visible in current viewport
    const visibleArea = {
      left: -viewportState.panOffset.x,
      top: -viewportState.panOffset.y,
      right: -viewportState.panOffset.x + (window.innerWidth / viewportState.zoomLevel),
      bottom: -viewportState.panOffset.y + (window.innerHeight / viewportState.zoomLevel)
    };
    
    const componentCenter = {
      x: component.position.x + component.size.width / 2,
      y: component.position.y + component.size.height / 2
    };
    
    const isVisible = componentCenter.x >= visibleArea.left && 
                     componentCenter.x <= visibleArea.right &&
                     componentCenter.y >= visibleArea.top && 
                     componentCenter.y <= visibleArea.bottom;
    
    console.log("🚀 Component visible:", isVisible);
    console.log("🚀 Visible area:", visibleArea);
    console.log("🚀 Component center:", componentCenter);
    
    if (!isVisible) {
      console.warn("⚠️ Component may not be visible in current viewport. Auto-centering on new component...");
      
      // Auto-center the viewport on the new component
      const newPanOffset = {
        x: -(componentCenter.x - (window.innerWidth / viewportState.zoomLevel) / 2),
        y: -(componentCenter.y - (window.innerHeight / viewportState.zoomLevel) / 2)
      };
      
      setViewportState(prev => ({
        ...prev,
        panOffset: newPanOffset
      }));
      
      console.log("🎯 Auto-centered viewport on new component");
    }
  };

  // Listen for regeneration additions from Renderer
  useEffect(() => {
    const onAddGenerated = (e: any) => {
      const comp = e?.detail;
      if (!comp) return;
      try {
        handleComponentGenerated(comp as ComponentData);
      } catch (err) {
        console.error('Failed to add regenerated component from event', err);
      }
    };
    window.addEventListener('ai:addGeneratedComponent', onAddGenerated as any);
    return () => window.removeEventListener('ai:addGeneratedComponent', onAddGenerated as any);
  }, []);

  // Selection mode handlers
  const handleSelectionModeUpdate = (newSelectionMode: SelectionMode) => {
    setSelectionMode(newSelectionMode);
  };

  const handleComponentSelected = (componentId: string) => {
    console.log("🎯 Component selected for AI binding:", componentId);
    // The AIConfigurator will handle the actual binding logic
    // We just need to make sure the selection mode is reset
    setSelectionMode({
      isActive: false,
      type: null,
      functionalityId: null,
      inputIndex: undefined,
    });
  };

  // Handler for opening design properties when right-clicking AI components
  const handleOpenDesignProperties = (componentId: string) => {
    console.log("🎨 Opening design properties for AI component:", componentId);
    
    // Find the component to get its type
    const component = components.find(c => c.id === componentId);
    if (!component) {
      console.error("❌ Component not found:", componentId);
      return;
    }
    
    // Select the component first
    setSelectedComponentId(componentId);
    
    // Open the AI Configuration sidebar and switch to design tab
    // We'll need to communicate with the AIConfigurator to open the design tab
    // For now, we'll use a custom event to trigger this
    const event = new CustomEvent('ai:openDesignProperties', {
      detail: { componentId, componentType: component.type }
    });
    window.dispatchEvent(event);
  };

  const handleAddHtmlCssToCanvas = (html: string, requirements: ComponentRequirements) => {
    // Calculate position within the last frame if frames are available
    let position = { x: 100, y: 100 };
    let frameId: string | undefined;
    
    if (frames.length > 0) {
      // Find the last added frame (most recent) for attachment
      const lastFrame = frames[frames.length - 1];
      
      // Calculate position within the frame (center the component in the frame)
      const frameCenterX = lastFrame.position.x + (lastFrame.size.width / 2);
      const frameCenterY = lastFrame.position.y + (lastFrame.size.height / 2);
      
      // Position component at the center of the frame
      position = {
        x: frameCenterX - (400 / 2), // 400 is the default width
        y: frameCenterY - (300 / 2)  // 300 is the default height
      };
      
      frameId = lastFrame.id;
      
      console.log(`🎯 HTML/CSS component positioned at frame center:`, position);
      console.log(`🎯 Frame ID:`, frameId);
    }
    
    const newHtmlCssComponent = {
      id: uuidv4(),
      html,
      requirements,
      position,
      size: { width: 400, height: 300 },
      frameId
    };
    
    setHtmlCssComponents(prev => [...prev, newHtmlCssComponent]);
    
    // Save to localStorage
    const existingComponents = JSON.parse(localStorage.getItem('htmlCssComponents') || '[]');
    localStorage.setItem('htmlCssComponents', JSON.stringify([...existingComponents, newHtmlCssComponent]));
    
    console.log('✅ HTML/CSS component added to canvas:', newHtmlCssComponent);
    alert('✅ HTML/CSS component added to canvas! You can now edit it directly on the canvas.');
  };

  const handleConvertHtmlCssToReact = async (html: string, componentId: string) => {
    try {
      const component = htmlCssComponents.find(c => c.id === componentId);
      if (!component) return;

      const response = await fetch("/api/ai/html-to-react", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          html,
          componentName: component.requirements.componentType.replace(/\s+/g, "")
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to convert to React");
      }

      // Create new React component with proper frame positioning
      let position = component.position || { x: 100, y: 100 };
      let frameId = component.frameId;
      
      // If no frame is attached, try to attach to the last frame
      if (!frameId && frames.length > 0) {
        const lastFrame = frames[frames.length - 1];
        
        // Calculate position within the frame (center the component in the frame)
        const frameCenterX = lastFrame.position.x + (lastFrame.size.width / 2);
        const frameCenterY = lastFrame.position.y + (lastFrame.size.height / 2);
        
        // Position component at the center of the frame
        position = {
          x: frameCenterX - ((component.size?.width || 400) / 2),
          y: frameCenterY - ((component.size?.height || 300) / 2)
        };
        
        frameId = lastFrame.id;
        
        console.log(`🎯 Converted component positioned at frame center:`, position);
        console.log(`🎯 Frame ID:`, frameId);
      }
      
      const newComponent: ComponentData = {
        id: uuidv4(),
        type: `AI${component.requirements.componentType.replace(/\s+/g, "")}`,
        position,
        size: component.size || { width: 400, height: 300 },
        frameId,
        properties: {
          generatedCode: data.component,
          prompt: component.requirements.idea,
          requirements: component.requirements,
          originalHtml: html
        }
      };
      
      // Add React component to canvas
      setComponents(prev => [...prev, newComponent]);
      
      // Remove HTML/CSS component
      setHtmlCssComponents(prev => prev.filter(c => c.id !== componentId));
      
      // Update localStorage
      const existingComponents = JSON.parse(localStorage.getItem('prototypeComponents') || '[]');
      localStorage.setItem('prototypeComponents', JSON.stringify([...existingComponents, newComponent]));
      
      const existingHtmlCss = JSON.parse(localStorage.getItem('htmlCssComponents') || '[]');
      localStorage.setItem('htmlCssComponents', JSON.stringify(existingHtmlCss.filter((c: any) => c.id !== componentId)));
      
      console.log('✅ HTML/CSS component converted to React:', newComponent);
      alert('✅ Component converted to React and added to canvas!');
    } catch (error) {
      console.error('❌ Error converting HTML/CSS to React:', error);
      alert('❌ Error converting component to React. Please try again.');
    }
  };

  const handleUpdateHtmlCssHtml = (html: string, componentId: string) => {
    setHtmlCssComponents(prev => 
      prev.map(c => 
        c.id === componentId 
          ? { ...c, html } 
          : c
      )
    );
    
    // Update localStorage
    const existingComponents = JSON.parse(localStorage.getItem('htmlCssComponents') || '[]');
    const updatedComponents = existingComponents.map((c: any) => 
      c.id === componentId 
        ? { ...c, html } 
        : c
    );
    localStorage.setItem('htmlCssComponents', JSON.stringify(updatedComponents));
  };

  const handleUpdateHtmlCssPosition = (id: string, position: { x: number; y: number }) => {
    setHtmlCssComponents(prev => 
      prev.map(c => 
        c.id === id 
          ? { ...c, position } 
          : c
      )
    );
    
    // Update localStorage
    const existingComponents = JSON.parse(localStorage.getItem('htmlCssComponents') || '[]');
    const updatedComponents = existingComponents.map((c: any) => 
      c.id === id 
        ? { ...c, position } 
        : c
    );
    localStorage.setItem('htmlCssComponents', JSON.stringify(updatedComponents));
  };

  const handleUpdateHtmlCssSize = (id: string, size: { width: number; height: number }) => {
    setHtmlCssComponents(prev => 
      prev.map(c => 
        c.id === id 
          ? { ...c, size } 
          : c
      )
    );
    
    // Update localStorage
    const existingComponents = JSON.parse(localStorage.getItem('htmlCssComponents') || '[]');
    const updatedComponents = existingComponents.map((c: any) => 
      c.id === id 
        ? { ...c, size } 
        : c
    );
    localStorage.setItem('htmlCssComponents', JSON.stringify(updatedComponents));
  };

  // Function to clean up incorrect localStorage keys
  const cleanupIncorrectLocalStorageKeys = () => {
    const allKeys = Object.keys(localStorage);
    const modifiedCodeKeys = allKeys.filter(key => key.startsWith('modifiedCode_'));

    // Get the current components from localStorage
    const savedComponents = localStorage.getItem("prototypeComponents");
    let currentComponents: any[] = [];
    
    if (savedComponents) {
      try {
        currentComponents = JSON.parse(savedComponents);
      } catch (e) {
        console.error("Failed to parse saved components for cleanup:", e);
      }
    }

    for (const key of modifiedCodeKeys) {
      const componentId = key.replace('modifiedCode_', '');
      const component = currentComponents.find(c => c.id === componentId);

      // Remove keys that don't match any existing component ID
      if (!component) {
        console.warn(`🗑️ Removing incorrect modifiedCode key: ${key} (component with ID ${componentId} not found)`);
        localStorage.removeItem(key);
      }
    }
  };

  // REMOVED: Complex position preservation function - using simple approach like old version

  // REMOVED: Complex validation function - using simple approach like old version

  // REMOVED: Complex frame boundary checking function - using simple approach like old version

  // Group management functions
  const handleCreateGroup = (componentIds?: string[]) => {
    const idsToGroup = componentIds || selectedComponentIds;
    if (idsToGroup.length < 2) return;

    const componentsToGroup = components.filter(c => idsToGroup.includes(c.id));
    
    if (!groupUtils.canGroupComponents(componentsToGroup)) {
      alert("Cannot group these components. Make sure they're in the same frame and not already grouped.");
      return;
    }

    const newGroup = groupUtils.createGroup(componentsToGroup);
    
    // Update components to include group ID
    setComponents(prev => prev.map(component => 
      idsToGroup.includes(component.id) 
        ? { ...component, groupId: newGroup.id }
        : component
    ));
    
    // Add group to groups list
    setGroups(prev => [...prev, newGroup]);
    
    // Select the new group
    setSelectedGroupId(newGroup.id);
    setSelectedComponentId(null);
    setSelectedComponentIds([]);
    
    console.log(`✅ Created group "${newGroup.name}" with ${idsToGroup.length} components`);
  };

  const handleUngroupComponents = (groupId?: string) => {
    const targetGroupId = groupId || selectedGroupId;
    if (!targetGroupId) return;

    const group = groups.find(g => g.id === targetGroupId);
    if (!group) return;

    // Remove group ID from components
    setComponents(prev => prev.map(component => 
      group.componentIds.includes(component.id)
        ? { ...component, groupId: undefined }
        : component
    ));
    
    // Remove group from groups list
    setGroups(prev => prev.filter(g => g.id !== targetGroupId));
    
    // Clear group selection
    setSelectedGroupId(null);
    
    console.log(`✅ Ungrouped "${group.name}"`);
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedComponentId(null);
    setSelectedComponentIds([]);
    setSelectedFrameId(null);
  };

  const handleMoveGroup = (groupId: string, delta: { x: number; y: number }) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    // Move all components in the group
    setComponents(prev => groupUtils.moveGroupComponents(prev, group, delta));
    
    // Update group bounds
    setGroups(prev => prev.map(g => 
      g.id === groupId 
        ? groupUtils.updateGroupBounds(g, components)
        : g
    ));
  };

  // Keyboard shortcuts for grouping
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'g':
          e.preventDefault();
          if (selectedComponentIds.length >= 2) {
            handleCreateGroup();
          }
          break;
        case 'u':
          e.preventDefault();
          if (selectedGroupId) {
            handleUngroupComponents();
          }
          break;
      }
    }
  };

  // Add keyboard event listener
  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentIds, selectedGroupId]);

  return (
    <DndContext
      sensors={sensors}
      measuring={{
        droppable: {
          measure: getClientRect,
        },
      }}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen w-full overflow-hidden">
        <ComponentPicker />
        <div
          ref={canvasOuterRef}
          className="relative flex-1 h-full overflow-hidden"
        >
          <Canvas
            canvasSize={canvasSize}
            components={components}
            frames={frames}
            htmlCssComponents={htmlCssComponents}
            onUpdateProperties={handleUpdateProperties}
            onSelectItem={handleSelectItem}
            onDeleteItem={handleDeleteItem}
            onResizeItem={handleResizeItem}
            onAddFrame={handleAddFrame}
            onHoverFrame={handleHoverFrame}
            onSetHomeFrame={handleSetHomeFrame}
            selectedComponentId={selectedComponentId}
            selectedComponentIds={selectedComponentIds}
            hoveredComponentId={hoveredComponentId}
            selectedFrameId={selectedFrameId}
            hoveredFrameId={hoveredFrameId}
            homeFrameId={homeFrameId}
            groups={groups}
            selectedGroupId={selectedGroupId}
            onCreateGroup={handleCreateGroup}
            onUngroupComponents={handleUngroupComponents}
            onSelectGroup={handleSelectGroup}
            onMoveGroup={handleMoveGroup}
            viewportState={viewportState}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            onResetPanOffest={handleResetPanOffset}
            onWheel={handleWheel}
            onPanStart={handlePanStart}
            onPanEnd={handlePanEnd}
            onPanMove={handlePanMove}
            onPrototypeGenerated={handlePrototypeGenerated}
            selectionMode={selectionMode}
            onComponentSelected={handleComponentSelected}
            onConvertHtmlCssToReact={handleConvertHtmlCssToReact}
            onUpdateHtmlCssHtml={handleUpdateHtmlCssHtml}
            onUpdateHtmlCssPosition={handleUpdateHtmlCssPosition}
            onUpdateHtmlCssSize={handleUpdateHtmlCssSize}
            onOpenDesignProperties={handleOpenDesignProperties}
          />
          
          {/* Canvas Loading Overlay */}
          {isCanvasLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md w-full mx-4">
                <div className="text-center">
                  {/* Spinning Icon */}
                  <div className="mb-4">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
                  </div>
                  
                  {/* Main Message */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {canvasLoadingMessage || 'Processing...'}
                  </h3>
                  
                  {/* Step Details */}
                  {canvasLoadingStep && (
                    <p className="text-sm text-gray-600 mb-4">
                      {canvasLoadingStep}
                    </p>
                  )}
                  
                  {/* Progress Animation */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* User Instruction */}
                  <p className="text-xs text-gray-500 mt-4">
                    Please wait... This may take 30-60 seconds
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <AIConfigurator
          components={components}
          onHoverComponent={handleHoverComponent}
          onComponentGenerated={handleComponentGenerated}
          onUpdateComponentProperties={(id, properties) => handleUpdateProperties(id, properties, "component")}
          onComponentSelection={handleComponentSelected}
          selectionMode={selectionMode}
          onSelectionModeUpdate={handleSelectionModeUpdate}
          canvasRef={canvasOuterRef as unknown as React.RefObject<HTMLElement>}
        />
      </div>
      <DragOverlay>{activeId && renderDragOverlay()}</DragOverlay>
      
      {/* Dialog for AI Component Generator */}
      <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-gray-800">Generate Custom Component</DialogTitle>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-blue-200">
                <span className="text-sm text-gray-700 font-medium">Enhanced Workflow</span>
                <Switch
                  checked={useEnhancedWorkflow}
                  onCheckedChange={(checked) => setUseEnhancedWorkflow(checked)}
                />
              </div>
            </div>
          </DialogHeader>
          <AIComponentGenerator 
            onComponentGenerated={handleComponentGenerated} 
            onAddHtmlCssToCanvas={handleAddHtmlCssToCanvas}
            isEmbedded={true}
            useEnhancedWorkflow={useEnhancedWorkflow}
            onEnhancedWorkflowChange={setUseEnhancedWorkflow}
          />
        </DialogContent>
      </Dialog>
    </DndContext>
  );
};
