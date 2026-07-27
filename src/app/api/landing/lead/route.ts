import { NextResponse } from 'next/server';
import { landingLeadSchema } from '@/schemas/landingLeadSchema';
import { infoEmail } from '@/configs/branding';

export const runtime = 'nodejs';

interface LandingLeadPayload {
  email?: unknown;
  /** Honeypot: campo invisible para usuarios reales. Si llega relleno, es un bot. */
  company?: unknown;
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'La PesquerApp <onboarding@resend.dev>';

export async function POST(request: Request) {
  let payload: LandingLeadPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ userMessage: 'Solicitud no válida' }, { status: 400 });
  }

  // Honeypot relleno → falso éxito, no delatar el check al bot ni enviar el email
  if (typeof payload.company === 'string' && payload.company.trim() !== '') {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const parsed = landingLeadSchema.safeParse({ email: payload.email });
  if (!parsed.success) {
    return NextResponse.json(
      { userMessage: parsed.error.issues[0]?.message || 'Email no válido' },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[landing/lead] RESEND_API_KEY no está configurada');
    return NextResponse.json(
      { userMessage: 'El envío no está disponible ahora mismo. Inténtalo más tarde.' },
      { status: 500 }
    );
  }

  const toEmail = process.env.LANDING_LEAD_TO_EMAIL || infoEmail;
  const fromEmail = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;
  const leadEmail = parsed.data.email;

  try {
    const resendResponse = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: leadEmail,
        subject: 'Nuevo lead desde la landing de La PesquerApp',
        text: `Nueva solicitud de acceso desde la landing.\n\nEmail: ${leadEmail}`,
      }),
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text();
      console.error('[landing/lead] Error de Resend:', resendResponse.status, errorBody);
      return NextResponse.json(
        { userMessage: 'No se pudo enviar la solicitud. Inténtalo de nuevo.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[landing/lead] Error de red al llamar a Resend:', error);
    return NextResponse.json(
      { userMessage: 'No se pudo enviar la solicitud. Inténtalo de nuevo.' },
      { status: 502 }
    );
  }
}
