export const parseAzureDocumentAIResult = (data) => {
    const analyzedDocuments = [];

    // Accedemos a los documentos
    const documents = data.documents || [];

    documents.forEach((document) => {
        const fields = document.fields || {};
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
                fields[field].valueArray.forEach((item, index) => {
                    const row = item.valueObject;
                    const formattedRow = {};
                    for (const key in row) {
                        if (row[key].content) {
                            formattedRow[key] = row[key].content;
                        }
                    }
                    if (formattedRow) {
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