"use client"

import React, { use, useEffect, useState } from "react"
import { addDays, format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function DateRangeFilter({ className, value, onChange , label, name }) {
    const [date, setDate] = useState({
        from: null,
        to: null,
    })

    useEffect(() => {
        if (value) {
            setDate(value)
        }
    }, [value])

    const handleOnChange = (date) => {
        const formattedDate = {
            from: date.from ? format(date.from, "yyyy-MM-dd") : null,
            to: date.to ? format(date.to, "yyyy-MM-dd") : null,
        }
        setDate(date)
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
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(date.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Selecciona un rango de fechas</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={handleOnChange}
                                    onChange={handleOnChange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

            </div>
        </div>
    )
}
