'use client';

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export const TextAccumulatorFilter = ({ filter }) => {
    const [temporalValue, setTemporalValue] = useState("");

    const handleOnChangeInput = (event) => {
        setTemporalValue(event.target.value);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const newValue = temporalValue.trim();

            if (newValue) {
                filter.onAdd(newValue); // Añade el nuevo valor si no está vacío
                setTemporalValue(''); // Limpia el campo después de agregar
            }
        }
    };

    return (
        <div className="grid grid-cols-2 gap-y-6 gap-x-3">
            <div className="col-span-2">
                <div className="flex w-full flex-col">
                    <label
                        htmlFor={filter.name}
                        className="w-full mb-2 text-xs font-medium text-neutral-400"
                    >
                        {filter.label}
                    </label>
                    <input
                        type="text"
                        id={filter.name}
                        value={temporalValue}
                        onChange={handleOnChangeInput}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5 dark:bg-neutral-700 dark:border-neutral-400 dark:placeholder-neutral-500 placeholder:italic dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                        placeholder={filter.placeholder}
                    />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {filter.value.map((item) => (
                        <div
                            key={item}
                            className="italic bg-sky-100 flex justify-center gap-1 text-sky-800 text-xs font-medium pr-2 pl-2.5 py-0.5 rounded-full dark:bg-sky-900 dark:text-sky-300 items-center"
                        >
                            {item}
                            <button
                                onClick={() => filter.onDelete(item)}
                                type="button"
                                className="hover:bg-sky-500 rounded-full text-md text-white shadow-sm"
                            >
                                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
