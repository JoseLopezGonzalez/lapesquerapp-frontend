/**
 * Centralized error handling for reception operations
 * Provides consistent error messages and error codes
 */

/**
 * Error codes for different types of errors
 */
export const RECEPTION_ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

/**
 * Maps error types to user-friendly messages
 */
const ERROR_MESSAGES = {
    [RECEPTION_ERROR_CODES.VALIDATION_ERROR]: {
        supplier: 'Debe seleccionar un proveedor',
        date: 'Debe seleccionar una fecha válida',
        details: 'Debe agregar al menos una línea de producto válida',
        pallets: 'Debe agregar al menos un palet válido',
        netWeight: 'El peso neto debe ser mayor que 0',
        price: 'El precio debe ser un número válido',
        boxes: 'El número de cajas debe ser al menos 1',
    },
    [RECEPTION_ERROR_CODES.NETWORK_ERROR]: 'Error de conexión. Por favor, verifique su conexión a internet e intente nuevamente.',
    [RECEPTION_ERROR_CODES.AUTH_ERROR]: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
    [RECEPTION_ERROR_CODES.SERVER_ERROR]: 'Error del servidor. Por favor, intente más tarde o contacte al administrador.',
    [RECEPTION_ERROR_CODES.UNKNOWN_ERROR]: 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.',
};

/**
 * Analyzes an error and returns error information
 * @param {Error|Object} error - Error object
 * @param {string} context - Context where error occurred (e.g., 'create', 'update', 'load')
 * @returns {Object} Error information with code, message, and details
 */
export const analyzeReceptionError = (error, context = 'operation') => {
    // Check if it's a validation error from API
    if (error?.response?.status === 422 || error?.status === 422) {
        const errorData = error?.response?.data || error?.data || {};
        const validationErrors = errorData.errors || {};
        
        // Priorizar userMessage sobre message para mostrar errores en formato natural
        // El userMessage puede venir en errorData.userMessage o ya estar en error.message (desde fetchWithTenant)
        const userMessage = errorData.userMessage;
        const errorMessage = error?.message;
        
        // Usar userMessage si está disponible, sino usar el mensaje del error (que ya puede contener userMessage),
        // sino usar el primer error de validación, sino usar un mensaje genérico
        const finalMessage = userMessage || 
                            (errorMessage && !errorMessage.includes('Error HTTP') ? errorMessage : null) ||
                            Object.values(validationErrors)[0]?.[0] || 
                            'Error de validación';
        
        return {
            code: RECEPTION_ERROR_CODES.VALIDATION_ERROR,
            message: finalMessage,
            details: validationErrors,
            field: Object.keys(validationErrors)[0],
        };
    }

    // Check for network errors
    if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.code === 'NETWORK_ERROR') {
        return {
            code: RECEPTION_ERROR_CODES.NETWORK_ERROR,
            message: ERROR_MESSAGES[RECEPTION_ERROR_CODES.NETWORK_ERROR],
            details: error.message,
        };
    }

    // Check for authentication errors
    if (error?.response?.status === 401 || error?.status === 401 || error?.message?.includes('sesión')) {
        return {
            code: RECEPTION_ERROR_CODES.AUTH_ERROR,
            message: ERROR_MESSAGES[RECEPTION_ERROR_CODES.AUTH_ERROR],
            details: error.message,
        };
    }

    // Check for server errors
    if (error?.response?.status >= 500 || error?.status >= 500) {
        return {
            code: RECEPTION_ERROR_CODES.SERVER_ERROR,
            message: ERROR_MESSAGES[RECEPTION_ERROR_CODES.SERVER_ERROR],
            details: error.message,
        };
    }

    // Check for specific error messages
    if (error?.message) {
        // Si el error tiene data con userMessage, priorizarlo
        const userMessage = error?.data?.userMessage;
        if (userMessage) {
            return {
                code: RECEPTION_ERROR_CODES.VALIDATION_ERROR,
                message: userMessage,
                details: error.data,
            };
        }
        
        // Si el error.message ya contiene un mensaje útil (no es genérico), usarlo
        // Esto cubre el caso donde fetchWithTenant ya puso el userMessage en error.message
        if (error.message && !error.message.includes('Error HTTP') && !error.message.includes('Error inesperado')) {
            // Verificar si parece un mensaje de validación
            if (error.status === 422 || error?.data?.errors) {
                return {
                    code: RECEPTION_ERROR_CODES.VALIDATION_ERROR,
                    message: error.message,
                    details: error.data || {},
                };
            }
        }
        
        // Check if it's a known validation error
        const knownErrors = Object.values(ERROR_MESSAGES[RECEPTION_ERROR_CODES.VALIDATION_ERROR]);
        if (knownErrors.some(msg => error.message.includes(msg))) {
            return {
                code: RECEPTION_ERROR_CODES.VALIDATION_ERROR,
                message: error.message,
                details: error.message,
            };
        }

        // Return error with original message
        return {
            code: RECEPTION_ERROR_CODES.UNKNOWN_ERROR,
            message: error.message || ERROR_MESSAGES[RECEPTION_ERROR_CODES.UNKNOWN_ERROR],
            details: error.message,
        };
    }

    // Default unknown error
    return {
        code: RECEPTION_ERROR_CODES.UNKNOWN_ERROR,
        message: ERROR_MESSAGES[RECEPTION_ERROR_CODES.UNKNOWN_ERROR],
        details: String(error),
    };
};

/**
 * Gets a user-friendly error message for a specific field
 * @param {string} field - Field name
 * @param {string} errorCode - Error code
 * @returns {string} User-friendly error message
 */
export const getFieldErrorMessage = (field, errorCode = RECEPTION_ERROR_CODES.VALIDATION_ERROR) => {
    return ERROR_MESSAGES[errorCode]?.[field] || ERROR_MESSAGES[errorCode] || 'Error de validación';
};

/**
 * Formats error for display to user
 * @param {Error|Object} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {string} Formatted error message
 */
export const formatReceptionError = (error, context = 'operation') => {
    const errorInfo = analyzeReceptionError(error, context);
    return errorInfo.message;
};

/**
 * Logs error with context for debugging
 * @param {Error|Object} error - Error object
 * @param {string} context - Context where error occurred
 * @param {Object} additionalInfo - Additional information to log
 */
export const logReceptionError = (error, context = 'operation', additionalInfo = {}) => {
    const errorInfo = analyzeReceptionError(error, context);
    
    console.error(`[Reception ${context}] Error:`, {
        code: errorInfo.code,
        message: errorInfo.message,
        details: errorInfo.details,
        field: errorInfo.field,
        ...additionalInfo,
        originalError: error,
    });
    
    return errorInfo;
};

