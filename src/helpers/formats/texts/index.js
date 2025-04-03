export const normalizeText = (nombre) => {
    return nombre
        ?.normalize('NFD') // quitar tildes
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[.,]/g, '') // quitar puntos y comas
        .toLowerCase()
        .trim();
};