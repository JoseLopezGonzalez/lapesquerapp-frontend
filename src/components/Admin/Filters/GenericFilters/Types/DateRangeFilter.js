'use client';

import React, { memo } from 'react';

const DateRangeFilter = ({
    label,
    name,
    value = { start: '', end: '' },
    onChange,
    min,
    max,
    placeholderStart = 'Fecha de inicio',
    placeholderEnd = 'Fecha de fin',
}) => {
    const handleOnChange = (type) => (e) => {
        const newValue = { ...value, [type]: e.target.value };

        // Validación del rango de fechas
        if (type === 'start' && newValue.end && newValue.start > newValue.end) return;
        if (type === 'end' && newValue.start && newValue.end < newValue.start) return;

        onChange(newValue);
    };

    return (
        <div key={name} className="col-span-2">
            <div className="flex w-full flex-col">
                <label
                    id={`date-range-label-${name}`}
                    htmlFor={`date-range-filter-${name}`}
                    className="block mb-2 text-xs font-medium text-neutral-400 text-start"
                >
                    {label}
                </label>
                <div
                    role="group"
                    aria-labelledby={`date-range-label-${name}`}
                    className="flex flex-col sm:flex-row gap-3"
                >
                    {/* Fecha de inicio */}
                    <input
                        id={`date-range-start-${name}`}
                        type="date"
                        value={value.start}
                        min={min}
                        max={value.end || max}
                        onChange={handleOnChange('start')}
                        placeholder={placeholderStart}
                        className="border text-sm rounded-xl block w-full p-2.5 bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-500 focus:ring-sky-500 focus:border-sky-500 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                    />
                    {/* Fecha de fin */}
                    <input
                        id={`date-range-end-${name}`}
                        type="date"
                        value={value.end}
                        min={value.start || min}
                        max={max}
                        onChange={handleOnChange('end')}
                        placeholder={placeholderEnd}
                        className="border text-sm rounded-xl block w-full p-2.5 bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-500 focus:ring-sky-500 focus:border-sky-500 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default memo(DateRangeFilter);
