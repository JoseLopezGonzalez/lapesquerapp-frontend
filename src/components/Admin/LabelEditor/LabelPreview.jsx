"use client";
import React from "react";
import { cn } from "@/lib/utils";
import LabelRender from "./LabelRender";

const LabelPreview = React.forwardRef(function LabelPreview(
  { label, scale = 1, highlight = false, className, ...props },
  ref
) {
  const { canvas = {} } = label || {};
  const width = canvas.width || 100;
  const height = canvas.height || 100;

  return (
    <div
      ref={ref}
      className={cn("relative flex items-center justify-center", className)}
      style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
    >
      <div
        className={cn(
          "relative bg-white border border-dashed shadow-md",
          highlight && "ring-2 ring-primary"
        )}
        style={{ width, height }}
      >
        <LabelRender label={label} {...props} />
      </div>
    </div>
  );
});

export default LabelPreview;
