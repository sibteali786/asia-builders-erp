"use client";

import * as React from "react";
import { Separator as SeparatorPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

type SeparatorVariant = "solid" | "dotted" | "dashed";

interface SeparatorProps extends React.ComponentProps<
  typeof SeparatorPrimitive.Root
> {
  variant?: SeparatorVariant;
}

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  variant = "solid",
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0",
        // Solid variant uses background color (original behavior)
        variant === "solid" &&
          "bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        // Dotted and dashed variants use border styles
        (variant === "dotted" || variant === "dashed") && [
          "bg-transparent",
          variant === "dotted" && "border-dotted",
          variant === "dashed" && "border-dashed",
          "border-border",
          "data-[orientation=horizontal]:border-t data-[orientation=horizontal]:w-full",
          "data-[orientation=vertical]:border-l data-[orientation=vertical]:h-full",
        ],
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
export type { SeparatorVariant };
