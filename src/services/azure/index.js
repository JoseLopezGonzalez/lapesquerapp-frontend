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
    }
];

export const extractDataWithAzureDocumentAi = async ({ file, documentType }) => {

    try {
        const endpoint = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_ENDPOINT;
        const apiKey = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_KEY;

        const documentTypeData = documentTypes.find((type) => type.name === documentType);
        if (!documentTypeData) {
            throw new Error(`Tipo de documento no encontrado: ${documentType}`);
        }

        const modelId = documentTypeData.modelId;
        const apiVersion = documentTypeData.apiVersion;

        /* const url = `${endpoint}formrecognizer/documentModels/prebuilt-document:analyze?api-version=${apiVersion}`; */
        const url = `${endpoint}formrecognizer/documentModels/${modelId}:analyze?api-version=${apiVersion}`;

        // Leer archivo PDF como binary
        const fileBuffer = await file.arrayBuffer();

        // Hacer llamada inicial a Azure
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/pdf',
                'Ocp-Apim-Subscription-Key': apiKey,
            },
            body: fileBuffer,
        });

        if (!response.ok) {
            throw new Error(`Error Azure inicial: ${response.statusText}`);
        }

        // Obtener URL de resultado
        const operationLocation = response.headers.get('Operation-Location');
        if (!operationLocation) {
            throw new Error("Operation-Location no encontrado en respuesta.");
        }

        // Esperar el resultado final (polling)
        let analysisResult = null;
        let status = null;

        do {
            await new Promise(resolve => setTimeout(resolve, 2000)); // esperar 2 segundos
            const resultResponse = await fetch(operationLocation, {
                headers: { 'Ocp-Apim-Subscription-Key': apiKey },
            });

            if (!resultResponse.ok) {
                throw new Error(`Error Azure resultado: ${resultResponse.statusText}`);
            }

            const resultData = await resultResponse.json();
            status = resultData.status;

            if (status === 'succeeded') {
                analysisResult = resultData.analyzeResult;
            } else if (status === 'failed') {
                throw new Error("Análisis fallido en Azure.");
            }

        } while (status === 'running' || status === 'notStarted');

        // 🧹 Parsear y estructurar el resultado para que solo contenga los campos necesarios

        return parseAzureDocumentAIResult(analysisResult);


    } catch (error) {
        console.error("Error al procesar el PDF:", error);
    }
};