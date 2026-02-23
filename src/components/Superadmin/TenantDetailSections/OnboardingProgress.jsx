"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { fetchSuperadmin } from "@/lib/superadminApi";
import { notify } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCw } from "lucide-react";

const STEPS = [
  "Registro creado",
  "Base de datos creada",
  "Migraciones ejecutadas",
  "Catálogos iniciales",
  "Usuario administrador",
  "Configuración empresa",
  "Activación",
  "Email de bienvenida",
];

const POLL_INTERVAL = 4000;
const RETRY_THRESHOLD = 30000;

export default function OnboardingProgress({ tenant, onRefresh }) {
  const [currentStep, setCurrentStep] = useState(tenant.onboarding_step);
  const [retrying, setRetrying] = useState(false);
  const stepStartTime = useRef(Date.now());
  const prevStep = useRef(tenant.onboarding_step);
  const pollRef = useRef(null);
  const [showRetry, setShowRetry] = useState(false);

  const visible = tenant.status === "pending" && tenant.onboarding_step < 8;

  // Polling
  useEffect(() => {
    if (!visible) return;

    const poll = async () => {
      try {
        const res = await fetchSuperadmin(`/tenants/${tenant.id}`);
        const json = await res.json();
        const step = (json.data || json).onboarding_step;

        if (step !== prevStep.current) {
          prevStep.current = step;
          stepStartTime.current = Date.now();
          setShowRetry(false);
        }

        setCurrentStep(step);

        if (step >= 8) {
          clearInterval(pollRef.current);
          notify.success({ title: "Onboarding completado" });
          onRefresh();
          return;
        }

        if (Date.now() - stepStartTime.current > RETRY_THRESHOLD) {
          setShowRetry(true);
        }
      } catch { /* ignore polling errors */ }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [visible, tenant.id, onRefresh]);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      await fetchSuperadmin(`/tenants/${tenant.id}/retry-onboarding`, { method: "POST" });
      notify.success({ title: "Reintentando onboarding..." });
      stepStartTime.current = Date.now();
      setShowRetry(false);
    } catch (err) {
      notify.error({ title: err.message || "Error al reintentar" });
    } finally {
      setRetrying(false);
    }
  }, [tenant.id]);

  if (!visible) return null;

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Progreso de onboarding</h2>
        <span className="text-xs text-muted-foreground">Paso {currentStep} / 8</span>
      </div>
      <div className="p-4 space-y-4">
        {/* Progress bar */}
        <div className="flex gap-1">
          {STEPS.map((label, i) => {
            const stepNum = i + 1;
            const completed = currentStep >= stepNum;
            const isCurrent = currentStep === i; // onboarding_step is 0-indexed for "in progress" step
            return (
              <div key={i} className="flex-1">
                <div
                  className={`h-2 rounded-full transition-colors ${
                    completed
                      ? "bg-green-500"
                      : isCurrent
                        ? "bg-blue-500 animate-pulse"
                        : "bg-muted"
                  }`}
                  title={label}
                />
              </div>
            );
          })}
        </div>

        {/* Step labels */}
        <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
          {STEPS.map((label, i) => {
            const stepNum = i + 1;
            const completed = currentStep >= stepNum;
            return (
              <div key={i} className="text-center">
                <span
                  className={`block text-[10px] leading-tight ${
                    completed ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Retry button */}
        {showRetry && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              El onboarding parece estar detenido.
            </span>
            <Button variant="outline" size="sm" onClick={handleRetry} disabled={retrying}>
              {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
              Reintentar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
