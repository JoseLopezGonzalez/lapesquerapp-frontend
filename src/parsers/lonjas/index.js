/**
 * Parsers for lonja document processing
 * 
 * This module exports parsers for different document types.
 * Parsers transform raw Azure Document AI data into structured formats
 * used by the application components.
 */

export { BaseParser } from './baseParser';
export { parseAlbaranCofraData } from './cofraParser';
export { parseLonjaDeIslaData } from './lonjaDeIslaParser';
export { parseAsocData } from './asocParser';

