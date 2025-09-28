"use client";

import React, { useMemo, useState, useEffect } from "react";
import { FrameData, ComponentData } from "@/lib/utils";
import { Map, X, Minimize2, Maximize2 } from "lucide-react";

interface MiniMapProps {
  canvasSize: number;
  frames: FrameData[];
  components: ComponentData[];
  viewportState: {
    zoomLevel: number;
    panOffset: { x: number; y: number };
    isPanning: boolean;
  };
  className?: string;
  activeFrameId?: string | null;
  isCanvasLoading?: boolean;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  canvasSize,
  frames,
  components,
  viewportState,
  className = "",
  activeFrameId,
  isCanvasLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isClient, setIsClient] = useState(false);
  
  // Set client flag when component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Calculate the scale factor for the mini-map
  const miniMapSize = isExpanded ? 200 : 150;
  const scale = miniMapSize / canvasSize;
  
  // Calculate the current viewport rectangle in mini-map coordinates
  const viewportRect = useMemo(() => {
    try {
      // Check if we're on the client side and document is available
      if (!isClient || typeof window === 'undefined' || typeof document === 'undefined') {
        return {
          x: miniMapSize / 4,
          y: miniMapSize / 4,
          width: miniMapSize / 2,
          height: miniMapSize / 2,
        };
      }

      // Get the actual canvas container dimensions
      const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement;
      const canvasRect = canvasContainer ? {
        width: canvasContainer.clientWidth / viewportState.zoomLevel,
        height: canvasContainer.clientHeight / viewportState.zoomLevel,
      } : {
        width: window.innerWidth / viewportState.zoomLevel,
        height: window.innerHeight / viewportState.zoomLevel,
      };
      
      // Calculate viewport position relative to canvas center
      const canvasCenterX = canvasSize / 2;
      const canvasCenterY = canvasSize / 2;
      
      // Convert pan offset to mini-map coordinates
      const viewportX = (canvasCenterX + viewportState.panOffset.x) * scale;
      const viewportY = (canvasCenterY + viewportState.panOffset.y) * scale;
      
      // Ensure viewport doesn't go outside mini-map bounds
      const viewportWidth = Math.min(canvasRect.width * scale, miniMapSize);
      const viewportHeight = Math.min(canvasRect.height * scale, miniMapSize);
      
      let x = viewportX - viewportWidth / 2;
      let y = viewportY - viewportHeight / 2;
      
      // Clamp to mini-map boundaries
      x = Math.max(0, Math.min(x, miniMapSize - viewportWidth));
      y = Math.max(0, Math.min(y, miniMapSize - viewportHeight));
      
      return {
        x,
        y,
        width: viewportWidth,
        height: viewportHeight,
      };
    } catch (error) {
      console.warn('MiniMap: Error calculating viewport rect:', error);
      // Fallback to center position
      return {
        x: miniMapSize / 4,
        y: miniMapSize / 4,
        width: miniMapSize / 2,
        height: miniMapSize / 2,
      };
    }
  }, [viewportState, scale, canvasSize, miniMapSize, isClient]);

  // Calculate frame positions in mini-map coordinates with improved positioning
  const frameElements = useMemo(() => {
    return frames.map((frame) => ({
      ...frame,
      x: frame.position.x * scale,
      y: frame.position.y * scale,
      width: frame.size.width * scale,
      height: frame.size.height * scale,
    }));
  }, [frames, scale]);

  // Calculate component positions in mini-map coordinates (for reference)
  const componentElements = useMemo(() => {
    return components.map((component) => ({
      ...component,
      x: component.position.x * scale,
      y: component.position.y * scale,
      width: component.size.width * scale,
      height: component.size.height * scale,
    }));
  }, [components, scale]);

  // Handle window resize to adjust viewport calculations
  useEffect(() => {
    if (!isClient) return;
    
    const handleResize = () => {
      // Force re-render when window resizes
      // This ensures viewport calculations are accurate
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isClient]);

  // Don't show if canvas is loading or not on client
  if (isCanvasLoading || !isClient) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="absolute bottom-32 left-4 z-[9998]">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-lg shadow-xl p-2 hover:bg-white/100 hover:border-gray-300/80 hover:shadow-2xl transition-all duration-200"
          title="Show Canvas Overview"
        >
          <Map className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`absolute bottom-32 left-4 bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-lg shadow-xl p-3 z-[9998] transition-all duration-200 hover:bg-white/100 hover:border-gray-300/80 hover:shadow-2xl minimap-container ${className}`}
      style={{
        width: miniMapSize + 24,
        height: miniMapSize + 24,
        maxWidth: '100vw',
        maxHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Mini-map header with controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Map className="h-3 w-3 text-gray-500" />
          <h3 className="text-xs font-medium text-gray-700">Canvas Overview</h3>
        </div>
        <div className="flex items-center space-x-1">
          <div className="text-xs text-gray-500 mr-2">
            {Math.round(viewportState.zoomLevel * 100)}%
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={isExpanded ? "Minimize" : "Expand"}
          >
            {isExpanded ? (
              <Minimize2 className="h-3 w-3 text-gray-500" />
            ) : (
              <Maximize2 className="h-3 w-3 text-gray-500" />
            )}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Hide"
          >
            <X className="h-3 w-3 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Mini-map canvas */}
      <div
        className="relative bg-gray-50 border border-gray-200 rounded overflow-hidden minimap-canvas"
        style={{
          width: miniMapSize,
          height: miniMapSize,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        {/* Canvas background grid (subtle) */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: `${20 * scale}px ${20 * scale}px`,
          }}
        />

        {/* Canvas boundary indicator */}
        <div
          className="absolute border border-gray-300 opacity-40"
          style={{
            left: 0,
            top: 0,
            width: miniMapSize,
            height: miniMapSize,
          }}
          title="Canvas Boundary"
        />

        {/* Frames - Improved positioning to prevent overlapping */}
        {frameElements.map((frame, index) => {
          // Adjust frame positions to prevent overlapping
          const adjustedX = Math.max(0, Math.min(frame.x, miniMapSize - frame.width));
          const adjustedY = Math.max(0, Math.min(frame.y, miniMapSize - frame.height));
          
          return (
            <div
              key={frame.id}
              className={`absolute border-2 minimap-frame ${
                frame.id === activeFrameId
                  ? 'border-green-500 bg-green-200 bg-opacity-50'
                  : 'border-blue-500 bg-blue-100 bg-opacity-30'
              }`}
              style={{
                left: adjustedX,
                top: adjustedY,
                width: Math.min(frame.width, miniMapSize),
                height: Math.min(frame.height, miniMapSize),
                zIndex: frame.id === activeFrameId ? 10 : index + 1, // Active frame on top
              }}
              title={`Frame: ${frame.label || frame.id}${frame.id === activeFrameId ? ' (Active)' : ''}`}
            />
          );
        })}

        {/* Components (small dots for reference) - Improved positioning */}
        {componentElements.map((component, index) => {
          const adjustedX = Math.max(0, Math.min(component.x + component.width / 2, miniMapSize - 2));
          const adjustedY = Math.max(0, Math.min(component.y + component.height / 2, miniMapSize - 2));
          
          return (
            <div
              key={component.id}
              className="absolute w-1 h-1 bg-gray-600 rounded-full minimap-component"
              style={{
                left: adjustedX,
                top: adjustedY,
                zIndex: 20 + index, // Components above frames
              }}
              title={`${component.type}: ${component.id}`}
            />
          );
        })}

        {/* Current viewport rectangle */}
        <div
          className="absolute border-2 border-red-500 bg-red-100 bg-opacity-30 minimap-viewport"
          style={{
            left: viewportRect.x,
            top: viewportRect.y,
            width: viewportRect.width,
            height: viewportRect.height,
            zIndex: 30, // Viewport above everything
          }}
          title="Current Viewport"
        />

        {/* Canvas center indicator */}
        <div
          className="absolute w-1 h-1 bg-green-500 rounded-full"
          style={{
            left: miniMapSize / 2,
            top: miniMapSize / 2,
            zIndex: 25,
          }}
          title="Canvas Center"
        />

        {/* Zoom level indicator */}
        <div
          className="absolute bottom-1 right-1 bg-white bg-opacity-80 px-1 py-0.5 rounded text-xs text-gray-600"
        >
          {Math.round(scale * 1000) / 10}%
        </div>
      </div>

      {/* Mini-map legend (only show when expanded) */}
      {isExpanded && (
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-blue-500 bg-blue-100 bg-opacity-30"></div>
            <span>Frames</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-green-500 bg-green-200 bg-opacity-50"></div>
            <span>Active Frame</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-red-500 bg-red-100 bg-opacity-30"></div>
            <span>Viewport</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <span>Components</span>
          </div>
        </div>
      )}
    </div>
  );
};
