'use client';

import React, { memo } from 'react';

const TextFilter = ({ label, name, value, placeholder, onChange }) => {
    const handleOnChange = (e) => {
        onChange(e.target.value);
    };

    return (
        <div className="col-span-2">
            <div className="flex w-full flex-col">
                <label
                    htmlFor={name}
                    className="w-full mb-2 text-xs font-medium text-neutral-400 text-start"
                >
                    {label}
                </label>
                <input
                    id={name}
                    type="text"
                    value={value}
                    onChange={handleOnChange}
                    placeholder={placeholder}
                    className="w-full border text-sm rounded-lg block p-2.5 bg-neutral-900 border-neutral-600 placeholder-neutral-600 placeholder:italic text-white"
                />
            </div>
        </div>
    );
};

export default memo(TextFilter);
