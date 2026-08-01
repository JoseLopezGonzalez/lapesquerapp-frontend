import { getTranslations } from 'next-intl/server';
import { FileText, Layers, Fish } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

// Claims 4 (código de barras GS1-128) y 5 (cumplimiento RGPD) quedan documentados como
// deuda técnica bloqueada — ver landing-proposal.md §12.5. No se activan hasta que:
// (4) se corrija el bug de precisión del AI GS1-128 (3100/3200 → 3102/3202) en un GAP
//     del módulo Stock/Almacén, fuera de landing;
// (5) Jose confirme explícitamente que el tratamiento de datos cumple RGPD de verdad.
// Grid preparado para pasar de 3 a 5 items (sm:grid-cols-3 → puede ampliarse a 2+3) el
// día que ambos se activen, sin rediseño.

const CLAIM_KEYS = ['labeling', 'traceability', 'faoCatalog'] as const;
const CLAIM_ICONS = { labeling: FileText, traceability: Layers, faoCatalog: Fish } as const;

export default async function TrustBadge() {
  const t = await getTranslations('Landing.trustBadge');

  return (
    <section className="bg-muted/30 py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight">{t('title')}</h2>
        </div>
        <ScrollReveal className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3">
          {CLAIM_KEYS.map((key) => {
            const Icon = CLAIM_ICONS[key];
            return (
              <div key={key} className="flex flex-col items-center text-center">
                <div className="bg-background mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
                  <Icon className="text-foreground h-6 w-6" aria-hidden="true" />
                </div>
                <h4 className="text-foreground text-sm font-semibold">
                  {t(`claims.${key}.title`)}
                </h4>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t(`claims.${key}.description`)}
                </p>
              </div>
            );
          })}
        </ScrollReveal>
      </div>
    </section>
  );
}
