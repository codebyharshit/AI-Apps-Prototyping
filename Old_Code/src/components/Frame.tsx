import React, { useState } from "react";
import { FrameData } from "@/lib/utils";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Home, Edit } from "lucide-react";

export interface FrameProps {
  frame: FrameData;
  children?: React.ReactNode;
  onDragEnd?: (event: any) => void;
  onResize: (id: string, size: { width: number; height: number }) => void;
  onSelect: (id: string) => void;
  onSetHomeFrame: (id: string) => void;
  onUpdateProperties: (id: string, properties: Record<string, any>) => void;
  isSelected: boolean;
  isHovered: boolean;
  isHomeFrame: boolean;
}

export const Frame: React.FC<FrameProps> = ({
  frame,
  children,
  onDragEnd,
  onResize,
  onSelect,
  onSetHomeFrame,
  onUpdateProperties,
  isSelected,
  isHovered,
  isHomeFrame,
}) => {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [frameLabel, setFrameLabel] = useState(frame.label || "Frame");

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    isDragging,
  } = useDraggable({
    id: `frame-${frame.id}`,
    data: { type: "frame", id: frame.id, isFrame: true },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `frame-drop-${frame.id}`,
  });

  // Merge refs so the element is both draggable & droppable
  const setRefs = (node: HTMLElement | null) => {
    setDraggableRef(node);
    setDroppableRef(node);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(frame.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsContextMenuOpen(true);
  };

  const handleSetHomeFrame = () => {
    onSetHomeFrame(frame.id);
    setIsContextMenuOpen(false);
  };

  const handleLabelChange = () => {
    // Update frame label in parent component
    const updatedFrame = {
      ...frame,
      label: frameLabel,
    };
    onUpdateProperties(frame.id, updatedFrame);
    setIsEditingLabel(false);
  };

  const handleResize = (event, { size }) => {
    onResize(frame.id, { width: size.width, height: size.height });
  };

  // Only show resize handles when the component is selected
  const resizeHandles = isSelected ? ["se", "s", "e"] : [];

  return (
    <div
      className="fixed"
      style={{
        left: `${frame.position.x}px`,
        top: `${frame.position.y}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-30px", // Move it above the component
          left: "0",
          display: "flex",
          alignItems: "center",
        }}
      >
        {isEditingLabel ? (
          <div className="flex items-center space-x-2">
            <input
              value={frameLabel}
              onChange={(e) => setFrameLabel(e.target.value)}
              onBlur={handleLabelChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLabelChange();
              }}
              className="bg-transparent border-none p-0 text-md focus:outline-none focus:ring-0"
              autoFocus
            />
          </div>
        ) : (
          <div
            className="flex items-center cursor-text"
            onClick={() => setIsEditingLabel(true)}
          >
            {frameLabel}
            {isHomeFrame && <Home className="ml-2 text-green-500" size={16} />}
            <Edit className="ml-2 cursor-pointer text-gray-500" size={14} />
          </div>
        )}
      </div>
      <Popover open={isContextMenuOpen} onOpenChange={() => {}}>
        <PopoverTrigger asChild>
          <div>
            <ResizableBox
              width={frame.size.width}
              height={frame.size.height}
              onResizeStop={handleResize}
              resizeHandles={resizeHandles}
              minConstraints={[100, 100]}
            >
              <div
                ref={setRefs}
                {...attributes}
                {...listeners}
                id={frame.id}
                className={`absolute border-2 transition-all duration-200 ${
                  isSelected ? "border-blue-500" : "border-2 border-gray-300"
                } ${
                  isHovered
                    ? "ring-2 ring-blue-400 ring-offset-2 shadow-lg bg-blue-100"
                    : ""
                } ${isOver ? "bg-blue-50" : "bg-white"} rounded-md`}
                style={{
                  width: "100%",
                  height: "100%",
                  opacity: isDragging ? 0.5 : 1,
                  zIndex: 0,
                }}
                onDragEnd={onDragEnd}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
              >
                {children}
              </div>
            </ResizableBox>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-48 p-2"
          onPointerDownOutside={() => setIsContextMenuOpen(false)}
        >
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleSetHomeFrame}
          >
            <Home className="mr-2 h-4 w-4" />
            Set as home frame
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
};
