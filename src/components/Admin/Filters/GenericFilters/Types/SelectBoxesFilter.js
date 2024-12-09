'use client';

import { CheckIcon } from '@heroicons/react/20/solid';

export const SelectBoxesFilter = ({ filter }) => {
    return (
        <div>
            <label
                className="w-full mb-2 text-xs font-medium text-neutral-400"
                htmlFor={`select-boxes-filter-${filter.name}`}
            >
                {filter.label}
            </label>
            <div id={`select-boxes-filter-${filter.name}`} className="flex gap-y-2 gap-x-2 mt-1 flex-wrap">
                {filter.options.map((item, index) => (
                    <div key={index} className="">
                        <input
                            type="checkbox"
                            id={`${filter.name}-${item.name}`}
                            checked={item.value}
                            onChange={item.onChange}
                            className="hidden peer"
                            required=""
                        />
                        <label
                            htmlFor={`${filter.name}-${item.name}`}
                            className="flex gap-2 items-center justify-center px-4 whitespace-nowrap text-sm w-full sm:h-full py-1 border-2 rounded-xl cursor-pointer hover:text-white border-neutral-600 hover:border-sky-400 peer-checked:border-sky-500 peer-checked:text-white text-neutral-400 bg-neutral-800 hover:bg-sky-400"
                        >
                            {item.value && <CheckIcon className="h-4 w-4" aria-hidden="true" />}
                            {item.label}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};
