import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { memo } from 'react';

const SearchFilter = (({
    label,
    name,
    value,
    placeholder = 'Buscar...',
    onChange,
    maxLength = 100,
    onKeyDown,
}) => {

    const handleOnKeyDown = (e) => {
        if (e.key === 'Enter') onKeyDown();
    }

    return (
        <div>
            <label
                htmlFor={`search-${name}`}
                className="mb-2 text-sm font-medium text-neutral-900 sr-only dark:text-white"
            >
                {label}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <MagnifyingGlassIcon className="w-4 h-4 text-neutral-400" aria-hidden="true" />
                </div>
                <input
                    id={`search-${name}`}
                    type="search"
                    name={name}
                    aria-label={label}
                    onChange={(e) => onChange(e.target.value)}
                    value={value}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    onKeyDown={handleOnKeyDown}
                    className="block w-full px-4 py-2.5 ps-10 text-sm text-neutral-900 border border-neutral-300 rounded-xl bg-neutral-50 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white focus:ring-sky-500 focus:border-sky-500"
                />
            </div>
        </div>
    );
});

export default memo(SearchFilter);
