// components/AutocompleteFilter.jsx
'use client';

import { Combobox } from '@/components/Shadcn/Combobox/index';
import { Badge } from '@/components/ui/badge';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState, useCallback } from 'react';
import { fetchAutocompleteFilterOptions } from '@/services/autocompleteService';export const AutocompleteFilter = ({ label, placeholder, endpoint, onAdd, onDelete, value }) => {

    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Utilizamos useCallback para memoizar la función de carga de opciones.
    // Esto previene que se re-cree en cada render si sus dependencias no cambian.
    const loadOptions = useCallback(async () => {
        if (!endpoint) return;

        setLoading(true);
        try {
            // Llama a la función del servicio para obtener las opciones
            const fetchedOptions = await fetchAutocompleteFilterOptions(endpoint);
            setOptions(fetchedOptions);
        } catch (error) {
            console.error("Error al cargar opciones del filtro de autocompletado:", error);
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || `Error al cargar las opciones para ${label}. Por favor, inténtelo de nuevo.`;
            notify.error(errorMessage);
            setOptions([]); // Asegúrate de que las opciones estén vacías en caso de error
        } finally {
            setLoading(false);
        }
    }, [endpoint, label]); // 'label' añadido como dependencia por si se usa en el mensaje de error

    // Llama a loadOptions cuando el componente se monta o cuando 'endpoint' cambia.
    useEffect(() => {
        loadOptions();
    }, [loadOptions]); // Dependencia de loadOptions

    const handleOnAdd = (itemValue) => { // Renombrado a itemValue para claridad
        const selectedOption = options.find((option) => option.value === itemValue);
        if (selectedOption) {
            const newItem = { id: selectedOption.value, name: selectedOption.label };
            onAdd(newItem);
        } else {
            console.warn("Opción seleccionada no encontrada en las opciones cargadas:", itemValue);
            // Opcionalmente, mostrar un toast aquí si es un escenario inesperado
        }
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
                    {/* Puedes mostrar un indicador de carga en el Combobox si lo soporta,
                        o deshabilitarlo mientras carga. */}
                    <Combobox
                        options={options}
                        placeholder={placeholder || 'Escribe para buscar...'}
                        searchPlaceholder={'Buscar...'}
                        notFoundMessage={'No se encontraron resultados'}
                        onChange={handleOnAdd}
                        loading={loading}
                        disabled={loading}
                    />
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