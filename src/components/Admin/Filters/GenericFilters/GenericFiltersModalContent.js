'use client';

import React from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import TextAreaFilter from './Types/TextAreaFilter';
import TextAccumulatorFilter from './Types/TextAccumulatorFilter';
import NumberFilter from './Types/NumberFilter';
import PairSelectBoxesFilter from './Types/PairSelectBoxesFilter';
import DateFilter from './Types/DateFilter';
import DateRangeFilter from './Types/DateRangeFilter';
import { AutocompleteFilter } from './Types/AutocompleteFilter';
import SearchFilter from './Types/SearchFilter';
import TextFilter from './Types/TextFilter';

export const GenericFiltersModalContent = ({ filtersGroup, onFilterChange }) => {
    if (!filtersGroup || filtersGroup.length === 0) {
        return <p className="text-gray-500">No hay filtros disponibles.</p>;
    }

    // Extraer cualquier filtro de tipo `search` desde el primer nivel de `filtersGroup`
    const searchFilter = filtersGroup
        .flatMap((group) => group.filters)
        .find((filter) => filter.type === 'search');

    return (
        <div className="px-2 sm:px-4 lg:px-6 flex flex-col gap-4">
            {/* Renderizar el filtro de tipo `search` si existe */}
            {searchFilter && (
                <div className="mb-4">
                    <SearchFilter
                        label={searchFilter.label}
                        name={searchFilter.name}
                        value={searchFilter.value}
                        placeholder={searchFilter.placeholder}
                        onChange={(value) => onFilterChange(null, searchFilter.name, value)}
                        onKeyDown={() => console.log('Buscar')} /* IMPLEMENTAR */
                    />
                </div>
            )}

            <div className="px-2">
                <div className="pb-4 divide-y divide-white/10">
                    <dl className="space-y-6 divide-y divide-white/10">
                        {filtersGroup.map((group) => (
                            <Disclosure key={group.name || group.label} as="div" className="pt-6">
                                {({ open }) => (
                                    <>
                                        <dt>
                                            <Disclosure.Button className="flex w-full items-start justify-between text-left text-neutral-300 hover:text-white">
                                                <span className="text-lg font-light leading-7">
                                                    {group.label || 'Grupo sin nombre'}
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
                                                {group.filters.map((filter) => (
                                                    <div key={filter.name || filter.label} className="mb-4">
                                                        {filter.type === 'text' && (
                                                            <TextFilter
                                                                label={filter.label}
                                                                name={filter.name}
                                                                value={filter.value}
                                                                placeholder={filter.placeholder}
                                                                onChange={(value) =>
                                                                    onFilterChange(group.name, filter.name, value)
                                                                }
                                                            />
                                                        )}
                                                        {filter.type === 'textarea' && (
                                                            <TextAreaFilter
                                                                label={filter.label}
                                                                name={filter.name}
                                                                value={filter.value}
                                                                placeholder={filter.placeholder}
                                                                onChange={(value) =>
                                                                    onFilterChange(group.name, filter.name, value)
                                                                }
                                                            />
                                                        )}
                                                        {filter.type === 'textAccumulator' && (
                                                            <TextAccumulatorFilter
                                                                label={filter.label}
                                                                name={filter.name}
                                                                value={filter.value || []}
                                                                placeholder={filter.placeholder}
                                                                onAdd={(item) =>
                                                                    onFilterChange(group.name, filter.name, [
                                                                        ...(filter.value || []),
                                                                        item,
                                                                    ])
                                                                }
                                                                onDelete={(item) =>
                                                                    onFilterChange(
                                                                        group.name,
                                                                        filter.name,
                                                                        (filter.value || []).filter(
                                                                            (i) => i !== item
                                                                        )
                                                                    )
                                                                }
                                                            />
                                                        )}
                                                        {filter.type === 'number' && (
                                                            <NumberFilter
                                                                label={filter.label}
                                                                name={filter.name}
                                                                value={filter.value}
                                                                placeholder={filter.placeholder}
                                                                onChange={(value) =>
                                                                    onFilterChange(group.name, filter.name, value)
                                                                }
                                                            />
                                                        )}
                                                        {filter.type === 'pairSelectBoxes' && (
                                                            <PairSelectBoxesFilter
                                                                label={filter.label}
                                                                name={filter.name}
                                                                value={filter.value}
                                                                options={filter.options}
                                                                onChange={(value) =>
                                                                    onFilterChange(group.name, filter.name, value)
                                                                }
                                                            />
                                                        )}
                                                        {filter.type === 'date' && (
                                                            <DateFilter
                                                                label={filter.label}
                                                                name={filter.name}
                                                                value={filter.value}
                                                                placeholder={filter.placeholder}
                                                                onChange={(value) =>
                                                                    onFilterChange(group.name, filter.name, value)
                                                                }
                                                            />
                                                        )}
                                                        {filter.type === 'dateRange' && (
                                                            <DateRangeFilter
                                                                label={filter.label}
                                                                name={filter.name}
                                                                value={filter.value}
                                                                onChange={(value) =>
                                                                    onFilterChange(group.name, filter.name, value)
                                                                }
                                                            />
                                                        )}
                                                        {filter.type === 'autocomplete' && (
                                                            <AutocompleteFilter
                                                                label={filter.label}
                                                                placeholder={filter.placeholder}
                                                                endpoint={filter.endpoint}
                                                                onAdd={(item) =>
                                                                    onFilterChange(group.name, filter.name, [
                                                                        ...(filter.value || []),
                                                                        item,
                                                                    ])
                                                                }
                                                                onDelete={(item) =>
                                                                    onFilterChange(
                                                                        group.name,
                                                                        filter.name,
                                                                        (filter.value || []).filter(
                                                                            (i) => i.id !== item.id
                                                                        )
                                                                    )
                                                                }
                                                                value={filter.value || []}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
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
