import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, LucideProps } from "lucide-react";

interface IconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  size?: number;
  strokeWidth?: number;
  iconProps?: LucideProps;
  className?: string;
}

export function Icon({
  icon: LucideIcon,
  size = 24,
  strokeWidth = 2,
  iconProps,
  className,
  ...props
}: IconProps) {
  return (
    <div className={cn("flex items-center justify-center", className)} {...props}>
      <LucideIcon
        size={size}
        strokeWidth={strokeWidth}
        {...iconProps}
      />
    </div>
  );
} 