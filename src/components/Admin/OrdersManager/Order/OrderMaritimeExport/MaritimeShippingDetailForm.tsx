'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Loader2, RefreshCw } from 'lucide-react';
import { useOrderMaritimeShippingDetail } from '@/hooks/orders/useOrderMaritimeShippingDetail';
import {
  maritimeShippingDetailSchema,
  type MaritimeShippingDetailFormData,
} from './schemas/maritimeShippingDetailSchema';

interface MaritimeShippingDetailFormProps {
  orderId: number | string | null | undefined;
  readOnly?: boolean;
}

const FIELDS: Array<{
  name: keyof MaritimeShippingDetailFormData;
  label: string;
  placeholder: string;
}> = [
  { name: 'vesselName', label: 'Buque', placeholder: 'Nombre del buque' },
  { name: 'voyageNumber', label: 'Nº de viaje', placeholder: 'ej. V-2026-045' },
  { name: 'exportInvoiceNumber', label: 'Factura de exportación', placeholder: 'ej. EXP-2026-0089' },
  { name: 'swbNumber', label: 'Nº SWB', placeholder: 'ej. SWB-778899' },
  { name: 'loadingPort', label: 'Puerto de carga', placeholder: 'ej. Vigo' },
  { name: 'dischargePort', label: 'Puerto de descarga', placeholder: 'ej. Montevideo' },
];

const EMPTY_VALUES: MaritimeShippingDetailFormData = {
  vesselName: '',
  voyageNumber: '',
  exportInvoiceNumber: '',
  swbNumber: '',
  loadingPort: '',
  dischargePort: '',
};

export default function MaritimeShippingDetailForm({
  orderId,
  readOnly = false,
}: MaritimeShippingDetailFormProps) {
  const { shippingDetail, isLoading, error, refetch, upsertMutation } =
    useOrderMaritimeShippingDetail(orderId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<MaritimeShippingDetailFormData>({
    resolver: zodResolver(maritimeShippingDetailSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (isLoading || error) return;
    // No pisar un borrador sin guardar: un refetch en segundo plano (window focus) o un remount
    // al volver de otra pestaña del pedido no debe borrar cambios que el usuario no ha guardado.
    if (isDirty) return;
    reset({
      vesselName: shippingDetail?.vesselName ?? '',
      voyageNumber: shippingDetail?.voyageNumber ?? '',
      exportInvoiceNumber: shippingDetail?.exportInvoiceNumber ?? '',
      swbNumber: shippingDetail?.swbNumber ?? '',
      loadingPort: shippingDetail?.loadingPort ?? '',
      dischargePort: shippingDetail?.dischargePort ?? '',
    });
  }, [isLoading, error, shippingDetail, isDirty, reset]);

  const onSubmit = handleSubmit((data) => {
    // PUT de reemplazo completo — se envían siempre los 6 campos, nunca solo el que cambió.
    const payload = {
      vesselName: data.vesselName || null,
      voyageNumber: data.voyageNumber || null,
      exportInvoiceNumber: data.exportInvoiceNumber || null,
      swbNumber: data.swbNumber || null,
      loadingPort: data.loadingPort || null,
      dischargePort: data.dischargePort || null,
    };
    upsertMutation.mutate(payload, {
      // Marca los valores recién guardados como el nuevo estado "limpio" — así el formulario deja
      // de estar dirty inmediatamente, sin esperar al refetch en segundo plano.
      onSuccess: () => reset(data),
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Datos de envío</CardTitle>
        <CardDescription>Buque, viaje y documentación de la exportación.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        ) : error ? (
          // Un error de carga NO se trata como "sin datos": el PUT es un reemplazo completo, así
          // que mostrar el formulario en blanco aquí arriesgaría sobrescribir datos reales que
          // fallaron al cargar. Sin reintentar con éxito, no se renderiza el formulario.
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <p className="text-sm text-red-500">
              No se pudieron cargar los datos de envío marítimo. Reintenta antes de guardar.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw />
              Reintentar
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map((field) => {
                const hasError = errors[field.name];
                return (
                  <div key={field.name} className="grid gap-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input
                      id={field.name}
                      placeholder={field.placeholder}
                      disabled={readOnly || upsertMutation.isPending}
                      aria-invalid={!!hasError}
                      {...register(field.name)}
                    />
                    {hasError && <p className="pt-1 text-xs text-red-400">* {hasError.message}</p>}
                  </div>
                );
              })}
            </div>
            {!readOnly && (
              <div className="flex justify-end">
                <Button type="submit" disabled={!isDirty || upsertMutation.isPending}>
                  {upsertMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save />
                      Guardar
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
