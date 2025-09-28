import React from "react";
import { cn } from "@/lib/utils";

type GroupDirection = "row" | "column";
type GroupAlignment = "start" | "center" | "end" | "between" | "around" | "evenly";
type GroupSpacing = "none" | "sm" | "md" | "lg";

interface GroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: GroupDirection;
  align?: GroupAlignment;
  justify?: GroupAlignment;
  spacing?: GroupSpacing;
  wrap?: boolean;
  bordered?: boolean;
  children: React.ReactNode;
}

export function Group({
  direction = "row",
  align = "start",
  justify = "start",
  spacing = "md",
  wrap = false,
  bordered = false,
  className,
  children,
  ...props
}: GroupProps) {
  // Convert align and justify values to Tailwind classes
  const getAlignmentClass = (value: GroupAlignment, type: "align" | "justify") => {
    const prefix = type === "align" ? "items" : "justify";
    
    switch (value) {
      case "start": return `${prefix}-start`;
      case "center": return `${prefix}-center`;
      case "end": return `${prefix}-end`;
      case "between": return `${prefix}-between`;
      case "around": return `${prefix}-around`;
      case "evenly": return `${prefix}-evenly`;
      default: return `${prefix}-start`;
    }
  };

  // Convert spacing to Tailwind gap classes
  const getSpacingClass = (value: GroupSpacing) => {
    switch (value) {
      case "none": return "gap-0";
      case "sm": return "gap-2";
      case "md": return "gap-4";
      case "lg": return "gap-6";
      default: return "gap-4";
    }
  };

  return (
    <div
      className={cn(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        getAlignmentClass(align, "align"),
        getAlignmentClass(justify, "justify"),
        getSpacingClass(spacing),
        wrap && "flex-wrap",
        bordered && "border rounded-md p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
} 