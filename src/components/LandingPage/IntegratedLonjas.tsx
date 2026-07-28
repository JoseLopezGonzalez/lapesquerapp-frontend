import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import ScrollReveal from './ScrollReveal';

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
            <h2 className="text-foreground text-3xl tracking-tight sm:text-3xl">{t('title')}</h2>
            <p className="text-muted-foreground text-md mt-4">{t('description')}</p>
          </div>
          <ScrollReveal className="grid w-full grid-cols-2 gap-4 sm:grid-cols-5">
            {LOGOS.map((logo) => (
              <div key={logo.src} className="flex items-center justify-center grayscale">
                <Image
                  src={logo.src}
                  width={1000}
                  height={1000}
                  className={logo.className}
                  alt={logo.alt}
                />
              </div>
            ))}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
