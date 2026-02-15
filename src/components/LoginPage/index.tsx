"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../Utilities/Loader";
import { useIsMobileSafe } from "@/hooks/use-mobile";
import { pageTransition } from "@/lib/motion-presets";
import { useLoginTenant } from "@/hooks/useLoginTenant";
import { useLoginActions } from "@/hooks/useLoginActions";
import { loginEmailSchema, loginOtpSchema } from "@/schemas/loginSchema";
import LoginWelcomeStep from "./LoginWelcomeStep";
import LoginFormDesktop from "./LoginFormDesktop";
import LoginFormMobile from "./LoginFormMobile";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const emailForm = useForm({
    resolver: zodResolver(loginEmailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm({
    resolver: zodResolver(loginOtpSchema),
    defaultValues: { code: "" },
  });

  const {
    tenantChecked,
    tenantActive,
    brandingImageUrl,
    isDemo,
    demoEmail,
  } = useLoginTenant();

  const { isMobile } = useIsMobileSafe();

  useEffect(() => {
    if (demoEmail) emailForm.setValue("email", demoEmail);
  }, [demoEmail, emailForm]);

  const setCodeValue = (value: string) => otpForm.setValue("code", value);

  const actions = useLoginActions({
    email,
    accessRequested,
    setEmail,
    setAccessRequested,
    setLoading,
    setCodeValue,
  });

  const handleBackToEmail = () => {
    actions.backToEmail();
    otpForm.reset({ code: "" });
  };

  if (!tenantChecked) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const shouldShowWelcome = isMobile && !showForm;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {shouldShowWelcome ? (
          <LoginWelcomeStep
            brandingImageUrl={brandingImageUrl}
            isDemo={isDemo}
            tenantActive={tenantActive}
            onContinue={() => setShowForm(true)}
          />
        ) : (
          <motion.div
            key="form"
            {...pageTransition}
            className="login-background flex min-h-screen items-center justify-center bg-white dark:bg-black"
          >
            {isMobile ? (
              <LoginFormMobile
                tenantActive={tenantActive}
                isDemo={isDemo}
                onBackToWelcome={() => setShowForm(false)}
                accessRequested={accessRequested}
                loading={loading}
                emailRegister={emailForm.register}
                emailErrors={emailForm.formState.errors}
                onEmailSubmit={emailForm.handleSubmit(actions.handleAcceder)}
                otpControl={otpForm.control}
                otpErrors={otpForm.formState.errors}
                onOtpSubmit={otpForm.handleSubmit(actions.handleVerifyOtp)}
                onBackToEmail={handleBackToEmail}
                onOtpPaste={actions.handleOtpPaste}
              />
            ) : (
              <LoginFormDesktop
                tenantActive={tenantActive}
                isDemo={isDemo}
                brandingImageUrl={brandingImageUrl}
                accessRequested={accessRequested}
                loading={loading}
                emailRegister={emailForm.register}
                emailErrors={emailForm.formState.errors}
                onEmailSubmit={emailForm.handleSubmit(actions.handleAcceder)}
                otpControl={otpForm.control}
                otpErrors={otpForm.formState.errors}
                onOtpSubmit={otpForm.handleSubmit(actions.handleVerifyOtp)}
                onBackToEmail={handleBackToEmail}
                onOtpPaste={actions.handleOtpPaste}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
