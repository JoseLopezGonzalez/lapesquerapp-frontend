'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchSuperadmin } from '@/lib/superadminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import StatusBadge from './StatusBadge';
import FilterTabs from './FilterTabs';
import { formatRelative } from '@/utils/superadminDateUtils';
import { Plus, ChevronLeft, ChevronRight, Search, RefreshCw, Building2 } from 'lucide-react';
import EmptyState from './EmptyState';

const ONBOARDING_DOT: Record<string, { color: string; label: string }> = {
  completed: { color: 'bg-green-500', label: 'Onboarding completado' },
  in_progress: { color: 'bg-amber-400', label: 'Onboarding en progreso' },
  failed: { color: 'bg-destructive', label: 'Onboarding fallido' },
  pending: { color: 'bg-muted-foreground/40', label: 'Onboarding pendiente' },
};

interface TenantRow {
  id: number | string;
  name: string;
  subdomain: string;
  plan?: string | null;
  status: string;
  onboarding?: { status: string; [key: string]: unknown } | null;
  last_activity_at?: string | null;
  [key: string]: unknown;
}

interface TenantMeta {
  current_page: number;
  last_page: number;
  total: number;
}

interface FetchParams {
  status?: string;
  search?: string;
  page?: number;
}

function OnboardingDot({ onboarding }: { onboarding?: { status: string; [key: string]: unknown } | null }) {
  if (!onboarding) return null;
  const { color, label } = ONBOARDING_DOT[onboarding.status] ?? ONBOARDING_DOT.pending;
  return (
    <span
      className={`ml-1.5 inline-block h-2 w-2 rounded-full ${color} shrink-0`}
      title={label}
      aria-label={label}
    />
  );
}

const STATUS_TABS = [
  { key: '', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'suspended', label: 'Suspendidos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'cancelled', label: 'Cancelados' },
];

export default function TenantsTable() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [meta, setMeta] = useState<TenantMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTenants = useCallback(async (params: FetchParams = {}) => {
    setLoading(true);
    try {
      const qp = new URLSearchParams();
      if (params.status) qp.set('status', params.status);
      if (params.search) qp.set('search', params.search);
      qp.set('page', String(params.page || 1));
      qp.set('per_page', '15');

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
    clearTimeout(debounceRef.current ?? undefined);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchTenants({ status, search, page: 1 });
    }, 300);
    return () => clearTimeout(debounceRef.current ?? undefined);
  }, [search]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Tenants</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTenants({ status, search, page })}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
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
                <TableHead>Estado</TableHead>
                <TableHead className="hidden lg:table-cell">Última actividad</TableHead>
                <TableHead className="w-8" aria-hidden />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-14" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
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
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                      {t.subdomain}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden capitalize md:table-cell">
                      {t.plan || '-'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center">
                        <StatusBadge status={t.status} />
                        <OnboardingDot onboarding={t.onboarding} />
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-sm lg:table-cell">
                      {formatRelative(t.last_activity_at) || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground w-8">
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
          <span className="text-muted-foreground text-sm">
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
