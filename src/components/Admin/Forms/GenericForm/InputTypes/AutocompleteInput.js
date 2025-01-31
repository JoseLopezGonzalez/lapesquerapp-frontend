'use client';

import AutocompleteSelector from '@/components/Utilities/AutocompleteSelector';
import { API_URL_V2 } from '@/configs/config';
import { getSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export const AutocompleteInput = ({ placeholder, endpoint, onChange}) => {

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
                const data =await response.json();
                console.log('data', data);
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
                    <AutocompleteSelector
                        placeholder={placeholder || 'Escribe para buscar...'}
                        inputClassName="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 placeholder:italic dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                        elements={options}
                        onChange={onChange}
                    />
                </div>
            </div>
        </div>
    );
};
