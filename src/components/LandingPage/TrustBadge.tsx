import { getTranslations } from 'next-intl/server';
import { FileText } from 'lucide-react';

export default async function TrustBadge() {
  const t = await getTranslations('Landing.trustBadge');

  return (
    <div className="flex w-full flex-col items-center justify-center py-20">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900">
          <FileText className="h-6 w-6 text-sky-600 dark:text-sky-400" />
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-white">{t('title')}</h4>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('description')}</p>
      </div>
    </div>
  );
}
