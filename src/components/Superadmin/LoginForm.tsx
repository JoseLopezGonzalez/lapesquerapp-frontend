'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useSuperadminAuth } from '@/context/SuperadminAuthContext';
import { fetchSuperadmin, SuperadminApiError } from '@/lib/superadminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { ArrowLeft, ArrowRight, Loader2, Mail, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { pageTransition } from '@/lib/motion-presets';
import { supportEmail } from '@/configs/branding';
import RotatingText from '@/components/Utilities/RotatingText';

const RESEND_COOLDOWN = 60;
const OTP_SLOT_CLASS =
  'rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10 h-11 w-10 text-base';
const OTP_SLOT_CLASS_MOBILE =
  'rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10 h-12 w-11 text-lg';

const ADMIN_TITLE = 'PesquerApp Admin';
const ADMIN_TAGLINE = 'Gestiona la plataforma';
const ROTATING_TEXTS = [
  'de forma segura.',
  'desde un solo lugar.',
  'sin restricciones.',
  'con total control.',
];
const LANDING_IMAGE = '/images/landing.png';

type Step = 'email' | 'otp' | 'verifying';

interface FormFieldsProps {
  step: 'email' | 'otp';
  email: string;
  setEmail: (v: string) => void;
  otp: string;
  handleOtpChange: (v: string) => void;
  error: string;
  submitting: boolean;
  cooldown: number;
  handleRequestAccess: (e: React.FormEvent) => Promise<void>;
  handleVerifyOtp: (code?: string) => Promise<void>;
  handleResend: () => Promise<void>;
  handleBack: () => void;
  variant: 'desktop' | 'mobile';
}

function SuperadminFormFields({
  step,
  email,
  setEmail,
  otp,
  handleOtpChange,
  error,
  submitting,
  cooldown,
  handleRequestAccess,
  handleVerifyOtp,
  handleResend,
  handleBack,
  variant,
}: FormFieldsProps) {
  const isMobile = variant === 'mobile';
  const buttonClass = isMobile ? 'w-full h-14 text-base font-semibold' : 'w-full';
  const inputClass = isMobile ? 'h-12 text-base' : '';
  const otpSlotClass = isMobile ? OTP_SLOT_CLASS_MOBILE : OTP_SLOT_CLASS;
  const inputId = isMobile ? 'sa-email-mobile' : 'sa-email';

  if (step === 'email') {
    return (
      <form onSubmit={handleRequestAccess} className="space-y-4">
        <div
          className={
            isMobile
              ? 'grid w-full items-center gap-2'
              : 'grid w-full max-w-sm items-center gap-1.5'
          }
        >
          <Label htmlFor={inputId} className={isMobile ? 'text-base' : ''}>
            Email
          </Label>
          <Input
            id={inputId}
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
            className={inputClass}
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" className={buttonClass} disabled={submitting || !email}>
          {submitting ? 'Enviando...' : 'Acceder'}
        </Button>
      </form>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleVerifyOtp();
      }}
    >
      <div className="flex flex-col gap-1">
        <Alert className="max-w-sm">
          <Mail className="h-4 w-4" />
          <AlertTitle>Revisa tu correo</AlertTitle>
          <AlertDescription>Te hemos enviado un enlace para acceder.</AlertDescription>
        </Alert>
        <Alert className="max-w-sm">
          <KeyRound className="h-4 w-4" />
          <AlertDescription>
            O bien introduce aquí el código de 6 dígitos que aparece en el correo.
          </AlertDescription>
        </Alert>
      </div>

      <div
        className={
          isMobile
            ? 'flex w-full flex-col items-center gap-2'
            : 'flex w-full max-w-sm flex-col items-center gap-1.5'
        }
      >
        <Label className={`${isMobile ? 'text-base ' : ''}w-full text-center`}>
          Código de 6 dígitos
        </Label>
        <InputOTP
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={otp}
          onChange={handleOtpChange}
          autoFocus
        >
          <InputOTPGroup className="gap-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <InputOTPSlot key={index} index={index} className={otpSlotClass} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          className={buttonClass}
          type="submit"
          disabled={submitting || otp.length < 6}
        >
          {submitting ? 'Verificando...' : 'Verificar código'}
        </Button>
        <Button variant="ghost" type="button" onClick={handleBack}>
          Volver
        </Button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="text-primary disabled:text-muted-foreground text-sm hover:underline disabled:no-underline"
        >
          {cooldown > 0 ? `Reenviar código (${cooldown}s)` : 'Reenviar código'}
        </button>
      </div>
    </form>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, token } = useSuperadminAuth();
  const { isMobile, mounted } = useIsMobileSafe();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (token) router.replace('/superadmin');
  }, [token, router]);

  useEffect(() => {
    const magicToken = searchParams.get('token');
    if (!magicToken) return;
    setStep('verifying');
    setError('');
    (async () => {
      try {
        const res = await fetchSuperadmin('/auth/verify-magic-link', {
          method: 'POST',
          body: JSON.stringify({ token: magicToken }),
        });
        const data = await res.json();
        login(data.access_token, data.user);
        router.replace('/superadmin');
      } catch (err) {
        setError(err instanceof SuperadminApiError ? err.message : 'Error al verificar el enlace.');
        setStep('email');
      }
    })();
  }, [searchParams, login, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current ?? undefined);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current ?? undefined);
  }, [cooldown]);

  const handleRequestAccess = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSubmitting(true);
      try {
        await fetchSuperadmin('/auth/request-access', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        setStep('otp');
        setCooldown(RESEND_COOLDOWN);
      } catch (err) {
        setError(err instanceof SuperadminApiError ? err.message : 'Error al solicitar acceso.');
      } finally {
        setSubmitting(false);
      }
    },
    [email]
  );

  const handleVerifyOtp = useCallback(
    async (codeOverride?: string) => {
      const code = codeOverride ?? otp;
      if (code.length < 6) return;
      setError('');
      setSubmitting(true);
      try {
        const res = await fetchSuperadmin('/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ email, code }),
        });
        const data = await res.json();
        login(data.access_token, data.user);
        router.replace('/superadmin');
      } catch (err) {
        setError(
          err instanceof SuperadminApiError ? err.message : 'Error al verificar el código.'
        );
      } finally {
        setSubmitting(false);
      }
    },
    [email, otp, login, router]
  );

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    setError('');
    try {
      await fetchSuperadmin('/auth/request-access', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(
        err instanceof SuperadminApiError ? err.message : 'Error al reenviar el código.'
      );
    }
  }, [cooldown, email]);

  const handleOtpChange = useCallback(
    (value: string) => {
      setOtp(value);
      if (value.length === 6) handleVerifyOtp(value);
    },
    [handleVerifyOtp]
  );

  const handleBack = () => {
    setStep('email');
    setError('');
    setOtp('');
  };

  if (step === 'verifying') {
    return (
      <div className="login-background flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
          <p className="text-muted-foreground mt-4 text-sm">Verificando enlace...</p>
          {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="login-background flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  const shouldShowWelcome = isMobile && !showForm;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {shouldShowWelcome ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative flex min-h-screen w-full flex-col items-center px-4 pb-8"
          >
            <div className="absolute inset-0 z-0">
              <Image
                src={LANDING_IMAGE}
                alt="Panel de administración"
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
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

            <div className="relative z-10 flex w-full max-w-sm flex-1 flex-col items-center justify-end pb-8">
              <div className="flex w-full flex-col items-center space-y-8 text-center">
                <div className="space-y-4">
                  <h1 className="from-primary to-primary/80 bg-gradient-to-tr bg-clip-text text-5xl font-bold text-transparent">
                    {ADMIN_TITLE}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1 text-nowrap">
                  <span className="text-foreground text-lg">{ADMIN_TAGLINE}</span>
                  <RotatingText
                    texts={ROTATING_TEXTS}
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
                  onClick={() => setShowForm(true)}
                  size="lg"
                  className="h-14 w-full gap-2 text-base font-semibold"
                >
                  Continuar
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            {...pageTransition}
            className="login-background flex min-h-screen items-center justify-center bg-white dark:bg-black"
          >
            {/* Mobile form */}
            {isMobile && (
              <div className="py-safe relative flex min-h-screen w-full flex-col px-6 md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowForm(false)}
                  className="absolute top-4 left-4 z-10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
                  <div className="w-full space-y-8">
                    <div className="flex flex-col gap-4 text-center">
                      <h2 className="text-primary from-primary to-muted-foreground bg-gradient-to-tr bg-clip-text text-4xl leading-tight font-bold text-transparent">
                        {ADMIN_TITLE}
                      </h2>
                      <div className="flex flex-wrap items-center justify-center gap-1 text-nowrap">
                        <span className="text-primary text-base">{ADMIN_TAGLINE}</span>
                        <RotatingText
                          texts={ROTATING_TEXTS}
                          mainClassName="text-base text-primary font-medium"
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

                    <div className="space-y-6">
                      <SuperadminFormFields
                        step={step === 'email' ? 'email' : 'otp'}
                        email={email}
                        setEmail={setEmail}
                        otp={otp}
                        handleOtpChange={handleOtpChange}
                        error={error}
                        submitting={submitting}
                        cooldown={cooldown}
                        handleRequestAccess={handleRequestAccess}
                        handleVerifyOtp={handleVerifyOtp}
                        handleResend={handleResend}
                        handleBack={handleBack}
                        variant="mobile"
                      />
                      <p className="text-muted-foreground pt-2 text-center text-sm">
                        ¿Algún problema?{' '}
                        <Link
                          href={`mailto:${supportEmail}`}
                          className="text-primary hover:text-muted-foreground underline underline-offset-2"
                        >
                          Contáctanos
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop form */}
            {!isMobile && (
              <div className="hidden w-full max-w-[1000px] px-6 py-20 md:block">
                <Card className="relative flex w-full flex-row p-2">
                  <div className="relative min-h-[240px] w-full max-w-[500px] overflow-hidden rounded-lg">
                    <Image
                      src={LANDING_IMAGE}
                      alt="Panel de administración"
                      fill
                      sizes="(max-width: 1024px) 100vw, 500px"
                      className="object-cover"
                      priority
                    />
                  </div>

                  <div className="flex w-full flex-col items-center justify-center p-8 lg:p-12">
                    <div className="mx-auto w-full max-w-xs space-y-8 py-20">
                      <div className="flex flex-col gap-3 text-center">
                        <h2 className="text-primary from-primary to-muted-foreground bg-gradient-to-tr bg-clip-text text-2xl leading-tight font-bold text-transparent lg:text-3xl xl:text-[2.5rem]">
                          {ADMIN_TITLE}
                        </h2>
                        <div className="flex items-center justify-center gap-1 text-nowrap">
                          <span className="text-md text-primary lg:text-xl">{ADMIN_TAGLINE}</span>
                          <RotatingText
                            texts={ROTATING_TEXTS}
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
                        <SuperadminFormFields
                          step={step === 'email' ? 'email' : 'otp'}
                          email={email}
                          setEmail={setEmail}
                          otp={otp}
                          handleOtpChange={handleOtpChange}
                          error={error}
                          submitting={submitting}
                          cooldown={cooldown}
                          handleRequestAccess={handleRequestAccess}
                          handleVerifyOtp={handleVerifyOtp}
                          handleResend={handleResend}
                          handleBack={handleBack}
                          variant="desktop"
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
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
