'use client';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
                    <Input
                        type="text"
                        id={name}
                        value={temporalValue}
                        onChange={handleOnChangeInput}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                    />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {value.map((item, index) => (
                        <Badge
                            key={index}
                            className='flex items-center gap-1'
                        >
                            {item}
                            <button
                                onClick={() => onDelete(item)}
                                type="button"
                                className="hover:bg-white/95 bg-black/20 rounded-full text-md font-bold text-black-500 p-0.5 shadow-sm"
                            >
                                <XMarkIcon className="h-3 w-3 " aria-hidden="true" />
                            </button>
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default memo(TextAccumulatorFilter);
