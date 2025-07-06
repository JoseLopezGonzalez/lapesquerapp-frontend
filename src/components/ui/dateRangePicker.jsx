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

import { cn } from "@/lib/utils"

export function DateRangePicker({ dateRange, onChange }) {
  const [open, setOpen] = React.useState(false)

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
            "w-full justify-between text-left font-normal",
            !dateRange?.from && "text-muted-foreground"
          )}
        >
          {displayValue}
          <CalendarIcon className="h-4 w-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col gap-2">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={(range) => {
              onChange(range)
              if (range?.from && range?.to) setOpen(false)
            }}
            locale={es}
            numberOfMonths={2}
          />
          <div className="p-3 pt-0 w-full flex items-center justify-between gap-1 flex-wrap">
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
              <Eraser className="h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
