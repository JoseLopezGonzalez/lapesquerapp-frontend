'use client';

import { memo } from 'react';

const DateFilter = ({ name, label, value, placeholder, onChange }) => {
    return (
        <div key={name} className="col-span-2">
            <div className="flex w-full flex-col">
                <label
                    htmlFor={`date-filter-${name}`}
                    className="block mb-2 text-xs font-medium text-muted-foreground text-start"
                >
                    {label}
                </label>
                <input
                    id={`date-filter-${name}`}
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
};

export default memo(DateFilter);
