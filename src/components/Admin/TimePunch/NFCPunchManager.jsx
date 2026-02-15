'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Loader2, AlertCircle, Radio } from 'lucide-react';
import Image from 'next/image';
import Loader from '@/components/Utilities/Loader';
import { getEmployees } from '@/services/employeeService';
import { createPunch } from '@/services/punchService';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { motion, useReducedMotion } from 'framer-motion';

const DEVICE_ID = 'nfc-reader-web-interface';

export default function NFCPunchManager() {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const { theme, resolvedTheme } = useTheme();
    const [nfcCode, setNfcCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const punchMutation = useMutation({
        mutationFn: async ({ punchPayload }) => {
            const token = session?.user?.accessToken;
            if (!token) throw new Error('No hay sesión activa');
            const result = await createPunch(punchPayload, token);
            if (!result) throw new Error('No se recibió respuesta del servidor');
            return result;
        },
        onSuccess: (result, { employeeName, eventType }) => {
            const actualEventType = result.event_type || result.eventType || eventType;
            const actualEventTypeLabel = actualEventType === 'IN' ? 'Entrada' : 'Salida';
            const resultTimestamp = result.timestamp || result.created_at || result.createdAt || result.date || new Date().toISOString();
            let timestampString = '';
            try {
                const d = new Date(resultTimestamp);
                if (!Number.isNaN(d.getTime())) {
                    timestampString = d.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                }
            } catch {
                timestampString = 'ahora';
            }
            setDialogContent(null);
            showSuccessMessage(employeeName, actualEventType, actualEventTypeLabel, timestampString);
            queryClient.invalidateQueries({ queryKey: ['punches'] });
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
        onError: (error) => {
            const msg = error?.userMessage || error?.data?.userMessage || error?.response?.data?.userMessage || error?.message || 'Error al registrar el fichaje';
            showErrorDialog(msg);
        },
        onSettled: () => {
            setIsProcessing(false);
        },
    });
    const [dialogContent, setDialogContent] = useState(null);
    const [statusMessage, setStatusMessage] = useState(null); // { type: 'error' | 'success', message: string, employeeName?: string, eventType?: string }
    const inputRef = useRef(null);
    const prefersReducedMotion = useReducedMotion();
    const [mounted, setMounted] = useState(false);

    // Detectar el tema actual (evitar hydration mismatch)
    useEffect(() => {
        setMounted(true);
    }, []);

    // Determinar qué imagen usar según el tema
    const nfcImageSrc = mounted && (resolvedTheme === 'dark' || theme === 'dark')
        ? '/images/nfc-illustration-dark.png'
        : '/images/nfc-illustration-light.png';

    // Enfocar el input al montar el componente y mantenerlo enfocado
    useEffect(() => {
        const focusInput = () => {
            if (inputRef.current && !isProcessing) {
                inputRef.current.focus();
            }
        };
        
        focusInput();
        
        // Re-enfocar cuando se cierra el dialog o cuando no está procesando
        const interval = setInterval(focusInput, 100);
        
        // También re-enfocar cuando se hace clic en cualquier parte
        const handleClick = () => focusInput();
        window.addEventListener('click', handleClick);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('click', handleClick);
        };
    }, [isProcessing]);

    // Manejar la detección de código NFC (simulado con teclado)
    const handleKeyDown = (e) => {
        // Si está procesando, ignorar todas las teclas excepto Escape para cancelar
        if (isProcessing) {
            if (e.key === 'Escape') {
                setIsProcessing(false);
                setNfcCode('');
            }
            return;
        }

        // Si es Enter y hay código, procesar
        if (e.key === 'Enter' && nfcCode.trim()) {
            e.preventDefault();
            handleNFCRead(nfcCode.trim());
            return;
        }

        // Si es Backspace o Delete, permitir borrar
        if (e.key === 'Backspace' || e.key === 'Delete') {
            return; // Permitir que funcione normalmente
        }

        // Para cualquier otra tecla, permitir que se escriba normalmente
        // El input capturará todo silenciosamente
    };

    const showErrorDialog = (errorMessage) => {
        // Mostrar error en el área principal
        setStatusMessage({
            type: 'error',
            message: errorMessage,
        });
        
        // Volver al estado normal después de 3 segundos
        setTimeout(() => {
            setStatusMessage(null);
            setNfcCode('');
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 3000);
    };

    const showSuccessMessage = (employeeName, eventType, eventTypeLabel, timestampString) => {
        // Mostrar éxito en el área principal
        setStatusMessage({
            type: 'success',
            message: `${eventTypeLabel} registrada`,
            employeeName: employeeName,
            eventType: eventType,
            timestampString: timestampString,
        });
        
        // Volver al estado normal después de 3 segundos
        setTimeout(() => {
            setStatusMessage(null);
            setNfcCode('');
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 3000);
    };

    const handleNFCRead = async (uid) => {
        if (!session?.user?.accessToken) {
            showErrorDialog('No hay sesión activa');
            return;
        }

        if (!uid) {
            showErrorDialog('Código NFC vacío');
            return;
        }

        setIsProcessing(true);
        const token = session.user.accessToken;

        try {
            // Buscar empleado por NFC UID
            const employeesResponse = await getEmployees(token, { 
                nfc_uid: uid,
                perPage: 1,
                with_last_punch: true 
            });

            if (!employeesResponse.data || employeesResponse.data.length === 0) {
                showErrorDialog('No se encontró ningún empleado con ese código NFC');
                return;
            }

            const employee = employeesResponse.data[0];
            const lastPunch = employee.lastPunchEvent;
            const isEntry = !lastPunch || lastPunch.event_type === 'OUT';
            const eventType = isEntry ? 'IN' : 'OUT';

            punchMutation.mutate({
                punchPayload: { uid, device_id: DEVICE_ID, event_type: eventType },
                employeeName: employee.name,
                eventType,
            });
        } catch (error) {
            console.error('Error al procesar fichaje NFC:', error);
            const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al procesar el fichaje';
            showErrorDialog(errorMessage);
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col">
            {/* Área principal de detección NFC */}
            <Card className="border-0 flex-1 flex flex-col m-0 rounded-none shadow-none">
                <CardContent className="flex-1 flex flex-col p-6 md:p-8 lg:p-12">
                    {/* Header integrado */}
                    <div className="mb-6 md:mb-8">
                        <h2 className="text-xl md:text-2xl font-medium">Fichaje Automático NFC</h2>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Acerca el chip NFC al lector o introduce el código manualmente
                        </p>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row items-center md:items-center justify-between gap-8 md:gap-12">
                        {/* Ilustración NFC - Izquierda */}
                        <div className="flex-1 flex items-center justify-center h-full">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                                className="relative"
                            >
                                <motion.div
                                    animate={{
                                        scale: isProcessing ? 1.05 : 1,
                                    }}
                                    transition={{
                                        duration: prefersReducedMotion ? 0 : 0.3,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <Image
                                        src={nfcImageSrc}
                                        alt="Lector NFC con chip"
                                        width={500}
                                        height={400}
                                        className="object-contain max-w-full h-auto w-full max-h-[60vh]"
                                        priority
                                    />
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Contenido - Derecha */}
                        <div className="flex-1 flex flex-col items-center md:items-start justify-center space-y-6 md:space-y-8 h-full">
                            {/* Icono NFC animado */}
                            <motion.div
                                className="relative"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: prefersReducedMotion ? 0 : 0.3, delay: 0.1 }}
                            >
                                {/* Efecto de ondas cuando está procesando o hay un estado */}
                                {(isProcessing || statusMessage) && (
                                    <>
                                        <motion.div
                                            className={cn(
                                                "absolute inset-0 rounded-full",
                                                statusMessage?.type === 'error'
                                                    ? "bg-red-500/20"
                                                    : statusMessage?.type === 'success'
                                                        ? statusMessage.eventType === 'IN'
                                                            ? "bg-green-500/20"
                                                            : "bg-orange-500/20"
                                                        : "bg-primary/20"
                                            )}
                                            animate={{
                                                scale: [1, 1.5, 2],
                                                opacity: [0.5, 0.3, 0],
                                            }}
                                            transition={{
                                                duration: prefersReducedMotion ? 0 : 1.5,
                                                repeat: Infinity,
                                                ease: "easeOut"
                                            }}
                                        />
                                        <motion.div
                                            className={cn(
                                                "absolute inset-0 rounded-full",
                                                statusMessage?.type === 'error'
                                                    ? "bg-red-500/20"
                                                    : statusMessage?.type === 'success'
                                                        ? statusMessage.eventType === 'IN'
                                                            ? "bg-green-500/20"
                                                            : "bg-orange-500/20"
                                                        : "bg-primary/20"
                                            )}
                                            animate={{
                                                scale: [1, 1.5, 2],
                                                opacity: [0.5, 0.3, 0],
                                            }}
                                            transition={{
                                                duration: prefersReducedMotion ? 0 : 1.5,
                                                repeat: Infinity,
                                                delay: 0.5,
                                                ease: "easeOut"
                                            }}
                                        />
                                    </>
                                )}
                                
                                {/* Icono NFC */}
                                <motion.div
                                    className={cn(
                                        "relative flex h-24 w-24 items-center justify-center rounded-full bg-background border-2 shadow-lg",
                                        statusMessage?.type === 'error'
                                            ? "border-red-500"
                                            : statusMessage?.type === 'success'
                                                ? statusMessage.eventType === 'IN'
                                                    ? "border-green-500"
                                                    : "border-orange-500"
                                                : isProcessing 
                                                    ? "border-primary" 
                                                    : "border-primary/50"
                                    )}
                                    animate={{
                                        scale: isProcessing 
                                            ? [1, 1.1, 1] 
                                            : statusMessage 
                                                ? [1, 1.15, 1] 
                                                : 1,
                                    }}
                                    transition={{
                                        duration: prefersReducedMotion ? 0 : statusMessage ? 0.4 : 1,
                                        repeat: (isProcessing || statusMessage) ? Infinity : 0,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <motion.div
                                        animate={{
                                            rotate: isProcessing ? [0, 360] : 0,
                                        }}
                                        transition={{
                                            duration: prefersReducedMotion ? 0 : 2,
                                            repeat: isProcessing ? Infinity : 0,
                                            ease: "linear"
                                        }}
                                    >
                                        <Radio className={cn(
                                            "h-12 w-12 transition-colors duration-300",
                                            statusMessage?.type === 'error'
                                                ? "text-red-600"
                                                : statusMessage?.type === 'success'
                                                    ? statusMessage.eventType === 'IN'
                                                        ? "text-green-600"
                                                        : "text-orange-600"
                                                    : isProcessing 
                                                        ? "text-primary" 
                                                        : "text-primary/70"
                                        )} strokeWidth={1.5} />
                                    </motion.div>
                                </motion.div>
                            </motion.div>

                            {/* Mensaje principal */}
                            <motion.div
                                className="text-center md:text-left space-y-2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: prefersReducedMotion ? 0 : 0.3, delay: 0.2 }}
                                key={statusMessage ? `${statusMessage.type}-${statusMessage.message}` : 'default'}
                            >
                                <motion.h3
                                    className={cn(
                                        "text-2xl font-semibold transition-colors",
                                        statusMessage?.type === 'error'
                                            ? "text-red-600"
                                            : statusMessage?.type === 'success'
                                                ? statusMessage.eventType === 'IN'
                                                    ? "text-green-600"
                                                    : "text-orange-600"
                                                : isProcessing 
                                                    ? "text-primary" 
                                                    : "text-foreground"
                                    )}
                                    initial={{ scale: statusMessage ? 0.9 : 1 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                                >
                                    {statusMessage?.type === 'error'
                                        ? 'Error'
                                        : statusMessage?.type === 'success'
                                            ? statusMessage.message
                                            : isProcessing 
                                                ? 'Procesando...' 
                                                : 'Esperando lectura NFC'}
                                </motion.h3>
                                <motion.p
                                    className={cn(
                                        "text-sm max-w-md transition-colors",
                                        statusMessage?.type === 'error'
                                            ? "text-red-500"
                                            : statusMessage?.type === 'success'
                                                ? "text-muted-foreground"
                                                : "text-muted-foreground"
                                    )}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: prefersReducedMotion ? 0 : 0.2, delay: 0.1 }}
                                >
                                    {statusMessage?.type === 'error'
                                        ? statusMessage.message
                                        : statusMessage?.type === 'success'
                                            ? (
                                                <>
                                                    <span className="text-2xl font-semibold text-foreground">{statusMessage.employeeName}</span>
                                                    {statusMessage.timestampString && (
                                                        <span className="block mt-2 text-xl font-medium text-foreground">{statusMessage.timestampString}</span>
                                                    )}
                                                </>
                                            )
                                            : isProcessing 
                                                ? 'Registrando fichaje del empleado...'
                                                : 'Acerca tu chip NFC al lector. El código se detectará automáticamente'}
                                </motion.p>
                            </motion.div>

                            {/* Indicador de estado */}
                            {isProcessing && (
                                <motion.div
                                    className="flex items-center gap-2 text-sm text-primary"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                                >
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Procesando fichaje...</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Input completamente oculto para capturar el código silenciosamente */}
                        <input
                            ref={inputRef}
                            type="text"
                            value={nfcCode}
                            onChange={(e) => setNfcCode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isProcessing}
                            className="absolute left-0 top-0 w-0 h-0 opacity-0 pointer-events-auto"
                            style={{ position: 'absolute', left: '-9999px' }}
                            autoComplete="off"
                            autoFocus
                            aria-hidden="true"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Dialog de registro (solo durante el procesamiento) */}
            <Dialog open={!!dialogContent && !dialogContent.isError && !dialogContent.isSuccess} onOpenChange={() => {}}>
                <DialogContent className="sm:max-w-md [&>button]:hidden">
                    {dialogContent && !dialogContent.isError && !dialogContent.isSuccess && (
                        <>
                            <DialogTitle className="sr-only">
                                Registrando {dialogContent.eventTypeLabel.toLowerCase()} para {dialogContent.employeeName}
                            </DialogTitle>
                            <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
                                {/* Icono de procesamiento */}
                                <div className="rounded-full p-4 bg-primary/10">
                                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                </div>

                                {/* Mensaje de procesamiento */}
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-foreground">
                                        Registrando {dialogContent.eventTypeLabel.toLowerCase()}
                                    </h3>
                                    <p className="text-lg font-semibold text-primary">
                                        {dialogContent.employeeName}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

