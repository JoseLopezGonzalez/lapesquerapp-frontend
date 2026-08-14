'use client';

import Image from 'next/image';
import Link from 'next/link';
import { appName, isGenericBranding } from '@/configs/branding';
import { Button } from '@/components/ui/button';
import RotatingText from '@/components/Utilities/RotatingText';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface LoginWelcomeStepProps {
  brandingImageUrl?: string | null;
  /** Logo del cliente de maquila (portal /portal/{slug}) — sustituye el título por texto+logo propio. */
  logoUrl?: string | null;
  /** Nombre del cliente de maquila — sustituye {appName} cuando está presente. */
  titleOverride?: string | null;
  isDemo: boolean;
  tenantActive: boolean;
  onContinue: () => void;
}

export default function LoginWelcomeStep({
  brandingImageUrl,
  logoUrl,
  titleOverride,
  isDemo,
  tenantActive,
  onContinue,
}: LoginWelcomeStepProps) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="relative flex min-h-screen w-full flex-col items-center px-4 pb-8"
    >
      <div className="absolute inset-0 z-0">
        {!isGenericBranding && (
          <Image
            src={brandingImageUrl || '/images/landing.png'}
            alt="Imagen de branding"
            fill
            sizes="100vw"
            className="object-cover"
            priority
            onError={(e) => {
              e.currentTarget.src = '/images/landing.png';
            }}
          />
        )}
        {isGenericBranding && <div className="bg-muted/50 absolute inset-0" aria-hidden />}
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            background:
              'linear-gradient(to top, white 0%, rgba(255, 255, 255, 0.7) 30%, rgba(255, 255, 255, 0.3) 50%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            background:
              'linear-gradient(to top, black 0%, rgba(0, 0, 0, 0.7) 30%, rgba(0, 0, 0, 0.3) 50%, transparent 60%)',
          }}
        />
      </div>

      {isDemo && (
        <div className="absolute top-4 right-4 z-20 rounded-lg bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800 shadow">
          MODO DEMO
        </div>
      )}

      <div className="relative z-10 flex w-full max-w-sm flex-1 flex-col items-center justify-end pb-8">
        <div className="flex w-full flex-col items-center space-y-8 text-center">
          <div className="space-y-4">
            {logoUrl && (
              <Image
                src={logoUrl}
                alt={titleOverride ?? appName}
                width={72}
                height={72}
                className="mx-auto rounded-lg object-contain"
              />
            )}
            <h1 className="text-primary from-primary to-primary/80 bg-gradient-to-tr bg-clip-text text-5xl font-bold">
              {titleOverride ?? appName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1 text-nowrap">
            <span className="text-foreground text-lg">Mantén tu producción</span>
            <RotatingText
              texts={['al día.', 'segura.', 'eficiente.', 'organizada.']}
              mainClassName="text-lg text-foreground font-medium"
              staggerFrom="last"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-120%' }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden"
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              rotationInterval={6000}
            />
          </div>

          <Button
            onClick={onContinue}
            size="lg"
            className="h-14 w-full gap-2 text-base font-semibold"
            disabled={!tenantActive}
          >
            Continuar
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <ArrowRight className="h-5 w-5" />
            </motion.div>
          </Button>

          <p className="text-muted-foreground px-4 text-xs">
            Al presionar &quot;Continuar&quot; aceptas nuestros{' '}
            <Link href="/terms" className="text-primary underline underline-offset-2">
              Términos de Servicio
            </Link>{' '}
            y{' '}
            <Link href="/privacy" className="text-primary underline underline-offset-2">
              Política de Privacidad
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
