'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, XCircle, Loader2, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { getEmployees } from '@/services/employeeService';
import { createPunch } from '@/services/punchService';
import { cn } from '@/lib/utils';

const DEVICE_ID = 'manual-web-interface';

export default function TimePunchManager() {
    const { data: session } = useSession();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [registeringId, setRegisteringId] = useState(null);
    const [lastSuccess, setLastSuccess] = useState(null);

    // Cargar lista de empleados
    useEffect(() => {
        const loadEmployees = async () => {
            if (!session?.user?.accessToken) return;

            try {
                setLoading(true);
                const token = session.user.accessToken;
                const response = await getEmployees(token, { perPage: 100, with_last_punch: true });
                setEmployees(response.data || []);
            } catch (error) {
                console.error('Error al cargar empleados:', error);
                toast.error(
                    error.message || 'Error al cargar la lista de empleados',
                    getToastTheme()
                );
            } finally {
                setLoading(false);
            }
        };

        loadEmployees();
    }, [session]);

    const handleRegisterPunch = async (employeeId, employeeName) => {
        if (!session?.user?.accessToken) {
            toast.error('No hay sesión activa', getToastTheme());
            return;
        }

        try {
            setRegisteringId(employeeId);
            const token = session.user.accessToken;

            // Registrar el fichaje usando employee_id
            let result;
            try {
                result = await createPunch(
                    {
                        employee_id: employeeId,
                        device_id: DEVICE_ID,
                    },
                    token
                );
            } catch (punchError) {
                // Log detallado del error para debugging
                console.error('Error en createPunch:', punchError);
                console.error('Error details:', {
                    message: punchError.message,
                    error: punchError,
                });
                
                // Intentar extraer el mensaje de error más específico
                let errorMessage = 'Error al registrar el fichaje';
                if (punchError.message) {
                    errorMessage = punchError.message;
                } else if (punchError.userMessage) {
                    errorMessage = punchError.userMessage;
                } else if (punchError.error) {
                    errorMessage = typeof punchError.error === 'string' 
                        ? punchError.error 
                        : punchError.error.message || errorMessage;
                }
                
                throw new Error(errorMessage);
            }

            // Validar que result existe y tiene la estructura esperada
            if (!result) {
                throw new Error('No se recibió respuesta del servidor');
            }

            // Mostrar resultado con un mensaje visual mejorado
            const eventType = result.event_type || result.eventType || null;
            const eventTypeLabel = eventType === 'IN' ? 'Entrada' : eventType === 'OUT' ? 'Salida' : 'Fichaje';
            
            // Intentar obtener timestamp de múltiples lugares posibles
            const resultTimestamp = result.timestamp 
                || result.created_at 
                || result.createdAt
                || result.date
                || new Date().toISOString();
            
            let timestampString = '';
            try {
                const timestampDate = new Date(resultTimestamp);
                if (!isNaN(timestampDate.getTime())) {
                    timestampString = timestampDate.toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                }
            } catch (e) {
                console.warn('Error al formatear timestamp:', e);
                timestampString = 'ahora';
            }

            const resultEmployeeName = result.employee_name || result.employeeName || employeeName;

            // Guardar información del último éxito para mostrarlo en la card
            setLastSuccess({
                employeeId,
                employeeName: resultEmployeeName,
                eventType: eventType,
                timestamp: resultTimestamp,
            });

            // Toast con más información
            toast.success(
                `${resultEmployeeName} - ${eventTypeLabel} registrada${timestampString ? ` a las ${timestampString}` : ''}`,
                {
                    ...getToastTheme(),
                    duration: 4000,
                }
            );

            // Recargar lista de empleados para actualizar lastPunchEvent
            try {
                const response = await getEmployees(token, { perPage: 100, with_last_punch: true });
                setEmployees(response.data || []);
            } catch (reloadError) {
                console.warn('Error al recargar empleados, pero el fichaje se registró correctamente:', reloadError);
                // No mostrar error aquí, el fichaje ya se registró
            }

            // Limpiar el éxito después de 3 segundos
            setTimeout(() => {
                setLastSuccess(null);
            }, 3000);
        } catch (error) {
            console.error('Error al registrar fichaje:', error);
            const errorMessage = error.message || error.userMessage || 'Error al registrar el fichaje';
            toast.error(errorMessage, getToastTheme());
        } finally {
            setRegisteringId(null);
        }
    };

    const getNextPunchType = (lastPunch) => {
        if (!lastPunch || !lastPunch.event_type) {
            return { type: 'IN', label: 'Entrada', color: 'text-green-600' };
        }
        return lastPunch.event_type === 'IN'
            ? { type: 'OUT', label: 'Salida', color: 'text-orange-600' }
            : { type: 'IN', label: 'Entrada', color: 'text-green-600' };
    };

    const formatLastPunchDate = (timestamp) => {
        if (!timestamp) return null;
        try {
            // Intentar parsear la fecha
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return null; // Fecha inválida
            
            return date.toLocaleString('es-ES', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return null;
        }
    };

    // Función auxiliar para obtener el timestamp de lastPunchEvent de forma segura
    const getLastPunchTimestamp = (lastPunchEvent) => {
        if (!lastPunchEvent) return null;
        // Intentar diferentes posibles nombres del campo
        return lastPunchEvent.timestamp || lastPunchEvent.created_at || lastPunchEvent.createdAt || null;
    };

    // Función auxiliar para obtener el event_type de forma segura
    const getLastPunchEventType = (lastPunchEvent) => {
        if (!lastPunchEvent) return null;
        return lastPunchEvent.event_type || lastPunchEvent.eventType || null;
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Cargando empleados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Clock className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Registro Horario</h1>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Toca la tarjeta de un empleado para registrar su fichaje
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid de empleados */}
            {employees.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium text-foreground mb-2">
                                No hay empleados disponibles
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Añade empleados desde la sección de gestión de empleados
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {employees.map((employee) => {
                        const lastPunchEvent = employee.lastPunchEvent || null;
                        const nextPunch = getNextPunchType(lastPunchEvent);
                        const isRegistering = registeringId === employee.id;
                        const isSuccess = lastSuccess?.employeeId === employee.id;
                        const lastPunchTimestamp = getLastPunchTimestamp(lastPunchEvent);
                        const lastPunchDate = formatLastPunchDate(lastPunchTimestamp);
                        const lastPunchEventType = getLastPunchEventType(lastPunchEvent);

                        return (
                            <Card
                                key={employee.id}
                                className={cn(
                                    "transition-all duration-200 cursor-pointer",
                                    "hover:shadow-lg hover:scale-[1.02]",
                                    "active:scale-[0.98]",
                                    "border-2",
                                    isSuccess
                                        ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                                        : "border-border hover:border-primary/50",
                                    isRegistering && "opacity-75 pointer-events-none"
                                )}
                                onClick={() => handleRegisterPunch(employee.id, employee.name)}
                            >
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {/* Nombre del empleado */}
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-full bg-primary/10 shrink-0">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-lg leading-tight truncate">
                                                    {employee.name}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Información del último fichaje */}
                                        {lastPunchEvent && lastPunchEventType && (
                                            <div className="space-y-1 pt-2 border-t">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {lastPunchEventType === 'IN' ? (
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="h-3.5 w-3.5 text-gray-500" />
                                                    )}
                                                    <span className="truncate">
                                                        Último: {lastPunchEventType === 'IN' ? 'Entrada' : 'Salida'}
                                                    </span>
                                                </div>
                                                {lastPunchDate && (
                                                    <p className="text-xs text-muted-foreground pl-5">
                                                        {lastPunchDate}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Próximo fichaje */}
                                        <div
                                            className={cn(
                                                "pt-3 border-t",
                                                "flex items-center justify-between",
                                                isSuccess && "animate-pulse"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Clock className={cn("h-4 w-4", nextPunch.color)} />
                                                <span className={cn("text-sm font-medium", nextPunch.color)}>
                                                    {nextPunch.label}
                                                </span>
                                            </div>
                                            {isRegistering ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            ) : isSuccess ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            ) : null}
                                        </div>

                                        {/* Mensaje de éxito */}
                                        {isSuccess && lastSuccess && (
                                            <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
                                                <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                                                    <p className="text-xs font-medium text-green-800 dark:text-green-200">
                                                        ✓ {lastSuccess.eventType === 'IN' ? 'Entrada' : 'Salida'} registrada
                                                    </p>
                                                    <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                                                        {formatLastPunchDate(lastSuccess.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Información adicional */}
            <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="space-y-2 text-sm">
                                <p className="font-medium text-foreground">
                                    Cómo funciona el sistema
                                </p>
                                <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                                    <li>
                                        Toca la tarjeta de un empleado para registrar su fichaje automáticamente
                                    </li>
                                    <li>
                                        El sistema determina si es <strong>Entrada</strong> o <strong>Salida</strong> según el último evento registrado
                                    </li>
                                    <li>
                                        Si es el primer fichaje del día o el último fue salida, se registrará una entrada
                                    </li>
                                    <li>
                                        El fichaje se registra con la hora actual del servidor
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
