import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success:
          "border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-600",
        warning:
          "border-yellow-500/50 text-yellow-700 dark:border-yellow-500 [&>svg]:text-yellow-600",
        info:
          "border-blue-500/50 text-blue-700 dark:border-blue-500 [&>svg]:text-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  icon?: React.ReactNode;
}

function Alert({
  className,
  variant,
  title,
  children,
  icon,
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {icon && icon}
      <div className="flex flex-col gap-1">
        {title && <h5 className="font-medium leading-none tracking-tight">{title}</h5>}
        <div className="text-sm [&_p]:leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export { Alert, alertVariants }; 