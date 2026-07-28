import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

const LOGOS = [
  {
    src: '/images/landingPage/logos/logo-docapesca-bn.png',
    alt: 'Logo Docapesca',
    className: 'w-full',
  },
  {
    src: '/images/landingPage/logos/logo-armadores-punta-bn.png',
    alt: 'Logo Armadores Punta',
    className: 'w-full',
  },
  {
    src: '/images/landingPage/logos/logo-lonja-isla-bn.png',
    alt: 'Logo Lonja Isla',
    className: 'w-[200px]',
  },
  {
    src: '/images/landingPage/logos/logo-cofra-santo-cristo-bn.png',
    alt: 'Logo Cofra Santo Cristo',
    className: 'w-[150px]',
  },
  { src: '/images/landingPage/logos/logo-cofra-bn.png', alt: 'Logo Cofra', className: 'w-[120px]' },
];

export default async function IntegratedLonjas() {
  const t = await getTranslations('Landing.integratedLonjas');

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-8 text-center">
          <div>
            <h2 className="text-3xl tracking-tight text-gray-900 sm:text-3xl dark:text-white">
              {t('title')}
            </h2>
            <p className="text-md mt-4 text-gray-600 dark:text-gray-300">{t('description')}</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-5">
            {LOGOS.map((logo) => (
              <div key={logo.src} className="flex items-center justify-center">
                <Image
                  src={logo.src}
                  width={1000}
                  height={1000}
                  className={logo.className}
                  alt={logo.alt}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
