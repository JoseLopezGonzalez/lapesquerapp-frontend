'use client';

import React from 'react';

export const NumberFilter = ({ filter }) => {
    const handleChange = (e) => {
        const value = e.target.value;
        // Permitir solo números y punto decimal
        if (/^[0-9]*\.?[0-9]*$/.test(value)) {
            filter.onChange(value);
        }
    };

    return (
        <div key={filter.name} className="col-span-2">
            <div className="flex w-full flex-col">
                <label
                    htmlFor={`number-filter-${filter.name}`}
                    className="w-full mb-2 text-xs font-medium text-neutral-400"
                >
                    {filter.label}
                </label>
                <input
                    id={`number-filter-${filter.name}`}
                    value={filter.value}
                    onChange={handleChange}
                    type="text"
                    inputMode="decimal"
                    placeholder={filter.placeholder}
                    className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 placeholder:italic dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                />
            </div>
        </div>
    );
};
