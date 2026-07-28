import type { ReactNode } from 'react';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { appName, metadataBaseUrl } from '@/configs/branding';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Sin esto, getTranslations()/useTranslations() sin locale explícito caían siempre al
  // locale por defecto ('es') bajo rutas ya prefijadas (/pt/*, /en/*), porque el middleware
  // solo invoca intlMiddleware para rutas SIN prefijo (ver src/middleware.ts
  // isPublicLocalePath) — bug pre-existente descubierto durante GAP-123, afectaba a todo el
  // contenido de body (no al <title>, que sí pasa el locale explícito vía generateMetadata).
  setRequestLocale(locale);

  const messages = await getMessages();

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: appName,
    url: metadataBaseUrl,
    logo: `${metadataBaseUrl}/pesquerapp/favicon.svg`,
  };

  return (
    <NextIntlClientProvider messages={messages}>
      {/* JSON-LD Organization — sembrado desde Server Component (landing-proposal.md §4.5) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {children}
    </NextIntlClientProvider>
  );
}
