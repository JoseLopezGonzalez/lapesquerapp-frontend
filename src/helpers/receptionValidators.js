/**
 * Validation functions for reception forms
 * Centralized validation logic
 */

/**
 * Validates supplier selection
 * @param {string|number|null} supplier - Supplier ID
 * @returns {string|null} Error message or null if valid
 */
export const validateSupplier = (supplier) => {
    if (!supplier) {
        return 'Debe seleccionar un proveedor';
    }
    return null;
};

/**
 * Validates date
 * @param {Date|string|null} date - Date to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateDate = (date) => {
    if (!date) {
        return 'Debe seleccionar una fecha';
    }
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return 'La fecha no es válida';
    }
    return null;
};

/**
 * Validates net weight
 * @param {number|string} netWeight - Net weight value
 * @param {boolean} required - Whether the field is required
 * @returns {string|null} Error message or null if valid
 */
export const validateNetWeight = (netWeight, required = true) => {
    if (required && (!netWeight || netWeight === '')) {
        return 'El peso neto es obligatorio';
    }
    const weight = parseFloat(netWeight);
    if (isNaN(weight)) {
        return 'El peso debe ser un número válido';
    }
    if (weight < 0) {
        return 'El peso no puede ser negativo';
    }
    if (weight > 100000) {
        return 'El peso es demasiado grande (máximo 100,000 kg)';
    }
    if (required && weight <= 0) {
        return 'El peso debe ser mayor que 0';
    }
    return null;
};

/**
 * Validates price
 * @param {number|string} price - Price value
 * @param {boolean} required - Whether the field is required
 * @returns {string|null} Error message or null if valid
 */
export const validatePrice = (price, required = false) => {
    if (!required && (!price || price === '')) {
        return null; // Price is optional
    }
    if (required && (!price || price === '')) {
        return 'El precio es obligatorio';
    }
    const priceValue = parseFloat(price);
    if (isNaN(priceValue)) {
        return 'El precio debe ser un número válido';
    }
    if (priceValue < 0) {
        return 'El precio no puede ser negativo';
    }
    if (priceValue > 10000) {
        return 'El precio es demasiado alto (máximo 10,000 €/kg)';
    }
    return null;
};

/**
 * Validates boxes count
 * @param {number|string} boxes - Number of boxes
 * @param {boolean} required - Whether the field is required
 * @returns {string|null} Error message or null if valid
 */
export const validateBoxes = (boxes, required = true) => {
    if (required && (!boxes || boxes === '')) {
        return 'Las cajas son obligatorias';
    }
    const boxCount = parseInt(boxes);
    if (isNaN(boxCount)) {
        return 'El número de cajas debe ser un número válido';
    }
    if (boxCount < 1) {
        return 'Debe haber al menos 1 caja';
    }
    if (boxCount > 10000) {
        return 'El número de cajas es demasiado grande (máximo 10,000)';
    }
    return null;
};

/**
 * Validates declared total amount
 * @param {number|string} amount - Total amount
 * @returns {string|null} Error message or null if valid
 */
export const validateDeclaredTotalAmount = (amount) => {
    if (!amount || amount === '') {
        return null; // Optional field
    }
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue)) {
        return 'El importe debe ser un número válido';
    }
    if (amountValue < 0) {
        return 'El importe no puede ser negativo';
    }
    if (amountValue > 10000000) {
        return 'El importe es demasiado grande (máximo 10,000,000 €)';
    }
    return null;
};

/**
 * Validates declared total net weight
 * @param {number|string} weight - Total net weight
 * @returns {string|null} Error message or null if valid
 */
export const validateDeclaredTotalNetWeight = (weight) => {
    if (!weight || weight === '') {
        return null; // Optional field
    }
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue)) {
        return 'El peso debe ser un número válido';
    }
    if (weightValue < 0) {
        return 'El peso no puede ser negativo';
    }
    if (weightValue > 1000000) {
        return 'El peso es demasiado grande (máximo 1,000,000 kg)';
    }
    return null;
};

/**
 * Validates reception details for automatic mode
 * @param {Array} details - Array of detail objects
 * @returns {string|null} Error message or null if valid
 */
export const validateReceptionDetails = (details) => {
    if (!details || details.length === 0) {
        return 'Debe agregar al menos una línea de producto';
    }
    
    const validDetails = details.filter(detail => 
        detail.product && 
        detail.netWeight && 
        parseFloat(detail.netWeight) > 0
    );
    
    if (validDetails.length === 0) {
        return 'Debe completar al menos una línea válida con producto y peso neto';
    }
    
    return null;
};

/**
 * Validates temporal pallets for manual mode
 * @param {Array} temporalPallets - Array of temporal pallet items
 * @returns {string|null} Error message or null if valid
 */
export const validateTemporalPallets = (temporalPallets) => {
    if (!temporalPallets || temporalPallets.length === 0) {
        return 'Debe agregar al menos un palet';
    }
    
    const validPallets = temporalPallets.filter(item => {
        const pallet = item?.pallet;
        if (!pallet?.boxes || pallet.boxes.length === 0) return false;
        
        return pallet.boxes.some(box => box.product?.id && box.netWeight);
    });
    
    if (validPallets.length === 0) {
        return 'Debe completar al menos un palet válido con producto y cajas';
    }
    
    return null;
};

