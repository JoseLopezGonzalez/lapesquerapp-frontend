'use client';

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

                console.log('url', `${API_URL_V2}${endpoint}`);

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
                setOptions(data.map((item) => ({ id: item.id, name: item.name })));
            } catch (error) {
                console.error("Error fetching options:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, [endpoint]);


    return (
        <div className="grid grid-cols-2 gap-y-6 gap-x-3">
            <div className="col-span-2">
                <div className="flex w-full flex-col  text-start">
                    <label
                        htmlFor="autocomplete-filter"
                        className="w-full mb-2 text-xs font-medium text-neutral-400"
                    >
                        {label}
                    </label>
                    <AutocompleteSelector
                        placeholder={placeholder || 'Escribe para buscar...'}
                        inputClassName="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 placeholder:italic dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                        elements={options}
                        onChange={onAdd}
                    />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {value?.length > 0 && value?.map((item) => (
                        <div
                            key={item.id}
                            className="italic flex justify-center gap-1 text-xs font-bold pr-2 pl-2.5 py-0.5 rounded-full bg-sky-500 text-white items-center"
                        >
                            {item.name}
                            <button
                                onClick={() => onDelete(item)}
                                type="button"
                                className="hover:bg-white/95 bg-white/70 rounded-full text-md font-bold text-sky-500  shadow-sm"
                            >
                                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
