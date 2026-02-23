"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchSuperadmin } from "@/lib/superadminApi";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import GeneralData from "@/components/Superadmin/TenantDetailSections/GeneralData";
import StatusActions from "@/components/Superadmin/TenantDetailSections/StatusActions";
import OnboardingProgress from "@/components/Superadmin/TenantDetailSections/OnboardingProgress";
import TenantUsersTable from "@/components/Superadmin/TenantDetailSections/TenantUsersTable";
import { ArrowLeft } from "lucide-react";

export default function TenantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTenant = useCallback(async () => {
    try {
      const res = await fetchSuperadmin(`/tenants/${id}`);
      const json = await res.json();
      setTenant(json.data || json);
    } catch (err) {
      setError(err.message || "Error al cargar el tenant");
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
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/superadmin/tenants")}>
          <ArrowLeft className="h-4 w-4" />
          Volver a tenants
        </Button>
        <p className="text-sm text-destructive">{error || "Tenant no encontrado"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push("/superadmin/tenants")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">{tenant.name}</h1>
      </div>

      {/* Onboarding progress (only if pending) */}
      <OnboardingProgress tenant={tenant} onRefresh={fetchTenant} />

      {/* General data */}
      <GeneralData tenant={tenant} onRefresh={fetchTenant} />

      {/* Status actions */}
      <StatusActions tenant={tenant} onRefresh={fetchTenant} />

      {/* Users */}
      <TenantUsersTable tenantId={tenant.id} />
    </div>
  );
}
