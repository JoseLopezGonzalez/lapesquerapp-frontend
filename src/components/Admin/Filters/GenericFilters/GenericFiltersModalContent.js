'use client';

import React from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { SearchFilter } from './Types/SearchFilter';

export const GenericFiltersModalContent = ({ searchFilter, filtersGroup }) => {
    return (
        <div className="px-4 sm:px-6 flex flex-col gap-4">
            {searchFilter && <SearchFilter filter={searchFilter} />}
            <div className="px-2">
                <div className="pb-4 divide-y divide-gray-200">
                    <dl className="space-y-6 divide-y divide-gray-200">
                        {filtersGroup.map((group) => (
                            <Disclosure key={group.name} as="div" className="pt-6">
                                {({ open }) => (
                                    <>
                                        <dt>
                                            <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-900 dark:text-white">
                                                <span className="text-lg font-medium leading-7">{group.label}</span>
                                                <span className="ml-6 flex items-center">
                                                    {open ? (
                                                        <ChevronRightIcon className="h-5 w-5" />
                                                    ) : (
                                                        <ChevronDownIcon className="h-5 w-5" />
                                                    )}
                                                </span>
                                            </Disclosure.Button>
                                        </dt>
                                        <Disclosure.Panel as="dd" className="mt-2 px-4 py-4">
                                            <div className="flex flex-col gap-4">
                                                {group.filters.map((filter) => (
                                                    <div key={filter.name}>
                                                        {/* Aquí añadiremos cada tipo de filtro */}
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
