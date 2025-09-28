import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { getComponentDefinition } from "@/lib/components-registry";
import { ComponentData, FrameData } from "@/lib/utils";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { ComponentPropertiesEditor } from "@/components/ComponentPropertiesEditor";

interface CanvasComponentProps {
  component: ComponentData;
  frames: FrameData[];
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: string) => void;
  onResize: (id: string, size: { width: number; height: number }) => void;
  onUpdateProperties: (id: string, properties: Record<string, any>) => void;
  onHoverFrame: (id: string | null) => void;
}

const CanvasComponent: React.FC<CanvasComponentProps> = ({
  component,
  frames,
  isSelected,
  isHovered,
  onSelect,
  onResize,
  onUpdateProperties,
  onHoverFrame,
}) => {
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `canvas-component-${component.id}`,
    data: {
      type: component.type,
      id: component.id,
      isCanvasComponent: true,
    },
  });

  const componentDef = getComponentDefinition(component.type);
  if (!componentDef) return null;

  const handleResize = (event, { size }) => {
    onResize(component.id, { width: size.width, height: size.height });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(component.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(component.id);
    setIsPropertiesOpen(true);
  };

  // Only show resize handles when the component is selected
  const resizeHandles = isSelected ? ["se"] : [];

  return (
    <div
      className="fixed"
      style={{
        left: `${component.position.x}px`,
        top: `${component.position.y}px`,
        zIndex: isDragging ? 1000 : isSelected ? 10 : isHovered ? 5 : 1,
      }}
    >
      <Popover open={isPropertiesOpen} onOpenChange={() => {}}>
        <PopoverTrigger asChild>
          <div>
            <ResizableBox
              width={component.size.width}
              height={component.size.height}
              onResizeStop={handleResize}
              minConstraints={[10, 10]} // Minimum size constraints
              maxConstraints={[800, 800]} // Maximum size constraints
              resizeHandles={resizeHandles}
            >
              <div
                ref={setNodeRef}
                {...listeners}
                {...attributes}
                className={`cursor-move transition-all duration-200 relative ${
                  isSelected ? "ring-2 ring-blue-500" : ""
                } ${
                  isHovered
                    ? "ring-2 ring-blue-400 ring-offset-2 shadow-lg"
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
                {/* Add overlay div when hovered */}
                {isHovered && (
                  <div
                    className="absolute inset-0 bg-blue-200 opacity-50 pointer-events-none z-10"
                    style={{
                      borderRadius: "inherit",
                    }}
                  />
                )}
                {componentDef.render({
                  isInteractive: false,
                  className: "relative w-full h-full",
                  id: `canvas-${component.id}`,
                  ...(component.properties || {}),
                })}
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
