import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, rows, ...props }, ref) => {
  return (
    (<textarea
      className={cn(
        "flex  w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      rows={rows}
      cols="50"
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }


/* min-h-[60px] */