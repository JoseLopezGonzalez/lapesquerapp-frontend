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
import { Loader2, UserCheck, Zap } from "lucide-react";

export default function ImpersonationButtons({ tenantId, user }) {
  const [silentOpen, setSilentOpen] = useState(false);
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
        description: "Esperando aprobación del administrador.",
      });
    } catch (err) {
      notify.error({ title: err.message || "Error al solicitar acceso" });
    } finally {
      setLoading(false);
    }
  };

  const handleSilent = async () => {
    setLoading(true);
    try {
      const res = await fetchSuperadmin(`/tenants/${tenantId}/impersonate/silent`, {
        method: "POST",
        body: JSON.stringify({ target_user_id: user.id }),
      });
      const data = await res.json();
      setSilentOpen(false);
      if (data.redirect_url) {
        window.open(data.redirect_url, "_blank");
      }
      notify.success({ title: "Sesión de impersonación iniciada" });
    } catch (err) {
      notify.error({ title: err.message || "Error al acceder" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="ghost" size="sm" onClick={handleRequest} disabled={loading} title="Solicitar acceso (con consentimiento)">
        <UserCheck className="h-3.5 w-3.5" />
        <span className="hidden xl:inline">Solicitar</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setSilentOpen(true)} disabled={loading} title="Acceso directo (silencioso)">
        <Zap className="h-3.5 w-3.5" />
        <span className="hidden xl:inline">Directo</span>
      </Button>

      <Dialog open={silentOpen} onOpenChange={setSilentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acceso directo</DialogTitle>
            <DialogDescription>
              Accederás a la cuenta de <strong>{user.name}</strong> sin notificarlo.
              Esta acción queda registrada en el log de auditoría.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSilentOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSilent} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
