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
import { ComponentData, FrameData } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { getComponentDefinition } from "@/lib/components-registry";
import { AIConfigurator } from "@/components/AIConfigurator";

export const Editor: React.FC = () => {
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<any>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null
  );
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
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

  // Load components and frames from localStorage only once on mount
  useEffect(() => {
    const savedComponents = localStorage.getItem("prototypeComponents");
    if (savedComponents) {
      try {
        const parsed = JSON.parse(savedComponents);
        setComponents(parsed);
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

    setIsInitialized(true);
  }, []);

  // Save components and frames to localStorage whenever they change, but only after initial load
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("prototypeComponents", JSON.stringify(components));
      localStorage.setItem("prototypeFrames", JSON.stringify(frames));
    }
  }, [components, frames, isInitialized]);

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
      const newId = uuidv4();
      const componentDef = getComponentDefinition(type);
      if (!componentDef) {
        console.error("Component definition not found for type:", type);
        return;
      }

      setComponents((prev) => [
        ...prev,
        {
          id: newId,
          type,
          position: newPos,
          size: {
            height: componentDef.defaultSize.height,
            width: componentDef.defaultSize.width,
          },
          frameId,
        },
      ]);
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
          comp.id === id ? { ...comp, properties } : comp
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

  const handleSelectItem = (id: string | null, type: "component" | "frame") => {
    if (type === "component") {
      setSelectedComponentId(id);
      if (id) setSelectedFrameId(null); // Deselect frame if component is selected
    } else if (type === "frame") {
      setSelectedFrameId(id);
      if (id) setSelectedComponentId(null); // Deselect component if frame is selected
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

  const getNewPanOffsetForZoom = (
    newZoomLevel: number,
    zoomOrigin?: { x: number; y: number }
  ) => {
    if (!canvasOuterRef.current) {
      console.error("Canvas element not found");
      return;
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

  const handleGestureStart = (e: React.TouchEvent) => {
    e.preventDefault();
  };

  const handleGestureChange = (e: React.TouchEvent) => {
    e.preventDefault();
  };

  const handleGestureEnd = (e: React.TouchEvent) => {
    e.preventDefault();
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
          onTouchStart={handleGestureStart}
          onTouchMove={handleGestureChange}
          onTouchEnd={handleGestureEnd}
        >
          <Canvas
            canvasSize={canvasSize}
            components={components}
            frames={frames}
            onUpdateProperties={handleUpdateProperties}
            onSelectItem={handleSelectItem}
            onDeleteItem={handleDeleteItem}
            onResizeItem={handleResizeItem}
            onAddFrame={handleAddFrame}
            onHoverFrame={handleHoverFrame}
            onSetHomeFrame={handleSetHomeFrame}
            selectedComponentId={selectedComponentId}
            hoveredComponentId={hoveredComponentId}
            selectedFrameId={selectedFrameId}
            hoveredFrameId={hoveredFrameId}
            homeFrameId={homeFrameId}
            viewportState={viewportState}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            onResetPanOffest={handleResetPanOffset}
            onWheel={handleWheel}
            onPanStart={handlePanStart}
            onPanEnd={handlePanEnd}
            onPanMove={handlePanMove}
          />
        </div>
        <AIConfigurator
          components={components}
          onHoverComponent={handleHoverComponent}
        />
      </div>
      <DragOverlay>{activeId && renderDragOverlay()}</DragOverlay>
    </DndContext>
  );
};
