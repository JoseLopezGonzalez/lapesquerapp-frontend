export const formatNumberEs = (number) => {
    return Intl.NumberFormat('es-ES', { style: 'decimal', minimumFractionDigits: 2, useGrouping: true }).format(number);
}

export const formatNumberEsEur = (number) => {
    return `${formatNumberEs(number)} €`;
}

/* formatNumberEsKg */
export const formatNumberEsKg = (number) => {
    return `${formatNumberEs(number)} Kg`;
}