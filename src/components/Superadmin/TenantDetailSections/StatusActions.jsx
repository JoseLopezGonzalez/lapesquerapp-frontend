"use client";

import React, { useState } from "react";
import { fetchSuperadmin } from "@/lib/superadminApi";
import { notify } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Play, Pause, XCircle, RotateCw } from "lucide-react";

const ACTIONS_BY_STATUS = {
  active: [
    { action: "suspend", label: "Suspender", icon: Pause, variant: "outline" },
    { action: "cancel", label: "Cancelar", icon: XCircle, variant: "destructive" },
  ],
  suspended: [
    { action: "activate", label: "Activar", icon: Play, variant: "default" },
    { action: "cancel", label: "Cancelar", icon: XCircle, variant: "destructive" },
  ],
  pending: [
    { action: "activate", label: "Activar", icon: Play, variant: "default" },
    { action: "cancel", label: "Cancelar", icon: XCircle, variant: "destructive" },
    { action: "retry-onboarding", label: "Reintentar onboarding", icon: RotateCw, variant: "outline" },
  ],
  cancelled: [
    { action: "activate", label: "Activar", icon: Play, variant: "default" },
  ],
};

const CONFIRM_MESSAGES = {
  activate: "¿Activar este tenant? Se habilitará el acceso.",
  suspend: "¿Suspender este tenant? Los usuarios no podrán acceder.",
  cancel: "¿Cancelar este tenant? Esta acción desactiva el acceso.",
  "retry-onboarding": "¿Reintentar el proceso de onboarding?",
};

export default function StatusActions({ tenant, onRefresh }) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(false);

  const actions = ACTIONS_BY_STATUS[tenant.status] || [];

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setLoading(true);
    try {
      await fetchSuperadmin(`/tenants/${tenant.id}/${confirmAction}`, {
        method: "POST",
      });
      notify.success({ title: `Acción "${confirmAction}" ejecutada` });
      setConfirmAction(null);
      onRefresh();
    } catch (err) {
      notify.error({ title: err.message || "Error al ejecutar la acción" });
    } finally {
      setLoading(false);
    }
  };

  if (actions.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Acciones</h2>
      </div>
      <div className="flex flex-wrap gap-2 p-4">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Button
              key={a.action}
              variant={a.variant}
              size="sm"
              onClick={() => setConfirmAction(a.action)}
            >
              <Icon className="h-4 w-4" />
              {a.label}
            </Button>
          );
        })}
      </div>

      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar acción</DialogTitle>
            <DialogDescription>
              {confirmAction && CONFIRM_MESSAGES[confirmAction]}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
