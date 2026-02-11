/**
 * Mapea los errores de validación 422 del backend al estado de errores de React Hook Form.
 * El backend devuelve: { errors: { "campo": ["mensaje"], "plannedProducts.0.product": ["mensaje"], ... } }
 * Las claves están en camelCase y los arrays usan notación de punto (ej. plannedProducts.0.product).
 *
 * @param {Function} setError - setError de useForm (react-hook-form)
 * @param {Object} errors - Objeto errors de la respuesta 422 (clave = nombre campo, valor = array de mensajes)
 */
export function setErrorsFrom422(setError, errors) {
    if (!errors || typeof errors !== 'object' || typeof setError !== 'function') {
        return;
    }
    Object.entries(errors).forEach(([key, messages]) => {
        const message = Array.isArray(messages) && messages.length > 0 ? messages[0] : String(messages);
        if (message) {
            setError(key, { type: 'server', message });
        }
    });
}
