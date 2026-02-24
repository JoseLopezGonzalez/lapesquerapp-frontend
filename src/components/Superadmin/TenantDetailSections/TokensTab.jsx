"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchSuperadmin, SuperadminApiError } from "@/lib/superadminApi";
import { notify } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Trash2, Key } from "lucide-react";
import { formatDateTime } from "@/utils/superadminDateUtils";
import EmptyState from "../EmptyState";

export default function TokensTab({ tenantId }) {
  const [tokens, setTokens] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);
  const [revokingAll, setRevokingAll] = useState(false);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSuperadmin(`/tenants/${tenantId}/tokens`);
      const json = await res.json();
      setTokens(json.data || []);
      setTotal(json.total ?? (json.data?.length ?? 0));
    } catch { setTokens([]); } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  const handleRevoke = async (tokenId) => {
    setRevokingId(tokenId);
    try {
      await fetchSuperadmin(`/tenants/${tenantId}/tokens/${tokenId}`, { method: "DELETE" });
      notify.success({ title: "Token revocado" });
      fetchTokens();
    } catch (err) {
      notify.error({ title: err.message || "Error al revocar el token" });
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    try {
      const res = await fetchSuperadmin(`/tenants/${tenantId}/tokens`, { method: "DELETE" });
      const json = await res.json();
      notify.success({
        title: "Tokens revocados",
        description: json.message || `${json.tokens_revoked} token(s) revocados.`,
      });
      setRevokeAllOpen(false);
      fetchTokens();
    } catch (err) {
      notify.error({ title: err.message || "Error al revocar tokens" });
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Tokens activos ({total})</CardTitle>
        {tokens.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setRevokeAllOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Revocar todos
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Ultimo uso</TableHead>
              <TableHead className="hidden lg:table-cell">Creado</TableHead>
              <TableHead className="text-right">Accion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : tokens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={Key}
                    title="No hay tokens activos"
                    description="Los tokens de API y sesión aparecerán aquí cuando se generen."
                    compact
                  />
                </TableCell>
              </TableRow>
            ) : (
              tokens.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm font-mono">{t.id}</TableCell>
                  <TableCell className="text-sm">{t.tokenable_id}</TableCell>
                  <TableCell>
                    {t.name === "impersonation" ? (
                      <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400">
                        {t.name}
                      </Badge>
                    ) : (
                      <span className="text-sm">{t.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatDateTime(t.last_used_at)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDateTime(t.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(t.id)}
                      disabled={revokingId === t.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {revokingId === t.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={revokeAllOpen} onOpenChange={setRevokeAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revocar todos los tokens</DialogTitle>
            <DialogDescription>
              Todos los usuarios del tenant perderan su sesion activa y tendran que volver a iniciar sesion.
              Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeAllOpen(false)} disabled={revokingAll}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRevokeAll} disabled={revokingAll}>
              {revokingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : "Revocar todos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
