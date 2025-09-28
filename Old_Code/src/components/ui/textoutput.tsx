import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface TextOutputProps extends React.HTMLAttributes<HTMLDivElement> {
  placeholder: string;
  content?: string;
  variant?: "default" | "heading" | "subheading" | "caption";
  maxLines?: number;
}

const TextOutput = React.forwardRef<HTMLDivElement, TextOutputProps>(
  (
    {
      className,
      placeholder,
      content,
      variant = "default",
      maxLines,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: "text-base text-gray-900",
      heading: "text-2xl font-bold text-gray-900",
      subheading: "text-lg font-semibold text-gray-800",
      caption: "text-sm text-gray-500",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-full p-3 rounded-md border border-gray-200 bg-white shadow-sm overflow-auto",
          variantClasses[variant],
          className
        )}
        style={
          maxLines
            ? {
                display: "-webkit-box",
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: "vertical",
              }
            : undefined
        }
        {...props}
      >
        {content ? (
          content === "Loading..." ? (
            <div className="space-y-2">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
            </div>
          ) : (
            content
          )
        ) : (
          placeholder
        )}
      </div>
    );
  }
);

TextOutput.displayName = "TextOutput";

export { TextOutput };
