"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { es } from "date-fns/locale"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function formatDate(date, formatStyle = "long") {
  if (!date) return ""

  if (formatStyle === "short") {
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = String(date.getFullYear())
    return `${day}/${month}/${year}`
  }

  return date.toLocaleDateString("es-ES", {
    dateStyle: formatStyle,
  })
}

function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime())
}

function parseShortDate(input) {
  const parts = input.split("/")
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts
    const day = parseInt(dd, 10)
    const month = parseInt(mm, 10) - 1
    const year = parseInt(yyyy, 10)
    return new Date(year, month, day)
  }
  return null
}

export function DatePicker({ date, onChange, formatStyle = "short" }) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState(date)
  const [value, setValue] = React.useState(formatDate(date, formatStyle))

  const handleInputChange = (e) => {
    setValue(e.target.value)
  }

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      let parsed
      if (formatStyle === "short") {
        parsed = parseShortDate(value)
      } else {
        parsed = new Date(value)
      }

      if (isValidDate(parsed)) {
        onChange(parsed)
        setMonth(parsed)
        setValue(formatDate(parsed, formatStyle))
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
    }
  }

  const handleSelect = (newDate) => {
    onChange(newDate)
    setMonth(newDate)
    setValue(formatDate(newDate, formatStyle))
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex gap-2">
        <Input
          id="date"
          value={value}
          placeholder={formatDate(new Date(), formatStyle)}
          className="bg-background pr-10"
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-picker"
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Seleccionar fecha</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              locale={es}
              onSelect={handleSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
