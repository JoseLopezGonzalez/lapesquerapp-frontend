'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchSuperadmin } from '@/lib/superadminApi';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GeneralData from '@/components/Superadmin/TenantDetailSections/GeneralData';
import StatusActions from '@/components/Superadmin/TenantDetailSections/StatusActions';
import OnboardingProgress from '@/components/Superadmin/TenantDetailSections/OnboardingProgress';
import TenantUsersTable from '@/components/Superadmin/TenantDetailSections/TenantUsersTable';
import TokensTab from '@/components/Superadmin/TenantDetailSections/TokensTab';
import MigrationsTab from '@/components/Superadmin/TenantDetailSections/MigrationsTab';
import FeatureFlagsTab from '@/components/Superadmin/TenantDetailSections/FeatureFlagsTab';
import BlocklistTab from '@/components/Superadmin/TenantDetailSections/BlocklistTab';
import ErrorLogsTab from '@/components/Superadmin/TenantDetailSections/ErrorLogsTab';
import { ArrowLeft } from 'lucide-react';
import StatusBadge from '@/components/Superadmin/StatusBadge';

interface TenantData {
  id: number | string;
  name: string;
  status: string;
  subdomain: string;
  plan?: string;
  onboarding?: { status: string; step: number; total_steps: number; [key: string]: unknown };
  onboarding_step?: number;
  [key: string]: unknown;
}

export default function TenantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTenant = useCallback(async () => {
    try {
      const res = await fetchSuperadmin(`/tenants/${id}`);
      const json = await res.json();
      setTenant(json.data || json);
    } catch (err) {
      setError((err as Error).message || 'Error al cargar el tenant');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/superadmin/tenants')}>
          <ArrowLeft className="h-4 w-4" />
          Volver a tenants
        </Button>
        <p className="text-destructive text-sm">{error || 'Tenant no encontrado'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push('/superadmin/tenants')}
            aria-label="Volver a la lista"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">{tenant.name}</h1>
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 pl-11 text-sm">
          <StatusBadge status={tenant.status} />
          <span>{tenant.plan ? String(tenant.plan) : '-'}</span>
          <span aria-hidden>•</span>
          <span>{tenant.subdomain ? `${tenant.subdomain}.pesquerapp.com` : '-'}</span>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="migrations">Migraciones</TabsTrigger>
          <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="blocklist">Blocklist</TabsTrigger>
          <TabsTrigger value="errors">Errores</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <OnboardingProgress tenant={tenant} onRefresh={fetchTenant} />
          <GeneralData tenant={tenant} onRefresh={fetchTenant} />
          <StatusActions tenant={tenant} onRefresh={fetchTenant} />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <TenantUsersTable tenant={tenant} />
        </TabsContent>

        <TabsContent value="tokens" className="mt-4">
          <TokensTab tenantId={id} />
        </TabsContent>

        <TabsContent value="migrations" className="mt-4">
          <MigrationsTab tenantId={id} />
        </TabsContent>

        <TabsContent value="flags" className="mt-4">
          <FeatureFlagsTab tenantId={id} />
        </TabsContent>

        <TabsContent value="blocklist" className="mt-4">
          <BlocklistTab tenantId={id} />
        </TabsContent>

        <TabsContent value="errors" className="mt-4">
          <ErrorLogsTab tenantId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
