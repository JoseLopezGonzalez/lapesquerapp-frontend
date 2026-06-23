'use client';

import React, { useState } from 'react';
import { fetchSuperadmin } from '@/lib/superadminApi';
import { notify } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, UserCheck, Zap, Key } from 'lucide-react';

function openTenantWithToken(subdomain, accessToken) {
  const url = `https://${subdomain}.lapesquerapp.es`;
  window.open(url, '_blank');
  navigator.clipboard?.writeText(accessToken).catch(() => {});
  notify.success({
    title: 'Sesión de impersonación iniciada',
    description: `Pestaña abierta para ${subdomain}.lapesquerapp.es. Token copiado al portapapeles.`,
  });
}

export default function ImpersonationButtons({ tenantId, tenantSubdomain, user }) {
  // Silent flow
  const [silentOpen, setSilentOpen] = useState(false);
  const [silentReason, setSilentReason] = useState('');

  // Consent flow
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentReason, setConsentReason] = useState('');
  const [pendingRequest, setPendingRequest] = useState(false);

  const [loading, setLoading] = useState(false);

  // --- Silent impersonation ---
  const handleSilent = async () => {
    if (!silentReason.trim()) return;
    setLoading(true);
    try {
      const res = await fetchSuperadmin(`/tenants/${tenantId}/impersonate/silent`, {
        method: 'POST',
        body: JSON.stringify({ target_user_id: user.id, reason: silentReason.trim() }),
      });
      const data = await res.json();
      setSilentOpen(false);
      setSilentReason('');
      const subdomain = data.tenant ?? tenantSubdomain;
      if (subdomain && data.access_token) {
        openTenantWithToken(subdomain, data.access_token);
      } else {
        notify.success({ title: 'Sesión iniciada', description: 'No se pudo construir la URL del tenant.' });
      }
    } catch (err) {
      notify.error({ title: err.message || 'Error al acceder' });
    } finally {
      setLoading(false);
    }
  };

  // --- Consent request ---
  const handleRequest = async () => {
    if (!consentReason.trim()) return;
    setLoading(true);
    try {
      await fetchSuperadmin(`/tenants/${tenantId}/impersonate/request`, {
        method: 'POST',
        body: JSON.stringify({ target_user_id: user.id, reason: consentReason.trim() }),
      });
      setConsentOpen(false);
      setConsentReason('');
      setPendingRequest(true);
      notify.success({
        title: 'Solicitud enviada',
        description: 'El administrador recibirá un correo. Cuando apruebe, usa "Usar token".',
      });
    } catch (err) {
      notify.error({ title: err.message || 'Error al solicitar acceso' });
    } finally {
      setLoading(false);
    }
  };

  // --- Generate token after approval ---
  const handleGenerateToken = async () => {
    setLoading(true);
    try {
      const res = await fetchSuperadmin(`/tenants/${tenantId}/impersonate/token`, {
        method: 'POST',
      });
      const data = await res.json();
      setPendingRequest(false);
      const subdomain = data.tenant ?? tenantSubdomain;
      if (subdomain && data.access_token) {
        openTenantWithToken(subdomain, data.access_token);
      } else {
        notify.success({ title: 'Token generado', description: 'No se pudo construir la URL del tenant.' });
      }
    } catch (err) {
      notify.error({ title: err.message || 'El acceso aún no fue aprobado o la solicitud expiró.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Consent request */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => { setConsentReason(''); setConsentOpen(true); }}
        disabled={loading}
        title="Solicitar acceso con consentimiento del administrador"
      >
        <UserCheck className="h-3.5 w-3.5" />
        <span className="hidden xl:inline">Solicitar</span>
      </Button>

      {/* Silent */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => { setSilentReason(''); setSilentOpen(true); }}
        disabled={loading}
        title="Acceso directo (silencioso, queda auditado)"
      >
        <Zap className="h-3.5 w-3.5" />
        <span className="hidden xl:inline">Directo</span>
      </Button>

      {/* Generate token — visible only after a consent request was sent */}
      {pendingRequest && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGenerateToken}
          disabled={loading}
          title="Generar token una vez que el admin haya aprobado la solicitud"
          className="text-primary"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Key className="h-3.5 w-3.5" />
          )}
          <span className="hidden xl:inline">Usar token</span>
        </Button>
      )}

      {/* Silent dialog */}
      <Dialog
        open={silentOpen}
        onOpenChange={(open) => {
          if (!open) { setSilentOpen(false); setSilentReason(''); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acceso directo</DialogTitle>
            <DialogDescription>
              Accederás a la cuenta de <strong>{user.name}</strong> sin notificarlo. Esta acción
              queda registrada en el log de auditoría.
            </DialogDescription>
          </DialogHeader>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="imp-silent-reason">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="imp-silent-reason"
              placeholder="Describe el motivo de este acceso directo..."
              value={silentReason}
              onChange={(e) => setSilentReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-muted-foreground text-xs">
              Campo obligatorio. Quedará registrado en el log de impersonaciones.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setSilentOpen(false); setSilentReason(''); }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSilent} disabled={loading || !silentReason.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consent dialog */}
      <Dialog
        open={consentOpen}
        onOpenChange={(open) => {
          if (!open) { setConsentOpen(false); setConsentReason(''); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar acceso con consentimiento</DialogTitle>
            <DialogDescription>
              Se enviará un correo a <strong>{user.name}</strong> ({user.email}) para que apruebe o
              rechace el acceso. Cuando lo apruebe, aparecerá el botón "Usar token".
            </DialogDescription>
          </DialogHeader>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="imp-consent-reason">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="imp-consent-reason"
              placeholder="Ej: Revisión de incidencia reportada por el cliente..."
              value={consentReason}
              onChange={(e) => setConsentReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setConsentOpen(false); setConsentReason(''); }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleRequest} disabled={loading || !consentReason.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
