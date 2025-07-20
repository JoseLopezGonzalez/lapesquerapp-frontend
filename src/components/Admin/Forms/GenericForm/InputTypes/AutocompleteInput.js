// components/AutocompleteInput.jsx
'use client';

import AutocompleteSelector from '@/components/Utilities/AutocompleteSelector';
// import { API_URL_V2 } from '@/configs/config'; // Ya no es necesario, lo usa el servicio
// import { getSession } from 'next-auth/react'; // Ya no es necesario, lo usa el servicio
import { useEffect, useState, useCallback } from 'react'; // Añadido useCallback
import { fetchAutocompleteInputOptions } from '@/services/autocompleteService'; // Importa el nuevo servicio
import toast from 'react-hot-toast'; // Para mostrar mensajes de error al usuario

export const AutocompleteInput = ({ placeholder, endpoint, onChange }) => {

    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Utilizamos useCallback para memoizar la función de carga de opciones.
    const loadOptions = useCallback(async () => {
        if (!endpoint) return;

        setLoading(true);
        try {
            // Llama a la función del servicio para obtener las opciones
            const fetchedOptions = await fetchAutocompleteInputOptions(endpoint);
            setOptions(fetchedOptions);
        } catch (error) {
            console.error("Error al cargar opciones del autocompletado:", error);
            toast.error(`Error al cargar opciones para el campo de autocompletado.`);
            setOptions([]); // Asegúrate de que las opciones estén vacías en caso de error
        } finally {
            setLoading(false);
        }
    }, [endpoint]); // 'endpoint' es la dependencia aquí

    // Llama a loadOptions cuando el componente se monta o cuando 'endpoint' cambia.
    useEffect(() => {
        loadOptions();
    }, [loadOptions]); // Dependencia de loadOptions

    return (
        <div className="grid grid-cols-2 gap-y-6 gap-x-3">
            <div className="col-span-2">
                <div className="flex w-full flex-col text-start">
                    <AutocompleteSelector
                        placeholder={placeholder || 'Escribe para buscar...'}
                        inputClassName="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 placeholder:italic dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                        elements={options}
                        onChange={onChange}
                        loading={loading} // Pasa el estado de carga al selector si lo soporta
                        disabled={loading} // Opcionalmente, deshabilita el input mientras carga
                    />
                </div>
            </div>
        </div>
    );
};