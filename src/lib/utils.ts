import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Interface for component positioning data
export interface ComponentPosition {
  x: number;
  y: number;
}

// Interface for component size in px
export interface ComponentSize {
  width: number;
  height: number;
}

// Interface for component data used in the Canvas
export interface ComponentData {
  id: string;
  type: string;
  position: ComponentPosition;
  size: ComponentSize;
  frameId?: string;
  properties?: Record<string, any>;
  aiConfig?: {
    role?: "input" | "output" | "both" | null;
    promptTemplate?: string;
    outputMapping?: Record<string, string>;
  };
  groupId?: string; // ID of the group this component belongs to
}

// Interface for component groups
export interface ComponentGroup {
  id: string;
  name: string;
  componentIds: string[];
  position: ComponentPosition; // Group's bounding box position
  size: ComponentSize; // Group's bounding box size
  frameId?: string;
  isCollapsed?: boolean; // Whether the group is collapsed/minimized
  properties?: Record<string, any>; // Group-level properties
}

// Interface for frame component
export interface FrameData {
  id: string;
  position: ComponentPosition;
  size: ComponentSize;
  label?: string;
}

// For AI functionality later
export interface AIComponentConfig {
  componentId: string;
  role: "input" | "output" | "both";
  settings: Record<string, any>;
}

/**
 * Applies style overrides to a component's props
 * This function merges style overrides from direct manipulation into component props
 */
export function applyStyleOverrides(props: any, styleOverrides: Record<string, any>): any {
  if (!styleOverrides || Object.keys(styleOverrides).length === 0) {
    return props;
  }

  // Create a new props object with merged styles
  const updatedProps = { ...props };
  
  // If there's already a style prop, merge with it
  if (updatedProps.style) {
    updatedProps.style = {
      ...updatedProps.style,
      ...styleOverrides
    };
  } else {
    // Otherwise, create a new style prop
    updatedProps.style = styleOverrides;
  }

  return updatedProps;
}

/**
 * Applies content changes from direct manipulation to component props
 */
export function applyContentChanges(props: any, contentChanges: Record<string, any>): any {
  if (!contentChanges || Object.keys(contentChanges).length === 0) {
    return props;
  }

  const updatedProps = { ...props };
  
  // Apply text content changes
  if (contentChanges.textContent) {
    // Set both textContent and content for compatibility
    updatedProps.textContent = contentChanges.textContent;
    updatedProps.content = contentChanges.textContent;
    // Also set text for backward compatibility
    updatedProps.text = contentChanges.textContent;
  }
  
  // Apply placeholder changes
  if (contentChanges.placeholder) {
    updatedProps.placeholder = contentChanges.placeholder;
  }

  return updatedProps;
}

/**
 * Calculate the natural size of an AI component based on its generated code
 * This function analyzes the component code to determine appropriate dimensions
 */
export function calculateNaturalComponentSize(
  generatedCode: string, 
  componentType: string
): { width: number; height: number } {
  // Default fallback size
  const defaultSize = { width: 400, height: 300 };
  
  if (!generatedCode) {
    return defaultSize;
  }

  // Analyze the generated code to determine natural size
  const code = generatedCode.toLowerCase();
  
  // Look for specific patterns that indicate component size requirements
  let width = 300; // Base width
  let height = 200; // Base height
  
  // Check for form-related components (usually wider)
  if (code.includes('form') || code.includes('input') || code.includes('textarea')) {
    width = Math.max(width, 400);
    height = Math.max(height, 250);
  }
  
  // Check for card or container components (usually larger)
  if (code.includes('card') || code.includes('container') || code.includes('dashboard')) {
    width = Math.max(width, 500);
    height = Math.max(height, 350);
  }
  
  // Check for simple text/display components (usually smaller)
  if (code.includes('text') && !code.includes('input') && !code.includes('textarea')) {
    width = Math.max(width, 200);
    height = Math.max(height, 100);
  }
  
  // Check for button components (usually compact)
  if (code.includes('button') && !code.includes('form')) {
    width = Math.max(width, 150);
    height = Math.max(height, 50);
  }
  
  // Check for list or table components (usually wider)
  if (code.includes('list') || code.includes('table') || code.includes('grid')) {
    width = Math.max(width, 600);
    height = Math.max(height, 400);
  }
  
  // Check for modal or dialog components (usually larger)
  if (code.includes('modal') || code.includes('dialog') || code.includes('popup')) {
    width = Math.max(width, 500);
    height = Math.max(height, 400);
  }
  
  // Check for navigation components (usually wider, shorter)
  if (code.includes('nav') || code.includes('menu') || code.includes('header')) {
    width = Math.max(width, 600);
    height = Math.max(height, 80);
  }
  
  // Check for sidebar components (usually narrower, taller)
  if (code.includes('sidebar') || code.includes('panel')) {
    width = Math.max(width, 250);
    height = Math.max(height, 500);
  }
  
  // Check for footer components (usually wider, shorter)
  if (code.includes('footer')) {
    width = Math.max(width, 600);
    height = Math.max(height, 100);
  }
  
  // Look for explicit size hints in the code
  const widthMatch = code.match(/width[:\s]*(\d+)/);
  const heightMatch = code.match(/height[:\s]*(\d+)/);
  
  if (widthMatch) {
    width = Math.max(width, parseInt(widthMatch[1]));
  }
  if (heightMatch) {
    height = Math.max(height, parseInt(heightMatch[1]));
  }
  
  // Look for CSS class names that might indicate size
  if (code.includes('large') || code.includes('big') || code.includes('wide')) {
    width = Math.max(width, 500);
    height = Math.max(height, 350);
  }
  
  if (code.includes('small') || code.includes('compact') || code.includes('mini')) {
    width = Math.min(width, 250);
    height = Math.min(height, 150);
  }
  
  // Ensure minimum and maximum reasonable sizes
  width = Math.max(100, Math.min(width, 800));
  height = Math.max(50, Math.min(height, 600));
  
  return { width, height };
}

// Group management utilities
export const groupUtils = {
  // Calculate bounding box for a group of components
  calculateGroupBounds(components: ComponentData[]): { position: ComponentPosition; size: ComponentSize } {
    if (components.length === 0) {
      return { position: { x: 0, y: 0 }, size: { width: 0, height: 0 } };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    components.forEach(component => {
      const { x, y } = component.position;
      const { width, height } = component.size;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    return {
      position: { x: minX, y: minY },
      size: { width: maxX - minX, height: maxY - minY }
    };
  },

  // Create a new group from selected components
  createGroup(components: ComponentData[], name?: string): ComponentGroup {
    const bounds = this.calculateGroupBounds(components);
    const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: groupId,
      name: name || `Group ${groupId.split('-')[1]}`,
      componentIds: components.map(c => c.id),
      position: bounds.position,
      size: bounds.size,
      frameId: components[0]?.frameId, // Use the frame of the first component
      isCollapsed: false,
      properties: {}
    };
  },

  // Update group bounds when components move
  updateGroupBounds(group: ComponentGroup, components: ComponentData[]): ComponentGroup {
    const groupComponents = components.filter(c => group.componentIds.includes(c.id));
    const bounds = this.calculateGroupBounds(groupComponents);
    
    return {
      ...group,
      position: bounds.position,
      size: bounds.size
    };
  },

  // Move all components in a group by a delta
  moveGroupComponents(
    components: ComponentData[], 
    group: ComponentGroup, 
    delta: { x: number; y: number }
  ): ComponentData[] {
    return components.map(component => {
      if (group.componentIds.includes(component.id)) {
        return {
          ...component,
          position: {
            x: component.position.x + delta.x,
            y: component.position.y + delta.y
          }
        };
      }
      return component;
    });
  },

  // Check if components can be grouped (same frame, not already in groups)
  canGroupComponents(components: ComponentData[]): boolean {
    if (components.length < 2) return false;
    
    // All components must be in the same frame (or no frame)
    const frameId = components[0].frameId;
    if (!components.every(c => c.frameId === frameId)) return false;
    
    // No component should already be in a group
    if (components.some(c => c.groupId)) return false;
    
    return true;
  }
};
