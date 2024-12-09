'use client';

import React, { useState, useEffect } from 'react';
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

export const GenericFiltersModalContent = ({ filtersGroup, searchFilter, onFiltersChange }) => {
    const [localFilters, setLocalFilters] = useState({});

    useEffect(() => {
        // Inicializar el estado local de filtros
        const initialFilters = {};
        filtersGroup.forEach((filter) => {
            initialFilters[filter.name] = filter.value || ''; // Valor inicial
        });
        setLocalFilters(initialFilters);
    }, [filtersGroup]);

    const handleFilterChange = (name, value) => {
        setLocalFilters((prev) => ({ ...prev, [name]: value }));
        onFiltersChange?.(name, value); // Propaga el cambio si se define
    };

    if (!filtersGroup || filtersGroup.length === 0) {
        return <p className="text-gray-500">No hay filtros disponibles.</p>;
    }

    return (
        <div className="px-2 sm:px-4 lg:px-6 flex flex-col gap-4">
            {searchFilter && (
                <div>
                    <label className="block mb-2 text-sm font-medium text-neutral-400">
                        {searchFilter.label}
                    </label>
                    <input
                        type="text"
                        placeholder={searchFilter.placeholder}
                        value={localFilters[searchFilter.name] || ''}
                        onChange={(e) => handleFilterChange(searchFilter.name, e.target.value)}
                        className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-neutral-700 border-neutral-300 text-neutral-900 dark:text-white"
                    />
                </div>
            )}

            <div className="px-2">
                <div className="pb-4 divide-y divide-white/10">
                    <dl className="space-y-6 divide-y divide-white/10">
                        {filtersGroup.map((filter) => (
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
                                                {/* Renderizamos el tipo de filtro específico */}
                                                {filter.type === 'text' && (
                                                    <TextFilter
                                                        filter={{
                                                            ...filter,
                                                            value: localFilters[filter.name] || '',
                                                            onChange: (value) =>
                                                                handleFilterChange(filter.name, value),
                                                        }}
                                                    />
                                                )}
                                                {filter.type === 'textarea' && (
                                                    <TextAreaFilter
                                                        filter={{
                                                            ...filter,
                                                            value: localFilters[filter.name] || '',
                                                            onChange: (value) =>
                                                                handleFilterChange(filter.name, value),
                                                        }}
                                                    />
                                                )}
                                                {filter.type === 'textAccumulator' && (
                                                    <TextAccumulatorFilter
                                                        filter={{
                                                            ...filter,
                                                            value: localFilters[filter.name] || [],
                                                            onAdd: (item) =>
                                                                handleFilterChange(filter.name, [
                                                                    ...(localFilters[filter.name] || []),
                                                                    item,
                                                                ]),
                                                            onDelete: (item) =>
                                                                handleFilterChange(
                                                                    filter.name,
                                                                    (localFilters[filter.name] || []).filter(
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
                                                            value: localFilters[filter.name] || '',
                                                            onChange: (value) =>
                                                                handleFilterChange(filter.name, value),
                                                        }}
                                                    />
                                                )}
                                                {filter.type === 'pairSelectBox' && (
                                                    <SelectBoxesFilter
                                                        filter={{
                                                            ...filter,
                                                            value: localFilters[filter.name] || '',
                                                            onChange: (value) =>
                                                                handleFilterChange(filter.name, value),
                                                        }}
                                                    />
                                                )}
                                                {filter.type === 'date' && (
                                                    <DateFilter
                                                        filter={{
                                                            ...filter,
                                                            value: localFilters[filter.name] || '',
                                                            onChange: (value) =>
                                                                handleFilterChange(filter.name, value),
                                                        }}
                                                    />
                                                )}
                                                {filter.type === 'dateRange' && (
                                                    <DateRangeFilter
                                                        filter={{
                                                            ...filter,
                                                            value: localFilters[filter.name] || {
                                                                start: '',
                                                                end: '',
                                                            },
                                                            onChange: (value) =>
                                                                handleFilterChange(filter.name, value),
                                                        }}
                                                    />
                                                )}
                                                {filter.type === 'autocomplete' && (
                                                    <AutocompleteFilter
                                                        filter={{
                                                            ...filter,
                                                            value: localFilters[filter.name] || [],
                                                            onAdd: (item) =>
                                                                handleFilterChange(filter.name, [
                                                                    ...(localFilters[filter.name] || []),
                                                                    item,
                                                                ]),
                                                            onDelete: (item) =>
                                                                handleFilterChange(
                                                                    filter.name,
                                                                    (localFilters[filter.name] || []).filter(
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
