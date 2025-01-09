'use client';

import { CalendarDaysIcon } from '@heroicons/react/20/solid';
import { parseDate } from '@internationalized/date';
import { DateRangePicker } from '@nextui-org/react';
import { memo } from 'react';

const DateRangeFilter = ({
    label,
    name,
    value = { start: '', end: '' },
    onChange,
    min,
    max,
    placeholderStart = 'Fecha de inicio',
    placeholderEnd = 'Fecha de fin',
    visibleMonths = 1,
}) => {

    // Función para manejar el cambio de fechas
    const handleOnChange = (value) => {
        const newValue = {
            start: value.start ? value.start.toDate().toISOString().split('T')[0] : '',
            end: value.end ? value.end.toDate().toISOString().split('T')[0] : '',
        };

        console.log('newValue', newValue);

        onChange(newValue);
    };

    // Si las fechas están vacías, inicializarlas como null
    const formattedDate = {
        start: value.start ? parseDate(value.start) : null,
        end: value.end ? parseDate(value.end) : null,
    };

    console.log('formattedDate', formattedDate);

    return (
        <div className="grid grid-cols-2 gap-y-6 gap-x-3">
            <div className="col-span-2">
                <div className="flex w-full flex-col text-start">
                    <label
                        htmlFor="autocomplete-filter"
                        className="w-full mb-2 text-xs font-medium text-neutral-400"
                    >
                        {label}
                    </label>

                    <DateRangePicker
                        showMonthAndYearPickers
                        selectorIcon={<CalendarDaysIcon />}
                        visibleMonths={visibleMonths}

                        value={formattedDate}
                        onChange={handleOnChange}
                        className="mb-4 dark:text-white"
                        classNames={{
                            innerWrapper: "bg-transparent dark:text-white",
                            inputWrapper: [
                                "border text-sm rounded-xl h-5 block w-full flex items-center bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-500 focus:ring-sky-500 focus:border-sky-500 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500",
                            ],
                            selectorIcon: "h-5 w-5 dark:group-hover:text-white dark:text-neutral-400 ", /* dark:group-hover:text-sky-500 */
                            selectorButton: " dark:hover:bg-transparent rounded-xl",

                        }}
                        calendarProps={{
                            classNames: {
                                base: "text-sm rounded-xl block w-full p-2.5 bg-neutral-50 text-neutral-900 placeholder-neutral-500 focus:ring-sky-500 focus:border-sky-500 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500",
                                headerWrapper: "pt-4 bg-transparent dark:text-white",
                                prevButton: "rounded-small ",
                                nextButton: "rounded-small",
                                gridHeader: "bg-transparent shadow-none ",
                                cellButton: [
                                    "data-[today=true]:dark:text-sky-500 data-[selected=true]:dark:bg-transparent rounded-small data-[selected=true]:dark:text-white",
                                    "data-[range-start=true]:before:rounded-l-small",
                                    "data-[selection-start=true]:before:rounded-l-small",
                                    "data-[range-end=true]:before:rounded-r-small",
                                    "data-[selection-end=true]:before:rounded-r-small",
                                    "data-[selected=true]:data-[selection-start=true]:data-[range-selection=true]:rounded-small ",
                                    "data-[selected=true]:data-[selection-start=true]:data-[range-selection=true]:dark:bg-sky-500",
                                    "data-[selected=true]:data-[selection-end=true]:data-[range-selection=true]:rounded-small",
                                    "data-[selected=true]:data-[selection-end=true]:data-[range-selection=true]:dark:bg-sky-500",
                                    'data-[range-selection=true]:before:dark:bg-sky-900/50',
                                ],
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default memo(DateRangeFilter);
