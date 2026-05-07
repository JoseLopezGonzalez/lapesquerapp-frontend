/**
 * ChatGPT Extraction Service
 *
 * Sends a PDF file to the /api/extraction/chatgpt server-side route
 * and returns the parsed document in the app's final format.
 *
 * Note: uses plain fetch (not fetchWithTenant) because this is an internal
 * Next.js API route, not the Laravel backend.
 */

const CHATGPT_EXTRACTION_ENDPOINT = '/api/extraction/chatgpt';

/**
 * Extracts document data using ChatGPT via the server-side API route.
 *
 * @param {File} file - PDF file to process
 * @param {string} documentType - Internal document type key
 * @param {string} [model='gpt-4o'] - OpenAI model ID to use
 * @returns {Promise<{ success: true, data: Array } | { success: false, error: string }>}
 */
export async function extractWithChatGPT(file, documentType, model = 'gpt-4o') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('model', model);

    // Do NOT set Content-Type — browser sets it with the correct boundary automatically
    const response = await fetch(CHATGPT_EXTRACTION_ENDPOINT, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        let errorMessage = 'Error al comunicarse con ChatGPT';
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.error || errorMessage;
        } catch {
            // ignore json parse error on error body
        }
        throw new Error(errorMessage);
    }

    return response.json();
}
