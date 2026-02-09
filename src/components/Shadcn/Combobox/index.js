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
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const isDisabled = disabled || loading

  // Intentar encontrar el label del valor actual, incluso durante el loading
  const selectedOption = React.useMemo(() => {
    if (!value) return null
    return (options || []).find((option) => option.value === value)
  }, [options, value])

  // Manejar el cierre del popover para llamar onBlur si está definido
  const handleOpenChange = React.useCallback((newOpen) => {
    setOpen(newOpen)
    // Si se está cerrando y hay onBlur, llamarlo
    if (!newOpen && onBlur) {
      // Usar setTimeout para asegurar que se ejecute después del cambio de estado
      setTimeout(() => {
        onBlur()
      }, 0)
    }
  }, [onBlur])

  return (
    <Popover open={open} onOpenChange={handleOpenChange} className={className || ""}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isDisabled}
          className=" justify-between w-full overflow-hidden"
        >
          <div className="w-full truncate text-start text-base md:text-sm">
            {loading && !value ? (
              // Solo mostrar "Cargando..." si no hay valor seleccionado
              <span className="text-muted-foreground">Cargando opciones...</span>
            ) : selectedOption ? (
              // Si encontramos la opción, mostrar su label
              selectedOption.label
            ) : value ? (
              // Si hay un valor pero no se encontró en las opciones (puede ser durante el loading),
              // mostrar un mensaje indicando que se está cargando, pero mantener el valor visible
              loading ? (
                <span className="text-muted-foreground">Cargando...</span>
              ) : (
                // Si no está cargando y no se encontró, mostrar el valor como fallback
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
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[90vw] p-0 z-[100]">
        <Command>
          <CommandInput placeholder={searchPlaceholder} disabled={loading} />
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
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
