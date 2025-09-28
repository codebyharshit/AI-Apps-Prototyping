import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const linkVariants = cva(
  "inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
  {
    variants: {
      variant: {
        default: "text-primary hover:text-primary/80 underline-offset-4 hover:underline",
        button: "bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2",
        destructive: "text-destructive hover:text-destructive/80 underline-offset-4 hover:underline",
      },
      size: {
        default: "text-base",
        sm: "text-sm",
        lg: "text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants> {
  asButton?: boolean;
  target?: string;
  rel?: string;
}

export function Link({
  className,
  variant,
  size,
  asButton,
  children,
  target,
  rel,
  ...props
}: LinkProps) {
  // Set appropriate rel for external links
  const isExternal = target === "_blank" && !rel;
  const relValue = isExternal ? "noopener noreferrer" : rel;

  return (
    <a
      className={cn(
        linkVariants({ variant, size }),
        asButton && "inline-flex items-center justify-center",
        className
      )}
      target={target}
      rel={relValue}
      {...props}
    >
      {children}
    </a>
  );
} 