"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

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

export function Combobox({ 
  options, 
  placeholder, 
  searchPlaceholder, 
  notFoundMessage, 
  className, 
  value, 
  onChange,
  loading = false,
  disabled = false,
  onBlur,
  defaultOpen = false,
  onOpenChange: externalOnOpenChange,
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const listRef = React.useRef(null)
  const [searchValue, setSearchValue] = React.useState("")
  const isDisabled = disabled || loading

  // Al cambiar el texto de búsqueda, scroll de la lista a arriba (evita que el resultado quede oculto)
  React.useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0
  }, [searchValue])

  // Intentar encontrar el label del valor actual, incluso durante el loading
  const selectedOption = React.useMemo(() => {
    if (!value) return null
    return (options || []).find((option) => option.value === value)
  }, [options, value])

  // Manejar el cierre del popover para llamar onBlur si está definido
  const handleOpenChange = React.useCallback((newOpen) => {
    setOpen(newOpen)
    if (!newOpen) setSearchValue("")
    // Notificar al componente padre si hay un callback
    if (externalOnOpenChange) {
      externalOnOpenChange(newOpen)
    }
    // Si se está cerrando y hay onBlur, llamarlo
    if (!newOpen && onBlur) {
      setTimeout(() => {
        onBlur()
      }, 0)
    }
  }, [onBlur, externalOnOpenChange])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isDisabled}
          className={cn("justify-between w-full overflow-hidden", className)}
        >
          <div className="w-full truncate text-start text-base md:text-sm">
            {loading && !value ? (
              <span className="text-muted-foreground">Cargando opciones...</span>
            ) : selectedOption ? (
              selectedOption.label
            ) : value ? (
              loading ? (
                <span className="text-muted-foreground">Cargando...</span>
              ) : (
                <span className="text-muted-foreground">{String(value)}</span>
              )
            ) : (
              placeholder
            )}
          </div>

          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[90vw] p-0 z-[9999]">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            disabled={loading}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList
            ref={listRef}
            onWheel={(e) => {
              e.currentTarget.scrollBy({
                top: e.deltaY * 2,
                left: 0,
                behavior: "smooth",
              })
            }}
          >
            {loading ? (
              <CommandEmpty>Cargando opciones...</CommandEmpty>
            ) : (
              <>
                <CommandEmpty>{notFoundMessage}</CommandEmpty>
                <CommandGroup>
                  {(options || []).map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onChange(option.value === value ? "" : option.value)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
