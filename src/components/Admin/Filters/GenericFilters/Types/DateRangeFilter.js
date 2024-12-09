'use client';

import React from 'react';

export const DateRangeFilter = ({ filter }) => {
    const handleOnChange = (type) => (e) => {
        filter.onChange({
            ...filter.value,
            [type]: e.target.value,
        });
    };

    return (
        <div className="flex flex-col gap-2">
            <label
                htmlFor={`date-range-filter-${filter.name}`}
                className="text-xs font-medium text-neutral-400"
            >
                {filter.label}
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Fecha de inicio */}
                <input
                    id={`date-range-start-${filter.name}`}
                    type="date"
                    value={filter.value.start}
                    onChange={handleOnChange('start')}
                    placeholder="Fecha de inicio"
                    className="border text-sm rounded-xl block w-full p-2.5 bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-500 focus:ring-sky-500 focus:border-sky-500 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                />
                {/* Fecha de fin */}
                <input
                    id={`date-range-end-${filter.name}`}
                    type="date"
                    value={filter.value.end}
                    onChange={handleOnChange('end')}
                    placeholder="Fecha de fin"
                    className="border text-sm rounded-xl block w-full p-2.5 bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-500 focus:ring-sky-500 focus:border-sky-500 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                />
            </div>
        </div>
    );
};
