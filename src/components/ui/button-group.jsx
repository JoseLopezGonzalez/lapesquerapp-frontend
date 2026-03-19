"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const ButtonGroup = React.forwardRef(function ButtonGroup(
  { orientation = "horizontal", className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(
        "inline-flex overflow-hidden rounded-lg border border-border",
        orientation === "vertical" ? "flex-col" : "flex-row",
        className
      )}
      {...props}
    />
  )
})

export { ButtonGroup }

