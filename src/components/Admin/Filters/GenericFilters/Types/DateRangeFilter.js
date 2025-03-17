'use client';

import { memo, useEffect } from 'react';
import { useState } from "react";
/* import { es } from "react-day-picker/locale"; */
import { format } from "date-fns";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import "/src/customs/reactDayPicker/reactDayPickerStyles.css";
import { CalendarDateRangeIcon } from "@heroicons/react/20/solid";
import { CloseButton, Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

const DateRangeFilter = ({
    label,
    value = { start: '', end: '' },
    onChange,
    visibleMonths = 1,
}) => {

    const defaultClassNames = getDefaultClassNames();

    // Controla el mes actual del calendario
    const [month, setMonth] = useState(new Date());
    const [selectedRange, setSelectedRange] = useState({ from: undefined, to: undefined });
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        setSelectedRange({
            from: value?.start ? new Date(value.start) : undefined,
            to: value?.end ? new Date(value.end) : undefined,
        });
    }, [value]);

    useEffect(() => {
        setInputValue(value?.start && value?.end
            ? `${format(new Date(value.start), "dd/MM/yyyy")} - ${format(new Date(value.end), "dd/MM/yyyy")}`
            : "");
    }, [value]);

    // Maneja la selección de rango en el calendario
    const handleOnRangeSelect = (range) => {
        /* Convertir a {start,end} */
        const formattedRange = {
            start: range?.from ? format(range.from, "MM/dd/yyyy") : "",
            end: range?.to ? format(range.to, "MM/dd/yyyy") : "",
        };

        onChange(formattedRange);
    };

    // Limpia las fechas seleccionadas
    const clearDates = () => {
        onChange({ start: "", end: "" });
    };


    return (
        <div className="grid grid-cols-2 gap-y-6 gap-x-3 py-2">
            <div className="col-span-2">
                <div className="flex w-full flex-col text-start">
                    <label
                        htmlFor="autocomplete-filter"
                        className="w-full mb-2 text-xs font-medium text-neutral-400"
                    >
                        {label}
                    </label>
                    <Popover className="w-full">
                        <PopoverButton className="w-full">
                            <div className="flex justify-between gap-2 w-full p-2.5 bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500 ">
                                <input
                                    className="bg-transparent"
                                    id="date-input"
                                    type="text"
                                    value={inputValue}
                                    placeholder="dd/mm/aaaa - dd/mm/aaaa"
                                    readOnly
                                />
                                <div className="cursor-pointer">
                                    <CalendarDateRangeIcon className="h-5 w-5 text-neutral-400 dark:text-neutral-400" aria-hidden="true" />
                                </div>
                            </div>
                        </PopoverButton>
                        <PopoverPanel anchor="bottom" className="flex flex-col">
                            <div className=" text-xs z-50 rounded-lg shadow-lg bg-neutral-800 text-white p-3 border border-neutral-700">
                                <DayPicker
                                    captionLayout="dropdown"
                                    mode="range"
                                    month={month}
                                    onMonthChange={setMonth}
                                    selected={selectedRange}
                                    onSelect={handleOnRangeSelect}
                                    showOutsideDays
                                    showWeekNumber
                                    numberOfMonths={visibleMonths}
                                    locale={es}
                                    classNames={{
                                        today: ` text-sky-500 font-bold`, // Día actual
                                        root: `${defaultClassNames.root} pb-4 p-2 pt-0 bg-transparent text-neutral-300`, // Contenedor principal
                                        caption: "text-lg font-medium text-white", // Título del mes
                                        chevron: `${defaultClassNames.chevron} dark:fill-sky-500`, // Flechas de navegación
                                    }}
                                />
                                <div className="flex gap-2  justify-end text-xs">
                                    <button
                                        onClick={clearDates}
                                        className=" py-1 px-3 bg-neutral-500 hover:bg-neutral-600 text-white rounded-md focus:ring-2 focus:ring-neutral-500"
                                    >
                                        Eliminar
                                    </button>
                                    <CloseButton
                                        className=" py-1 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-md focus:ring-2 focus:ring-sky-500"
                                    >
                                        Aceptar
                                    </CloseButton>
                                </div>
                            </div>
                        </PopoverPanel>
                    </Popover>
                </div>
            </div>
        </div>
    );
};

export default memo(DateRangeFilter);
