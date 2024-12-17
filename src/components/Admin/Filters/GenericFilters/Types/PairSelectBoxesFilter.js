'use client';

import { CheckIcon } from '@heroicons/react/20/solid';

import React , { memo } from 'react';

const PairSelectBoxesFilter = ({ label, name, value, onChange, options }) => {

    const handleOnClick = (item) => {
        onChange(value === item.name ? null : item.name);
    };

    return (
        <div key={name} className="col-span-2">
            <div className="flex w-full flex-col">
                {/* Label principal */}
                <label
                    id={`select-label-${name}`}
                    className="w-full mb-2 text-xs font-medium text-neutral-400 text-start"
                    htmlFor={`select-boxes-filter-${name}`}
                >
                    {label}
                </label>

                {/* Contenedor de opciones */}
                <div
                    id={`select-boxes-filter-${name}`}
                    role="group"
                    aria-labelledby={`select-label-${name}`}
                    className="flex gap-y-2 gap-x-2 mt-1 flex-wrap"
                >
                    {options.map((item) => (
                        <div key={item.name} className="">
                            <input
                                type="checkbox"
                                id={`${name}-${item.name}`}
                                checked={item.name === value}
                                onChange={() => handleOnClick(item)}
                                className="hidden peer"
                            />
                            <label
                                htmlFor={`${name}-${item.name}`}
                                role="checkbox"
                                aria-checked={item.name === value}
                                className="flex gap-2 items-center justify-center px-4 whitespace-nowrap text-sm w-full sm:h-full py-1 border-2 rounded-xl cursor-pointer hover:text-white border-neutral-600 hover:border-sky-400 peer-checked:border-sky-500 peer-checked:text-white text-neutral-400 bg-neutral-800"
                            >
                                {item.name === value && <CheckIcon className="h-4 w-4" aria-hidden="true" />}
                                {item.label}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default memo(PairSelectBoxesFilter);

