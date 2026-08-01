'use client';
// Necesita 'use client': usePathname (next-intl) y el estado abierto/cerrado del DropdownMenu.

import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

type Locale = (typeof routing.locales)[number];

// Nombres nativos — nunca traducidos entre sí (ver landing-proposal.md §15: banderas
// descartadas por representar país, no idioma, y por ser intrínsecamente de color,
// incompatibles con la paleta 100% monocroma de landing-context.md §2/§3).
const LOCALE_LABELS: Record<Locale, string> = {
  es: 'Español',
  pt: 'Português',
  en: 'English',
};

interface LocaleSwitcherProps {
  className?: string;
}

export default function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className} aria-label="Seleccionar idioma">
          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
          {locale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((loc) => (
          <DropdownMenuItem key={loc} disabled={loc === locale} asChild={loc !== locale}>
            {loc === locale ? (
              LOCALE_LABELS[loc]
            ) : (
              <Link href={pathname} locale={loc} hrefLang={loc}>
                {LOCALE_LABELS[loc]}
              </Link>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
