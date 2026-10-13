import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "cn";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        success: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
        info: "bg-blue-50 text-blue-800 ring-1 ring-blue-200",
        warning: "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
        destructive: "bg-red-50 text-red-800 ring-1 ring-red-200",
        muted: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      data-variant={variant ?? "default"}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge };
