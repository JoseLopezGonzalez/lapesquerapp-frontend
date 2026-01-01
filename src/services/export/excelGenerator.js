/**
 * Excel Generator Service - Servicio para generación de Excel masivo
 * 
 * Genera un único archivo Excel consolidando múltiples documentos
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { generateCofraExcelRows } from '@/exportHelpers/cofraExportHelper';
import { generateLonjaDeIslaExcelRows } from '@/exportHelpers/lonjaDeIslaExportHelper';
import { generateAsocExcelRows } from '@/exportHelpers/asocExportHelper';

/**
 * Generates a massive Excel file from multiple processed documents
 * 
 * @param {Array} documents - Array of objects with document data and type:
 *   - document: Processed document data
 *   - documentType: 'albaranCofradiaPescadoresSantoCristoDelMar' | 'listadoComprasLonjaDeIsla' | 'listadoComprasAsocArmadoresPuntaDelMoral'
 * @param {Object} options - Options for generation
 * @param {string} options.software - Software type ('A3ERP', 'Facilcom', etc.) - default: 'A3ERP'
 * @returns {Blob} Excel file blob
 */
export function generateMassiveExcel(documents, options = {}) {
    const { software = 'A3ERP' } = options;

    if (documents.length === 0) {
        throw new Error('No hay documentos para exportar');
    }

    // Map document types to their export helpers
    const EXPORT_HELPERS = {
        'albaranCofradiaPescadoresSantoCristoDelMar': generateCofraExcelRows,
        'listadoComprasLonjaDeIsla': generateLonjaDeIslaExcelRows,
        'listadoComprasAsocArmadoresPuntaDelMoral': generateAsocExcelRows,
    };

    const allRows = [];
    let currentSequence = 1;

    // Process each document
    documents.forEach(({ document, documentType }) => {
        const helper = EXPORT_HELPERS[documentType];
        
        if (!helper) {
            console.warn(`No hay helper de exportación para el tipo: ${documentType}`);
            return;
        }

        // Generate rows for this document with continuing sequence
        const result = helper(document, {
            startSequence: currentSequence
        });

        allRows.push(...result.rows);
        currentSequence = result.nextSequence;
    });

    if (allRows.length === 0) {
        throw new Error('No se generaron filas para exportar');
    }

    // Create Excel workbook
    const worksheet = XLSX.utils.json_to_sheet(allRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ALBARANESCOMPRA');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `ALBARANES_A3ERP_MASIVO_${currentDate}.xls`;

    // Convert to blob
    const excelBuffer = XLSX.write(workbook, { bookType: 'xls', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.ms-excel' });
    
    return blob;
}

/**
 * Downloads a massive Excel file
 * 
 * @param {Array} documents - Array of documents to export
 * @param {Object} options - Options for generation
 */
export function downloadMassiveExcel(documents, options = {}) {
    try {
        const blob = generateMassiveExcel(documents, options);
        const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const filename = `ALBARANES_A3ERP_MASIVO_${currentDate}.xls`;
        saveAs(blob, filename);
    } catch (error) {
        console.error('Error al generar Excel masivo:', error);
        throw error;
    }
}

