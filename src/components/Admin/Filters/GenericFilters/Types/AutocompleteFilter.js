'use client';

import { Combobox } from '@/components/Shadcn/Combobox/index';
import { Badge } from '@/components/ui/badge';
import AutocompleteSelector from '@/components/Utilities/AutocompleteSelector';
import { API_URL_V2 } from '@/configs/config';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export const AutocompleteFilter = ({ label, placeholder, endpoint, onAdd, onDelete, value }) => {

    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!endpoint) return;

        const fetchOptions = async () => {
            setLoading(true);
            try {
                const session = await getSession(); // Obtener sesión actual


                const response = await fetch(`${API_URL_V2}${endpoint}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session?.user?.accessToken}`, // Enviar el token
                            'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
                        },
                    }
                );
                const data = await response.json();
                setOptions(data.map((item) => ({ value: item.id, label: item.name })));
            } catch (error) {
                console.error("Error fetching options:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, [endpoint]);

    const handleOnAdd = (item) => {
        const selectedOption = options.find((option) => option.value === item);
        const newItem = { id: selectedOption.value, name: selectedOption.label };
        onAdd(newItem);
    }


    return (
        <div className="grid grid-cols-2 gap-y-6 gap-x-3">
            <div className="col-span-2">
                <div className="flex w-full flex-col  text-start">
                    <label
                        htmlFor="autocomplete-filter"
                        className="w-full mb-2 text-xs font-medium text-muted-foreground"
                    >
                        {label}
                    </label>
                    <Combobox
                        options={options}
                        placeholder={placeholder || 'Escribe para buscar...'}
                        searchPlaceholder={'Buscar...'}
                        notFoundMessage={'No se encontraron resultados'}
                        /* value={value} */
                        onChange={handleOnAdd}
                    /* onBlur={onBlur} */
                    />
                    {/*  <AutocompleteSelector
                        placeholder={placeholder || 'Escribe para buscar...'}
                        inputClassName="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 placeholder:italic dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                        elements={options}
                        onChange={onAdd}
                    /> */}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {value?.length > 0 && value?.map((item) => (
                        <Badge
                            key={item.id}
                            className='flex items-center gap-1'
                        >
                            {item.name}
                            <button
                                onClick={() => onDelete(item)}
                                type="button"
                                className="hover:bg-white/95 bg-black/20 rounded-full text-md font-bold text-black  shadow-sm"
                            >
                                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    );
};
