'use client';

import { Textarea } from '@/components/ui/textarea';
import React, { memo } from 'react';

const TextAreaFilter = ({ label, name, value, placeholder, onChange }) => {

    const handleOnChange = (e) => {
        onChange(e.target.value);
    }

    return (
        <div className="grid grid-cols-2 gap-y-6 gap-x-3 h-full">
            <div className="col-span-2">
                <div className="flex w-full flex-col">
                    <label
                        htmlFor={name}
                        className="w-full mb-2 text-xs font-medium text-neutral-400 text-start"
                    >
                        {label}
                    </label>
                    <Textarea
                        id={name}
                        rows="4"
                        value={value}
                        onChange={handleOnChange}
                        placeholder={placeholder}
                    />
                </div>
            </div>
        </div>
    );
};

export default memo(TextAreaFilter);

