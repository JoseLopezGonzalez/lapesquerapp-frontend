/**
 * Logger que solo emite en desarrollo.
 * En producción, log/info/debug son no-op; error/warn se mantienen.
 * Útil para reducir ruido y overhead en cliente.
 */
const isDev = process.env.NODE_ENV === 'development';

export const log = isDev ? (...args) => console.log(...args) : () => {};
export const info = isDev ? (...args) => console.info(...args) : () => {};
export const debug = isDev ? (...args) => console.debug(...args) : () => {};
export const warn = (...args) => console.warn(...args);
export const error = (...args) => console.error(...args);
