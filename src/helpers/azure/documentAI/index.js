import { ValidationError } from '@/errors/lonjasErrors';

export const parseAzureDocumentAIResult = (data) => {
    // VALIDACIÓN ESTRUCTURAL: FALLAR si no es válido
    if (!data) {
        throw new ValidationError('Respuesta de Azure vacía o inválida');
    }

    if (!data.documents) {
        throw new ValidationError('Estructura de Azure inválida: campo "documents" no encontrado');
    }

    if (!Array.isArray(data.documents)) {
        throw new ValidationError('Campo "documents" debe ser un array');
    }

    if (data.documents.length === 0) {
        throw new ValidationError('No se encontraron documentos en la respuesta de Azure');
    }

    const analyzedDocuments = [];

    // Accedemos a los documentos (ya validado que existe y es array)
    const documents = data.documents;

    documents.forEach((document, index) => {
        // Validar estructura básica de cada documento
        if (!document) {
            throw new ValidationError(`Documento en índice ${index} es null o undefined`);
        }

        if (!document.fields || typeof document.fields !== 'object') {
            throw new ValidationError(`Documento en índice ${index}: campo "fields" faltante o no es un objeto`);
        }

        const fields = document.fields;
        const details = {}
        for (const fieldKey in fields) {
            const field = fields[fieldKey];
            if (field && field.content) {
                details[fieldKey] = field.content;
            }
        }

        const tables = {};

        for (const field in fields) {
            if (fields[field].type === 'array' && fields[field].valueArray) {
                tables[field] = [];
                fields[field].valueArray.forEach((item, itemIndex) => {
                    // Validar que item.valueObject exista
                    if (!item || !item.valueObject) {
                        throw new ValidationError(`Documento en índice ${index}: campo "valueObject" faltante en array "${field}" en índice ${itemIndex}`);
                    }
                    const row = item.valueObject;
                    const formattedRow = {};
                    for (const key in row) {
                        if (row[key] && row[key].content) {
                            formattedRow[key] = row[key].content;
                        }
                    }
                    if (Object.keys(formattedRow).length > 0) {
                        tables[field].push(formattedRow);
                    }
                });
            }
        }

        const objects = {};

        for (const field in fields) {
            if (fields[field].type === 'object' && fields[field].valueObject) {
                objects[field] = {};
                const obj = fields[field].valueObject;
                for (const key in obj) {
                    if (obj[key].valueObject) {
                        objects[field][key] = {};
                        const subObj = obj[key].valueObject;
                        for (const subKey in subObj) {
                            if (subObj[subKey].content) {
                                objects[field][key][subKey] = subObj[subKey].content;
                            }
                        }
                    }
                }
            }
        }

        analyzedDocuments.push({
            details,
            tables,
            objects
        });

    });

    return analyzedDocuments;
};