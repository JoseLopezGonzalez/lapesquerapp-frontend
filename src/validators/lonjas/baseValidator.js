/**
 * Base validator class with common validation methods
 * 
 * This class provides reusable validation methods that can be extended
 * by specific document type validators.
 */

import { ValidationError } from '@/errors/lonjasErrors';

export class BaseValidator {
    /**
     * Validates that a value exists (not null, not undefined)
     * @param {*} value - Value to validate
     * @param {string} fieldName - Name of the field for error messages
     * @param {string} context - Context (e.g., "document", "table") for error messages
     * @throws {ValidationError} If value is null or undefined
     */
    requireField(value, fieldName, context = '') {
        if (value === null || value === undefined) {
            const contextMsg = context ? `${context}.` : '';
            throw new ValidationError(
                `Campo requerido faltante: ${contextMsg}${fieldName}`,
                fieldName,
                { context }
            );
        }
    }

    /**
     * Validates that a value is an array
     * @param {*} value - Value to validate
     * @param {string} fieldName - Name of the field for error messages
     * @param {string} context - Context for error messages
     * @throws {ValidationError} If value is not an array
     */
    requireArray(value, fieldName, context = '') {
        this.requireField(value, fieldName, context);
        if (!Array.isArray(value)) {
            const contextMsg = context ? `${context}.` : '';
            throw new ValidationError(
                `Campo debe ser un array: ${contextMsg}${fieldName}`,
                fieldName,
                { context, expectedType: 'array', actualType: typeof value }
            );
        }
    }

    /**
     * Validates that a value is an object
     * @param {*} value - Value to validate
     * @param {string} fieldName - Name of the field for error messages
     * @param {string} context - Context for error messages
     * @throws {ValidationError} If value is not an object
     */
    requireObject(value, fieldName, context = '') {
        this.requireField(value, fieldName, context);
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
            const contextMsg = context ? `${context}.` : '';
            throw new ValidationError(
                `Campo debe ser un objeto: ${contextMsg}${fieldName}`,
                fieldName,
                { context, expectedType: 'object', actualType: typeof value }
            );
        }
    }

    /**
     * Validates that an array is not empty
     * @param {Array} array - Array to validate
     * @param {string} fieldName - Name of the field for error messages
     * @param {string} context - Context for error messages
     * @throws {ValidationError} If array is empty
     */
    requireNonEmptyArray(array, fieldName, context = '') {
        this.requireArray(array, fieldName, context);
        if (array.length === 0) {
            const contextMsg = context ? `${context}.` : '';
            throw new ValidationError(
                `Array no puede estar vacío: ${contextMsg}${fieldName}`,
                fieldName,
                { context }
            );
        }
    }

    /**
     * Validates that a string is not empty (after trimming)
     * @param {string} value - String to validate
     * @param {string} fieldName - Name of the field for error messages
     * @param {string} context - Context for error messages
     * @throws {ValidationError} If string is empty
     */
    requireNonEmptyString(value, fieldName, context = '') {
        this.requireField(value, fieldName, context);
        if (typeof value !== 'string' || value.trim() === '') {
            const contextMsg = context ? `${context}.` : '';
            throw new ValidationError(
                `Campo debe ser un string no vacío: ${contextMsg}${fieldName}`,
                fieldName,
                { context, expectedType: 'non-empty string' }
            );
        }
    }

    /**
     * Validates that a value is a number
     * @param {*} value - Value to validate
     * @param {string} fieldName - Name of the field for error messages
     * @param {string} context - Context for error messages
     * @throws {ValidationError} If value is not a number
     */
    requireNumber(value, fieldName, context = '') {
        this.requireField(value, fieldName, context);
        if (typeof value !== 'number' || isNaN(value)) {
            const contextMsg = context ? `${context}.` : '';
            throw new ValidationError(
                `Campo debe ser un número: ${contextMsg}${fieldName}`,
                fieldName,
                { context, expectedType: 'number', actualType: typeof value }
            );
        }
    }

    /**
     * Validates nested object structure
     * @param {Object} obj - Object to validate
     * @param {string[]} path - Array of property names representing the path
     * @param {string} context - Context for error messages
     * @throws {ValidationError} If path doesn't exist
     * @returns {*} The value at the end of the path
     */
    requireNestedField(obj, path, context = '') {
        this.requireObject(obj, path[0], context);
        
        let current = obj;
        const fullPath = path.join('.');
        
        for (let i = 0; i < path.length; i++) {
            const key = path[i];
            if (current[key] === null || current[key] === undefined) {
                const contextMsg = context ? `${context}.` : '';
                throw new ValidationError(
                    `Campo anidado faltante: ${contextMsg}${fullPath}`,
                    fullPath,
                    { context, path }
                );
            }
            current = current[key];
        }
        
        return current;
    }
}

