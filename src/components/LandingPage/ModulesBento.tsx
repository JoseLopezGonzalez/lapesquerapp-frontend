import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fish, Package, ShoppingCart, Sparkle, Ticket } from 'lucide-react';

const MODULES_SECTION_ID = 'modulos';

export default async function ModulesBento() {
  const t = await getTranslations('Landing.modules');

  return (
    <section id={MODULES_SECTION_ID} className="bg-neutral-50 py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            {t('title')}
          </h2>
          <p className="text-md mt-4 text-gray-600 dark:text-gray-300">{t('description')}</p>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-4">
              <div className="mb-4 inline-flex w-fit rounded-xl bg-sky-100 p-3 dark:bg-sky-900">
                <Fish className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <CardTitle className="text-xl">{t('production.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">{t('production.description')}</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4">
              <div className="mb-4 inline-flex w-fit rounded-xl bg-sky-100 p-3 dark:bg-sky-900">
                <Package className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <CardTitle className="text-xl">{t('stock.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">{t('stock.description')}</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4">
              <div className="mb-4 inline-flex w-fit rounded-xl bg-sky-100 p-3 dark:bg-sky-900">
                <ShoppingCart className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <CardTitle className="text-xl">{t('sales.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">{t('sales.description')}</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4">
              <div className="mb-4 inline-flex w-fit rounded-xl bg-sky-100 p-3 dark:bg-sky-900">
                <Sparkle className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <CardTitle className="text-xl">{t('ai.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">{t('ai.description')}</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4">
              <div className="mb-4 inline-flex w-fit rounded-xl bg-sky-100 p-3 dark:bg-sky-900">
                <Ticket className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <CardTitle className="text-xl">{t('labels.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">{t('labels.description')}</CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
