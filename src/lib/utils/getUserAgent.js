/**
 * Helper para obtener el User-Agent, compatible con cliente y servidor.
 * 
 * En el cliente (navegador), usa navigator.userAgent.
 * En el servidor (Node.js), navigator no existe, usa un User-Agent estándar.
 * 
 * @returns {string} User-Agent string
 */
export function getUserAgent() {
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
        return navigator.userAgent;
    }
    // User-Agent estándar para llamadas desde el servidor (Node.js)
    return 'Node.js/LaPesquerApp-Server';
}

