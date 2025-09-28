"use client";

import React, { useEffect, useState, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ComponentData, FrameData, ComponentGroup } from "@/lib/utils";
import { Button } from "@/components/ui/button";
  import {
    Play,
    Frame as FrameIcon,
    ZoomIn,
    ZoomOut,
    Scan,
  } from "lucide-react";
import { useRouter } from "next/navigation";
import CanvasComponent from "@/components/CanvasComponent";
import { useSidebar } from "@/components/ui/sidebar";
import { Frame } from "@/components/Frame";
// import { PublishDialog } from "@/components/PublishDialog";
// import { PromptToPrototype } from "@/components/PromptToPrototype";
// import { TemplateLibrary } from "@/components/TemplateLibrary";
import { DraggableHtmlCssComponent } from "@/components/DraggableHtmlCssComponent";
import { ComponentRequirements } from "@/components/ComponentRequirementsForm";
import { MiniMap } from "@/components/MiniMap";

// Selection mode interface
interface SelectionMode {
  isActive: boolean;
  type: 'input' | 'output' | 'trigger' | null;
  functionalityId: string | null;
  inputIndex?: number;
}

interface CanvasProps {
  canvasSize: number;
  components: ComponentData[];
  frames: FrameData[];
  htmlCssComponents?: Array<{
    id: string;
    html: string;
    requirements: ComponentRequirements;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  }>;
  onUpdateProperties: (
    id: string,
    properties: Record<string, any>,
    type: "component" | "frame"
  ) => void;
  onSelectItem: (id: string | null, type: "component" | "frame", ctrlKey?: boolean) => void;
  onDeleteItem: (id: string) => void;
  onResizeItem: (id: string, size: { width: number; height: number }) => void;
  onAddFrame: (frame: FrameData) => void;
  onHoverFrame: (id: string | null) => void;
  selectedComponentId: string | null;
  selectedComponentIds?: string[];
  hoveredComponentId: string | null;
  selectedFrameId: string | null;
  hoveredFrameId: string | null;
  groups?: ComponentGroup[];
  selectedGroupId?: string | null;
  onCreateGroup?: (componentIds?: string[]) => void;
  onUngroupComponents?: (groupId?: string) => void;
  onSelectGroup?: (groupId: string) => void;
  onMoveGroup?: (groupId: string, delta: { x: number; y: number }) => void;
  onSetHomeFrame: (id: string) => void;
  homeFrameId: string | null;
  onPrototypeGenerated: (data: {
    components: ComponentData[];
    frames: FrameData[];
    aiFunctionalities: any[];
    title: string;
  }) => void;
  viewportState: {
    zoomLevel: number;
    panOffset: { x: number; y: number };
    isPanning: boolean;
  };
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onResetPanOffest: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onPanStart: () => void;
  onPanEnd: () => void;
  onPanMove: (e: React.MouseEvent) => void;
  selectionMode?: SelectionMode;
  onComponentSelected?: (componentId: string) => void;
  onConvertHtmlCssToReact?: (html: string, componentId: string) => void;
  onUpdateHtmlCssHtml?: (html: string, componentId: string) => void;
  onUpdateHtmlCssPosition?: (id: string, position: { x: number; y: number }) => void;
  onUpdateHtmlCssSize?: (id: string, size: { width: number; height: number }) => void;
  // Add loading state props
  isCanvasLoading?: boolean;
  canvasLoadingMessage?: string;
  canvasLoadingStep?: string;
  // Add callback for opening design properties
  onOpenDesignProperties?: (componentId: string) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  canvasSize,
  components,
  frames,
  htmlCssComponents = [],
  onUpdateProperties,
  onSelectItem,
  onDeleteItem,
  onResizeItem,
  onAddFrame,
  onHoverFrame,
  selectedComponentId,
  selectedComponentIds = [],
  hoveredComponentId,
  selectedFrameId,
  hoveredFrameId,
  groups = [],
  selectedGroupId,
  onCreateGroup,
  onUngroupComponents,
  onSelectGroup,
  onMoveGroup,
  onSetHomeFrame,
  homeFrameId,
  viewportState,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onResetPanOffest,
  onWheel,
  onPanStart,
  onPanEnd,
  onPanMove,
  onPrototypeGenerated,
  selectionMode,
  onComponentSelected,
  onConvertHtmlCssToReact,
  onUpdateHtmlCssHtml,
  onUpdateHtmlCssPosition,
  onUpdateHtmlCssSize,
  // Add loading state props with defaults
  isCanvasLoading = false,
  canvasLoadingMessage = '',
  canvasLoadingStep = '',
  // Add callback for opening design properties
  onOpenDesignProperties,
}) => {
  // Debug: Log components being passed to Canvas
  console.log("🎯 Canvas: Received components:", components.map(c => ({ id: c.id, type: c.type, frameId: c.frameId, position: c.position })));
  console.log("🎯 Canvas: Total components count:", components.length);
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-drop-area",
  });
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [isDrawingFrame, setIsDrawingFrame] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentPoint, setCurrentPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const { setOpen } = useSidebar();

  const handleRunMode = () => {
    setOpen(false);
    localStorage.setItem("prototypeComponents", JSON.stringify(components));
    localStorage.setItem("prototypeFrames", JSON.stringify(frames));
    router.push("/run");
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const aiFunctionalities = JSON.parse(localStorage.getItem("aiFunctionalities") || "[]");
      
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          components,
          frames,
          aiFunctionalities,
          title: "My Prototype" // You could add a title input field
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish prototype');
      }

      const result = await response.json();
      setPublishResult(result.data);
      setShowPublishDialog(true);
    } catch (error) {
      console.error('Error publishing prototype:', error);
      alert('Failed to publish prototype. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Don't deselect if we're drawing a frame
    if (isDrawingFrame) return;

    // Check if the click is directly on the canvas (not on a component)
    if (e.target === e.currentTarget) {
      onSelectItem(null, "component");
      onSelectItem(null, "frame");
    }
  };

  const handleAddFrameClick = () => {
    setIsDrawingFrame(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawingFrame || e.button !== 0) return;

    if (outerRef.current) {
      const rect = outerRef.current.getBoundingClientRect();
      const x =
        (e.clientX - rect.left) / viewportState.zoomLevel -
        viewportState.panOffset.x;
      const y =
        (e.clientY - rect.top) / viewportState.zoomLevel -
        viewportState.panOffset.y;
      setStartPoint({ x, y });
      setCurrentPoint({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingFrame || !startPoint) return;

    if (outerRef.current) {
      const rect = outerRef.current.getBoundingClientRect();
      const x =
        (e.clientX - rect.left) / viewportState.zoomLevel -
        viewportState.panOffset.x;
      const y =
        (e.clientY - rect.top) / viewportState.zoomLevel -
        viewportState.panOffset.y;
      setCurrentPoint({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawingFrame || !startPoint || !currentPoint) return;

    // Calculate frame dimensions
    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);

    // Only create frame if it has meaningful dimensions
    if (width > 50 && height > 50) {
      const newFrame: FrameData = {
        id: `frame-${Date.now()}`,
        position: { x, y },
        size: { width, height },
        label: "Frame",
      };

      onAddFrame(newFrame);
    }

    // Reset drawing state
    setIsDrawingFrame(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDrawingFrame) {
      setIsDrawingFrame(false);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  };

  const handleMouseDownPan = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      onPanStart();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedComponentId && e.key === "Delete") {
        onDeleteItem(selectedComponentId);
      }

      if (selectedFrameId && e.key === "Delete") {
        onDeleteItem(selectedFrameId);
      }

      // Exit drawing mode with Escape key
      if (isDrawingFrame && e.key === "Escape") {
        setIsDrawingFrame(false);
        setStartPoint(null);
        setCurrentPoint(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onDeleteItem, selectedComponentId, selectedFrameId, isDrawingFrame]);

  useEffect(() => {
    const canvasElement = outerRef.current;
    if (!canvasElement) return;

    // Add passive wheel event listener
    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      onWheel(e as any);
    };

    canvasElement.addEventListener("wheel", handleWheelEvent, {
      passive: false,
    });

    return () => {
      canvasElement.removeEventListener("wheel", handleWheelEvent);
    };
  }, [onWheel]);

  // Calculate frame preview dimensions
  const framePreview =
    startPoint && currentPoint
      ? {
          left: Math.min(startPoint.x, currentPoint.x),
          top: Math.min(startPoint.y, currentPoint.y),
          width: Math.abs(currentPoint.x - startPoint.x),
          height: Math.abs(currentPoint.y - startPoint.y),
        }
      : null;

  return (
    <div
      ref={outerRef}
      className={`relative flex-1 h-full bg-gray-100 overflow-hidden ${
        isCanvasLoading ? 'pointer-events-none' : ''
      }`}
      style={{
        cursor: isDrawingFrame
          ? "crosshair"
          : viewportState.isPanning
          ? "grabbing"
          : "grab",
      }}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDownPan}
      onMouseUp={onPanEnd}
      onMouseMove={onPanMove}
    >
      <div
        ref={(node) => {
          setNodeRef(node);
          if (node) {
            canvasRef.current = node;
          }
        }}
        className={`absolute inset-0 overflow-visible ${
          isCanvasLoading ? 'pointer-events-none' : ''
        } ${isOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''}`}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          width: `${canvasSize}px`,
          height: `${canvasSize}px`,
          transform: `scale(${viewportState.zoomLevel}) translate(${viewportState.panOffset.x}px, ${viewportState.panOffset.y}px)`,
          transformOrigin: "0 0",
          background: `
            linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: `${100 * viewportState.zoomLevel}px ${
            100 * viewportState.zoomLevel
          }px`,
          backgroundColor: isOver ? "rgb(239 246 255)" : "transparent", // Equivalent to bg-blue-50
        }}
      >
        {/* Render Frames first */}
        {frames.map((frame) => (
          <Frame
            key={frame.id}
            frame={frame}
            onResize={onResizeItem}
            onSelect={(id) => onSelectItem(id, "frame")}
            onSetHomeFrame={onSetHomeFrame}
            onUpdateProperties={(id, properties) =>
              onUpdateProperties(id, properties, "frame")
            }
            isSelected={frame.id === selectedFrameId}
            isHovered={frame.id === hoveredFrameId}
            isHomeFrame={frame.id === homeFrameId}
            onDelete={onDeleteItem}
          >
            {/* Render Components belonging to this Frame */}
            {components
              .filter((component) => component.frameId === frame.id)
              .map((component) => (
                <CanvasComponent
                  key={component.id}
                  component={component}
                  frames={frames}
                  isSelected={component.id === selectedComponentId}
                  isMultiSelected={selectedComponentIds.includes(component.id)}
                  isHovered={component.id === hoveredComponentId}
                  onSelect={(id, ctrlKey) => onSelectItem(id, "component", ctrlKey)}
                  onResize={onResizeItem}
                  onUpdateProperties={(id, properties) =>
                    onUpdateProperties(id, properties, "component")
                  }
                  onHoverFrame={onHoverFrame}
                  onDelete={onDeleteItem}
                  selectionMode={selectionMode}
                  onComponentSelected={onComponentSelected}
                  onOpenDesignProperties={onOpenDesignProperties}
                />
              ))}
          </Frame>
        ))}

        {/* Render Components belonging to no Frame */}
        {(() => {
          const componentsWithoutFrame = components.filter((component) => component.frameId === undefined);
          console.log("🎯 Canvas: Components without frame:", componentsWithoutFrame.map(c => ({ id: c.id, type: c.type, position: c.position })));
          return componentsWithoutFrame.map((component) => (
            <CanvasComponent
              key={component.id}
              component={component}
              frames={frames}
              isSelected={component.id === selectedComponentId}
              isMultiSelected={selectedComponentIds.includes(component.id)}
              isHovered={component.id === hoveredComponentId}
              onSelect={(id, ctrlKey) => onSelectItem(id, "component", ctrlKey)}
              onResize={onResizeItem}
              onUpdateProperties={(id, properties) =>
                onUpdateProperties(id, properties, "component")
              }
              onHoverFrame={onHoverFrame}
              onDelete={onDeleteItem}
              selectionMode={selectionMode}
              onComponentSelected={onComponentSelected}
              onOpenDesignProperties={onOpenDesignProperties}
            />
          ));
        })()}

        {/* Render HTML/CSS Components */}
        {htmlCssComponents.map((htmlCssComponent) => (
          <DraggableHtmlCssComponent
            key={htmlCssComponent.id}
            component={htmlCssComponent}
            onConvertToReact={(html) => onConvertHtmlCssToReact?.(html, htmlCssComponent.id)}
            onUpdateHtml={(html) => onUpdateHtmlCssHtml?.(html, htmlCssComponent.id)}
            onUpdatePosition={onUpdateHtmlCssPosition || (() => {})}
            onUpdateSize={onUpdateHtmlCssSize || (() => {})}
            viewportState={viewportState}
          />
        ))}

        {/* Frame Preview when drawing */}
        {framePreview && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-100/30"
            style={{
              left: framePreview.left,
              top: framePreview.top,
              width: framePreview.width,
              height: framePreview.height,
            }}
          />
        )}
      </div>

      {/* MiniMap - Canvas Overview */}
      <MiniMap
        canvasSize={canvasSize}
        frames={frames}
        components={components}
        viewportState={viewportState}
        activeFrameId={selectedFrameId}
        isCanvasLoading={isCanvasLoading}
        className={isCanvasLoading ? 'opacity-50 pointer-events-none' : ''}
      />

      {/* Multi-Selection Toolbar */}
      {selectedComponentIds.length >= 2 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 flex items-center space-x-2 z-50">
          <span className="text-sm text-gray-600 font-medium">
            {selectedComponentIds.length} components selected
          </span>
          <div className="w-px h-6 bg-gray-300" />
          <Button
            size="sm"
            onClick={() => onCreateGroup?.(selectedComponentIds)}
            className="flex items-center"
            title="Group selected components (Ctrl+G)"
          >
            <span className="mr-1">📦</span>
            Group
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Clear multi-selection
              selectedComponentIds.forEach(id => onSelectItem(null, "component"));
            }}
            title="Clear selection"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Help tooltip for multi-selection */}
      {selectedComponentIds.length === 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-40">
          💡 Hold Ctrl and click other components to multi-select
        </div>
      )}

      {/* Group Selection Toolbar */}
      {selectedGroupId && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 flex items-center space-x-2 z-50">
          <span className="text-sm text-gray-600 font-medium">
            Group selected
          </span>
          <div className="w-px h-6 bg-gray-300" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUngroupComponents?.(selectedGroupId)}
            className="flex items-center"
          >
            <span className="mr-1">📂</span>
            Ungroup
          </Button>
        </div>
      )}

      <div className={`absolute top-4 right-4 flex items-center space-x-2 ${
        isCanvasLoading ? 'pointer-events-none opacity-50' : ''
      }`}>
        {/* <TemplateLibrary onTemplateSelected={onPrototypeGenerated} /> */}
        {/* <PromptToPrototype onPrototypeGenerated={onPrototypeGenerated} /> */}
        
        <Button
          className="flex items-center"
          onClick={handleAddFrameClick}
          variant={isDrawingFrame ? "secondary" : "default"}
        >
          <FrameIcon className="mr-2 h-4 w-4" />
          Add Frame
        </Button>
        <Button className="flex items-center" onClick={handleRunMode}>
          <Play className="mr-2 h-4 w-4" />
          Run Prototype
        </Button>
        {/* <Button 
          className="flex items-center" 
          onClick={handlePublish}
          disabled={isPublishing || components.length === 0}
          variant="outline"
        >
          <Share2 className="mr-2 h-4 w-4" />
          {isPublishing ? "Publishing..." : "Publish & Share"}
        </Button> */}
      </div>

      <div className={`absolute bottom-4 right-4 flex flex-row space-x-2 ${
        isCanvasLoading ? 'pointer-events-none opacity-50' : ''
      }`}>
        <Button
          className="bg-white shadow-md"
          variant="outline"
          size="icon"
          onClick={onZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          className="bg-white shadow-md"
          variant="outline"
          onClick={onResetZoom}
        >
          {Math.round(viewportState.zoomLevel * 100)} %
        </Button>
        <Button
          className="bg-white shadow-md"
          variant="outline"
          size="icon"
          onClick={onZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          className="bg-white shadow-md"
          variant="outline"
          size="icon"
          onClick={onResetPanOffest}
        >
          <Scan className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Publish Dialog */}
      {/* <PublishDialog
        isOpen={showPublishDialog}
        onClose={() => setShowPublishDialog(false)}
        publishResult={publishResult}
      /> */}

      {/* Loading Overlay */}
      {isCanvasLoading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 max-w-lg mx-4 text-center shadow-2xl border-2 border-blue-200">
            {/* Main Spinner */}
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Loading Message */}
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {canvasLoadingMessage || 'Generating Component...'}
            </h3>
            
            {/* Step Details */}
            {canvasLoadingStep && (
              <div className="mb-6">
                <p className="text-lg text-blue-600 font-medium mb-2">
                  {canvasLoadingStep}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full animate-pulse transition-all duration-1000"></div>
                </div>
              </div>
            )}
            
            {/* Progress Animation */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full" style={{ animationDelay: '0.2s' }}></div>
              <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full" style={{ animationDelay: '0.4s' }}></div>
            </div>
            
            {/* User Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                ⏳ Please wait while AI generates your component
              </p>
              <p className="text-xs text-blue-600">
                This process typically takes 30-60 seconds. Please don't interact with the canvas during generation.
              </p>
            </div>
            
            {/* Estimated Time */}
            <div className="mt-4 text-sm text-gray-500">
              <p>⏱️ Estimated time: 30-60 seconds</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


