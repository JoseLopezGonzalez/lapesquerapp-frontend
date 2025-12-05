/**
 * Hook para manejar notificaciones centralizadas
 * Proporciona funciones para mostrar errores, éxitos y advertencias
 */

import { useState, useCallback } from 'react'

/**
 * Tipos de notificación
 */
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
}

/**
 * Hook para usar notificaciones
 * @returns {object} - Funciones para mostrar notificaciones
 */
export const useNotifications = () => {
    const [notifications, setNotifications] = useState([])

    /**
     * Muestra una notificación
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de notificación (success, error, warning, info)
     * @param {object} options - Opciones adicionales
     * @param {number} options.duration - Duración en ms (default: 5000)
     * @param {Function} options.onClose - Callback cuando se cierra
     * @param {string} options.actionLabel - Etiqueta de acción opcional
     * @param {Function} options.onAction - Callback de acción opcional
     */
    const showNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, options = {}) => {
        const {
            duration = 5000,
            onClose = null,
            actionLabel = null,
            onAction = null,
        } = options

        const id = Date.now() + Math.random()
        const notification = {
            id,
            message,
            type,
            duration,
            onClose,
            actionLabel,
            onAction,
        }

        setNotifications(prev => [...prev, notification])

        // Auto-remover después de la duración
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id)
                if (onClose) onClose()
            }, duration)
        }

        return id
    }, [])

    /**
     * Muestra una notificación de éxito
     */
    const showSuccess = useCallback((message, options = {}) => {
        return showNotification(message, NOTIFICATION_TYPES.SUCCESS, options)
    }, [showNotification])

    /**
     * Muestra una notificación de error
     */
    const showError = useCallback((message, options = {}) => {
        return showNotification(message, NOTIFICATION_TYPES.ERROR, {
            duration: 7000, // Errores se muestran más tiempo
            ...options,
        })
    }, [showNotification])

    /**
     * Muestra una notificación de advertencia
     */
    const showWarning = useCallback((message, options = {}) => {
        return showNotification(message, NOTIFICATION_TYPES.WARNING, {
            duration: 6000,
            ...options,
        })
    }, [showNotification])

    /**
     * Muestra una notificación informativa
     */
    const showInfo = useCallback((message, options = {}) => {
        return showNotification(message, NOTIFICATION_TYPES.INFO, options)
    }, [showNotification])

    /**
     * Remueve una notificación
     */
    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }, [])

    /**
     * Limpia todas las notificaciones
     */
    const clearNotifications = useCallback(() => {
        setNotifications([])
    }, [])

    /**
     * Maneja un error de API y muestra una notificación
     */
    const handleApiError = useCallback((error, defaultMessage = 'Ha ocurrido un error') => {
        let message = defaultMessage

        if (error?.message) {
            message = error.message
        } else if (typeof error === 'string') {
            message = error
        } else if (error?.data?.message) {
            message = error.data.message
        }

        showError(message)
        return message
    }, [showError])

    return {
        notifications,
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeNotification,
        clearNotifications,
        handleApiError,
    }
}

/**
 * Componente de notificaciones (Toast)
 * Debe ser usado en el layout principal
 */
export const NotificationContainer = ({ notifications, onRemove }) => {
    if (!notifications || notifications.length === 0) return null

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
            {notifications.map((notification) => (
                <NotificationToast
                    key={notification.id}
                    notification={notification}
                    onRemove={onRemove}
                />
            ))}
        </div>
    )
}

/**
 * Componente individual de notificación
 */
const NotificationToast = ({ notification, onRemove }) => {
    const { id, message, type, actionLabel, onAction } = notification

    const getStyles = () => {
        const baseStyles = "p-4 rounded-lg shadow-lg border flex items-start gap-3 animate-in slide-in-from-right"
        
        switch (type) {
            case NOTIFICATION_TYPES.SUCCESS:
                return `${baseStyles} bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200`
            case NOTIFICATION_TYPES.ERROR:
                return `${baseStyles} bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200`
            case NOTIFICATION_TYPES.WARNING:
                return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200`
            default:
                return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200`
        }
    }

    const getIcon = () => {
        switch (type) {
            case NOTIFICATION_TYPES.SUCCESS:
                return '✓'
            case NOTIFICATION_TYPES.ERROR:
                return '✕'
            case NOTIFICATION_TYPES.WARNING:
                return '⚠'
            default:
                return 'ℹ'
        }
    }

    return (
        <div className={getStyles()}>
            <span className="font-semibold text-lg flex-shrink-0">{getIcon()}</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{message}</p>
                {actionLabel && onAction && (
                    <button
                        onClick={() => {
                            onAction()
                            onRemove(id)
                        }}
                        className="mt-2 text-xs font-semibold underline"
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
            <button
                onClick={() => onRemove(id)}
                className="flex-shrink-0 text-current opacity-50 hover:opacity-100"
                aria-label="Cerrar"
            >
                ×
            </button>
        </div>
    )
}

