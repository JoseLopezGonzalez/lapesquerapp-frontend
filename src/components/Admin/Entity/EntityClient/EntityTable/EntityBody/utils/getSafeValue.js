export function getSafeValue(value) {
    return value === undefined || value === null ? "-" : value;
}
