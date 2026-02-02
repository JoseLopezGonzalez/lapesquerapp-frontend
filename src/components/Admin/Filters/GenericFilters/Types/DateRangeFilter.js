"use client"

import React, { useEffect, useState } from "react"
import { format, parse } from "date-fns"
import { DateRangePicker } from "@/components/ui/dateRangePicker"
import { cn } from "@/lib/utils"

export function DateRangeFilter({ className, value, onChange, label, name }) {
    // Convertir value (strings) a dateRange (Dates) para DateRangePicker
    const [dateRange, setDateRange] = useState(() => {
        if (value?.from && value?.to && value.from !== null && value.to !== null) {
            try {
                const fromDate = parse(value.from, "yyyy-MM-dd", new Date())
                const toDate = parse(value.to, "yyyy-MM-dd", new Date())
                // Validar que las fechas sean válidas
                if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
                    return { from: fromDate, to: toDate }
                }
            } catch (e) {
                // Si hay error al parsear, retornar undefined
            }
        }
        return { from: undefined, to: undefined }
    })

    // Sincronizar cuando cambia el value externo
    useEffect(() => {
        if (value?.from && value?.to && value.from !== null && value.to !== null) {
            try {
                const fromDate = parse(value.from, "yyyy-MM-dd", new Date())
                const toDate = parse(value.to, "yyyy-MM-dd", new Date())
                // Validar que las fechas sean válidas
                if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
                    setDateRange({ from: fromDate, to: toDate })
                    return
                }
            } catch (e) {
                // Si hay error al parsear, continuar
            }
        }
        // Si no hay valores válidos, resetear
        setDateRange({ from: undefined, to: undefined })
    }, [value])

    // Manejar cambios del DateRangePicker y convertir Dates a strings
    const handleDateRangeChange = (range) => {
        setDateRange(range)
        
        const formattedDate = {
            from: range?.from ? format(range.from, "yyyy-MM-dd") : null,
            to: range?.to ? format(range.to, "yyyy-MM-dd") : null,
        }
        
        onChange(formattedDate)
    }

    return (
        <div className="grid grid-cols-2 gap-y-6 gap-x-3">
            <div className="col-span-2">
                <div className="flex w-full flex-col">
                    <label
                        htmlFor={name}
                        className="w-full mb-2 text-xs font-medium text-muted-foreground text-start"
                    >
                        {label}
                    </label>
                    <div className={cn("grid gap-2 w-full", className)}>
                        <DateRangePicker
                            dateRange={dateRange}
                            onChange={handleDateRangeChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
