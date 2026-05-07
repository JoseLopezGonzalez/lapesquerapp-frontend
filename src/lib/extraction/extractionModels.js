/**
 * Extraction model catalogue.
 * Each entry describes one extraction backend available in the UI.
 * Non-azure entries map directly to an OpenAI model ID.
 */

export const EXTRACTION_MODELS = [
    {
        id: 'azure',
        label: 'Azure Document AI',
        description: 'Extracción por campos (legacy)',
    },
    {
        id: 'gpt-4o-mini',
        label: 'GPT-4o mini',
        description: 'Rápido y económico — documentos simples',
        openaiModel: 'gpt-4o-mini',
    },
    {
        id: 'gpt-4o',
        label: 'GPT-4o',
        description: 'Estándar — uso general recomendado',
        openaiModel: 'gpt-4o',
    },
    {
        id: 'gpt-4.1',
        label: 'GPT-4.1',
        description: 'Avanzado — documentos complejos o con varias páginas',
        openaiModel: 'gpt-4.1',
    },
];

export const DEFAULT_MODEL_ID = 'gpt-4o';

export const ALLOWED_OPENAI_MODELS = EXTRACTION_MODELS
    .filter((m) => m.openaiModel)
    .map((m) => m.openaiModel);

export function isAzureModel(modelId) {
    return modelId === 'azure';
}

export function getOpenAIModelId(modelId) {
    const entry = EXTRACTION_MODELS.find((m) => m.id === modelId);
    return entry?.openaiModel ?? 'gpt-4o';
}
