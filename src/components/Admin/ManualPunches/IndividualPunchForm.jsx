'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { notify } from '@/lib/notifications';
import { createManualPunch, createBulkPunches } from '@/services/punchService';
import { useEmployeeOptions } from '@/hooks/useEmployeesForPunches';
import {
  getIndividualPunchSchema,
  getDefaultTimestampValues,
} from './individualPunchSchema';

/** Mapa de errores de Zod a español para mensajes por defecto (ej. tipo incorrecto) */
const zodErrorMapES = (issue, ctx) => {
  if (issue.code === 'invalid_type') {
    if (issue.received === 'number' && issue.expected === 'string') {
      return { message: 'Se esperaba texto, se recibió un número' };
    }
    if (issue.received === 'string' && issue.expected === 'number') {
      return { message: 'Se esperaba un número, se recibió texto' };
    }
    return { message: `Tipo no válido: se esperaba ${issue.expected}, se recibió ${issue.received}` };
  }
  return { message: ctx.defaultError };
};

export default function IndividualPunchForm() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { options: employeeOptions, isLoading: loadingEmployees, error: employeesError } = useEmployeeOptions();

  const [isFullSession, setIsFullSession] = useState(false);
  const [success, setSuccess] = useState(false);

  const schema = getIndividualPunchSchema(isFullSession);
  const defaultValues = getDefaultTimestampValues();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema, { errorMap: zodErrorMapES }),
    defaultValues,
  });

  const mutation = useMutation({
    mutationFn: async (formValues) => {
      const token = session?.user?.accessToken;
      if (!token) throw new Error('No hay sesión activa');

      if (isFullSession) {
        const entryTimestamp = new Date(formValues.timestamp).toISOString();
        const exitTimestamp = new Date(formValues.exitTimestamp).toISOString();
        const punches = [
          {
            employee_id: Number(formValues.employee_id),
            event_type: 'IN',
            timestamp: entryTimestamp,
            device_id: 'manual-admin',
          },
          {
            employee_id: Number(formValues.employee_id),
            event_type: 'OUT',
            timestamp: exitTimestamp,
            device_id: 'manual-admin',
          },
        ];
        return createBulkPunches(punches, token);
      }

      return createManualPunch(
        {
          employee_id: Number(formValues.employee_id),
          event_type: formValues.event_type,
          timestamp: new Date(formValues.timestamp).toISOString(),
          device_id: 'manual-admin',
        },
        token
      );
    },
    onSuccess: (result, variables) => {
      setSuccess(true);
      if (isFullSession) {
        if (result?.failed === 0) {
          notify.success('Sesión completa registrada correctamente (Entrada + Salida)');
        } else {
          notify.error('Se registró la entrada, pero la salida falló');
        }
      } else {
        notify.success(
          `Fichaje registrado correctamente: ${variables.event_type === 'IN' ? 'Entrada' : 'Salida'}`
        );
      }
      reset(getDefaultTimestampValues());
      setTimeout(() => setSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['punches'] });
    },
    onError: (error) => {
      const message = error?.userMessage || error?.message || 'Error al registrar el fichaje';
      notify.error(message);
    },
  });

  useEffect(() => {
    if (employeesError) {
      notify.error(employeesError || 'Error al cargar la lista de empleados');
    }
  }, [employeesError]);

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Registro Individual de Fichaje</CardTitle>
        <CardDescription>
          Registra un fichaje individual con fecha y hora personalizada
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="employee_id">
              Empleado <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="employee_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={employeeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecciona un empleado"
                  searchPlaceholder="Buscar empleado..."
                  notFoundMessage="No se encontraron empleados"
                  loading={loadingEmployees}
                />
              )}
            />
            {errors.employee_id && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.employee_id.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 p-4 bg-muted rounded-md">
            <Checkbox
              id="fullSession"
              checked={isFullSession}
              onCheckedChange={(checked) => setIsFullSession(!!checked)}
            />
            <Label
              htmlFor="fullSession"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Crear sesión completa (Entrada + Salida)
            </Label>
          </div>

          {!isFullSession ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="event_type">
                  Tipo de Evento <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="event_type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de evento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN">Entrada</SelectItem>
                        <SelectItem value="OUT">Salida</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.event_type && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.event_type.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timestamp">
                  Fecha y Hora <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="timestamp"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="timestamp"
                      type="datetime-local"
                      {...field}
                      className={errors.timestamp ? 'border-destructive' : ''}
                    />
                  )}
                />
                {errors.timestamp && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.timestamp.message}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="timestamp">
                  Fecha y Hora de Entrada <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="timestamp"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="timestamp"
                      type="datetime-local"
                      {...field}
                      className={errors.timestamp ? 'border-destructive' : ''}
                    />
                  )}
                />
                {errors.timestamp && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.timestamp.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exitTimestamp">
                  Fecha y Hora de Salida <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="exitTimestamp"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="exitTimestamp"
                      type="datetime-local"
                      {...field}
                      className={errors.exitTimestamp ? 'border-destructive' : ''}
                    />
                  )}
                />
                {errors.exitTimestamp && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.exitTimestamp.message}
                  </p>
                )}
              </div>
            </>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-800 dark:text-green-200">
                Fichaje registrado correctamente
              </p>
            </div>
          )}

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : isFullSession ? (
              'Registrar Sesión Completa'
            ) : (
              'Registrar Fichaje'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
