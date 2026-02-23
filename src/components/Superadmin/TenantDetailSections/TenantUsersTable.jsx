"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchSuperadmin } from "@/lib/superadminApi";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ImpersonationButtons from "./ImpersonationButtons";
import { CheckCircle2, XCircle } from "lucide-react";

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

export default function TenantUsersTable({ tenantId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetchSuperadmin(`/tenants/${tenantId}/users`);
      const json = await res.json();
      setUsers(json.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Usuarios del tenant</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="hidden md:table-cell">Activo</TableHead>
            <TableHead className="hidden lg:table-cell">Último acceso</TableHead>
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
                    <ImpersonationButtons tenantId={tenantId} user={u} />
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
