"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchSuperadmin, SuperadminApiError } from "@/lib/superadminApi";
import { notify } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Play, Pause, XCircle, RotateCw, Trash2, AlertTriangle } from "lucide-react";

function getOnboarding(tenant) {
  if (tenant.onboarding) return tenant.onboarding;
  return { step: tenant.onboarding_step ?? 0, total_steps: 8, status: null };
}

function getActions(tenant) {
  const ob = getOnboarding(tenant);

  switch (tenant.status) {
    case "active":
      return [
        { action: "suspend", label: "Suspender", icon: Pause, variant: "outline" },
        { action: "cancel", label: "Cancelar", icon: XCircle, variant: "destructive" },
      ];

    case "suspended":
      return [
        { action: "activate", label: "Activar", icon: Play, variant: "default" },
        { action: "cancel", label: "Cancelar", icon: XCircle, variant: "destructive" },
      ];

    case "pending": {
      const actions = [];
      if (ob.status === "failed") {
        actions.push({
          action: "retry-onboarding",
          label: "Reintentar onboarding",
          icon: RotateCw,
          variant: "outline",
        });
      }
      actions.push(
        { action: "cancel", label: "Cancelar onboarding", icon: XCircle, variant: "destructive" },
        { action: "delete", label: "Eliminar tenant", icon: Trash2, variant: "destructive" },
      );
      return actions;
    }

    case "cancelled": {
      const onboardingComplete = ob.step >= ob.total_steps && ob.status !== "failed";
      return [
        {
          action: "activate",
          label: "Activar",
          icon: Play,
          variant: "default",
          hint: !onboardingComplete
            ? `Onboarding incompleto (${ob.step}/${ob.total_steps}). El backend rechazara esta accion.`
            : null,
        },
        { action: "delete", label: "Eliminar tenant", icon: Trash2, variant: "destructive" },
      ];
    }

    default:
      return [];
  }
}

const CONFIRM_MESSAGES = {
  activate: "Activar este tenant? Se habilitara el acceso de los usuarios.",
  suspend: "Suspender este tenant? Los usuarios no podran acceder mientras este suspendido.",
  cancel: "Cancelar este tenant? Se desactivara el acceso.",
  "retry-onboarding": "Reintentar el proceso de onboarding desde el paso actual?",
};

export default function StatusActions({ tenant, onRefresh }) {
  const router = useRouter();
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dropDatabase, setDropDatabase] = useState(false);

  const actions = getActions(tenant);

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setLoading(true);
    setActionError(null);
    try {
      await fetchSuperadmin(`/tenants/${tenant.id}/${confirmAction}`, {
        method: "POST",
      });
      notify.success({ title: "Accion ejecutada correctamente" });
      setConfirmAction(null);
      onRefresh();
    } catch (err) {
      if (err instanceof SuperadminApiError && err.status === 422) {
        setActionError(err.data?.message || err.message);
      } else {
        notify.error({ title: err.message || "Error al ejecutar la accion" });
        setConfirmAction(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const qp = new URLSearchParams({ confirm_delete: "true" });
      if (dropDatabase) qp.set("drop_database", "true");

      const res = await fetchSuperadmin(`/tenants/${tenant.id}?${qp.toString()}`, {
        method: "DELETE",
      });
      const json = await res.json();
      notify.success({
        title: "Tenant eliminado",
        description: json.details?.database_dropped
          ? "El registro y la base de datos han sido eliminados."
          : "El registro ha sido eliminado. La base de datos se conserva.",
      });
      setDeleteOpen(false);
      router.push("/superadmin/tenants");
    } catch (err) {
      if (err instanceof SuperadminApiError && err.status === 422) {
        setActionError(err.data?.message || err.message);
      } else {
        notify.error({ title: err.message || "Error al eliminar" });
      }
    } finally {
      setLoading(false);
    }
  };

  const openAction = (action) => {
    setActionError(null);
    if (action === "delete") {
      setDropDatabase(false);
      setDeleteOpen(true);
    } else {
      setConfirmAction(action);
    }
  };

  if (actions.length === 0) return null;

  const currentActionDef = actions.find((a) => a.action === confirmAction);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Acciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-start gap-2">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.action} className="flex flex-col gap-1">
                <Button
                  variant={a.variant}
                  size="sm"
                  onClick={() => openAction(a.action)}
                >
                  <Icon className="h-4 w-4" />
                  {a.label}
                </Button>
                {a.hint && (
                  <span className="max-w-[200px] text-[10px] leading-tight text-muted-foreground">
                    {a.hint}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      <Dialog open={!!confirmAction} onOpenChange={(open) => { if (!open) { setConfirmAction(null); setActionError(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar accion</DialogTitle>
            <DialogDescription>
              {confirmAction && CONFIRM_MESSAGES[confirmAction]}
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{actionError}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmAction(null); setActionError(null); }} disabled={loading}>
              {actionError ? "Cerrar" : "Cancelar"}
            </Button>
            {!actionError && (
              <Button
                onClick={handleConfirm}
                disabled={loading}
                variant={currentActionDef?.variant === "destructive" ? "destructive" : "default"}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(open) => { if (!open) { setDeleteOpen(false); setActionError(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar tenant</DialogTitle>
            <DialogDescription>
              Esta accion eliminara permanentemente el tenant <strong>{tenant.name}</strong> ({tenant.subdomain}).
              Esta operacion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={dropDatabase}
                onChange={(e) => setDropDatabase(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <div>
                <span className="text-sm font-medium">Eliminar tambien la base de datos</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Se borrara la base de datos MySQL <code className="text-xs">{tenant.database || `tenant_${tenant.subdomain}`}</code>.
                  Si no marcas esta opcion, solo se elimina el registro del tenant.
                </p>
              </div>
            </label>
          </div>

          {actionError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{actionError}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setActionError(null); }} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
