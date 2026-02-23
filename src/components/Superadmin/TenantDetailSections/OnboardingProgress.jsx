"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { fetchSuperadmin } from "@/lib/superadminApi";
import { notify } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RotateCw, AlertTriangle } from "lucide-react";

const STEP_LABELS = [
  "Registro creado",
  "Base de datos creada",
  "Migraciones ejecutadas",
  "Catalogos iniciales",
  "Usuario administrador",
  "Configuracion empresa",
  "Activacion",
  "Email de bienvenida",
];

const POLL_INTERVAL = 4000;
const STALLED_THRESHOLD = 30000;

function getOnboarding(tenant) {
  if (tenant.onboarding) return tenant.onboarding;
  return {
    step: tenant.onboarding_step ?? 0,
    total_steps: 8,
    step_label: null,
    status: tenant.onboarding_step >= 8 ? "completed" : "in_progress",
    error: null,
    failed_at: null,
  };
}

export default function OnboardingProgress({ tenant, onRefresh }) {
  const ob = getOnboarding(tenant);
  const totalSteps = ob.total_steps || 8;

  const [current, setCurrent] = useState(ob);
  const [retrying, setRetrying] = useState(false);
  const [stalled, setStalled] = useState(false);

  const stepStartTime = useRef(Date.now());
  const prevStep = useRef(ob.step);
  const pollRef = useRef(null);

  const visible =
    tenant.status === "pending" &&
    ob.status !== "completed" &&
    ob.step < totalSteps;

  useEffect(() => {
    if (!visible) return;

    const poll = async () => {
      try {
        const res = await fetchSuperadmin(`/tenants/${tenant.id}/onboarding-status`);
        const json = await res.json();
        const data = json.data || json;

        if (data.step !== prevStep.current) {
          prevStep.current = data.step;
          stepStartTime.current = Date.now();
          setStalled(false);
        }

        setCurrent(data);

        if (data.status === "completed" || data.step >= totalSteps) {
          clearInterval(pollRef.current);
          notify.success({ title: "Onboarding completado" });
          onRefresh();
          return;
        }

        if (data.status === "failed") {
          clearInterval(pollRef.current);
          return;
        }

        if (Date.now() - stepStartTime.current > STALLED_THRESHOLD) {
          setStalled(true);
        }
      } catch { /* ignore polling errors */ }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [visible, tenant.id, totalSteps, onRefresh]);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      const res = await fetchSuperadmin(`/tenants/${tenant.id}/retry-onboarding`, { method: "POST" });
      const json = await res.json();
      const data = json.data || json.onboarding || json;

      notify.success({ title: "Reintentando onboarding..." });
      stepStartTime.current = Date.now();
      setStalled(false);

      if (data.step !== undefined) {
        setCurrent((prev) => ({ ...prev, ...data, status: "in_progress", error: null }));
        prevStep.current = data.step;
      }

      if (!pollRef.current) {
        pollRef.current = setInterval(async () => {
          try {
            const r = await fetchSuperadmin(`/tenants/${tenant.id}/onboarding-status`);
            const j = await r.json();
            const d = j.data || j;
            if (d.step !== prevStep.current) {
              prevStep.current = d.step;
              stepStartTime.current = Date.now();
              setStalled(false);
            }
            setCurrent(d);
            if (d.status === "completed" || d.step >= totalSteps) {
              clearInterval(pollRef.current);
              pollRef.current = null;
              notify.success({ title: "Onboarding completado" });
              onRefresh();
            }
            if (d.status === "failed") {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          } catch { /* ignore */ }
        }, POLL_INTERVAL);
      }
    } catch (err) {
      notify.error({ title: err.message || "Error al reintentar" });
    } finally {
      setRetrying(false);
    }
  }, [tenant.id, totalSteps, onRefresh]);

  if (!visible) return null;

  const isFailed = current.status === "failed";
  const labels = STEP_LABELS.slice(0, totalSteps);

  return (
    <Card className={isFailed ? "border-destructive/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Progreso de onboarding</CardTitle>
        <span className="text-xs text-muted-foreground">
          Paso {current.step} / {totalSteps}
          {current.step_label && ` — ${current.step_label}`}
        </span>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-1">
          {labels.map((label, i) => {
            const stepNum = i + 1;
            const completed = current.step >= stepNum;
            const isCurrentStep = current.step === i;
            const failedHere = isFailed && current.step === i;
            return (
              <div key={i} className="flex-1">
                <div
                  className={`h-2 rounded-full transition-colors ${
                    failedHere
                      ? "bg-destructive"
                      : completed
                        ? "bg-green-500"
                        : isCurrentStep
                          ? "bg-blue-500 animate-pulse"
                          : "bg-muted"
                  }`}
                  title={label}
                />
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
          {labels.map((label, i) => {
            const stepNum = i + 1;
            const completed = current.step >= stepNum;
            const failedHere = isFailed && current.step === i;
            return (
              <div key={i} className="text-center">
                <span
                  className={`block text-[10px] leading-tight ${
                    failedHere
                      ? "text-destructive font-medium"
                      : completed
                        ? "text-green-600 dark:text-green-400 font-medium"
                        : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {isFailed && current.error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Error en onboarding</p>
              <p className="text-xs text-destructive/80">{current.error}</p>
              {current.failed_at && (
                <p className="text-[10px] text-muted-foreground">
                  {new Intl.DateTimeFormat("es-ES", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                  }).format(new Date(current.failed_at))}
                </p>
              )}
            </div>
          </div>
        )}

        {(isFailed || stalled) && (
          <div className="flex items-center gap-2">
            {stalled && !isFailed && (
              <span className="text-xs text-muted-foreground">
                El onboarding parece estar detenido.
              </span>
            )}
            <Button variant={isFailed ? "default" : "outline"} size="sm" onClick={handleRetry} disabled={retrying}>
              {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
              Reintentar onboarding
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
