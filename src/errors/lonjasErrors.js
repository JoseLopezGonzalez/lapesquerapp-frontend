/**
 * Custom error classes for lonja data processing
 * 
 * These errors are used to provide specific error handling and messaging
 * for validation and parsing operations in the lonja data extraction system.
 */

/**
 * Error thrown when data validation fails
 * @extends Error
 */
export class ValidationError extends Error {
    /**
     * @param {string} message - Error message
     * @param {string|null} field - Field name that failed validation (optional)
     * @param {Object} details - Additional error details (optional)
     */
    constructor(message, field = null, details = {}) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.details = details;
        
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ValidationError);
        }
    }
}

/**
 * Error thrown when data parsing fails
 * @extends Error
 */
export class ParsingError extends Error {
    /**
     * @param {string} message - Error message
     * @param {string|null} field - Field name that failed parsing (optional)
     * @param {*} originalValue - Original value that failed to parse (optional)
     */
    constructor(message, field = null, originalValue = null) {
        super(message);
        this.name = 'ParsingError';
        this.field = field;
        this.originalValue = originalValue;
        
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ParsingError);
        }
    }
}

/**
 * Error thrown when document type doesn't match expected type
 * @extends Error
 */
export class DocumentTypeMismatchError extends Error {
    /**
     * @param {string} message - Error message
     * @param {string} expectedType - Expected document type
     * @param {string} detectedType - Detected document type
     */
    constructor(message, expectedType = null, detectedType = null) {
        super(message);
        this.name = 'DocumentTypeMismatchError';
        this.expectedType = expectedType;
        this.detectedType = detectedType;
        
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DocumentTypeMismatchError);
        }
    }
}

