import { fetchWithTenant } from "@lib/fetchWithTenant";
const { parseAzureDocumentAIResult } = require("@/helpers/azure/documentAI");


const documentTypes = [
    {
        name: 'ListadoComprasAsocArmadoresPuntaDelMoral',
        modelId: process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_LISTADO_COMPRAS_ASOC_ARMADORES_PUNTA_DEL_MORAL_MODEL_ID,
        apiVersion: '2023-07-31',
    },
    {
        name: 'AlbaranCofradiaPescadoresSantoCristoDelMar',
        modelId: process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_ALBARAN_COFRADIA_PESCADORES_SANTO_CRISTO_DEL_MAR_MODEL_ID,
        apiVersion: '2023-07-31',
    },
    {
        name: 'ListadoComprasLonjaDeIsla',
        modelId: process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_LISTADO_COMPRAS_LONJA_DE_ISLA_MODEL_ID,
        apiVersion: '2023-07-31',
    }

];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const extractDataWithAzureDocumentAi = async ({ file, documentType }) => {
    const traceId = `azure-trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
        const endpoint = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_ENDPOINT;
        const apiKey = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_KEY;
        console.group(`[${traceId}] Azure Document AI - START`);
        console.log(`[${traceId}] input meta:`, {
            documentType,
            fileName: file?.name,
            fileType: file?.type,
            fileSizeBytes: file?.size,
            fileSizeMB: file?.size ? Number((file.size / 1024 / 1024).toFixed(2)) : null,
            fileLastModified: file?.lastModified,
            endpointConfigured: Boolean(endpoint),
            apiKeyConfigured: Boolean(apiKey),
        });

        const documentTypeData = documentTypes.find((type) => type.name === documentType);
        if (!documentTypeData) {
            console.error(`[${traceId}] documentType mapping not found`, {
                requestedDocumentType: documentType,
                availableTypes: documentTypes.map((type) => type.name),
            });
            throw new Error(`Tipo de documento no encontrado: ${documentType}`);
        }

        const modelId = documentTypeData.modelId;
        const apiVersion = documentTypeData.apiVersion;

        /* const url = `${endpoint}formrecognizer/documentModels/prebuilt-document:analyze?api-version=${apiVersion}`; */
        const url = `${endpoint}formrecognizer/documentModels/${modelId}:analyze?api-version=${apiVersion}`;
        console.log(`[${traceId}] azure model config:`, { modelId, apiVersion, url });

        // Leer archivo PDF como binary
        const fileBuffer = await file.arrayBuffer();
        console.log(`[${traceId}] fileBuffer bytes:`, fileBuffer?.byteLength);

        // Hacer llamada inicial a Azure
        const response = await fetchWithTenant(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/pdf',
                'Ocp-Apim-Subscription-Key': apiKey,
            },
            body: fileBuffer,
        });
        console.log(`[${traceId}] initial POST response:`, {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
        });

        if (!response.ok) {
            const initialErrorBody = await response.text().catch(() => "");
            console.error(`[${traceId}] initial POST error body:`, initialErrorBody);
            throw new Error(`Error Azure inicial: ${response.statusText}`);
        }

        // Obtener URL de resultado
        const operationLocation = response.headers.get('Operation-Location');
        console.log(`[${traceId}] operationLocation:`, operationLocation);
        if (!operationLocation) {
            throw new Error("Operation-Location no encontrado en respuesta.");
        }

        // Esperar el resultado final (polling)
        let analysisResult = null;
        let status = null;
        let attempts = 0;
        const maxAttempts = 45; // ~15 minutos con intervalos normales
        const defaultPollingDelay = 5000; // 5 segundos
        const rateLimitDelay = 17000; // esperar 17 segundos en caso de 429 (retry-after sugerido)

        do {
            attempts += 1;
            if (attempts > maxAttempts) {
                throw new Error("Tiempo de espera agotado al obtener el resultado del análisis de Azure.");
            }

            await sleep(defaultPollingDelay);

            let resultResponse;

            try {
                resultResponse = await fetchWithTenant(operationLocation, {
                    headers: { 'Ocp-Apim-Subscription-Key': apiKey },
                });
            } catch (error) {
                const errorMessage = error?.message || "";
                const isRateLimitError = /429|Too Many Requests|rate limit/i.test(errorMessage);

                if (isRateLimitError) {
                    console.warn(`[${traceId}] ⚠️ Azure rate limit alcanzado. Reintentando en ${rateLimitDelay}ms.`);
                    await sleep(rateLimitDelay);
                    continue;
                }

                console.error(`[${traceId}] poll request failed:`, error);
                throw error;
            }
            console.log(`[${traceId}] poll #${attempts} response:`, {
                ok: resultResponse.ok,
                status: resultResponse.status,
                statusText: resultResponse.statusText,
            });

            if (!resultResponse.ok) {
                const pollErrorBody = await resultResponse.text().catch(() => "");
                console.error(`[${traceId}] poll #${attempts} error body:`, pollErrorBody);
                throw new Error(`Error Azure resultado: ${resultResponse.statusText}`);
            }

            const resultData = await resultResponse.json();
            status = resultData.status;
            console.log(`[${traceId}] poll #${attempts} status:`, status);

            if (status === 'succeeded') {
                analysisResult = resultData.analyzeResult;
                const pages = Array.isArray(analysisResult?.pages) ? analysisResult.pages : [];
                const documents = Array.isArray(analysisResult?.documents) ? analysisResult.documents : [];
                console.log(`[${traceId}] analyzeResult summary:`, {
                    pagesCount: pages.length,
                    pageNumbers: pages.map((page) => page.pageNumber),
                    documentsCount: documents.length,
                    documentBoundingPages: documents.map((doc, index) => ({
                        index,
                        pages: (doc?.boundingRegions || []).map((region) => region.pageNumber),
                    })),
                    contentLength: analysisResult?.content?.length || 0,
                });
                console.debug(`[${traceId}] raw analyzeResult:`, analysisResult);
            } else if (status === 'failed') {
                console.error(`[${traceId}] analysis failed payload:`, resultData);
                throw new Error("Análisis fallido en Azure.");
            }

        } while (status === 'running' || status === 'notStarted');

        // 🧹 Parsear y estructurar el resultado para que solo contenga los campos necesarios
        const parsedResult = parseAzureDocumentAIResult(analysisResult);
        console.log(`[${traceId}] parsed result summary:`, {
            parsedDocumentsCount: Array.isArray(parsedResult) ? parsedResult.length : null,
            parsedFirstDocumentKeys: parsedResult?.[0] ? Object.keys(parsedResult[0]) : [],
        });
        console.groupEnd();

        return parsedResult;


    } catch (error) {
        console.error(`[${traceId}] Error al procesar el PDF:`, error);
        console.groupEnd();
        throw error; // Re-lanzar el error para que se propague
    }
};