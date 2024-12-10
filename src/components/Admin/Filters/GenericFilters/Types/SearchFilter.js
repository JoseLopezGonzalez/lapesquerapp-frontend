import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export const SearchFilter = ({ filter }) => {
    return (
        <div>
            <label className="mb-2 text-sm font-medium text-neutral-900 sr-only dark:text-white">Search</label>
            <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <MagnifyingGlassIcon className="w-4 h-4 text-neutral-400" aria-hidden="true" />
                </div>
                <input
                    type="search"
                    onChange={(e) => filter.onChange(e.target.value)}
                    value={filter.value}
                    className="block w-full px-4 py-2.5 ps-10 text-sm text-neutral-900 border border-neutral-300 rounded-xl bg-neutral-50 focus:ring-sky-500 focus:border-sky-500 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                    placeholder={filter.placeholder}
                />
            </div>
        </div>
    )
}
