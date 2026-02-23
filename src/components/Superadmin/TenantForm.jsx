"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { fetchSuperadmin, SuperadminApiError } from "@/lib/superadminApi";
import { notify } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SubdomainField from "./SubdomainField";
import { Loader2, ArrowLeft } from "lucide-react";

const PLAN_OPTIONS = ["basic", "pro", "enterprise"];

const TIMEZONE_OPTIONS = [
  "Europe/Madrid",
  "Atlantic/Canary",
  "Europe/London",
  "Europe/Lisbon",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "America/Mexico_City",
];

export default function TenantForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      subdomain: "",
      admin_email: "",
      plan: "basic",
      timezone: "Europe/Madrid",
      branding_image_url: "",
    },
  });

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const res = await fetchSuperadmin("/tenants", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          branding_image_url: values.branding_image_url || null,
        }),
      });
      const json = await res.json();
      const newId = (json.data || json).id;
      notify.success({ title: "Tenant creado", description: "Onboarding en progreso." });
      router.push(`/superadmin/tenants/${newId}`);
    } catch (err) {
      if (err instanceof SuperadminApiError && err.status === 422 && err.data?.errors) {
        Object.entries(err.data.errors).forEach(([field, msgs]) => {
          setError(field, { message: msgs[0] });
        });
      } else {
        notify.error({ title: err.message || "Error al crear el tenant" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push("/superadmin/tenants")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Crear tenant</h1>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Datos del tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="tf-name">Nombre empresa</Label>
              <Input
                id="tf-name"
                {...register("name", { required: "El nombre es obligatorio" })}
                placeholder="Mi Empresa S.L."
                maxLength={255}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <Controller
              name="subdomain"
              control={control}
              rules={{ required: "El subdominio es obligatorio" }}
              render={({ field }) => (
                <SubdomainField
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.subdomain?.message}
                />
              )}
            />

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="tf-email">Email administrador</Label>
              <Input
                id="tf-email"
                type="email"
                {...register("admin_email", { required: "El email es obligatorio" })}
                placeholder="admin@empresa.es"
              />
              {errors.admin_email && (
                <p className="text-xs text-destructive">{errors.admin_email.message}</p>
              )}
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="tf-plan">Plan</Label>
              <select
                id="tf-plan"
                {...register("plan")}
                className="flex h-12 md:h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base md:text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
              {errors.plan && <p className="text-xs text-destructive">{errors.plan.message}</p>}
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="tf-tz">Zona horaria</Label>
              <select
                id="tf-tz"
                {...register("timezone")}
                className="flex h-12 md:h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base md:text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="tf-logo">URL logo (opcional)</Label>
              <Input
                id="tf-logo"
                type="url"
                {...register("branding_image_url")}
                placeholder="https://..."
              />
              {errors.branding_image_url && (
                <p className="text-xs text-destructive">{errors.branding_image_url.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/superadmin/tenants")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear tenant"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
