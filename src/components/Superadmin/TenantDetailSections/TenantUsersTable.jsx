"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchSuperadmin, SuperadminApiError } from "@/lib/superadminApi";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ImpersonationButtons from "./ImpersonationButtons";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

const ROLE_COLORS = {
  administrador: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  operario: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  comercial: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(dateStr));
  } catch { return dateStr; }
}

function isOnboardingIncomplete(tenant) {
  if (tenant.onboarding) {
    return tenant.onboarding.status !== "completed" && tenant.onboarding.step < tenant.onboarding.total_steps;
  }
  return (tenant.onboarding_step ?? 0) < 8;
}

export default function TenantUsersTable({ tenant }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  const dbNotReady = tenant.status === "pending" && isOnboardingIncomplete(tenant);

  const fetchUsers = useCallback(async () => {
    if (dbNotReady) {
      setLoading(false);
      setUnavailable(true);
      return;
    }
    try {
      const res = await fetchSuperadmin(`/tenants/${tenant.id}/users`);
      const json = await res.json();
      setUsers(json.data || []);
      setUnavailable(false);
    } catch (err) {
      if (err instanceof SuperadminApiError && err.status === 422) {
        setUnavailable(true);
      }
    } finally {
      setLoading(false);
    }
  }, [tenant.id, dbNotReady]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  if (unavailable || dbNotReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Usuarios del tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            La base de datos del tenant aun no esta disponible. Los usuarios se mostraran cuando el onboarding se complete.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Usuarios del tenant</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="hidden md:table-cell">Activo</TableHead>
              <TableHead className="hidden lg:table-cell">Ultimo acceso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  No hay usuarios.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ROLE_COLORS[u.role] || ""}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {u.active ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDate(u.last_login_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    {u.role === "administrador" && (
                      <ImpersonationButtons tenantId={tenant.id} user={u} />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
