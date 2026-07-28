'use client';
// Necesita 'use client': usa useForm (formulario de leads) y estado de envío

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notify } from '@/lib/notifications';
import { landingLeadSchema, type LandingLeadForm } from '@/schemas/landingLeadSchema';
import { submitLandingLead } from '@/services/landing/landingLeadService';

export default function LeadCaptureForm() {
  const t = useTranslations('Landing.leadForm');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LandingLeadForm>({
    resolver: zodResolver(landingLeadSchema),
    defaultValues: { email: '' },
  });

  const onSubmitLead = async (data: LandingLeadForm) => {
    setIsSubmittingLead(true);
    try {
      await submitLandingLead({ email: data.email, company: honeypotRef.current?.value ?? '' });
      notify.success(t('successMessage'));
      reset({ email: '' });
    } catch (error) {
      notify.error(error instanceof Error ? error.message : t('genericError'));
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <section className="bg-sky-500 py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl tracking-tight text-white sm:text-4xl">{t('title')}</h2>
          <p className="text-md mt-4 text-sky-100">{t('description')}</p>
          <form
            onSubmit={handleSubmit(onSubmitLead)}
            className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            noValidate
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <div className="text-left">
                <Input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/70"
                  disabled={isSubmittingLead}
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 w-fit rounded bg-white/95 px-2 py-0.5 text-xs font-medium text-red-600">
                    * {errors.email.message}
                  </p>
                )}
              </div>
              {/* Honeypot anti-spam: invisible para usuarios reales, leído aparte del schema RHF */}
              <input
                ref={honeypotRef}
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute h-0 w-0 opacity-0"
              />
              <Button type="submit" variant="secondary" disabled={isSubmittingLead}>
                {isSubmittingLead ? t('submitLoading') : t('submitIdle')}
              </Button>
            </div>
          </form>
          <p className="mt-10 text-sm text-sky-200">{t('disclaimer')}</p>
        </div>
      </div>
    </section>
  );
}
