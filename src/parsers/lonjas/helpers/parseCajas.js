/**
 * Helper function to parse cajas string
 * 
 * Parses strings like "10 CAJAS" or "5 UNIDADES" into
 * { cantidad: "10", tipo: "CAJAS" }
 * 
 * @param {string} cajasString - String containing quantity and type
 * @returns {{cantidad: string, tipo: string}} - Parsed cajas object
 * @throws {ParsingError} If parsing fails
 */

import { ParsingError } from '@/errors/lonjasErrors';

export function parseCajas(cajasString) {
    if (!cajasString || typeof cajasString !== 'string') {
        throw new ParsingError(
            'String de cajas inválido o vacío',
            'Cajas',
            cajasString
        );
    }

    const trimmed = cajasString.trim();
    if (trimmed === '') {
        throw new ParsingError(
            'String de cajas vacío',
            'Cajas',
            cajasString
        );
    }

    // Split by spaces
    const parts = trimmed.split(' ');
    
    if (parts.length < 2) {
        throw new ParsingError(
            `No se pudo extraer cantidad y tipo de cajas. Formato esperado: "CANTIDAD TIPO". Valor: "${cajasString}"`,
            'Cajas',
            cajasString
        );
    }

    // Last part is the type (e.g., "CAJAS", "UNIDADES")
    const tipo = parts[parts.length - 1];
    // Rest is the quantity
    const cantidad = parts.slice(0, -1).join(' ');

    if (!cantidad || cantidad.trim() === '') {
        throw new ParsingError(
            `Cantidad de cajas vacía. Valor: "${cajasString}"`,
            'Cajas',
            cajasString
        );
    }

    if (!tipo || tipo.trim() === '') {
        throw new ParsingError(
            `Tipo de cajas vacío. Valor: "${cajasString}"`,
            'Cajas',
            cajasString
        );
    }

    return { cantidad, tipo };
}

