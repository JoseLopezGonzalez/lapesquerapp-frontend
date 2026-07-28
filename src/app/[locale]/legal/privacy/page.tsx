import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Waves } from 'lucide-react';
import { appName, infoEmail, metadataBaseUrl } from '@/configs/branding';

const DATE_LOCALES: Record<string, string> = { es: 'es-ES', pt: 'pt-PT', en: 'en-US' };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Legal.privacy' });
  const base = metadataBaseUrl.replace(/\/$/, '');
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${base}${getPathname({ locale: l, href: '/legal/privacy' })}`])
  );

  return {
    title: t('pageTitle'),
    alternates: {
      canonical: `${base}${getPathname({ locale, href: '/legal/privacy' })}`,
      languages,
    },
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Requerido con generateStaticParams (next-intl): sin esto, getTranslations() ambiental
  // puede caer al locale por defecto en algunas requests (bug descubierto en GAP-123).
  setRequestLocale(locale);
  const t = await getTranslations('Legal.privacy');
  const tCommon = await getTranslations('Legal.common');
  const dateLocale = DATE_LOCALES[locale] ?? 'es-ES';

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border border-b">
        <div className="container mx-auto flex items-center gap-2 px-4 py-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary rounded-xl p-2">
              <Waves className="text-primary-foreground h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-foreground text-lg font-bold">{appName}</span>
          </Link>
        </div>
      </header>
      <main className="container mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">{t('heading')}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {tCommon('lastUpdated')}: {new Date().toLocaleDateString(dateLocale)}
        </p>

        <div className="text-foreground mt-10 flex flex-col gap-8 text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold">{t('controllerTitle')}</h2>
            <p className="text-muted-foreground mt-2">
              {t('controllerBody', { appName })}{' '}
              <a href={`mailto:${infoEmail}`} className="text-foreground underline">
                {infoEmail}
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">{t('dataCollectedTitle')}</h2>
            <p className="text-muted-foreground mt-2">{t('dataCollectedBody')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">{t('dataUseTitle')}</h2>
            <p className="text-muted-foreground mt-2">{t('dataUseBody', { appName })}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">{t('dataSharingTitle')}</h2>
            <p className="text-muted-foreground mt-2">{t('dataSharingBody')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">{t('rightsTitle')}</h2>
            <p className="text-muted-foreground mt-2">
              {t('rightsBody')}{' '}
              <a href={`mailto:${infoEmail}`} className="text-foreground underline">
                {infoEmail}
              </a>
            </p>
          </section>

          <section className="border-border rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">{t('disclaimer')}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
