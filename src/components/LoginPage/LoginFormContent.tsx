'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { Button as ButtonBase } from '@/components/ui/button';
import { Input as InputBase } from '@/components/ui/input';
import { Label as LabelBase } from '@/components/ui/label';

const Label = LabelBase as React.ComponentType<
  React.PropsWithChildren<{ htmlFor?: string; className?: string }>
>;
const Input = InputBase as React.ComponentType<React.InputHTMLAttributes<HTMLInputElement>>;
const Button = ButtonBase as React.ComponentType<
  React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }>
>;
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  InputOTP as InputOTPBase,
  InputOTPGroup as InputOTPGroupBase,
  InputOTPSlot as InputOTPSlotBase,
} from '@/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS } from 'input-otp';

type InputOTPProps = React.PropsWithChildren<{
  maxLength?: number;
  pattern?: RegExp | string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}>;
const InputOTP = InputOTPBase as React.ComponentType<InputOTPProps>;
const InputOTPGroup = InputOTPGroupBase as React.ComponentType<
  React.PropsWithChildren<{ className?: string }>
>;
const InputOTPSlot = InputOTPSlotBase as React.ComponentType<{ index: number; className?: string }>;
import { Mail, KeyRound } from 'lucide-react';
import type { LoginEmailForm, LoginOtpForm } from '@/schemas/loginSchema';
import { exampleEmail } from '@/configs/branding';

function OtpWatcher({
  control,
  onIsComplete,
}: {
  control: Control<LoginOtpForm>;
  onIsComplete: (v: boolean) => void;
}) {
  const code = useWatch({ control, name: 'code', defaultValue: '' });
  useEffect(() => {
    onIsComplete((code?.length ?? 0) === 6);
  }, [code, onIsComplete]);
  return null;
}

interface LoginFormContentProps {
  accessRequested: boolean;
  loading: boolean;
  tenantActive: boolean;
  variant?: 'desktop' | 'mobile';
  emailRegister?: UseFormRegister<LoginEmailForm>;
  emailErrors?: FieldErrors<LoginEmailForm>;
  onEmailSubmit: () => void;
  otpControl?: Control<LoginOtpForm>;
  otpErrors?: FieldErrors<LoginOtpForm>;
  onOtpSubmit: () => void;
  onBackToEmail: () => void;
  onOtpPaste?: (e: React.ClipboardEvent) => void;
}

export default function LoginFormContent({
  accessRequested,
  loading,
  tenantActive,
  variant = 'desktop',
  emailRegister,
  emailErrors,
  onEmailSubmit,
  otpControl,
  otpErrors,
  onOtpSubmit,
  onBackToEmail,
  onOtpPaste,
}: LoginFormContentProps) {
  const isMobile = variant === 'mobile';
  const [isOtpComplete, setIsOtpComplete] = useState(false);
  const inputId = isMobile ? 'email-mobile' : 'email';
  const labelClass = isMobile ? 'text-base' : '';
  const inputClass = isMobile ? 'h-12 text-base' : '';
  const buttonClass = isMobile ? 'w-full h-14 text-base font-semibold' : 'w-full';
  const otpSlotClass = isMobile
    ? 'rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10 h-12 w-11 text-lg'
    : 'rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10';

  if (!accessRequested) {
    return (
      <form
        className={isMobile ? 'flex flex-col gap-6' : 'flex flex-col gap-4'}
        onSubmit={(e) => {
          e.preventDefault();
          onEmailSubmit();
        }}
      >
        <div
          className={
            isMobile
              ? 'grid w-full items-center gap-2'
              : 'grid w-full max-w-sm items-center gap-1.5'
          }
        >
          <Label htmlFor={inputId} className={labelClass}>
            Email
          </Label>
          <Input
            type="email"
            id={inputId}
            placeholder={exampleEmail}
            disabled={!tenantActive}
            className={inputClass}
            autoFocus
            {...(emailRegister ? emailRegister('email') : {})}
          />
          {emailErrors?.email?.message && (
            <p className="text-destructive text-sm">{emailErrors.email.message}</p>
          )}
        </div>
        <Button className={buttonClass} type="submit" disabled={loading || !tenantActive}>
          {loading ? 'Enviando...' : 'Acceder'}
        </Button>
      </form>
    );
  }

  return (
    <form
      className={isMobile ? 'flex flex-col gap-6' : 'flex flex-col gap-4'}
      onSubmit={(e) => {
        e.preventDefault();
        onOtpSubmit();
      }}
    >
      {otpControl && <OtpWatcher control={otpControl} onIsComplete={setIsOtpComplete} />}
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
        onPasteCapture={onOtpPaste}
      >
        <Label className={`${isMobile ? 'text-base' : ''}text-center w-full`}>
          Código de 6 dígitos
        </Label>
        {otpControl ? (
          <Controller
            name="code"
            control={otpControl}
            render={({ field }) => (
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={field.value}
                onChange={field.onChange}
                disabled={!tenantActive}
                autoFocus
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot key={index} index={index} className={otpSlotClass} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            )}
          />
        ) : null}
        {otpErrors?.code?.message && (
          <p className="text-destructive text-sm">{otpErrors.code.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Button
          className={buttonClass}
          type="submit"
          disabled={loading || !tenantActive || !isOtpComplete}
        >
          {loading ? 'Verificando...' : 'Verificar código'}
        </Button>
        <Button variant="ghost" type="button" onClick={onBackToEmail}>
          Volver
        </Button>
      </div>
    </form>
  );
}
