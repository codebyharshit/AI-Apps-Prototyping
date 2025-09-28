import React, { useEffect, useState, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ComponentData, FrameData } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Play,
  WandSparkles,
  Frame as FrameIcon,
  ZoomIn,
  ZoomOut,
  Scan,
} from "lucide-react";
import { useRouter } from "next/navigation";
import CanvasComponent from "@/components/CanvasComponent";
import { useSidebar } from "@/components/ui/sidebar";
import { Frame } from "@/components/Frame";

interface CanvasProps {
  canvasSize: number;
  components: ComponentData[];
  frames: FrameData[];
  onUpdateProperties: (
    id: string,
    properties: Record<string, any>,
    type: "component" | "frame"
  ) => void;
  onSelectItem: (id: string | null, type: "component" | "frame") => void;
  onDeleteItem: (id: string) => void;
  onResizeItem: (id: string, size: { width: number; height: number }) => void;
  onAddFrame: (frame: FrameData) => void;
  onHoverFrame: (id: string | null) => void;
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  selectedFrameId: string | null;
  hoveredFrameId: string | null;
  onSetHomeFrame: (id: string) => void;
  homeFrameId: string | null;
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
}

export const Canvas: React.FC<CanvasProps> = ({
  canvasSize,
  components,
  frames,
  onUpdateProperties,
  onSelectItem,
  onDeleteItem,
  onResizeItem,
  onAddFrame,
  onHoverFrame,
  selectedComponentId,
  hoveredComponentId,
  selectedFrameId,
  hoveredFrameId,
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
}) => {
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

  const { toggleSidebar, setOpen } = useSidebar();

  const handleRunMode = () => {
    setOpen(false);
    localStorage.setItem("prototypeComponents", JSON.stringify(components));
    localStorage.setItem("prototypeFrames", JSON.stringify(frames));
    router.push("/run");
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
      className="relative flex-1 h-full bg-gray-100 overflow-hidden"
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
        className="absolute inset-0 overflow-visible"
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
                  isHovered={component.id === hoveredComponentId}
                  onSelect={(id) => onSelectItem(id, "component")}
                  onResize={onResizeItem}
                  onUpdateProperties={(id, properties) =>
                    onUpdateProperties(id, properties, "component")
                  }
                  onHoverFrame={onHoverFrame}
                />
              ))}
          </Frame>
        ))}

        {/* Render Components belonging to no Frame */}
        {components
          .filter((component) => component.frameId === undefined)
          .map((component) => (
            <CanvasComponent
              key={component.id}
              component={component}
              frames={frames}
              isSelected={component.id === selectedComponentId}
              isHovered={component.id === hoveredComponentId}
              onSelect={(id) => onSelectItem(id, "component")}
              onResize={onResizeItem}
              onUpdateProperties={(id, properties) =>
                onUpdateProperties(id, properties, "component")
              }
              onHoverFrame={onHoverFrame}
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

      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <Button
          className="flex items-center"
          onClick={handleAddFrameClick}
          variant={isDrawingFrame ? "secondary" : "default"}
        >
          <FrameIcon className="mr-2 h-4 w-4" />
          Add Frame
        </Button>
        <Button className="flex items-center" onClick={toggleSidebar}>
          <WandSparkles className="mr-2 h-4 w-4" />
          AI Configuration
        </Button>
        <Button className="flex items-center" onClick={handleRunMode}>
          <Play className="mr-2 h-4 w-4" />
          Run Prototype
        </Button>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-row space-x-2">
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
    </div>
  );
};
