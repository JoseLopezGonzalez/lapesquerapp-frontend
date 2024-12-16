'use client';

import React, { useState, memo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export const TextAccumulatorFilter = ({ label, name, value, placeholder, onAdd , onDelete }) => {
    const [temporalValue, setTemporalValue] = useState("");

    const handleOnChangeInput = (event) => {
        setTemporalValue(event.target.value);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const newValue = temporalValue.trim();

            if (newValue) {
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
                        className="w-full border text-sm rounded-lg block p-2.5 bg-neutral-900 border-neutral-400 placeholder-neutral-500 placeholder:italic text-white focus:ring-sky-500 focus:border-sky-500"
                        placeholder={placeholder}
                    />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {value.map((item) => (
                        <div
                            key={item}
                            className="italic flex justify-center gap-1 text-xs font-medium pr-2 pl-2.5 py-0.5 rounded-full bg-sky-900 text-sky-300 items-center"
                        >
                            {item}
                            <button
                                onClick={() => onDelete(item)}
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

export default memo(TextAccumulatorFilter);
