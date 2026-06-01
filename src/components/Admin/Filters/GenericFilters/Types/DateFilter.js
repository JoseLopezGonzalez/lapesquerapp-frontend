'use client';

import { memo } from 'react';

const DateFilter = ({ name, label, value, placeholder, onChange }) => {
  return (
    <div key={name} className="col-span-2">
      <div className="flex w-full flex-col">
        <label
          htmlFor={`date-filter-${name}`}
          className="text-muted-foreground mb-2 block text-start text-xs font-medium"
        >
          {label}
        </label>
        <input
          id={`date-filter-${name}`}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 focus:border-sky-500 focus:ring-sky-500 dark:border-neutral-600 dark:bg-neutral-700/50 dark:text-white dark:placeholder-neutral-500 dark:focus:border-sky-500 dark:focus:ring-sky-500"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default memo(DateFilter);
