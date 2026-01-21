import * as React from "react"
import { Toggle as TogglePrimitive } from "@radix-ui/react-toggle"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:bg-accent hover:text-accent-foreground",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2 text-xs",
        lg: "h-10 px-4",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef(({ className, variant, size, pressed, onPressedChange, ...props }, ref) => {
  return (
    <TogglePrimitive
      ref={ref}
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
      pressed={pressed}
      onPressedChange={onPressedChange}
    />
  )
})
Toggle.displayName = TogglePrimitive.displayName

export { Toggle, toggleVariants }
