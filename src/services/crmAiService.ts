export type CrmTextKind =
  | 'interaction_summary'
  | 'next_action_description'
  | 'prospect_commercial_interest'
  | 'prospect_notes';

interface ImproveTextPayload {
  improvedText?: string;
  error?: string;
}

export const crmAiService = {
  async improveText(kind: CrmTextKind, text: string): Promise<string> {
    const response = await fetch('/api/crm/improve-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, text }),
    });
    const payload: ImproveTextPayload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'No se pudo mejorar el texto con IA');
    }
    const improved = String(payload.improvedText ?? '').trim();
    if (!improved) {
      throw new Error('La IA no devolvió un texto válido');
    }
    return improved;
  },
};
