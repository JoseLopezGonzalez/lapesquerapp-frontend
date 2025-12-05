/**
 * Normalizadores de datos para Production Records
 * Convierte datos de snake_case a camelCase para consistencia en toda la aplicación
 */

/**
 * Normaliza un Production Record de snake_case a camelCase
 * @param {object} record - Record en formato snake_case o camelCase
 * @returns {object} - Record normalizado en camelCase
 */
export const normalizeProductionRecord = (record) => {
    if (!record) return null
    
    return {
        id: record.id,
        productionId: record.production_id || record.productionId,
        parentRecordId: record.parent_record_id || record.parentRecordId || null,
        processId: record.process_id || record.processId,
        process: record.process ? normalizeProcess(record.process) : (record.process || null),
        startedAt: record.started_at || record.startedAt,
        finishedAt: record.finished_at || record.finishedAt || null,
        notes: record.notes || null,
        isCompleted: record.is_completed || record.isCompleted || false,
        isRoot: record.is_root || record.isRoot || false,
        
        // Totales
        totalInputWeight: record.total_input_weight || record.totalInputWeight || 0,
        totalOutputWeight: record.total_output_weight || record.totalOutputWeight || 0,
        totalInputBoxes: record.total_input_boxes || record.totalInputBoxes || 0,
        totalOutputBoxes: record.total_output_boxes || record.totalOutputBoxes || 0,
        waste: record.waste || 0,
        wastePercentage: record.waste_percentage || record.wastePercentage || 0,
        yield: record.yield || 0,
        yieldPercentage: record.yield_percentage || record.yieldPercentage || 0,
        
        // Relaciones
        inputs: Array.isArray(record.inputs) 
            ? record.inputs.map(normalizeProductionInput)
            : (record.inputs || []),
        outputs: Array.isArray(record.outputs)
            ? record.outputs.map(normalizeProductionOutput)
            : (record.outputs || []),
        parentOutputConsumptions: Array.isArray(record.parent_output_consumptions)
            ? record.parent_output_consumptions.map(normalizeProductionOutputConsumption)
            : (Array.isArray(record.parentOutputConsumptions)
                ? record.parentOutputConsumptions.map(normalizeProductionOutputConsumption)
                : []),
    }
}

/**
 * Normaliza un Process
 * @param {object} process - Process en formato snake_case o camelCase
 * @returns {object} - Process normalizado
 */
export const normalizeProcess = (process) => {
    if (!process) return null
    
    return {
        id: process.id,
        name: process.name,
        type: process.type,
        description: process.description || null,
    }
}

/**
 * Normaliza un Production Input
 * @param {object} input - Input en formato snake_case o camelCase
 * @returns {object} - Input normalizado
 */
export const normalizeProductionInput = (input) => {
    if (!input) return null
    
    return {
        id: input.id,
        productionRecordId: input.production_record_id || input.productionRecordId,
        boxId: input.box_id || input.boxId,
        box: input.box ? normalizeBox(input.box) : (input.box || null),
    }
}

/**
 * Normaliza un Production Output
 * @param {object} output - Output en formato snake_case o camelCase
 * @returns {object} - Output normalizado
 */
export const normalizeProductionOutput = (output) => {
    if (!output) return null
    
    return {
        id: output.id,
        productionRecordId: output.production_record_id || output.productionRecordId,
        productId: output.product_id || output.productId,
        product: output.product ? normalizeProduct(output.product) : (output.product || null),
        lotId: output.lot_id || output.lotId || null,
        weightKg: output.weight_kg || output.weightKg || 0,
        boxes: output.boxes || output.quantity_boxes || 0,
        notes: output.notes || null,
    }
}

/**
 * Normaliza un Production Output Consumption
 * @param {object} consumption - Consumption en formato snake_case o camelCase
 * @returns {object} - Consumption normalizado
 */
export const normalizeProductionOutputConsumption = (consumption) => {
    if (!consumption) return null
    
    return {
        id: consumption.id,
        productionRecordId: consumption.production_record_id || consumption.productionRecordId,
        productionOutputId: consumption.production_output_id || consumption.productionOutputId,
        productionOutput: consumption.production_output 
            ? normalizeProductionOutput(consumption.production_output)
            : (consumption.productionOutput 
                ? normalizeProductionOutput(consumption.productionOutput)
                : null),
        consumedWeightKg: consumption.consumed_weight_kg || consumption.consumedWeightKg || 0,
        consumedBoxes: consumption.consumed_boxes || consumption.consumedBoxes || 0,
        notes: consumption.notes || null,
    }
}

/**
 * Normaliza un Product
 * @param {object} product - Product en formato snake_case o camelCase
 * @returns {object} - Product normalizado
 */
export const normalizeProduct = (product) => {
    if (!product) return null
    
    return {
        id: product.id,
        name: product.name,
        code: product.code || null,
        description: product.description || null,
    }
}

/**
 * Normaliza un Box
 * @param {object} box - Box en formato snake_case o camelCase
 * @returns {object} - Box normalizado
 */
export const normalizeBox = (box) => {
    if (!box) return null
    
    return {
        id: box.id,
        product: box.product ? normalizeProduct(box.product) : (box.product || null),
        productId: box.product_id || box.productId,
        lot: box.lot || null,
        netWeight: box.net_weight || box.netWeight || 0,
        palletId: box.pallet_id || box.palletId || null,
        isAvailable: box.is_available !== undefined ? box.is_available : (box.isAvailable !== undefined ? box.isAvailable : true),
    }
}

/**
 * Normaliza una Production
 * @param {object} production - Production en formato snake_case o camelCase
 * @returns {object} - Production normalizada
 */
export const normalizeProduction = (production) => {
    if (!production) return null
    
    return {
        id: production.id,
        lot: production.lot || null,
        species: production.species ? normalizeSpecies(production.species) : (production.species || null),
        captureZone: production.capture_zone 
            ? normalizeCaptureZone(production.capture_zone)
            : (production.captureZone || null),
        openedAt: production.opened_at || production.openedAt,
        closedAt: production.closed_at || production.closedAt || null,
        notes: production.notes || null,
        waste: production.waste || 0,
        wastePercentage: production.waste_percentage || production.wastePercentage || 0,
        yield: production.yield || 0,
        yieldPercentage: production.yield_percentage || production.yieldPercentage || 0,
        reconciliation: production.reconciliation || null,
    }
}

/**
 * Normaliza una Species
 * @param {object} species - Species en formato snake_case o camelCase
 * @returns {object} - Species normalizada
 */
export const normalizeSpecies = (species) => {
    if (!species) return null
    
    return {
        id: species.id,
        name: species.name,
    }
}

/**
 * Normaliza una Capture Zone
 * @param {object} zone - Capture Zone en formato snake_case o camelCase
 * @returns {object} - Capture Zone normalizada
 */
export const normalizeCaptureZone = (zone) => {
    if (!zone) return null
    
    return {
        id: zone.id,
        name: zone.name,
    }
}

/**
 * Normaliza una respuesta de API que contiene un array de records
 * @param {object} response - Respuesta de la API
 * @returns {object} - Respuesta normalizada
 */
export const normalizeProductionRecordsResponse = (response) => {
    if (!response) return { data: [], meta: null }
    
    const data = response.data || response
    const normalizedData = Array.isArray(data) 
        ? data.map(normalizeProductionRecord)
        : []
    
    return {
        data: normalizedData,
        meta: response.meta || null,
    }
}

/**
 * Normaliza una respuesta de API que contiene un solo record
 * @param {object} response - Respuesta de la API
 * @returns {object} - Record normalizado
 */
export const normalizeProductionRecordResponse = (response) => {
    if (!response) return null
    
    const data = response.data || response
    return normalizeProductionRecord(data)
}

