import { getTranslations } from 'next-intl/server';
import { Mail, Phone, Waves } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { appName, infoEmail } from '@/configs/branding';

export default async function Footer() {
  const t = await getTranslations('Landing.footer');

  return (
    <footer className="bg-slate-900 py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex w-full flex-col items-center sm:col-span-2 sm:items-start">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-sky-500 p-2">
                <Waves className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">{appName}</span>
            </div>
            <p className="mt-4 text-center text-gray-400 sm:text-left">
              {t('tagline')}
              <br /> {t('taglineLine2')}
            </p>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="text-sm font-semibold text-white">{t('contactHeading')}</h3>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="h-4 w-4" />
                <span>{infoEmail}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="h-4 w-4" />
                <span>+34 900 123 456</span>
              </li>
            </ul>
          </div>
        </div>
        <Separator className="my-8 bg-slate-800" />
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} {appName}. {t('copyrightSuffix')}
          </p>
          <div className="flex gap-6">
            <Link href="/legal/terms" className="text-sm text-gray-400 hover:text-white">
              {t('legalTerms')}
            </Link>
            <Link href="/legal/privacy" className="text-sm text-gray-400 hover:text-white">
              {t('legalPrivacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
