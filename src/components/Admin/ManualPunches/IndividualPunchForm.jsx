'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { createManualPunch, createBulkPunches } from '@/services/punchService';
import { employeeService } from '@/services/domain/employees/employeeService';

export default function IndividualPunchForm() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [isFullSession, setIsFullSession] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    event_type: '',
    timestamp: '',
    exitTimestamp: '',
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Cargar opciones de empleados
  useEffect(() => {
    const loadEmployees = async () => {
      if (!session?.user?.accessToken) return;

      try {
        setLoadingEmployees(true);
        const options = await employeeService.getOptions();
        setEmployeeOptions(options || []);
      } catch (error) {
        console.error('Error al cargar empleados:', error);
        toast.error('Error al cargar la lista de empleados', getToastTheme());
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, [session]);

  // Formatear fecha/hora actual para el input datetime-local
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Calcular hora de salida (8 horas después, pero mantener en el mismo día si es posible)
    const exitDate = new Date(now);
    exitDate.setHours(exitDate.getHours() + 8);
    
    // Si la salida calculada es del día siguiente pero la hora es muy temprana (antes de las 6 AM),
    // usar 17:00 del mismo día en su lugar
    const isNextDay = exitDate.getDate() !== now.getDate();
    const exitHour = exitDate.getHours();
    
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
    
    setFormData(prev => ({
      ...prev,
      timestamp: prev.timestamp || datetimeLocal,
      exitTimestamp: prev.exitTimestamp || exitDatetimeLocal,
    }));
  }, []);

  const validate = () => {
    const newErrors = {};

    if (!formData.employee_id) {
      newErrors.employee_id = 'El empleado es obligatorio';
    }

    if (isFullSession) {
      // Validación para sesión completa
      if (!formData.timestamp) {
        newErrors.timestamp = 'La fecha y hora de entrada son obligatorias';
      } else {
        const timestamp = new Date(formData.timestamp);
        if (isNaN(timestamp.getTime())) {
          newErrors.timestamp = 'La fecha y hora de entrada no son válidas';
        }
      }

      if (!formData.exitTimestamp) {
        newErrors.exitTimestamp = 'La fecha y hora de salida son obligatorias';
      } else {
        const exitTimestamp = new Date(formData.exitTimestamp);
        if (isNaN(exitTimestamp.getTime())) {
          newErrors.exitTimestamp = 'La fecha y hora de salida no son válidas';
        } else {
          const entryTimestamp = new Date(formData.timestamp);
          if (exitTimestamp <= entryTimestamp) {
            newErrors.exitTimestamp = 'La hora de salida debe ser posterior a la de entrada';
          }
        }
      }
    } else {
      // Validación para fichaje individual
      if (!formData.event_type) {
        newErrors.event_type = 'El tipo de evento es obligatorio';
      } else if (!['IN', 'OUT'].includes(formData.event_type)) {
        newErrors.event_type = 'El tipo de evento debe ser Entrada o Salida';
      }

      if (!formData.timestamp) {
        newErrors.timestamp = 'La fecha y hora son obligatorias';
      } else {
        const timestamp = new Date(formData.timestamp);
        if (isNaN(timestamp.getTime())) {
          newErrors.timestamp = 'La fecha y hora no son válidas';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);

    if (!validate()) {
      toast.error('Por favor, corrige los errores en el formulario', getToastTheme());
      return;
    }

    if (!session?.user?.accessToken) {
      toast.error('No hay sesión activa', getToastTheme());
      return;
    }

    try {
      setLoading(true);
      const token = session.user.accessToken;

      if (isFullSession) {
        // Crear sesión completa (entrada + salida)
        const entryTimestamp = new Date(formData.timestamp).toISOString();
        const exitTimestamp = new Date(formData.exitTimestamp).toISOString();

        const punches = [
          {
            employee_id: parseInt(formData.employee_id),
            event_type: 'IN',
            timestamp: entryTimestamp,
            device_id: 'manual-admin',
          },
          {
            employee_id: parseInt(formData.employee_id),
            event_type: 'OUT',
            timestamp: exitTimestamp,
            device_id: 'manual-admin',
          },
        ];

        const result = await createBulkPunches(punches, token);

        setSuccess(true);
        if (result.failed === 0) {
          toast.success('Sesión completa registrada correctamente (Entrada + Salida)', getToastTheme());
        } else {
          toast.warning(`Se registró la entrada, pero la salida falló`, getToastTheme());
        }
      } else {
        // Crear fichaje individual
        const timestampISO = new Date(formData.timestamp).toISOString();

        const result = await createManualPunch(
          {
            employee_id: parseInt(formData.employee_id),
            event_type: formData.event_type,
            timestamp: timestampISO,
            device_id: 'manual-admin',
          },
          token
        );

        setSuccess(true);
        toast.success(
          `Fichaje registrado correctamente: ${formData.event_type === 'IN' ? 'Entrada' : 'Salida'}`,
          getToastTheme()
        );
      }

      // Resetear formulario
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;

      // Calcular hora de salida (8 horas después, pero mantener en el mismo día si es posible)
      const exitDate = new Date(now);
      exitDate.setHours(exitDate.getHours() + 8);
      
      // Si la salida calculada es del día siguiente pero la hora es muy temprana (antes de las 6 AM),
      // usar 17:00 del mismo día en su lugar
      const isNextDay = exitDate.getDate() !== now.getDate();
      const exitHour = exitDate.getHours();
      
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

      setFormData({
        employee_id: '',
        event_type: '',
        timestamp: datetimeLocal,
        exitTimestamp: exitDatetimeLocal,
      });
      setErrors({});

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error al crear fichaje:', error);
      const errorMessage = error.userMessage || error.message || 'Error al registrar el fichaje';
      toast.error(errorMessage, getToastTheme());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro Individual de Fichaje</CardTitle>
        <CardDescription>
          Registra un fichaje individual con fecha y hora personalizada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Empleado */}
          <div className="space-y-2">
            <Label htmlFor="employee_id">
              Empleado <span className="text-destructive">*</span>
            </Label>
            <Combobox
              options={employeeOptions}
              value={formData.employee_id}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, employee_id: value }));
                setErrors(prev => ({ ...prev, employee_id: undefined }));
              }}
              placeholder="Selecciona un empleado"
              searchPlaceholder="Buscar empleado..."
              notFoundMessage="No se encontraron empleados"
              loading={loadingEmployees}
            />
            {errors.employee_id && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.employee_id}
              </p>
            )}
          </div>

          {/* Sesión Completa */}
          <div className="flex items-center space-x-2 p-4 bg-muted rounded-md">
            <Checkbox
              id="fullSession"
              checked={isFullSession}
              onCheckedChange={(checked) => {
                setIsFullSession(checked);
                setErrors({});
              }}
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
              {/* Tipo de Evento */}
              <div className="space-y-2">
                <Label htmlFor="event_type">
                  Tipo de Evento <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, event_type: value }));
                    setErrors(prev => ({ ...prev, event_type: undefined }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">Entrada</SelectItem>
                    <SelectItem value="OUT">Salida</SelectItem>
                  </SelectContent>
                </Select>
                {errors.event_type && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.event_type}
                  </p>
                )}
              </div>

              {/* Fecha y Hora */}
              <div className="space-y-2">
                <Label htmlFor="timestamp">
                  Fecha y Hora <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="timestamp"
                  type="datetime-local"
                  value={formData.timestamp}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, timestamp: e.target.value }));
                    setErrors(prev => ({ ...prev, timestamp: undefined }));
                  }}
                  className={errors.timestamp ? 'border-destructive' : ''}
                />
                {errors.timestamp && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.timestamp}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Fecha y Hora de Entrada */}
              <div className="space-y-2">
                <Label htmlFor="timestamp">
                  Fecha y Hora de Entrada <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="timestamp"
                  type="datetime-local"
                  value={formData.timestamp}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, timestamp: e.target.value }));
                    setErrors(prev => ({ ...prev, timestamp: undefined }));
                  }}
                  className={errors.timestamp ? 'border-destructive' : ''}
                />
                {errors.timestamp && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.timestamp}
                  </p>
                )}
              </div>

              {/* Fecha y Hora de Salida */}
              <div className="space-y-2">
                <Label htmlFor="exitTimestamp">
                  Fecha y Hora de Salida <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="exitTimestamp"
                  type="datetime-local"
                  value={formData.exitTimestamp}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, exitTimestamp: e.target.value }));
                    setErrors(prev => ({ ...prev, exitTimestamp: undefined }));
                  }}
                  className={errors.exitTimestamp ? 'border-destructive' : ''}
                />
                {errors.exitTimestamp && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.exitTimestamp}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Mensaje de éxito */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-800 dark:text-green-200">
                Fichaje registrado correctamente
              </p>
            </div>
          )}

          {/* Botón de envío */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
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

