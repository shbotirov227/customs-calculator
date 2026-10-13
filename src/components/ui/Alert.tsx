import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "cn";

const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        warning: "border-amber-200 bg-amber-50 text-amber-950",
        destructive: "border-red-200 bg-red-50 text-red-900",
        info: "border-blue-200 bg-blue-50 text-blue-950",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("leading-relaxed", className)}
      {...props}
    />
  );
}

export { Alert, AlertDescription };
