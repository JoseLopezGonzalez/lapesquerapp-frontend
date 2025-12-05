"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"



export function Combobox({ options, placeholder, searchPlaceholder, notFoundMessage, className, value, onChange }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen} className={className || ""}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className=" justify-between w-full overflow-hidden"
        >
          <div className="w-full  truncate text-start">
            {value
              ? (options || []).find((option) => option.value === value)?.label
              : placeholder}
          </div>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 ">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList
            /* scroll con rueda de raton forzado */
            onWheel={(e) => {
              e.currentTarget.scrollBy({
                top: e.deltaY * 2,
                left: 0,
                behavior: "smooth",
              })
            }}
          >
            <CommandEmpty>{notFoundMessage}</CommandEmpty>
            <CommandGroup>
              {(options || []).map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={(currentValue) => {
                    onChange(option.value === value ? "" : option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
