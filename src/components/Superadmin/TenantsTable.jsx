"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchSuperadmin } from "@/lib/superadminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "./StatusBadge";
import FilterTabs from "./FilterTabs";
import { formatRelative } from "@/utils/superadminDateUtils";
import { Plus, ChevronLeft, ChevronRight, Search, RefreshCw, Building2 } from "lucide-react";
import EmptyState from "./EmptyState";

const STATUS_TABS = [
  { key: "", label: "Todos" },
  { key: "active", label: "Activos" },
  { key: "suspended", label: "Suspendidos" },
  { key: "pending", label: "Pendientes" },
  { key: "cancelled", label: "Cancelados" },
];

export default function TenantsTable() {
  const router = useRouter();
  const [tenants, setTenants] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounceRef = useRef(null);

  const fetchTenants = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const qp = new URLSearchParams();
      if (params.status) qp.set("status", params.status);
      if (params.search) qp.set("search", params.search);
      qp.set("page", String(params.page || 1));
      qp.set("per_page", "15");

      const res = await fetchSuperadmin(`/tenants?${qp.toString()}`);
      const json = await res.json();
      setTenants(json.data || []);
      setMeta(json.meta || null);
    } catch {
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants({ status, search, page });
  }, [status, page, fetchTenants]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchTenants({ status, search, page: 1 });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">Tenants</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchTenants({ status, search, page })} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button asChild size="sm">
            <Link href="/superadmin/tenants/new">
              <Plus className="h-4 w-4" />
              Nuevo
            </Link>
          </Button>
        </div>
      </div>

      <FilterTabs tabs={STATUS_TABS} activeKey={status} onChange={handleStatusChange} />

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o subdominio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Subdominio</TableHead>
                <TableHead className="hidden md:table-cell">Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Última actividad</TableHead>
                <TableHead className="w-8" aria-hidden />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-14" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={Building2}
                      title="No se encontraron tenants"
                      description="Ajusta los filtros o crea el primero desde el botón superior."
                      compact
                    />
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/superadmin/tenants/${t.id}`)}
                  >
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {t.subdomain}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground capitalize">
                      {t.plan || "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {formatRelative(t.last_activity_at) || "-"}
                    </TableCell>
                    <TableCell className="w-8 text-muted-foreground">
                      <ChevronRight className="h-4 w-4" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Página {meta.current_page} de {meta.last_page} ({meta.total} tenants)
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={meta.current_page <= 1}
              onClick={() => setPage(meta.current_page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage(meta.current_page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
