import * as React from "react";

import { cn } from "@/lib/utils";

function InputGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "relative flex h-8 w-full items-center rounded-lg border border-input bg-transparent text-sm transition-colors has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot=input-group-control][aria-invalid=true]]:border-destructive has-[[data-slot=input-group-control][aria-invalid=true]]:ring-3 has-[[data-slot=input-group-control][aria-invalid=true]]:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input-group-control"
      className={cn(
        "h-full w-full min-w-0 rounded-lg bg-transparent px-2.5 py-1 text-base outline-none placeholder:text-muted-foreground md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & {
  align?: "inline-start" | "inline-end";
}) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "flex shrink-0 items-center text-muted-foreground",
        align === "inline-start" ? "pl-2" : "pr-1",
        className,
      )}
      {...props}
    />
  );
}

export { InputGroup, InputGroupAddon, InputGroupInput };
