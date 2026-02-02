"use client"

import React, { useEffect, useState } from "react"
import { format, parse, isValid } from "date-fns"
import { DateRangePicker } from "@/components/ui/dateRangePicker"
import { cn } from "@/lib/utils"

// Función helper para convertir strings a Dates
function parseValueToDateRange(val) {
    // Si no hay value o es null/undefined, retornar undefined
    if (!val || (val.from === null && val.to === null) || (val.from === undefined && val.to === undefined)) {
        return { from: undefined, to: undefined }
    }

    // Intentar parsear las fechas si existen
    let fromDate = undefined
    let toDate = undefined

    if (val.from && val.from !== null && val.from !== '') {
        try {
            const parsed = parse(val.from, "yyyy-MM-dd", new Date())
            if (isValid(parsed)) {
                fromDate = parsed
            }
        } catch (e) {
            // Si hay error al parsear, mantener undefined
        }
    }

    if (val.to && val.to !== null && val.to !== '') {
        try {
            const parsed = parse(val.to, "yyyy-MM-dd", new Date())
            if (isValid(parsed)) {
                toDate = parsed
            }
        } catch (e) {
            // Si hay error al parsear, mantener undefined
        }
    }

    return { from: fromDate, to: toDate }
}

export function DateRangeFilter({ className, value, onChange, label, name }) {
    // Convertir value inicial (strings) a dateRange (Dates) para DateRangePicker
    const [dateRange, setDateRange] = useState(() => parseValueToDateRange(value))

    // Sincronizar cuando cambia el value externo
    useEffect(() => {
        const newDateRange = parseValueToDateRange(value)
        
        // Actualizar el estado solo si realmente cambió
        setDateRange((prevDateRange) => {
            const fromChanged = prevDateRange?.from?.getTime() !== newDateRange?.from?.getTime()
            const toChanged = prevDateRange?.to?.getTime() !== newDateRange?.to?.getTime()
            
            if (fromChanged || toChanged) {
                return newDateRange
            }
            return prevDateRange
        })
    }, [value])

    // Manejar cambios del DateRangePicker y convertir Dates a strings
    const handleDateRangeChange = (range) => {
        setDateRange(range)
        
        const formattedDate = {
            from: range?.from && isValid(range.from) ? format(range.from, "yyyy-MM-dd") : null,
            to: range?.to && isValid(range.to) ? format(range.to, "yyyy-MM-dd") : null,
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
