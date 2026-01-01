/**
 * Helper function to parse armador string
 * 
 * Parses strings like "HERMANOS CORDERO GIL CB E72452600" into
 * { nombre: "HERMANOS CORDERO GIL CB", cif: "E72452600" }
 * 
 * @param {string} armadorString - String containing armador name and CIF
 * @returns {{nombre: string, cif: string}} - Parsed armador object
 * @throws {ParsingError} If parsing fails
 */

import { ParsingError } from '@/errors/lonjasErrors';

export function parseArmador(armadorString) {
    if (!armadorString || typeof armadorString !== 'string') {
        throw new ParsingError(
            'String de armador inválido o vacío',
            'Armador',
            armadorString
        );
    }

    const trimmed = armadorString.trim();
    if (trimmed === '') {
        throw new ParsingError(
            'String de armador vacío',
            'Armador',
            armadorString
        );
    }

    // Split by spaces
    const parts = trimmed.split(' ');
    
    if (parts.length < 2) {
        throw new ParsingError(
            `No se pudo extraer CIF del armador. Formato esperado: "NOMBRE CIF". Valor: "${armadorString}"`,
            'Armador',
            armadorString
        );
    }

    // CIF is typically the last part (may contain numbers and letters)
    // Pattern: E + 8 digits, or similar formats
    const cifPattern = /^[A-Z]?[0-9]{7,9}[A-Z0-9]?$/;
    const lastPart = parts[parts.length - 1];
    
    // Try to match CIF pattern in last part
    if (cifPattern.test(lastPart)) {
        const cif = lastPart;
        const nombre = parts.slice(0, -1).join(' ');
        return { nombre, cif };
    }

    // If last part doesn't match CIF pattern, try second-to-last
    // This handles cases like "HERMANOS CORDERO GIL CB E72452600"
    // Since we already checked parts.length < 2 above, we know parts.length >= 2 here
    const secondLast = parts[parts.length - 2];
    const last = parts[parts.length - 1];
    const combinedLast = `${secondLast} ${last}`;
    
    if (cifPattern.test(combinedLast) || /^[A-Z][0-9]+/.test(combinedLast)) {
        const cif = combinedLast;
        const nombre = parts.slice(0, -2).join(' ');
        return { nombre, cif };
    }
    
    // Fallback: assume last part is CIF even if pattern doesn't match perfectly
    // This maintains compatibility with existing code
    const cif = last;
    const nombre = parts.slice(0, -1).join(' ');
    return { nombre, cif };

    // If we can't parse, throw error
    throw new ParsingError(
        `No se pudo extraer CIF del armador. Formato no reconocido: "${armadorString}"`,
        'Armador',
        armadorString
    );
}

