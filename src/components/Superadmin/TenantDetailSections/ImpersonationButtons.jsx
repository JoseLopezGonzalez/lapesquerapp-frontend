"use client";

import React, { useState } from "react";
import { fetchSuperadmin } from "@/lib/superadminApi";
import { notify } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, UserCheck, Zap } from "lucide-react";

export default function ImpersonationButtons({ tenantId, user }) {
  const [silentOpen, setSilentOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      await fetchSuperadmin(`/tenants/${tenantId}/impersonate/request`, {
        method: "POST",
        body: JSON.stringify({ target_user_id: user.id }),
      });
      notify.success({
        title: "Solicitud enviada",
        description: "Esperando aprobacion del administrador.",
      });
    } catch (err) {
      notify.error({ title: err.message || "Error al solicitar acceso" });
    } finally {
      setLoading(false);
    }
  };

  const handleSilent = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const res = await fetchSuperadmin(`/tenants/${tenantId}/impersonate/silent`, {
        method: "POST",
        body: JSON.stringify({ target_user_id: user.id, reason: reason.trim() }),
      });
      const data = await res.json();
      setSilentOpen(false);
      setReason("");
      if (data.redirect_url) {
        window.open(data.redirect_url, "_blank");
      }
      notify.success({ title: "Sesion de impersonacion iniciada" });
    } catch (err) {
      notify.error({ title: err.message || "Error al acceder" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSilent = () => {
    setReason("");
    setSilentOpen(true);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRequest}
        disabled={loading}
        title="Solicitar acceso (con consentimiento)"
      >
        <UserCheck className="h-3.5 w-3.5" />
        <span className="hidden xl:inline">Solicitar</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpenSilent}
        disabled={loading}
        title="Acceso directo (silencioso)"
      >
        <Zap className="h-3.5 w-3.5" />
        <span className="hidden xl:inline">Directo</span>
      </Button>

      <Dialog open={silentOpen} onOpenChange={(open) => { if (!open) { setSilentOpen(false); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acceso directo</DialogTitle>
            <DialogDescription>
              Accederas a la cuenta de <strong>{user.name}</strong> sin notificarlo.
              Esta accion queda registrada en el log de auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="imp-reason">
              Motivo del acceso <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="imp-reason"
              placeholder="Describe el motivo de este acceso directo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Campo obligatorio. Quedara registrado en el log de impersonaciones.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setSilentOpen(false); setReason(""); }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSilent}
              disabled={loading || !reason.trim()}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
