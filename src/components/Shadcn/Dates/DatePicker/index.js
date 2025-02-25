import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDate } from '@/helpers/formats/dates/formatDates'
import { CalendarIcon } from 'lucide-react'
import React from 'react'

const DatePicker = ({ value, onChange }) => {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={`justify-start text-left font-normal ${!value && "text-muted-foreground"}`}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? formatDate(value) : "Seleccionar fecha"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(date) => {
                        onChange(date)
                        setOpen(false)
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}

export default DatePicker