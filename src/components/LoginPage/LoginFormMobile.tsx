"use client";

import Link from "next/link";
import { appName, supportEmail } from "@/configs/branding";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, ArrowLeft } from "lucide-react";
import RotatingText from "@/components/Utilities/RotatingText";
import LoginFormContent from "./LoginFormContent";
import type { UseFormRegister, Control, FieldErrors } from "react-hook-form";
import type { LoginEmailForm, LoginOtpForm } from "@/schemas/loginSchema";

interface LoginFormMobileProps {
  tenantActive: boolean;
  isDemo: boolean;
  onBackToWelcome: () => void;
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

export default function LoginFormMobile({
  tenantActive,
  isDemo,
  onBackToWelcome,
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
}: LoginFormMobileProps) {
  return (
    <div className="md:hidden relative w-full min-h-screen flex flex-col px-6 py-safe">
      {!tenantActive && (
        <Alert variant="destructive" className="mb-4 mt-4">
          <AlertCircleIcon />
          <AlertTitle className="text-sm">Cuentas deshabilitadas para esta empresa</AlertTitle>
          <AlertDescription className="text-xs">
            <p>La suscripción de esta empresa está caducada o pendiente de renovación.</p>
            <ul className="list-inside list-disc text-xs mt-2">
              <li>
                Contacta con soporte para más información (
                <Link href={`mailto:${supportEmail}`}>{supportEmail}</Link>)
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isDemo && (
        <div className="absolute top-4 right-4 z-10 bg-lime-100 text-lime-800 text-xs font-semibold px-3 py-1 rounded-lg shadow">
          MODO DEMO
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={onBackToWelcome}
        className="absolute top-4 left-4 z-10"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="flex-1 flex flex-col justify-center w-full max-w-sm mx-auto py-12">
        <div className="w-full space-y-8">
          <div className="text-center flex flex-col gap-4">
            <h2 className="text-4xl font-bold text-primary bg-clip-text bg-gradient-to-tr from-primary to-muted-foreground text-transparent leading-tight">
              {appName}
            </h2>
            <div className="flex items-center justify-center gap-1 text-nowrap flex-wrap">
              <span className="text-base text-primary">Mantén tu producción</span>
              <RotatingText
                texts={["al día.", "segura.", "eficiente.", "organizada."]}
                mainClassName="text-base text-primary font-medium"
                staggerFrom="last"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={6000}
              />
            </div>
          </div>

          <div className="space-y-6">
            <LoginFormContent
              accessRequested={accessRequested}
              loading={loading}
              tenantActive={tenantActive}
              variant="mobile"
              emailRegister={emailRegister}
              emailErrors={emailErrors}
              onEmailSubmit={onEmailSubmit}
              otpControl={otpControl}
              otpErrors={otpErrors}
              onOtpSubmit={onOtpSubmit}
              onBackToEmail={onBackToEmail}
              onOtpPaste={onOtpPaste}
            />

            <p className="text-center text-sm text-muted-foreground pt-2">
              ¿Algún problema?{" "}
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
  );
}
