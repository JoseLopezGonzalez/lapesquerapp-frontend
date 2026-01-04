"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

export function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn("h-6 w-11 rounded-full bg-muted", className)} />
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative h-6 w-11 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isDark
          ? "border-sidebar-border bg-sidebar-accent"
          : "border-sidebar-border bg-sidebar-background",
        className
      )}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {/* Inactive icon - Sun (left side) */}
      <Sun
        className={cn(
          "absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 transition-opacity",
          isDark ? "opacity-40 text-sidebar-foreground" : "opacity-0 text-sidebar-foreground"
        )}
      />
      
      {/* Toggle button */}
      <div
        className={cn(
          "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all duration-200 ease-in-out flex items-center justify-center",
          isDark 
            ? "left-5 bg-white" 
            : "left-0.5 bg-sidebar-primary"
        )}
      >
        {/* Active icon inside button */}
        {isDark ? (
          <Moon className="h-2.5 w-2.5 text-sidebar-background" />
        ) : (
          <Sun className="h-2.5 w-2.5 text-sidebar-primary-foreground" />
        )}
      </div>

      {/* Inactive icon - Moon (right side) */}
      <Moon
        className={cn(
          "absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 transition-opacity",
          isDark ? "opacity-0 text-sidebar-foreground" : "opacity-40 text-sidebar-foreground"
        )}
      />
    </button>
  )
}
