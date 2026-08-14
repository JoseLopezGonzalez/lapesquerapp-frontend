'use client';

import Image from 'next/image';
import Link from 'next/link';
import { appName, supportEmail, isGenericBranding } from '@/configs/branding';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';
import RotatingText from '@/components/Utilities/RotatingText';
import LoginFormContent from './LoginFormContent';
import type { UseFormRegister, Control, FieldErrors } from 'react-hook-form';
import type { LoginEmailForm, LoginOtpForm } from '@/schemas/loginSchema';

interface LoginFormDesktopProps {
  tenantActive: boolean;
  isDemo: boolean;
  brandingImageUrl?: string | null;
  /** Nombre del cliente de maquila (portal /portal/{slug}) — sustituye {appName} cuando está presente. */
  titleOverride?: string | null;
  accessRequested: boolean;
  loading: boolean;
  emailRegister: UseFormRegister<LoginEmailForm>;
  emailErrors: FieldErrors<LoginEmailForm>;
  onEmailSubmit: () => void;
  otpControl: Control<LoginOtpForm>;
  otpErrors: FieldErrors<LoginOtpForm>;
  onOtpSubmit: () => void;
  onBackToEmail: () => void;
  onOtpPaste: (e: React.ClipboardEvent) => void;
}

export default function LoginFormDesktop(props: LoginFormDesktopProps) {
  const {
    tenantActive,
    isDemo,
    brandingImageUrl,
    titleOverride,
    accessRequested,
    loading,
    emailRegister,
    emailErrors,
    onEmailSubmit,
    otpControl,
    otpErrors,
    onOtpSubmit,
    onBackToEmail,
    onOtpPaste,
  } = props;

  return (
    <div className="hidden w-full max-w-[1000px] px-6 py-20 md:block">
      {!tenantActive && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircleIcon />
          <AlertTitle>Cuentas deshabilitadas para esta empresa</AlertTitle>
          <AlertDescription>
            <p>La suscripción de esta empresa está caducada o pendiente de renovación.</p>
            <ul className="list-inside list-disc text-sm">
              <li>
                Contacta con soporte para más información (
                <Link href={`mailto:${supportEmail}`}>{supportEmail}</Link>)
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card className="relative flex w-full flex-row p-2">
        {isDemo && (
          <div className="absolute top-2 right-2 z-10 rounded-lg bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800 shadow">
            MODO DEMO
          </div>
        )}

        {!isGenericBranding && (
          <div className="relative min-h-[240px] w-full max-w-[500px] overflow-hidden rounded-lg">
            <Image
              src={brandingImageUrl || '/images/landing.png'}
              alt="Imagen de branding"
              fill
              sizes="(max-width: 1024px) 100vw, 500px"
              className="object-cover"
              priority
              onError={(e) => {
                e.currentTarget.src = '/images/landing.png';
              }}
            />
          </div>
        )}

        <div className="flex w-full flex-col items-center justify-center p-8 lg:p-12">
          <div className="mx-auto w-full max-w-xs space-y-8 py-20">
            <div className="flex flex-col gap-3 text-center">
              <h2 className="text-primary from-primary to-muted-foreground bg-gradient-to-tr bg-clip-text text-2xl leading-tight font-bold text-transparent lg:text-3xl xl:text-[2.5rem]">
                {titleOverride ?? appName}
              </h2>
              <div className="flex items-center justify-center gap-1 text-nowrap">
                <span className="text-md text-primary lg:text-xl">Mantén tu producción</span>
                <RotatingText
                  texts={['al día.', 'segura.', 'eficiente.', 'organizada.']}
                  mainClassName="text-xl text-primary font-medium"
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
            </div>

            <div className="space-y-4">
              <LoginFormContent
                accessRequested={accessRequested}
                loading={loading}
                tenantActive={tenantActive}
                variant="desktop"
                emailRegister={emailRegister}
                emailErrors={emailErrors}
                onEmailSubmit={onEmailSubmit}
                otpControl={otpControl}
                otpErrors={otpErrors}
                onOtpSubmit={onOtpSubmit}
                onBackToEmail={onBackToEmail}
                onOtpPaste={onOtpPaste}
              />
              <p className="text-muted-foreground text-center text-sm">
                ¿Algún problema?{' '}
                <Link
                  href={`mailto:${supportEmail}`}
                  className="text-primary hover:text-muted-foreground"
                >
                  Contáctanos
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
