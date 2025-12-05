/**
 * Helpers para calcular totales de producción localmente
 * Evita tener que recargar todo el record del servidor
 */

/**
 * Calcula el peso total de inputs basándose en las cajas
 */
export function calculateTotalInputWeight(inputs) {
    if (!inputs || !Array.isArray(inputs)) return 0
    
    return inputs.reduce((sum, input) => {
        const weight = input.box?.netWeight || input.netWeight || 0
        return sum + parseFloat(weight || 0)
    }, 0)
}

/**
 * Calcula el número total de cajas de inputs
 */
export function calculateTotalInputBoxes(inputs) {
    if (!inputs || !Array.isArray(inputs)) return 0
    return inputs.filter(input => input.box?.id || input.id).length
}

/**
 * Calcula el peso total de outputs
 */
export function calculateTotalOutputWeight(outputs) {
    if (!outputs || !Array.isArray(outputs)) return 0
    
    return outputs.reduce((sum, output) => {
        const weight = output.weightKg || output.weight_kg || 0
        return sum + parseFloat(weight || 0)
    }, 0)
}

/**
 * Calcula el número total de cajas de outputs
 */
export function calculateTotalOutputBoxes(outputs) {
    if (!outputs || !Array.isArray(outputs)) return 0
    
    return outputs.reduce((sum, output) => {
        const boxes = output.boxes || 0
        return sum + parseInt(boxes || 0, 10)
    }, 0)
}

/**
 * Calcula la merma (pérdida de peso)
 */
export function calculateWaste(inputWeight, outputWeight) {
    const input = parseFloat(inputWeight || 0)
    const output = parseFloat(outputWeight || 0)
    
    if (input <= 0) return 0
    if (output >= input) return 0
    
    return input - output
}

/**
 * Calcula el porcentaje de merma
 */
export function calculateWastePercentage(inputWeight, outputWeight) {
    const input = parseFloat(inputWeight || 0)
    const waste = calculateWaste(inputWeight, outputWeight)
    
    if (input <= 0) return 0
    
    return (waste / input) * 100
}

/**
 * Calcula el rendimiento (ganancia de peso)
 */
export function calculateYield(inputWeight, outputWeight) {
    const input = parseFloat(inputWeight || 0)
    const output = parseFloat(outputWeight || 0)
    
    if (input <= 0) return 0
    if (output <= input) return 0
    
    return output - input
}

/**
 * Calcula el porcentaje de rendimiento
 */
export function calculateYieldPercentage(inputWeight, outputWeight) {
    const input = parseFloat(inputWeight || 0)
    const yieldValue = calculateYield(inputWeight, outputWeight)
    
    if (input <= 0) return 0
    
    return (yieldValue / input) * 100
}

/**
 * Calcula todos los totales de un record basándose en inputs y outputs
 * @param {Array} inputs - Array de inputs
 * @param {Array} outputs - Array de outputs
 * @returns {Object} - Objeto con todos los totales calculados
 */
export function calculateRecordTotals(inputs, outputs) {
    const totalInputWeight = calculateTotalInputWeight(inputs)
    const totalInputBoxes = calculateTotalInputBoxes(inputs)
    const totalOutputWeight = calculateTotalOutputWeight(outputs)
    const totalOutputBoxes = calculateTotalOutputBoxes(outputs)
    
    const waste = calculateWaste(totalInputWeight, totalOutputWeight)
    const wastePercentage = calculateWastePercentage(totalInputWeight, totalOutputWeight)
    const yieldValue = calculateYield(totalInputWeight, totalOutputWeight)
    const yieldPercentage = calculateYieldPercentage(totalInputWeight, totalOutputWeight)
    
    return {
        totalInputWeight,
        totalInputBoxes,
        totalOutputWeight,
        totalOutputBoxes,
        waste,
        wastePercentage,
        yield: yieldValue,
        yieldPercentage
    }
}

/**
 * Actualiza un record con totales calculados localmente
 * @param {Object} record - Record actual
 * @param {Array} inputs - Array de inputs (opcional, si no se proporciona usa record.inputs)
 * @param {Array} outputs - Array de outputs (opcional, si no se proporciona usa record.outputs)
 * @returns {Object} - Record actualizado con totales calculados
 */
export function updateRecordWithCalculatedTotals(record, inputs = null, outputs = null) {
    if (!record) return record
    
    const currentInputs = inputs || record.inputs || []
    const currentOutputs = outputs || record.outputs || []
    
    const totals = calculateRecordTotals(currentInputs, currentOutputs)
    
    return {
        ...record,
        ...totals
    }
}

