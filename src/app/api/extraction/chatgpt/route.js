import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { CHATGPT_EXTRACTION_PROMPTS } from '@/lib/extraction/chatgptPrompts';
import { ALLOWED_OPENAI_MODELS, isReasoningModel } from '@/lib/extraction/extractionModels';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    let formData;
    try {
      formData = await req.formData();
    } catch {
      return Response.json({ error: 'Body inválido' }, { status: 400 });
    }

    const file = formData.get('file');
    const documentType = formData.get('documentType');
    const requestedModel = formData.get('model') || 'gpt-4o';

    if (!file || typeof file === 'string') {
      return Response.json({ error: 'Archivo PDF requerido' }, { status: 400 });
    }
    if (!documentType || !CHATGPT_EXTRACTION_PROMPTS[documentType]) {
      return Response.json({ error: 'Tipo de documento no válido' }, { status: 400 });
    }
    if (!ALLOWED_OPENAI_MODELS.includes(requestedModel)) {
      return Response.json({ error: 'Modelo no válido' }, { status: 400 });
    }

    const promptConfig = CHATGPT_EXTRACTION_PROMPTS[documentType];
    const filename = file.name ?? 'document.pdf';

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const generateOptions = {
      model: openai(requestedModel),
      system: promptConfig.systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: uint8Array,
              mediaType: 'application/pdf',
              filename,
            },
            {
              type: 'text',
              text: promptConfig.userPromptTemplate(filename),
            },
          ],
        },
      ],
    };
    // Reasoning models (o-series) do not support temperature
    if (!isReasoningModel(requestedModel)) {
      generateOptions.temperature = 0;
    }

    const { text } = await generateText(generateOptions);

    let parsedData;
    try {
      const cleanedText = text
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
      parsedData = JSON.parse(cleanedText);
    } catch {
      console.error(
        '[ChatGPT Extraction] JSON parse error. Raw response (first 500 chars):',
        text?.substring(0, 500)
      );
      return Response.json(
        {
          success: false,
          error: 'El modelo devolvió una respuesta no válida. Inténtelo de nuevo.',
        },
        { status: 422 }
      );
    }

    return Response.json({ success: true, data: [parsedData] });
  } catch (error) {
    console.error('[ChatGPT Extraction] Error calling OpenAI:', error?.message ?? error);
    return Response.json(
      { success: false, error: 'Error al comunicarse con ChatGPT. Inténtelo de nuevo.' },
      { status: 500 }
    );
  }
}
