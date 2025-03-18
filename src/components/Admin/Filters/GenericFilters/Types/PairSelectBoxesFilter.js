'use client';

import { Badge } from '@/components/ui/badge';
import { CheckIcon } from '@heroicons/react/20/solid';

import React, { memo } from 'react';

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
                            <Badge
                                onClick={() => handleOnClick(item)}
                                variant={`${item.name === value ? '' : 'outline'}`}
                                className='cursor-pointer'
                            >
                                {item.label}
                            </Badge>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default memo(PairSelectBoxesFilter);

