/**
 * Helper function to parse barco code string
 * 
 * Parses strings like "742 PEPE MANUEL" into
 * { cod: "742", barco: "PEPE MANUEL" }
 * 
 * @param {string} codBarcoString - String containing barco code and name
 * @returns {{cod: string, barco: string}} - Parsed barco object
 * @throws {ParsingError} If parsing fails
 */

import { ParsingError } from '@/errors/lonjasErrors';

export function parseCodBarco(codBarcoString) {
    if (!codBarcoString || typeof codBarcoString !== 'string') {
        throw new ParsingError(
            'String de código de barco inválido o vacío',
            'Cod Barco',
            codBarcoString
        );
    }

    const trimmed = codBarcoString.trim();
    if (trimmed === '') {
        throw new ParsingError(
            'String de código de barco vacío',
            'Cod Barco',
            codBarcoString
        );
    }

    // Split by spaces
    const parts = trimmed.split(' ');
    
    if (parts.length < 2) {
        throw new ParsingError(
            `No se pudo extraer código y nombre del barco. Formato esperado: "COD NOMBRE". Valor: "${codBarcoString}"`,
            'Cod Barco',
            codBarcoString
        );
    }

    // First part is the code
    const cod = parts[0];
    // Rest is the barco name
    const barco = parts.slice(1).join(' ');

    if (!cod || cod.trim() === '') {
        throw new ParsingError(
            `Código de barco vacío. Valor: "${codBarcoString}"`,
            'Cod Barco',
            codBarcoString
        );
    }

    if (!barco || barco.trim() === '') {
        throw new ParsingError(
            `Nombre de barco vacío. Valor: "${codBarcoString}"`,
            'Cod Barco',
            codBarcoString
        );
    }

    return { cod, barco };
}

