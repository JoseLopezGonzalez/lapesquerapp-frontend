// /src/hooks/useDebounce.js
import { useEffect, useState } from 'react';

/**
 * Hook para debouncing de valores
 * 
 * @param {any} value - El valor a debounce
 * @param {number} delay - Delay en milisegundos (default: 300)
 * @returns {any} - El valor debounced
 */
export function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

