'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Save, Loader2, RefreshCw } from 'lucide-react';
import { useOrderMaritimeShippingDetail } from '@/hooks/orders/useOrderMaritimeShippingDetail';
import { useCustomsBrokerOptions } from '@/hooks/useCustomsBrokerOptions';
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
  { name: 'bookingNumber', label: 'Nº de Booking', placeholder: 'ej. BK-2026-0042' },
  { name: 'swbNumber', label: 'Nº SWB', placeholder: 'ej. SWB-778899' },
  { name: 'loadingPort', label: 'Puerto de carga', placeholder: 'ej. Vigo' },
  { name: 'dischargePort', label: 'Puerto de descarga', placeholder: 'ej. Montevideo' },
  { name: 'originCountry', label: 'País de origen', placeholder: 'ej. España' },
  { name: 'destinationCountry', label: 'País de destino', placeholder: 'ej. Puerto Rico' },
];

const SHIPPING_LINE_NONE_VALUE = '__none__';

const SHIPPING_LINE_OPTIONS: Array<{ value: 'maersk' | 'msc' | 'other'; label: string }> = [
  { value: 'maersk', label: 'Maersk' },
  { value: 'msc', label: 'MSC' },
  { value: 'other', label: 'Otra' },
];

const EMPTY_VALUES: MaritimeShippingDetailFormData = {
  vesselName: '',
  voyageNumber: '',
  exportInvoiceNumber: '',
  bookingNumber: '',
  swbNumber: '',
  loadingPort: '',
  dischargePort: '',
  originCountry: '',
  destinationCountry: '',
  customsBrokerId: null,
  ultimateConsigneeName: '',
  ultimateConsigneeAddress: '',
  shippingLine: null,
};

export default function MaritimeShippingDetailForm({
  orderId,
  readOnly = false,
}: MaritimeShippingDetailFormProps) {
  const { shippingDetail, isLoading, error, refetch, upsertMutation } =
    useOrderMaritimeShippingDetail(orderId);
  const { options: customsBrokerOptionsRaw, isLoading: customsBrokersLoading } =
    useCustomsBrokerOptions();
  const customsBrokerOptions = customsBrokerOptionsRaw.map((broker) => ({
    value: broker.id,
    label: broker.name,
  }));

  const {
    register,
    handleSubmit,
    reset,
    control,
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
      bookingNumber: shippingDetail?.bookingNumber ?? '',
      swbNumber: shippingDetail?.swbNumber ?? '',
      loadingPort: shippingDetail?.loadingPort ?? '',
      dischargePort: shippingDetail?.dischargePort ?? '',
      originCountry: shippingDetail?.originCountry ?? '',
      destinationCountry: shippingDetail?.destinationCountry ?? '',
      customsBrokerId: shippingDetail?.customsBrokerId ?? null,
      ultimateConsigneeName: shippingDetail?.ultimateConsigneeName ?? '',
      ultimateConsigneeAddress: shippingDetail?.ultimateConsigneeAddress ?? '',
      shippingLine: shippingDetail?.shippingLine ?? null,
    });
  }, [isLoading, error, shippingDetail, isDirty, reset]);

  const onSubmit = handleSubmit((data) => {
    // PUT de reemplazo completo — se envían siempre los 13 campos, nunca solo el que cambió.
    const payload = {
      vesselName: data.vesselName || null,
      voyageNumber: data.voyageNumber || null,
      exportInvoiceNumber: data.exportInvoiceNumber || null,
      bookingNumber: data.bookingNumber || null,
      swbNumber: data.swbNumber || null,
      loadingPort: data.loadingPort || null,
      dischargePort: data.dischargePort || null,
      originCountry: data.originCountry || null,
      destinationCountry: data.destinationCountry || null,
      customsBrokerId: data.customsBrokerId || null,
      ultimateConsigneeName: data.ultimateConsigneeName || null,
      ultimateConsigneeAddress: data.ultimateConsigneeAddress || null,
      shippingLine: data.shippingLine || null,
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: FIELDS.length + 1 }).map((_, i) => (
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <div className="grid gap-2">
                <Label htmlFor="shippingLine">Naviera</Label>
                <Controller
                  name="shippingLine"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? SHIPPING_LINE_NONE_VALUE}
                      onValueChange={(value) =>
                        field.onChange(value === SHIPPING_LINE_NONE_VALUE ? null : value)
                      }
                      disabled={readOnly || upsertMutation.isPending}
                    >
                      <SelectTrigger id="shippingLine" aria-invalid={!!errors.shippingLine}>
                        <SelectValue placeholder="Seleccionar naviera..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SHIPPING_LINE_NONE_VALUE}>Sin especificar</SelectItem>
                        {SHIPPING_LINE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.shippingLine && (
                  <p className="pt-1 text-xs text-red-400">* {errors.shippingLine.message}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid gap-3">
              <p className="text-muted-foreground text-xs font-medium">
                Consignatario y agente de aduanas
              </p>
              <div className="grid gap-2">
                <Label htmlFor="customsBrokerId">Agente de aduanas</Label>
                <Controller
                  name="customsBrokerId"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={customsBrokerOptions}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      loading={customsBrokersLoading}
                      disabled={readOnly || upsertMutation.isPending}
                      placeholder="Seleccionar agente de aduanas..."
                      searchPlaceholder="Buscar agente..."
                      notFoundMessage="No se encontraron agentes de aduanas"
                      className="h-11 w-full"
                    />
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="ultimateConsigneeName">Nombre del consignatario final</Label>
                  <Input
                    id="ultimateConsigneeName"
                    placeholder="Dejar en blanco para usar los datos del cliente del pedido"
                    disabled={readOnly || upsertMutation.isPending}
                    aria-invalid={!!errors.ultimateConsigneeName}
                    {...register('ultimateConsigneeName')}
                  />
                  {errors.ultimateConsigneeName && (
                    <p className="pt-1 text-xs text-red-400">
                      * {errors.ultimateConsigneeName.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ultimateConsigneeAddress">
                    Dirección del consignatario final
                  </Label>
                  <Textarea
                    id="ultimateConsigneeAddress"
                    placeholder="Dejar en blanco para usar la dirección de envío del pedido"
                    disabled={readOnly || upsertMutation.isPending}
                    aria-invalid={!!errors.ultimateConsigneeAddress}
                    {...register('ultimateConsigneeAddress')}
                  />
                  {errors.ultimateConsigneeAddress && (
                    <p className="pt-1 text-xs text-red-400">
                      * {errors.ultimateConsigneeAddress.message}
                    </p>
                  )}
                </div>
              </div>
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
