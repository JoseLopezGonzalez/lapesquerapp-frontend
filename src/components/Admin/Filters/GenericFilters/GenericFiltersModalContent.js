'use client';

import React from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { TextFilter } from './Types/TextFilter';
import { TextAreaFilter } from './Types/TextAreaFilter';
import { TextAccumulatorFilter } from './Types/TextAccumulatorFilter';
import { NumberFilter } from './Types/NumberFilter';
import { SelectBoxesFilter } from './Types/SelectBoxesFilter';
import { DateFilter } from './Types/DateFilter';
import { DateRangeFilter } from './Types/DateRangeFilter';
import { AutocompleteFilter } from './Types/AutocompleteFilter';
import { SearchFilter } from './Types/SearchFilter';

export const GenericFiltersModalContent = ({ filters , onFilterChange }) => {
    if (!filters || filters.length === 0) {
        return <p className="text-gray-500">No hay filtros disponibles.</p>;
    }

    // Extraer el filtro de tipo `search` y los demás
    const searchFilter = filters.find((filter) => filter.type === 'search');
    const otherFilters = filters.filter((filter) => filter.type !== 'search');
    
    console.log('filters', filters);
    return (
        <div className="px-2 sm:px-4 lg:px-6 flex flex-col gap-4">
            {/* Renderizar el filtro de tipo `search` si existe */}
            {searchFilter && (
                <div>
                    <SearchFilter
                        filter={{
                            ...searchFilter,
                            value: searchFilter.value || '',
                            onChange: (value) => onFilterChange(searchFilter.name, value),
                        }}
                    />
                </div>
            )}

            <div className="px-2">
                <div className="pb-4 divide-y divide-white/10">
                    <dl className="space-y-6 divide-y divide-white/10">
                        {otherFilters.map((filter) => (
                            <Disclosure as="div" key={filter.name || filter.label} className="pt-6">
                                {({ open }) => (
                                    <>
                                        <dt>
                                            <Disclosure.Button className="flex w-full items-start justify-between text-left text-neutral-300 hover:text-white">
                                                <span className="text-lg font-light leading-7">
                                                    {filter.label || 'Filtro sin nombre'}
                                                </span>
                                                <span className="ml-6 flex p-1.5 items-center border-0 rounded-xl border-neutral-600 text-neutral-300 hover:bg-white/20">
                                                    {open ? (
                                                        <ChevronDownIcon
                                                            className="h-4 w-4"
                                                            aria-hidden="true"
                                                        />
                                                    ) : (
                                                        <ChevronRightIcon
                                                            className="h-4 w-4"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                </span>
                                            </Disclosure.Button>
                                        </dt>
                                        <Disclosure.Panel as="dd" className="mt-2 px-4 py-4">
                                            <div>
                                                {filter.type === 'text' && (
                                                    <TextFilter
                                                        label={filter.label}
                                                        name={filter.name}
                                                        value={filter.value}
                                                        placeholder={filter.placeholder}
                                                        onChange={(value) =>
                                                            onFilterChange(filter.name, value)
                                                        }
                                                    />
                                                )}
                                                {filter.type === 'textarea' && (
                                                    <TextAreaFilter
                                                        filter={{
                                                            ...filter,
                                                            value: filter.value || '',
                                                            onChange: (value) =>
                                                                onFilterChange(filter.name, value),
                                                        }}
                                                    />
                                                )}
                                                {filter.type === 'textAccumulator' && (
                                                    <TextAccumulatorFilter
                                                        filter={{
                                                            ...filter,
                                                            value: filter.value || [],
                                                            onAdd: (item) =>
                                                                onFilterChange(filter.name, [
                                                                    ...(filter.value || []),
                                                                    item,
                                                                ]),
                                                            onDelete: (item) =>
                                                                onFilterChange(
                                                                    filter.name,
                                                                    (filter.value || []).filter(
                                                                        (i) => i !== item
                                                                    )
                                                                ),
                                                        }}
                                                    />
                                                )}
                                                {filter.type === 'number' && (
                                                    <NumberFilter
                                                        filter={{
                                                            ...filter,
                                                            value: filter.value || '',
                                                            onChange: (value) =>
                                                                onFilterChange(filter.name, value),
                                                        }}
                                                    />
                                                )}
                                                {filter.type === 'pairSelectBox' && (
                                                    <SelectBoxesFilter
                                                        filter={{
                                                            ...filter,
                                                            value: filter.value || '',
                                                            onChange: (value) =>
                                                                onFilterChange(filter.name, value),
                                                        }}
                                                    />
                                                )}
                                                {filter.type === 'date' && (
                                                    <DateFilter
                                                        filter={{
                                                            ...filter,
                                                            value: filter.value || '',
                                                            onChange: (value) =>
                                                                onFilterChange(filter.name, value),
                                                        }}
                                                    />
                                                )}
                                                {filter.type === 'dateRange' && (
                                                    <DateRangeFilter
                                                        filter={{
                                                            ...filter,
                                                            value: filter.value || {
                                                                start: '',
                                                                end: '',
                                                            },
                                                            onChange: (value) =>
                                                                onFilterChange(filter.name, value),
                                                        }}
                                                    />
                                                )}
                                                {filter.type === 'autocomplete' && (
                                                    <AutocompleteFilter
                                                        filter={{
                                                            ...filter,
                                                            value: filter.value || [],
                                                            onAdd: (item) =>
                                                                onFilterChange(filter.name, [
                                                                    ...(filter.value || []),
                                                                    item,
                                                                ]),
                                                            onDelete: (item) =>
                                                                onFilterChange(
                                                                    filter.name,
                                                                    (filter.value || []).filter(
                                                                        (i) => i.id !== item.id
                                                                    )
                                                                ),
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </Disclosure.Panel>
                                    </>
                                )}
                            </Disclosure>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
};
