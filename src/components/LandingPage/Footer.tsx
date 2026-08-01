import { getTranslations } from 'next-intl/server';
import { Mail, Waves } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Separator } from '@/components/ui/separator';
import { appName, infoEmail } from '@/configs/branding';

export default async function Footer() {
  const t = await getTranslations('Landing.footer');

  return (
    <footer className="bg-invert py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex w-full flex-col items-center sm:col-span-2 sm:items-start">
            <div className="flex items-center gap-2">
              <div className="bg-invert-foreground rounded-xl p-2">
                <Waves className="text-invert h-6 w-6" aria-hidden="true" />
              </div>
              <span className="text-invert-foreground text-xl font-bold">{appName}</span>
            </div>
            <p className="text-invert-foreground/70 mt-4 text-center sm:text-left">
              {t('tagline')}
              <br /> {t('taglineLine2')}
            </p>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="text-invert-foreground text-sm font-semibold">{t('contactHeading')}</h3>
            <ul className="mt-4 space-y-2">
              <li className="text-invert-foreground/70 flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span>{infoEmail}</span>
              </li>
            </ul>
          </div>
        </div>
        <Separator className="bg-invert-foreground/10 my-8" />
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-invert-foreground/70 text-sm">
            © {new Date().getFullYear()} {appName}. {t('copyrightSuffix')}
          </p>
          <div className="flex gap-6">
            <Link
              href="/blog"
              className="text-invert-foreground/70 hover:text-invert-foreground text-sm"
            >
              {t('blogLink')}
            </Link>
            <Link
              href="/legal/terms"
              className="text-invert-foreground/70 hover:text-invert-foreground text-sm"
            >
              {t('legalTerms')}
            </Link>
            <Link
              href="/legal/privacy"
              className="text-invert-foreground/70 hover:text-invert-foreground text-sm"
            >
              {t('legalPrivacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
