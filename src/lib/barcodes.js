export function eanChecksum(digits) {
    const nums = digits.replace(/\D/g, '').split('').map(Number)
    let sum = 0
    for (let i = nums.length - 1; i >= 0; i--) {
        const n = nums[i]
        sum += n * ((nums.length - i) % 2 === 0 ? 3 : 1)
    }
    return (10 - (sum % 10)) % 10
}

export const formatMap = {
    'ean13': 'EAN13',
    'ean14': 'EAN14',
    'ean13-weight': 'EAN13',
    'gs1-128': 'CODE128',
}

export function serializeBarcode(value, type) {
    const plain = String(value ?? '')
    switch (type) {
        case 'ean13':
        case 'ean13-weight': {
            let digits = plain.replace(/\D/g, '')
            digits = digits.padStart(12, '0').slice(0, 12)
            return digits + eanChecksum(digits)
        }
        case 'ean14': {
            let digits = plain.replace(/\D/g, '')
            digits = digits.padStart(13, '0').slice(0, 13)
            return digits + eanChecksum(digits)
        }
        case 'gs1-128':
        default:
            return plain
    }
}
