"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ResizableSidebarProps {
  children: React.ReactNode;
  side?: "left" | "right";
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  className?: string;
}

export const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  children,
  side = "right",
  minWidth = 320,
  maxWidth = 800,
  defaultWidth = 420,
  className,
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load saved width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem("ai-sidebar-width");
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (parsedWidth >= minWidth && parsedWidth <= maxWidth) {
        setWidth(parsedWidth);
      }
    }
  }, [minWidth, maxWidth]);

  // Save width to localStorage
  useEffect(() => {
    localStorage.setItem("ai-sidebar-width", width.toString());
  }, [width]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = side === "right" 
        ? window.innerWidth - e.clientX 
        : e.clientX;

      const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      setWidth(constrainedWidth);
    },
    [isResizing, side, minWidth, maxWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "relative h-full bg-white border-l border-gray-200 flex flex-col",
        className
      )}
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        className={cn(
          "absolute top-0 w-1 h-full cursor-ew-resize z-50 hover:bg-blue-500 transition-colors",
          "before:absolute before:inset-y-0 before:w-4 before:-translate-x-1/2 before:left-1/2",
          side === "right" ? "-left-0.5" : "-right-0.5",
          isResizing && "bg-blue-500"
        )}
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      >
        {/* Visual resize indicator */}
        <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-gray-300" />
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Resize indicator when resizing */}
      {isResizing && (
        <div className="absolute top-4 left-4 bg-black text-white text-xs px-2 py-1 rounded pointer-events-none z-50">
          {width}px
        </div>
      )}
    </div>
  );
}; 