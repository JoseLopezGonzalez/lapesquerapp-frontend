import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

export default async function ProductShowcase() {
  const t = await getTranslations('Landing.productShowcase');

  return (
    <section className="bg-neutral-50 py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">{t('description')}</p>
        </div>
        <div className="mt-16">
          <div className="relative mx-auto max-w-4xl">
            <Image
              src="/images/landingPage/mockup-label.png"
              alt={t('mainImageAlt')}
              width={1280}
              height={800}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="mt-24 grid gap-4 sm:gap-8 lg:grid-cols-2">
          <div className="relative h-full">
            <div className="flex h-full flex-col rounded-xl bg-gradient-to-tr from-sky-50 to-sky-200 p-8 dark:from-slate-800 dark:to-slate-700">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('extraction.title')}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {t('extraction.description')}
                </p>
              </div>
              <div className="relative flex-1">
                <div className="flex h-full items-center justify-center">
                  <Image
                    src="/images/landingPage/mockup-ia-2.png"
                    alt={t('extraction.imageAlt')}
                    width={1000}
                    height={2000}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="relative h-full">
            <div className="flex h-full flex-col rounded-xl bg-gradient-to-br from-sky-50 to-sky-200 p-8 dark:from-slate-800 dark:to-slate-700">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('inventory.title')}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {t('inventory.description')}
                </p>
              </div>
              <div className="relative flex-1">
                <div className="flex h-full w-full items-center justify-center">
                  <Image
                    src="/images/landingPage/mockup-store.png"
                    alt={t('inventory.imageAlt')}
                    width={800}
                    height={600}
                    className="w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-8">
          <div className="rounded-xl bg-gradient-to-r from-sky-200 to-sky-50 p-8 dark:from-slate-800 dark:to-slate-700">
            <div className="mb-8 flex flex-col items-center text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('orders.title')}
              </h3>
              <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-300">
                {t('orders.description')}
              </p>
            </div>
            <div className="relative mx-auto max-w-5xl">
              <Image
                src="/images/landingPage/mockup-orders.png"
                alt={t('orders.imageAlt')}
                width={1400}
                height={600}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
