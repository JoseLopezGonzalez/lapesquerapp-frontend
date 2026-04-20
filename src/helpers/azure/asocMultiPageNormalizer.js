/**
 * Multi-page normalizer for ASOC Armadores documents.
 *
 * Azure Document AI may return:
 *  1) Multiple top-level documents (one per page).
 *  2) Rows in `tables.subastas` merged across page boundaries with
 *     newline-concatenated values.
 *
 * This normalizer merges page documents and splits merged subasta rows.
 */

/**
 * Returns true when at least one field contains a line break.
 */
function isMergedRow(row) {
    return Object.values(row).some(
        (v) => typeof v === 'string' && v.includes('\n'),
    );
}

/**
 * Splits a merged row into N rows by zipping fields split on '\n'.
 * Non-split fields are replicated to every generated row.
 */
function splitMergedRow(row) {
    if (!isMergedRow(row)) return [row];

    const fieldParts = {};
    let maxParts = 1;

    for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'string' && value.includes('\n')) {
            const parts = value.split('\n').map((p) => p.trim());
            fieldParts[key] = parts;
            maxParts = Math.max(maxParts, parts.length);
        } else {
            fieldParts[key] = null;
        }
    }

    const rows = [];
    for (let i = 0; i < maxParts; i++) {
        const newRow = {};
        for (const [key, value] of Object.entries(row)) {
            const parts = fieldParts[key];
            newRow[key] = parts === null ? value : (i < parts.length ? parts[i] : '');
        }
        rows.push(newRow);
    }

    return rows;
}

/**
 * Keeps only rows that still contain the required ASOC fields.
 */
function isValidSubastaRow(row) {
    const requiredFields = [
        'barco',
        'matricula',
        'cajas',
        'especie',
        'pesoNeto',
        'precio',
        'importe',
    ];

    return requiredFields.every((field) => {
        const value = row[field];
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim() !== '';
        return true;
    });
}

function splitMergedSubastasRows(subastas) {
    if (!Array.isArray(subastas)) return subastas;

    const result = [];
    for (const row of subastas) {
        const splitRows = splitMergedRow(row);
        for (const splitRow of splitRows) {
            if (isValidSubastaRow(splitRow)) {
                result.push(splitRow);
            }
        }
    }

    return result;
}

/**
 * Merges N Azure documents (pages) into one logical document.
 */
function mergeDocuments(docs) {
    if (docs.length === 1) return docs[0];

    const merged = {
        details: { ...docs[0].details },
        tables: {},
        objects: { ...(docs[0].objects || {}) },
    };

    const allTableKeys = new Set();
    docs.forEach((doc) => {
        Object.keys(doc.tables || {}).forEach((key) => allTableKeys.add(key));
    });

    for (const key of allTableKeys) {
        merged.tables[key] = docs.flatMap((doc) =>
            Array.isArray(doc.tables?.[key]) ? doc.tables[key] : [],
        );
    }

    for (let i = 1; i < docs.length; i++) {
        if (docs[i].objects) {
            Object.assign(merged.objects, docs[i].objects);
        }
    }

    return merged;
}

/**
 * Normalizes ASOC Azure output for multi-page support.
 *
 * @param {Array} azureData - Documents from parseAzureDocumentAIResult
 * @returns {Array} Single-element array with normalized document
 */
export function normalizeAsocMultiPage(azureData) {
    if (!Array.isArray(azureData) || azureData.length === 0) return azureData;

    const doc = mergeDocuments(azureData);

    if (doc.tables && Array.isArray(doc.tables.subastas)) {
        doc.tables.subastas = splitMergedSubastasRows(doc.tables.subastas);
    }

    return [doc];
}

