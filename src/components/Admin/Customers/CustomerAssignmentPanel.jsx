'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notifications';
import { useFieldOperatorOptions } from '@/hooks/useFieldOptions';
import { useCustomerAssignmentMutation } from '@/hooks/useCustomerAssignment';
import { customerService } from '@/services/domain/customers/customerService';
import { getSalespeopleOptions } from '@/services/salespersonService';
import Loader from '@/components/Utilities/Loader';

export default function CustomerAssignmentPanel({ customerId }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const role = Array.isArray(session?.user?.role) ? session.user.role[0] : session?.user?.role;
  const canEdit = role === 'administrador' || role === 'direccion';
  const { options: fieldOperatorOptions } = useFieldOperatorOptions();
  const { mutateAsync: updateAssignment, isPending } = useCustomerAssignmentMutation();

  const customerQuery = useQuery({
    queryKey: ['admin', 'customers', 'assignment', customerId],
    queryFn: () => customerService.getById(customerId),
    enabled: Boolean(customerId),
  });

  const salespeopleQuery = useQuery({
    queryKey: ['salespeople', 'options', token ?? 'unknown'],
    queryFn: () => getSalespeopleOptions(token),
    enabled: Boolean(token),
  });

  const customer = customerQuery.data;
  const salespersonOptions = useMemo(() => {
    const raw = Array.isArray(salespeopleQuery.data) ? salespeopleQuery.data : salespeopleQuery.data?.data ?? [];
    return raw.map((item) => ({ value: String(item.id), label: item.name }));
  }, [salespeopleQuery.data]);

  const handleAssignmentChange = async (field, value) => {
    if (!canEdit) return;
    const payload = {
      salesperson_id: customer?.salesperson?.id ?? null,
      field_operator_id: customer?.fieldOperator?.id ?? null,
      operational_status: customer?.operationalStatus ?? 'normal',
      [field]: value,
    };

    const normalizedPayload = {
      ...payload,
      salesperson_id: payload.salesperson_id ? Number(payload.salesperson_id) : null,
      field_operator_id: payload.field_operator_id ? Number(payload.field_operator_id) : null,
    };

    await notify.promise(
      updateAssignment({ customerId, payload: normalizedPayload }),
      {
        loading: { title: 'Actualizando asignación', description: 'Guardando ownership y acceso operativo.' },
        success: { title: 'Asignación actualizada', description: 'Los cambios se han guardado correctamente.' },
        error: (err) => ({
          title: 'No se pudo actualizar la asignación',
          description: err?.message ?? 'Inténtalo de nuevo.',
        }),
      }
    );

    await customerQuery.refetch();
  };

  if (customerQuery.isLoading || salespeopleQuery.isLoading) {
    return (
      <Card className="border-border/70 shadow-sm">
        <CardContent className="flex min-h-[240px] items-center justify-center">
          <Loader />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle>Asignación comercial y operativa</CardTitle>
        <CardDescription>
          Separa el ownership comercial del acceso operativo del cliente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Comercial responsable</Label>
          <Select
            value={customer?.salesperson?.id != null ? String(customer.salesperson.id) : '__none__'}
            onValueChange={(value) => handleAssignmentChange('salesperson_id', value === '__none__' ? null : value)}
            disabled={!canEdit || isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin comercial asignado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin comercial asignado</SelectItem>
              {salespersonOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Operador de campo</Label>
          <Select
            value={customer?.fieldOperator?.id != null ? String(customer.fieldOperator.id) : '__none__'}
            onValueChange={(value) => handleAssignmentChange('field_operator_id', value === '__none__' ? null : value)}
            disabled={!canEdit || isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin operador asignado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin operador asignado</SelectItem>
              {fieldOperatorOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Estado operativo</Label>
          <Select
            value={customer?.operationalStatus || 'normal'}
            onValueChange={(value) => handleAssignmentChange('operational_status', value)}
            disabled={!canEdit || isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="alta_operativa">Alta operativa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!canEdit && (
          <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
            Tu rol puede consultar esta asignación, pero no modificarla.
          </div>
        )}

        {canEdit && (
          <Button variant="outline" disabled className="w-full">
            La asignación se guarda al cambiar cada selector
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
