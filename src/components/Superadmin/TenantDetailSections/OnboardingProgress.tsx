'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fetchSuperadmin } from '@/lib/superadminApi';
import { notify } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RotateCw, AlertTriangle } from 'lucide-react';

const STEP_LABELS = [
  'Registro creado',
  'Base de datos creada',
  'Migraciones ejecutadas',
  'Catálogos iniciales',
  'Usuario administrador',
  'Configuración empresa',
  'Activación',
  'Email de bienvenida',
];

const POLL_INTERVAL = 4000;
const STALLED_THRESHOLD = 30000;

interface OnboardingData {
  step: number;
  total_steps: number;
  step_label?: string | null;
  status: string;
  error?: string | null;
  failed_at?: string | null;
  [key: string]: unknown;
}

interface Tenant {
  id: number | string;
  status: string;
  onboarding?: OnboardingData;
  onboarding_step?: number;
  [key: string]: unknown;
}

function getOnboardingStepLabel(data: OnboardingData): string {
  return data.step_label || STEP_LABELS[Math.max(0, (data.step || 1) - 1)] || 'Procesando';
}

function getOnboarding(tenant: Tenant): OnboardingData {
  if (tenant.onboarding) return tenant.onboarding;
  return {
    step: tenant.onboarding_step ?? 0,
    total_steps: 8,
    step_label: null,
    status: tenant.onboarding_step >= 8 ? 'completed' : 'in_progress',
    error: null,
    failed_at: null,
  };
}

export default function OnboardingProgress({ tenant, onRefresh }: { tenant: Tenant; onRefresh: () => void }) {
  const ob = getOnboarding(tenant);
  const totalSteps = ob.total_steps || 8;
  const toastId = `tenant-onboarding-${tenant.id}`;

  const [current, setCurrent] = useState<OnboardingData>(ob);
  const [retrying, setRetrying] = useState(false);
  const [stalled, setStalled] = useState(false);

  const stepStartTime = useRef(Date.now());
  const prevStep = useRef(ob.step);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visible = tenant.status === 'pending' && ob.status !== 'completed' && ob.step < totalSteps;

  const completed = (ob.status === 'completed' || ob.step >= totalSteps) && totalSteps > 0;

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
          notify.loading(
            {
              title: 'Onboarding en progreso',
              description: `${getOnboardingStepLabel(data)} · Paso ${Math.min(data.step, totalSteps)} de ${totalSteps}`,
            },
            {
              id: toastId,
              important: true,
            }
          );
        }

        setCurrent(data);

        if (data.status === 'completed' || data.step >= totalSteps) {
          clearInterval(pollRef.current ?? undefined);
          pollRef.current = null;
          notify.success(
            {
              title: 'Onboarding completado',
              description: 'El tenant ya está listo para usarse.',
            },
            {
              id: toastId,
              duration: 6000,
            }
          );
          onRefresh();
          return;
        }

        if (data.status === 'failed') {
          clearInterval(pollRef.current ?? undefined);
          pollRef.current = null;
          notify.error(
            {
              title: 'Onboarding con errores',
              description: data.error || 'El proceso falló antes de completarse.',
            },
            {
              id: toastId,
              important: true,
            }
          );
          return;
        }

        if (Date.now() - stepStartTime.current > STALLED_THRESHOLD) {
          setStalled(true);
          notify.warning(
            {
              title: 'Onboarding sin avances recientes',
              description: 'El proceso sigue abierto, pero no ha cambiado de paso recientemente.',
            },
            {
              id: toastId,
              important: true,
            }
          );
        }
      } catch {
        /* ignore polling errors */
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(pollRef.current ?? undefined);
  }, [visible, tenant.id, totalSteps, onRefresh]);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      const res = await fetchSuperadmin(`/tenants/${tenant.id}/retry-onboarding`, {
        method: 'POST',
      });
      const json = await res.json();
      const data = json.data || json.onboarding || json;

      notify.loading(
        {
          title: 'Reintentando onboarding',
          description: `Paso ${Math.min(data.step ?? current.step, totalSteps)} de ${totalSteps}`,
        },
        {
          id: toastId,
          important: true,
        }
      );
      stepStartTime.current = Date.now();
      setStalled(false);

      if (data.step !== undefined) {
        setCurrent((prev) => ({ ...prev, ...data, status: 'in_progress', error: null }));
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
            if (d.status === 'completed' || d.step >= totalSteps) {
              clearInterval(pollRef.current ?? undefined);
              pollRef.current = null;
              notify.success(
                {
                  title: 'Onboarding completado',
                  description: 'El tenant ya está listo para usarse.',
                },
                {
                  id: toastId,
                  duration: 6000,
                }
              );
              onRefresh();
            }
            if (d.status === 'failed') {
              clearInterval(pollRef.current ?? undefined);
              pollRef.current = null;
              notify.error(
                {
                  title: 'Onboarding con errores',
                  description: d.error || 'El proceso volvió a fallar durante el reintento.',
                },
                {
                  id: toastId,
                  important: true,
                }
              );
            }
          } catch {
            /* ignore */
          }
        }, POLL_INTERVAL);
      }
    } catch (err) {
      notify.error(
        {
          title: (err as Error).message || 'Error al reintentar',
          description: 'No se pudo volver a lanzar el onboarding.',
        },
        {
          id: toastId,
          important: true,
        }
      );
    } finally {
      setRetrying(false);
    }
  }, [tenant.id, totalSteps, onRefresh, toastId, current.step]);

  if (!visible && !completed) return null;

  if (completed) {
    return (
      <Card className="border-green-500/30">
        <CardContent className="flex items-center gap-2 py-4">
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            Onboarding completado
          </span>
          <span className="text-muted-foreground text-xs">
            Paso {totalSteps}/{totalSteps}
          </span>
        </CardContent>
      </Card>
    );
  }

  const isFailed = current.status === 'failed';
  const labels = STEP_LABELS.slice(0, totalSteps);

  return (
    <Card className={isFailed ? 'border-destructive/50' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Progreso de onboarding</CardTitle>
        <span className="text-muted-foreground text-xs">
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
                      ? 'bg-destructive'
                      : completed
                        ? 'bg-green-500'
                        : isCurrentStep
                          ? 'animate-pulse bg-blue-500'
                          : 'bg-muted'
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
                      ? 'text-destructive font-medium'
                      : completed
                        ? 'font-medium text-green-600 dark:text-green-400'
                        : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {isFailed && current.error && (
          <div className="border-destructive/30 bg-destructive/10 flex items-start gap-2 rounded-md border p-3">
            <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="text-destructive text-sm font-medium">Error en onboarding</p>
              <p className="text-destructive/80 text-xs">{current.error}</p>
              {current.failed_at && (
                <p className="text-muted-foreground text-[10px]">
                  {new Intl.DateTimeFormat('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  }).format(new Date(current.failed_at))}
                </p>
              )}
            </div>
          </div>
        )}

        {(isFailed || stalled) && (
          <div className="flex items-center gap-2">
            {stalled && !isFailed && (
              <span className="text-muted-foreground text-xs">
                El onboarding parece estar detenido.
              </span>
            )}
            <Button
              variant={isFailed ? 'default' : 'outline'}
              size="sm"
              onClick={handleRetry}
              disabled={retrying}
            >
              {retrying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCw className="h-3.5 w-3.5" />
              )}
              Reintentar onboarding
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
