/**
 * Utilidades de formateo de fechas para el módulo de producción
 * Convierte entre formato ISO (backend) y datetime-local (inputs HTML)
 * y entre formato ISO (backend) y date (inputs HTML solo fecha)
 */

/**
 * Convierte una fecha ISO a formato date para inputs HTML (solo fecha, sin hora)
 * @param {string|Date|null|undefined} isoDate - Fecha en formato ISO
 * @returns {string} - Fecha en formato YYYY-MM-DD o cadena vacía
 */
export const isoToDate = (isoDate) => {
    if (!isoDate) return ''
    
    try {
        const date = new Date(isoDate)
        
        // Verificar que la fecha es válida
        if (isNaN(date.getTime())) {
            return ''
        }
        
        // Formato: YYYY-MM-DD (solo fecha)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        
        return `${year}-${month}-${day}`
    } catch (error) {
        console.error('Error converting ISO to date:', error)
        return ''
    }
}

/**
 * Convierte una fecha date (YYYY-MM-DD) a formato ISO agregando hora por defecto
 * @param {string|null|undefined} dateValue - Fecha en formato YYYY-MM-DD
 * @param {number} defaultHour - Hora por defecto (default: 12)
 * @param {number} defaultMinute - Minuto por defecto (default: 0)
 * @returns {string|null} - Fecha en formato ISO o null
 */
export const dateToIso = (dateValue, defaultHour = 12, defaultMinute = 0) => {
    if (!dateValue || dateValue.trim() === '') {
        return null
    }
    
    try {
        // Crear fecha con la hora por defecto (12:00:00)
        const date = new Date(dateValue)
        date.setHours(defaultHour, defaultMinute, 0, 0)
        
        // Verificar que la fecha es válida
        if (isNaN(date.getTime())) {
            return null
        }
        
        // Convertir a ISO string (YYYY-MM-DDTHH:mm:ssZ)
        return date.toISOString()
    } catch (error) {
        console.error('Error converting date to ISO:', error)
        return null
    }
}

/**
 * Convierte una fecha ISO a formato datetime-local para inputs HTML
 * @param {string|Date|null|undefined} isoDate - Fecha en formato ISO
 * @returns {string} - Fecha en formato YYYY-MM-DDTHH:mm o cadena vacía
 */
export const isoToDateTimeLocal = (isoDate) => {
    if (!isoDate) return ''
    
    try {
        const date = new Date(isoDate)
        
        // Verificar que la fecha es válida
        if (isNaN(date.getTime())) {
            return ''
        }
        
        // Formato: YYYY-MM-DDTHH:mm
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        
        return `${year}-${month}-${day}T${hours}:${minutes}`
    } catch (error) {
        console.error('Error converting ISO to datetime-local:', error)
        return ''
    }
}

/**
 * Convierte una fecha datetime-local a formato ISO
 * Preserva la hora local exacta sin aplicar conversión de zona horaria
 * @param {string|null|undefined} datetimeLocal - Fecha en formato YYYY-MM-DDTHH:mm
 * @returns {string|null} - Fecha en formato ISO (YYYY-MM-DDTHH:mm:ss) o null
 */
export const datetimeLocalToIso = (datetimeLocal) => {
    if (!datetimeLocal || datetimeLocal.trim() === '') {
        return null
    }
    
    try {
        // Parsear el string datetime-local directamente
        // Formato esperado: YYYY-MM-DDTHH:mm o YYYY-MM-DDTHH:mm:ss
        const parts = datetimeLocal.split('T')
        if (parts.length !== 2) {
            return null
        }
        
        const datePart = parts[0] // YYYY-MM-DD
        const timePart = parts[1] // HH:mm o HH:mm:ss
        
        // Validar formato básico
        const dateMatch = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/)
        if (!dateMatch) {
            return null
        }
        
        // Asegurar que el tiempo tenga segundos (agregar :00 si falta)
        const timeWithSeconds = timePart.includes(':') && timePart.split(':').length === 2 
            ? `${timePart}:00` 
            : timePart
        
        // Construir string ISO preservando la hora local exacta
        // Formato: YYYY-MM-DDTHH:mm:ss (sin Z, para que el backend lo interprete en su zona horaria)
        const isoString = `${datePart}T${timeWithSeconds}`
        
        // Validar que es una fecha válida
        const testDate = new Date(isoString)
        if (isNaN(testDate.getTime())) {
            return null
        }
        
        return isoString
    } catch (error) {
        console.error('Error converting datetime-local to ISO:', error)
        return null
    }
}

/**
 * Convierte múltiples campos de fecha de ISO a datetime-local
 * @param {object} record - Objeto con fechas en formato ISO
 * @param {string[]} fields - Array de nombres de campos a convertir
 * @returns {object} - Objeto con fechas convertidas a datetime-local
 */
export const convertRecordDatesToLocal = (record, fields = ['startedAt', 'finishedAt']) => {
    if (!record) return {}
    
    const converted = { ...record }
    
    fields.forEach(field => {
        const snakeCaseField = field.replace(/([A-Z])/g, '_$1').toLowerCase()
        const value = record[field] || record[snakeCaseField]
        
        if (value) {
            converted[field] = isoToDateTimeLocal(value)
            converted[snakeCaseField] = isoToDateTimeLocal(value)
        }
    })
    
    return converted
}

/**
 * Convierte múltiples campos de fecha de datetime-local a ISO
 * @param {object} formData - Objeto con fechas en formato datetime-local
 * @param {string[]} fields - Array de nombres de campos a convertir
 * @returns {object} - Objeto con fechas convertidas a ISO
 */
export const convertFormDatesToIso = (formData, fields = ['started_at', 'finished_at']) => {
    if (!formData) return {}
    
    const converted = {}
    
    fields.forEach(field => {
        const value = formData[field]
        if (value && value.trim() !== '') {
            const isoValue = datetimeLocalToIso(value)
            if (isoValue) {
                // Mantener ambos formatos para compatibilidad
                converted[field] = value
                converted[field.replace('_at', 'At')] = isoValue
            }
        } else {
            converted[field] = null
        }
    })
    
    return converted
}

