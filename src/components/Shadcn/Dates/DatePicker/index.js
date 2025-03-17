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
                        if (!date) return; // Por seguridad

                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mes es 0-indexado
                        const day = String(date.getDate()).padStart(2, '0');

                        const dateString = `${year}-${month}-${day}`;
                        console.log(dateString); // Fecha en formato correcto yyyy-mm-dd

                        onChange(dateString);
                        setOpen(false);
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}

export default DatePicker