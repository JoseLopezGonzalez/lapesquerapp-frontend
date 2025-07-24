"use client"

import { useState, useEffect } from "react"
import { ChevronsUpDown, CircleHelp, Plus } from "lucide-react"
import { Skeleton } from '@/components/ui/skeleton';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function AppSwitcher({ apps, loading }) {
  const { isMobile } = useSidebar()
  const [activeTeam, setActiveTeam] = useState(apps.find((app) => app.current))

  // Sincroniza activeTeam cuando apps cambie
  useEffect(() => {
    setActiveTeam(apps.find((app) => app.current));
  }, [apps]);

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-black">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {loading ? <Skeleton className="h-4 w-32" /> : activeTeam.name}
                </span>
                <span className="truncate text-xs">{activeTeam.description}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-lg" /* min-w-56 */
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Aplicaciones
            </DropdownMenuLabel>
            {apps.map((app, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => setActiveTeam(app)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <app.logo className="size-4 shrink-0" />
                </div>
                
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {loading ? <Skeleton className="h-4 w-32" /> : app.name}
                  </span>
                  <span className="truncate text-xs">{app.description}</span>
                </div>
                {/* <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut> */}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <CircleHelp className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Solicitar más módulos</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
