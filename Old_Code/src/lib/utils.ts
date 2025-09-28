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
