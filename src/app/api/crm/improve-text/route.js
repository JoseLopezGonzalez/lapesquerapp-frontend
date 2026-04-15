import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  CRM_AGENDA_DESCRIPTION_MAX_LENGTH,
  CRM_INTERACTION_SUMMARY_MAX_LENGTH,
} from '@/components/Comercial/CRM/schemas/crmTextLimits';

export const runtime = 'nodejs';
export const maxDuration = 30;

const IMPROVEMENT_CONFIG = {
  interaction_summary: {
    maxLength: CRM_INTERACTION_SUMMARY_MAX_LENGTH,
    emptyError: 'El resumen es obligatorio',
    resultError: 'No se pudo generar un resumen válido',
    internalError: 'Error interno al mejorar el resumen',
    promptIntro: 'Reescribe el siguiente resumen para CRM corrigiendo gramática y semántica cuando sea necesario.',
    promptRules: [
      'Mantén el significado, los datos y el contexto comercial.',
      'No inventes información nueva.',
    ],
  },
  next_action_description: {
    maxLength: CRM_AGENDA_DESCRIPTION_MAX_LENGTH,
    emptyError: 'La descripción es obligatoria',
    resultError: 'No se pudo generar una descripción válida',
    internalError: 'Error interno al mejorar la descripción',
    promptIntro:
      'Reescribe la siguiente descripción de próxima acción para CRM corrigiendo gramática y semántica cuando sea necesario.',
    promptRules: [
      'Mantén la intención, contexto comercial y datos clave.',
      'No inventes información nueva.',
    ],
  },
  prospect_commercial_interest: {
    maxLength: 5000,
    emptyError: 'El interés comercial es obligatorio',
    resultError: 'No se pudo generar un interés comercial válido',
    internalError: 'Error interno al mejorar el interés comercial',
    promptIntro:
      'Reescribe el siguiente texto de interés comercial de prospecto corrigiendo gramática y semántica cuando sea necesario.',
    promptRules: [
      'Mantén el significado, los productos/especies mencionados, formato y contexto de venta.',
      'No inventes información nueva.',
    ],
  },
  prospect_notes: {
    maxLength: 5000,
    emptyError: 'Las notas son obligatorias',
    resultError: 'No se pudo generar unas notas válidas',
    internalError: 'Error interno al mejorar las notas',
    promptIntro:
      'Reescribe las siguientes notas de prospecto corrigiendo gramática y semántica cuando sea necesario.',
    promptRules: [
      'Mantén el contexto comercial y de seguimiento.',
      'No inventes información nueva.',
    ],
  },
};

export async function POST(req) {
  let kind = null;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    let requestBody = {};
    try {
      requestBody = await req.json();
    } catch {
      return Response.json({ error: 'Body inválido' }, { status: 400 });
    }

    kind = String(requestBody?.kind ?? '').trim();
    const config = IMPROVEMENT_CONFIG[kind];
    if (!config) {
      return Response.json({ error: 'Tipo de mejora no soportado' }, { status: 400 });
    }

    const text = String(requestBody?.text ?? '').trim();
    if (!text) {
      return Response.json({ error: config.emptyError }, { status: 400 });
    }

    const aiModel = process.env.AI_MODEL || 'gpt-5-mini';
    const { text: improvedRawText } = await generateText({
      model: openai(aiModel),
      temperature: 0.2,
      system:
        'Eres un asistente de redacción comercial en español de España. Debes mejorar textos para CRM sin inventar datos.',
      prompt: [
        config.promptIntro,
        ...config.promptRules,
        `Máximo ${config.maxLength} caracteres.`,
        'Devuelve solo el texto final, sin comillas ni explicaciones.',
        '',
        'Texto original:',
        text,
      ].join('\n'),
    });

    const improvedText = String(improvedRawText ?? '')
      .trim()
      .slice(0, config.maxLength);

    if (!improvedText) {
      return Response.json({ error: config.resultError }, { status: 422 });
    }

    return Response.json({ improvedText }, { status: 200 });
  } catch (error) {
    const config = kind ? IMPROVEMENT_CONFIG[kind] : null;
    return Response.json(
      {
        error: config?.internalError || 'Error interno al mejorar el texto',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
