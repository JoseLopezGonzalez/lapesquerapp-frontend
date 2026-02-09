"use client"

import * as React from "react"
import { CalendarIcon, Eraser } from "lucide-react"
import { format, subYears, startOfYear, endOfYear, differenceInCalendarDays, addDays } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useIsMobileSafe } from "@/hooks/use-mobile"

import { cn } from "@/lib/utils"

export function DateRangePicker({ dateRange, onChange }) {
  const [open, setOpen] = React.useState(false)
  const { isMobile } = useIsMobileSafe()

  const displayValue = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
      : format(dateRange.from, "dd/MM/yyyy")
    : "Seleccionar rango"

  const handleClear = () => {
    onChange({ from: undefined, to: undefined })
  }

  const handlePreviousYearPeriod = () => {
    if (dateRange?.from && dateRange?.to) {
      const diff = differenceInCalendarDays(dateRange.to, dateRange.from)
      const newFrom = subYears(dateRange.from, 1)
      const newTo = addDays(newFrom, diff)
      onChange({ from: newFrom, to: newTo })
      setOpen(false)
    }
  }

  const handleLastYear = () => {
    const from = startOfYear(subYears(new Date(), 1))
    const to = endOfYear(subYears(new Date(), 1))
    onChange({ from, to })
    setOpen(false)
  }

  const handleCurrentYear = () => {
    const from = startOfYear(new Date())
    const to = new Date()
    onChange({ from, to })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between text-left font-normal min-w-0",
            !dateRange?.from && "text-muted-foreground"
          )}
        >
          <span className="truncate flex-1 min-w-0 text-left">{displayValue}</span>
          <CalendarIcon className="h-4 w-4 ml-2 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-auto p-0",
          isMobile && "max-w-[calc(100vw-1rem)]"
        )} 
        align={isMobile ? "center" : "start"}
        side="bottom"
        sideOffset={isMobile ? 8 : 4}
      >
        <div className="flex flex-col">
          <div className={cn(
            "overflow-hidden",
            isMobile ? "p-3" : "p-3"
          )}>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                onChange(range)
                if (range?.from && range?.to) setOpen(false)
              }}
              locale={es}
              numberOfMonths={isMobile ? 1 : 2}
            />
          </div>
          <div className={cn(
            "w-full border-t",
            isMobile ? "flex flex-col gap-0 p-2" : "flex items-center justify-between gap-1 flex-wrap p-3"
          )}>
            {isMobile ? (
              <>
                <div className="flex flex-col gap-0">
                  <Button
                    variant="ghost"
                    onClick={handlePreviousYearPeriod}
                    className="w-full justify-start h-11 text-sm font-normal rounded-none first:rounded-t-md hover:bg-accent"
                  >
                    Periodo en año anterior
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleLastYear}
                    className="w-full justify-start h-11 text-sm font-normal rounded-none hover:bg-accent"
                  >
                    Año pasado
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCurrentYear}
                    className="w-full justify-start h-11 text-sm font-normal rounded-none last:rounded-b-md hover:bg-accent"
                  >
                    Año en curso
                  </Button>
                </div>
                <div className="border-t mt-2 pt-2">
                  <Button
                    onClick={handleClear}
                    className="w-full h-11 text-sm font-normal"
                    variant="default"
                  >
                    <Eraser className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousYearPeriod}
                  >
                    Periodo en año anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLastYear}
                  >
                    Año pasado
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCurrentYear}
                  >
                    Año en curso
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={handleClear}
                >
                  <Eraser className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
