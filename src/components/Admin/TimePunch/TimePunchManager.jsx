'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, ArrowLeft, Loader2, User, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import Loader from '@/components/Utilities/Loader';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { getEmployees } from '@/services/employeeService';
import { createPunch } from '@/services/punchService';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const DEVICE_ID = 'manual-web-interface';

export default function TimePunchManager() {
    const { data: session } = useSession();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [registeringId, setRegisteringId] = useState(null);
    const [lastSuccess, setLastSuccess] = useState(null);
    const [dialogContent, setDialogContent] = useState(null); // Contenido congelado del dialog

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
                // Priorizar userMessage sobre message para mostrar errores en formato natural
                const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al cargar la lista de empleados';
                toast.error(errorMessage, getToastTheme());
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
                
                // Priorizar userMessage sobre message para mostrar errores en formato natural
                let errorMessage = 'Error al registrar el fichaje';
                if (punchError.userMessage) {
                    errorMessage = punchError.userMessage;
                } else if (punchError.data?.userMessage) {
                    errorMessage = punchError.data.userMessage;
                } else if (punchError.response?.data?.userMessage) {
                    errorMessage = punchError.response.data.userMessage;
                } else if (punchError.message) {
                    errorMessage = punchError.message;
                } else if (punchError.error) {
                    errorMessage = typeof punchError.error === 'string' 
                        ? punchError.error 
                        : (punchError.error.userMessage || punchError.error.message || errorMessage);
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

            // Encontrar el empleado actual para guardar su estado previo
            const currentEmployee = employees.find(emp => emp.id === employeeId);
            const previousLastPunchEvent = currentEmployee?.lastPunchEvent || null;
            
            // Guardar información del último éxito ANTES de recargar empleados
            // Esto asegura que el dialog muestre la información correcta
            // También guardamos el estado previo para congelar la visualización de la card
            const successData = {
                employeeId,
                employeeName: resultEmployeeName,
                eventType: eventType,
                timestamp: resultTimestamp,
                previousLastPunchEvent: previousLastPunchEvent, // Estado previo antes del fichaje
            };
            
            // Congelar el contenido del dialog de inmediato para evitar cambios
            setDialogContent({
                eventType: eventType,
                employeeName: resultEmployeeName,
                timestamp: resultTimestamp,
            });
            
            setLastSuccess(successData);

            // Recargar lista de empleados para actualizar lastPunchEvent
            // Hacerlo después de un pequeño delay para que el dialog se muestre primero
            setTimeout(async () => {
                try {
                    const response = await getEmployees(token, { perPage: 100, with_last_punch: true });
                    setEmployees(response.data || []);
                } catch (reloadError) {
                    console.warn('Error al recargar empleados, pero el fichaje se registró correctamente:', reloadError);
                    // No mostrar error aquí, el fichaje ya se registró
                }
            }, 100);

            // Cerrar dialog de éxito después de 3 segundos
            setTimeout(() => {
                setLastSuccess(null);
                setDialogContent(null); // Limpiar contenido congelado también
            }, 3000);
        } catch (error) {
            console.error('Error al registrar fichaje:', error);
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al registrar el fichaje';
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
            <div className="w-full h-full flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <div>
                    <h2 className="text-xl font-medium">Registro Horario</h2>
                    <p className="text-sm text-muted-foreground">
                        Toca la tarjeta de un empleado para registrar su fichaje
                    </p>
                </div>
            </div>

            {/* Grid de empleados */}
            {employees.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center py-12 min-h-[300px]">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70" />
                                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-background border shadow-xs">
                                    <Users className="h-6 w-6 text-primary" strokeWidth={1.5} />
                                </div>
                            </div>
                            <h2 className="mt-4 text-lg font-medium tracking-tight">No hay empleados disponibles</h2>
                            <p className="mt-2 text-center text-muted-foreground max-w-[300px] text-xs whitespace-normal">
                                Añade empleados desde la sección de gestión de empleados para poder registrar sus fichajes.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {employees.map((employee) => {
                        const isSuccess = lastSuccess?.employeeId === employee.id;
                        const isRegistering = registeringId === employee.id;
                        
                        // Si hay un éxito reciente para este empleado, congelar completamente la visualización
                        // usando los datos ANTES del fichaje registrado para evitar cambios durante el cierre del dialog
                        let lastPunchEvent, nextPunch, lastPunchTimestamp, lastPunchDate, lastPunchEventType;
                        
                        if (isSuccess && lastSuccess?.previousLastPunchEvent !== undefined) {
                            // Cuando hay un éxito activo, usar el estado PREVIO al fichaje registrado
                            // Esto mantiene la visualización consistente mientras el dialog se cierra
                            lastPunchEvent = lastSuccess.previousLastPunchEvent;
                            nextPunch = getNextPunchType(lastPunchEvent);
                            lastPunchTimestamp = getLastPunchTimestamp(lastPunchEvent);
                            lastPunchDate = formatLastPunchDate(lastPunchTimestamp);
                            lastPunchEventType = getLastPunchEventType(lastPunchEvent);
                        } else {
                            // Comportamiento normal cuando no hay éxito activo
                            lastPunchEvent = employee.lastPunchEvent || null;
                            nextPunch = getNextPunchType(lastPunchEvent);
                            lastPunchTimestamp = getLastPunchTimestamp(lastPunchEvent);
                            lastPunchDate = formatLastPunchDate(lastPunchTimestamp);
                            lastPunchEventType = getLastPunchEventType(lastPunchEvent);
                        }

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
                                                <div className="flex items-center gap-2 text-xs">
                                                    {lastPunchEventType === 'IN' ? (
                                                        <ArrowRight className={cn("h-3.5 w-3.5 text-green-600")} />
                                                    ) : (
                                                        <ArrowLeft className={cn("h-3.5 w-3.5 text-orange-600")} />
                                                    )}
                                                    <span className={cn(
                                                        "truncate font-medium",
                                                        lastPunchEventType === 'IN' ? 'text-green-600' : 'text-orange-600'
                                                    )}>
                                                        {lastPunchEventType === 'IN' ? 'Entrada' : 'Salida'}
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
                                                {nextPunch.type === 'IN' ? (
                                                    <ArrowRight className={cn("h-4 w-4", nextPunch.color)} />
                                                ) : (
                                                    <ArrowLeft className={cn("h-4 w-4", nextPunch.color)} />
                                                )}
                                                <span className={cn("text-sm font-medium", nextPunch.color)}>
                                                    {nextPunch.label}
                                                </span>
                                            </div>
                                            {isRegistering && (
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            )}
                                        </div>
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

            {/* Dialog de éxito - Usa contenido congelado para evitar cambios durante animación */}
            <Dialog open={!!lastSuccess} onOpenChange={() => {}}>
                <DialogContent className="sm:max-w-md [&>button]:hidden">
                    {dialogContent ? (
                        <>
                            <DialogTitle className="sr-only">
                                {dialogContent.eventType === 'IN' ? 'Entrada' : 'Salida'} registrada para {dialogContent.employeeName}
                            </DialogTitle>
                            <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
                                {/* Icono grande de éxito */}
                                <div className={cn(
                                    "rounded-full p-4",
                                    dialogContent.eventType === 'IN' 
                                        ? "bg-green-100 dark:bg-green-900/30" 
                                        : "bg-orange-100 dark:bg-orange-900/30"
                                )}>
                                    {dialogContent.eventType === 'IN' ? (
                                        <ArrowRight className={cn("h-12 w-12 text-green-600")} />
                                    ) : (
                                        <ArrowLeft className={cn("h-12 w-12 text-orange-600")} />
                                    )}
                                </div>

                                {/* Mensaje principal */}
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-foreground">
                                        {dialogContent.eventType === 'IN' ? 'Entrada' : 'Salida'} registrada
                                    </h3>
                                    <p className="text-lg font-semibold text-primary">
                                        {dialogContent.employeeName}
                                    </p>
                                    {dialogContent.timestamp && (
                                        <p className="text-sm text-muted-foreground">
                                            {formatLastPunchDate(dialogContent.timestamp)}
                                        </p>
                                    )}
                                </div>

                                {/* Indicador de cierre automático */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>Cerrando automáticamente...</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-6">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
