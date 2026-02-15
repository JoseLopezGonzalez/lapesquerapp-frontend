'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Plus, Trash2, CheckCircle2, AlertCircle, AlertTriangle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { createBulkPunches, validateBulkPunches } from '@/services/punchService';
import { useEmployeeOptions } from '@/hooks/useEmployeesForPunches';

export default function BulkPunchForm() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { options: employeeOptions, isLoading: loadingEmployees, error: employeesError } = useEmployeeOptions();

  const [rows, setRows] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [submitResults, setSubmitResults] = useState(null);
  const [isValidated, setIsValidated] = useState(false);

  const validateMutation = useMutation({
    mutationFn: async (punches) => {
      const token = session?.user?.accessToken;
      if (!token) throw new Error('No hay sesión activa');
      return validateBulkPunches(punches, token);
    },
    onSuccess: (result) => {
      setValidationResults(result);
      if (result.invalid === 0) {
        setIsValidated(true);
        toast.success('Todos los fichajes son válidos. Ya puedes registrar', getToastTheme());
      } else {
        setIsValidated(false);
        toast.error(`${result.invalid} ${result.invalid === 1 ? 'fichaje con error' : 'fichajes con errores'}. Corrige los errores antes de registrar`, getToastTheme());
      }
    },
    onError: () => {
      toast.error('Error al validar los fichajes', getToastTheme());
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (punches) => {
      const token = session?.user?.accessToken;
      if (!token) throw new Error('No hay sesión activa');
      return createBulkPunches(punches, token);
    },
    onSuccess: (result) => {
      setSubmitResults(result);
      if (result.failed === 0) {
        toast.success(`Se registraron ${result.created} ${result.created === 1 ? 'fichaje' : 'fichajes'} correctamente`, getToastTheme());
        setTimeout(() => {
          setRows([]);
          setValidationResults(null);
          setSubmitResults(null);
          setIsValidated(false);
        }, 3000);
        queryClient.invalidateQueries({ queryKey: ['punches'] });
      } else {
        toast.error(
          `Se registraron ${result.created} ${result.created === 1 ? 'fichaje' : 'fichajes'}, ${result.failed} ${result.failed === 1 ? 'falló' : 'fallaron'}`,
          getToastTheme()
        );
      }
    },
    onError: (error) => {
      const msg = error?.userMessage || error?.message || 'Error al registrar los fichajes';
      toast.error(msg, getToastTheme());
    },
  });

  useEffect(() => {
    if (employeesError) {
      toast.error(employeesError || 'Error al cargar la lista de empleados', getToastTheme());
    }
  }, [employeesError]);

  // Añadir una nueva fila
  const addRow = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;

    setRows(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        employee_id: '',
        event_type: '',
        timestamp: datetimeLocal,
      },
    ]);
    setValidationResults(null);
    setSubmitResults(null);
    setIsValidated(false);
  };

  // Añadir sesión completa (entrada + salida)
  const addFullSession = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const entryDatetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;

    // Calcular hora de salida (8 horas después, pero mantener en el mismo día si es posible)
    const exitDate = new Date(now);
    exitDate.setHours(exitDate.getHours() + 8);
    
    // Si la salida calculada es del día siguiente pero la hora es muy temprana (antes de las 6 AM),
    // usar 17:00 del mismo día en su lugar
    const entryHour = now.getHours();
    const exitHour = exitDate.getHours();
    const isNextDay = exitDate.getDate() !== now.getDate();
    
    if (isNextDay && exitHour < 6) {
      // Si pasó al día siguiente pero es muy temprano, usar 17:00 del mismo día
      exitDate.setDate(now.getDate());
      exitDate.setMonth(now.getMonth());
      exitDate.setFullYear(now.getFullYear());
      exitDate.setHours(17, 0, 0, 0);
    }
    
    const exitYear = exitDate.getFullYear();
    const exitMonth = String(exitDate.getMonth() + 1).padStart(2, '0');
    const exitDay = String(exitDate.getDate()).padStart(2, '0');
    const exitHours = String(exitDate.getHours()).padStart(2, '0');
    const exitMinutes = String(exitDate.getMinutes()).padStart(2, '0');
    const exitDatetimeLocal = `${exitYear}-${exitMonth}-${exitDay}T${exitHours}:${exitMinutes}`;

    setRows(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        employee_id: '',
        event_type: 'IN',
        timestamp: entryDatetimeLocal,
      },
      {
        id: Date.now() + Math.random() + 1,
        employee_id: '',
        event_type: 'OUT',
        timestamp: exitDatetimeLocal,
      },
    ]);
    setValidationResults(null);
    setSubmitResults(null);
    setIsValidated(false);
  };

  // Eliminar una fila
  const removeRow = (id) => {
    setRows(prev => prev.filter(row => row.id !== id));
    setValidationResults(null);
    setSubmitResults(null);
    setIsValidated(false);
  };

  // Duplicar una fila
  const duplicateRow = (id) => {
    setRows(prev => {
      const rowToDuplicate = prev.find(row => row.id === id);
      if (!rowToDuplicate) return prev;
      
      const duplicatedRow = {
        ...rowToDuplicate,
        id: Date.now() + Math.random(), // Nuevo ID único
      };
      
      // Añadir la fila duplicada al final
      return [...prev, duplicatedRow];
    });
    setValidationResults(null);
    setSubmitResults(null);
    setIsValidated(false);
  };

  // Actualizar una fila
  const updateRow = (id, field, value) => {
    setRows(prev =>
      prev.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
    setValidationResults(null);
    setSubmitResults(null);
    setIsValidated(false);
  };

  const punchesPayload = rows.map((row) => ({
    employee_id: parseInt(row.employee_id) || null,
    event_type: row.event_type,
    timestamp: new Date(row.timestamp).toISOString(),
    device_id: 'manual-admin',
  }));

  const handleValidate = () => {
    if (rows.length === 0) {
      toast.error('Añade al menos un fichaje para validar', getToastTheme());
      return;
    }
    if (!session?.user?.accessToken) {
      toast.error('No hay sesión activa', getToastTheme());
      return;
    }
    validateMutation.mutate(punchesPayload);
  };

  const handleSubmit = () => {
    if (rows.length === 0) {
      toast.error('Añade al menos un fichaje para registrar', getToastTheme());
      return;
    }
    if (!isValidated) {
      toast.error('Debes validar los fichajes antes de registrar. Haz clic en "Validar" primero', getToastTheme());
      return;
    }
    if (!session?.user?.accessToken) {
      toast.error('No hay sesión activa', getToastTheme());
      return;
    }
    const payload = rows.map((row) => ({
      employee_id: parseInt(row.employee_id),
      event_type: row.event_type,
      timestamp: new Date(row.timestamp).toISOString(),
      device_id: 'manual-admin',
    }));
    submitMutation.mutate(payload);
  };

  const getRowValidation = (index) => {
    if (!validationResults) return null;
    return validationResults.validation_results?.[index] || null;
  };

  const getRowSubmitResult = (index) => {
    if (!submitResults) return null;
    return submitResults.results?.[index] || null;
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Registro Masivo de Fichajes</CardTitle>
        <CardDescription>
          Registra múltiples fichajes a la vez mediante un formulario
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 min-h-0 overflow-y-auto">
        {/* Botones de acción */}
        <div className="flex gap-2 flex-wrap justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            <Button type="button" onClick={addRow} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Añadir Fila
            </Button>
            <Button type="button" onClick={addFullSession} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Añadir Sesión Completa
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              onClick={handleValidate}
              variant="outline"
              disabled={validateMutation.isPending || rows.length === 0}
            >
              {validateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                'Validar'
              )}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitMutation.isPending || rows.length === 0 || !isValidated}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar Todos'
              )}
            </Button>
          </div>
        </div>

        {/* Mensaje de validación requerida */}
        {rows.length > 0 && !isValidated && !validateMutation.isPending && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Debes validar los fichajes antes de registrar
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Haz clic en "Validar" para verificar la integridad de los datos con los registros existentes
              </p>
            </div>
          </div>
        )}

        {/* Resumen de validación - Solo se muestra si no hay resultados de registro */}
        {validationResults && !submitResults && (
          <div
            className={`p-4 rounded-md border ${
              validationResults.invalid === 0
                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {validationResults.invalid === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
              <p
                className={`text-sm font-medium ${
                  validationResults.invalid === 0
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-yellow-800 dark:text-yellow-200'
                }`}
              >
                {validationResults.valid} válido(s), {validationResults.invalid} con error(es)
              </p>
            </div>
          </div>
        )}

        {/* Resumen de envío */}
        {submitResults && (
          <div
            className={`p-4 rounded-md border ${
              submitResults.failed === 0
                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {submitResults.failed === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
              <p
                className={`text-sm font-medium ${
                  submitResults.failed === 0
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-yellow-800 dark:text-yellow-200'
                }`}
              >
                {submitResults.created} registrado(s), {submitResults.failed} fallido(s)
              </p>
            </div>
            {submitResults.errors && submitResults.errors.length > 0 && (
              <div className="mt-2 space-y-1">
                {submitResults.errors.map((error, idx) => (
                  <p key={idx} className="text-xs text-yellow-700 dark:text-yellow-300">
                    Fila {error.index + 1}: {error.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabla de fichajes */}
        {rows.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-md">
            <p className="text-sm text-muted-foreground mb-4">
              No hay fichajes añadidos. Haz clic en "Añadir Fila" para comenzar.
            </p>
            <Button type="button" onClick={addRow} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Añadir Primera Fila
            </Button>
          </div>
        ) : (
          <div className="border rounded-md overflow-x-auto max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead className="w-[120px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => {
                  const validation = getRowValidation(index);
                  const submitResult = getRowSubmitResult(index);
                  const hasError = validation && !validation.valid;
                  const hasSubmitError = submitResult && !submitResult.success;

                  return (
                    <TableRow
                      key={row.id}
                      className={hasError || hasSubmitError ? 'bg-red-50 dark:bg-red-950/20' : ''}
                    >
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Combobox
                            options={employeeOptions}
                            value={row.employee_id}
                            onChange={(value) => updateRow(row.id, 'employee_id', value)}
                            placeholder="Selecciona empleado"
                            searchPlaceholder="Buscar..."
                            notFoundMessage="No encontrado"
                            loading={loadingEmployees}
                            className="w-[200px]"
                          />
                          {validation?.errors?.some(e => e.includes('empleado')) && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {validation.errors.find(e => e.includes('empleado'))}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Select
                            value={row.event_type}
                            onValueChange={(value) => updateRow(row.id, 'event_type', value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IN">Entrada</SelectItem>
                              <SelectItem value="OUT">Salida</SelectItem>
                            </SelectContent>
                          </Select>
                          {validation?.errors?.some(e => e.includes('evento')) && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {validation.errors.find(e => e.includes('evento'))}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Input
                            type="datetime-local"
                            value={row.timestamp}
                            onChange={(e) => updateRow(row.id, 'timestamp', e.target.value)}
                            className="w-[200px]"
                          />
                          {validation?.errors?.some(e => e.includes('timestamp')) && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {validation.errors.find(e => e.includes('timestamp'))}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateRow(row.id)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Duplicar fila"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRow(row.id)}
                            className="text-destructive hover:text-destructive"
                            title="Eliminar fila"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Puedes añadir múltiples filas y completarlas todas antes de registrar</p>
          <p>• Usa "Añadir Sesión Completa" para crear entrada y salida de una vez</p>
          <p>• <strong>Es obligatorio validar</strong> los fichajes antes de registrar para verificar la integridad con los datos existentes</p>
          <p>• La validación comprueba que no haya conflictos con fichajes ya registrados en la base de datos</p>
          <p>• Los errores se mostrarán en rojo en cada fila</p>
        </div>
      </CardContent>
    </Card>
  );
}

