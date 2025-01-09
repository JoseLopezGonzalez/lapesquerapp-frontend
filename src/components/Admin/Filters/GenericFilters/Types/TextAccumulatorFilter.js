'use client';

import { XMarkIcon } from '@heroicons/react/20/solid';
import React, { useState, memo } from 'react';

const TextAccumulatorFilter = ({ label, name, value, placeholder, onAdd , onDelete }) => {
    const [temporalValue, setTemporalValue] = useState("");

    const handleOnChangeInput = (event) => {
        setTemporalValue(event.target.value);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const newValue = temporalValue.trim();

            if (newValue && !value.includes(newValue)) {
                onAdd(newValue); // Añade el nuevo valor si no está vacío
                setTemporalValue(''); // Limpia el campo después de agregar
            }
        }
    };

    return (
        <div className="grid grid-cols-2 gap-y-6 gap-x-3">
            <div className="col-span-2">
                <div className="flex w-full flex-col">
                    <label
                        htmlFor={name}
                        className="w-full mb-2 text-xs font-medium text-neutral-400 text-start"
                    >
                        {label}
                    </label>
                    <input
                        type="text"
                        id={name}
                        value={temporalValue}
                        onChange={handleOnChangeInput}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 placeholder:italic dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                        placeholder={placeholder}
                    />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {value.map((item, index) => (
                        <div
                            key={index}
                            className="italic flex justify-center gap-1 text-xs font-bold pr-2 pl-2.5 py-0.5 rounded-full bg-sky-500 text-white items-center"
                        >
                            {item}
                            <button
                                onClick={() => onDelete(item)}
                                type="button"
                                className="hover:bg-white/95 bg-white/70 rounded-full text-md font-bold text-sky-500  shadow-sm"
                            >
                                <XMarkIcon className="h-3 w-3 " aria-hidden="true" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default memo(TextAccumulatorFilter);
