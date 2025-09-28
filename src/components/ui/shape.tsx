import React from "react";
import { cn } from "@/lib/utils";

type ShapeType = "rectangle" | "circle" | "triangle" | "square" | "diamond" | "hexagon" | "star" | "ellipse";
type ShapeStyle = "filled" | "outline";

interface ShapeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  type?: ShapeType;
  variant?: ShapeStyle;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function Shape({
  type = "rectangle",
  variant = "filled",
  color = "bg-gray-200",
  borderColor = "border-gray-300",
  borderWidth = 1,
  width = "100%",
  height = "100%",
  className,
  style,
  ...props
}: ShapeProps) {
  let shapeClass = "";
  let backgroundClass = "";
  
  // Handle fill vs outline styling
  if (variant === "outline") {
    backgroundClass = "bg-transparent";
  } else {
    // If color is a hex value, don't use it as a class
    backgroundClass = color?.startsWith('#') ? "" : color;
  }
  
  switch (type) {
    case "circle":
      shapeClass = "rounded-full";
      break;
    case "square":
      shapeClass = "rounded-none aspect-square";
      break;
    case "triangle":
      // Triangle using CSS borders
      return (
        <div
          className={cn("relative", className)}
          style={{
            width: typeof width === "number" ? `${width}px` : width,
            height: typeof height === "number" ? `${height}px` : height,
            ...style,
          }}
          {...props}
        >
          <div
            className={cn(
              "w-0 h-0 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
              variant === "filled" 
                ? `border-l-[30px] border-r-[30px] border-b-[50px] border-l-transparent border-r-transparent`
                : `border-l-[30px] border-r-[30px] border-b-[50px] border-l-transparent border-r-transparent`
            )}
            style={{
              borderBottomColor: variant === "filled" 
                ? (color?.startsWith('#') ? color : color?.replace('bg-', '').replace('gray', '#6B7280').replace('red', '#EF4444').replace('blue', '#3B82F6').replace('green', '#10B981').replace('yellow', '#F59E0B').replace('purple', '#8B5CF6').replace('pink', '#EC4899') || '#6B7280')
                : (borderColor?.startsWith('#') ? borderColor : borderColor?.replace('border-', '').replace('gray', '#6B7280').replace('red', '#EF4444').replace('blue', '#3B82F6').replace('green', '#10B981').replace('yellow', '#F59E0B').replace('purple', '#8B5CF6').replace('pink', '#EC4899') || '#6B7280')
            }}
          />
        </div>
      );
    case "diamond":
      shapeClass = "transform rotate-45";
      break;
    case "hexagon":
      // Hexagon using clip-path
      shapeClass = "relative";
      return (
        <div
          className={cn(
            backgroundClass,
            borderColor?.startsWith('#') ? "" : borderColor,
            `border-[${borderWidth}px]`,
            className
          )}
          style={{
            width: typeof width === "number" ? `${width}px` : width,
            height: typeof height === "number" ? `${height}px` : height,
            clipPath: "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
            backgroundColor: color?.startsWith('#') ? color : undefined,
            borderColor: borderColor?.startsWith('#') ? borderColor : undefined,
            ...style,
          }}
          {...props}
        />
      );
    case "star":
      // Star using clip-path
      shapeClass = "relative";
      return (
        <div
          className={cn(
            backgroundClass,
            borderColor?.startsWith('#') ? "" : borderColor,
            `border-[${borderWidth}px]`,
            className
          )}
          style={{
            width: typeof width === "number" ? `${width}px` : width,
            height: typeof height === "number" ? `${height}px` : height,
            clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
            backgroundColor: color?.startsWith('#') ? color : undefined,
            borderColor: borderColor?.startsWith('#') ? borderColor : undefined,
            ...style,
          }}
          {...props}
        />
      );
    case "ellipse":
      shapeClass = "rounded-full";
      // Ellipse is just a circle with different aspect ratio
      break;
    default: // rectangle
      shapeClass = "rounded-md";
  }

  return (
    <div
      className={cn(
        backgroundClass,
        borderColor?.startsWith('#') ? "" : borderColor, // Don't apply hex colors as classes
        `border-[${borderWidth}px]`,
        shapeClass,
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        // Apply hex colors via inline styles
        backgroundColor: color?.startsWith('#') ? color : undefined,
        borderColor: borderColor?.startsWith('#') ? borderColor : undefined,
        ...style,
      }}
      {...props}
    />
  );
} 