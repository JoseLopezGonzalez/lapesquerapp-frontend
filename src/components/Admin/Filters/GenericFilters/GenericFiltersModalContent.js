'use client';

import React from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
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
    if (!filtersGroup || (!filtersGroup.search && !filtersGroup.groups)) {
        return <p className="text-neutral-500">No hay filtros disponibles.</p>;
    }

    const { search, groups } = filtersGroup;

    return (
        <div className="px-2 sm:px-4 lg:px-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
            {search?.filters && search.filters.length > 0 && (
                <div className="mb-4">
                    {search.filters.map((filter) => (
                        <SearchFilter
                            key={filter.name}
                            label={filter.label}
                            name={filter.name}
                            value={filter.value}
                            placeholder={filter.placeholder}
                            onChange={(value) => onFilterChange('search', filter.name, value)}
                            onKeyDown={() => console.log('Buscar')} /* IMPLEMENTAR */
                        />
                    ))}
                </div>
            )}

            <div className="px-2">
                <div className="pb-4 divide-y divide-white/10">
                    <dl className="space-y-6 divide-y divide-white/10">
                        {groups.map((group) => (
                            <Disclosure key={group.name || group.label} as="div" className="pt-6">
                                {({ open }) => (
                                    <>
                                        <dt>
                                            <DisclosureButton className="flex w-full items-start justify-between text-left text-neutral-300 hover:text-white">
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
                                            </DisclosureButton>
                                        </dt>
                                        <DisclosurePanel as="dd" className="mt-2 px-4 py-4 ">
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
                                                            <>

                                                            {/* <DateFilter
                                                                label={filter.label}
                                                                name={filter.name}
                                                                value={filter.value}
                                                                placeholder={filter.placeholder}
                                                                onChange={(value) =>
                                                                    onFilterChange(group.name, filter.name, value)
                                                                }
                                                            />  */}
                                                            </>

                                                        )}
                                                        {filter.type === 'dateRange' && (
                                                            <>
                                                                {/* <DateRangeFilter
                                                                    label={filter.label}
                                                                    name={filter.name}
                                                                    value={filter.value}
                                                                    onChange={(value) =>
                                                                        onFilterChange(group.name, filter.name, value)
                                                                    }
                                                                    visibleMonths={filter.visibleMonths}
                                                                /> */}
                                                            </>
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
                                        </DisclosurePanel>
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
