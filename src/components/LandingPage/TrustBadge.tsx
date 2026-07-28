import { getTranslations } from 'next-intl/server';
import { FileText } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

export default async function TrustBadge() {
  const t = await getTranslations('Landing.trustBadge');

  return (
    <ScrollReveal className="flex w-full flex-col items-center justify-center py-20">
      <div className="text-center">
        <div className="bg-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
          <FileText className="text-foreground h-6 w-6" aria-hidden="true" />
        </div>
        <h4 className="text-foreground font-semibold">{t('title')}</h4>
        <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
      </div>
    </ScrollReveal>
  );
}
