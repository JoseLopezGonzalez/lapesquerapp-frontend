
/* Función para concatenar clases de forma dinámica
 * @param {Array} classes - Clases a concatenar
 * @return {String} - Clases concatenadas
 */

export function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}