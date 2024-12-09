'use client';

import React from 'react';

export const DateFilter = ({ filter }) => {
    return (
        <div>
            <label
                htmlFor={`date-filter-${filter.name}`}
                className="block mb-2 text-sm font-medium text-neutral-400"
            >
                {filter.label}
            </label>
            <input
                id={`date-filter-${filter.name}`}
                type="date"
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                placeholder="Selecciona una fecha"
            />
        </div>
    );
};
