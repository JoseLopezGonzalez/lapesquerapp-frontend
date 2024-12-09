'use client';

import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function AutocompleteSelector({
    onChange,
    elements = [],
    inputClassName,
    placeholder = 'Selecciona una opción',
    reset,
}) {
    const [query, setQuery] = useState('');
    const [selectedElement, setSelectedElement] = useState(null);

    useEffect(() => {
        setSelectedElement(null);
        setQuery('');
    }, [reset]);

    const filteredElements =
        query === ''
            ? elements
            : elements.filter((element) =>
                  element.name.toLowerCase().includes(query.toLowerCase())
              );

    return (
        <Combobox
            as="div"
            className="w-full"
            value={selectedElement}
            onChange={(element) => {
                setSelectedElement(element);
                onChange(element);
                setSelectedElement(null);
            }}
        >
            <div className="relative w-full">
                <Combobox.Input
                    className={inputClassName}
                    placeholder={placeholder}
                    onChange={(event) => setQuery(event.target.value)}
                    displayValue={(element) => element?.name || ''}
                    autoComplete="off"
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                    <ChevronUpDownIcon
                        className="h-5 w-5 text-neutral-400"
                        aria-hidden="true"
                    />
                </Combobox.Button>

                {filteredElements.length > 0 && (
                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-neutral-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {filteredElements.map((element) => (
                            <Combobox.Option
                                key={element.id}
                                value={element}
                                className={({ active }) =>
                                    classNames(
                                        'relative cursor-default select-none py-2 pl-3 pr-9',
                                        active ? 'bg-sky-600 text-white' : 'text-neutral-900 dark:text-neutral-200'
                                    )
                                }
                            >
                                {({ active, selected }) => (
                                    <>
                                        <span
                                            className={classNames(
                                                'block truncate',
                                                selected && 'font-semibold'
                                            )}
                                        >
                                            {element.name}
                                        </span>

                                        {selected && (
                                            <span
                                                className={classNames(
                                                    'absolute inset-y-0 right-0 flex items-center pr-4',
                                                    active ? 'text-white' : 'text-sky-600'
                                                )}
                                            >
                                                <CheckIcon
                                                    className="h-5 w-5"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                        )}
                                    </>
                                )}
                            </Combobox.Option>
                        ))}
                    </Combobox.Options>
                )}
            </div>
        </Combobox>
    );
}
