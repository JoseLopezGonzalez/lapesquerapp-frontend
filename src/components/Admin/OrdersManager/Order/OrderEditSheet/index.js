'use client'
import React, { useEffect, useState, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useOrderFormConfig } from '@/hooks/useOrderFormConfig';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Edit, Check, Loader2, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useOrderContext } from '@/context/OrderContext';import EmailListInput from '@/components/ui/emailListInput';
import { DatePicker } from '@/components/ui/datePicker';
import { format } from "date-fns"
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';
import { zodResolver } from '@hookform/resolvers/zod';
import { notify } from '@/lib/notifications';
import { orderEditSchema } from './schemas/orderEditSchema';

const OrderEditSheet = ({ open: controlledOpen, onOpenChange: controlledOnOpenChange }) => {
    const { order, updateOrderData } = useOrderContext()
    const { formGroups, defaultValues, loading, loadingProgress } = useOrderFormConfig({ orderData: order });
    const isMobile = useIsMobile();
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined && typeof controlledOnOpenChange === 'function';
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;
    const [saving, setSaving] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [initialValues, setInitialValues] = useState(null);


    const { register, handleSubmit, reset, control, setError, formState: { errors, isDirty, dirtyFields } } = useForm({
        resolver: zodResolver(orderEditSchema),
        defaultValues,
        mode: 'onChange',
    });

    // Guardar valores iniciales cuando se abre el Sheet
    useEffect(() => {
        if (open && defaultValues && !loading) {
            setInitialValues(defaultValues);
            reset(defaultValues);
        }
    }, [open, defaultValues, loading, reset]);

    const handleFormSubmit = handleSubmit(
        (data) => {
            onSubmit(data);
        },
        (formErrors) => {
            const errorCount = Object.keys(formErrors).length;
            notify.error({
                title: `Por favor, corrige los errores en el formulario${errorCount > 0 ? ` (${errorCount} error${errorCount > 1 ? 'es' : ''})` : ''}`,
            });
        }
    );

    const onCloseSheet = () => {
        if (isDirty) {
            setShowCancelDialog(true);
        } else {
            handleConfirmClose();
        }
    };

    const handleConfirmClose = () => {
        reset(defaultValues);
        setOpen(false);
        setShowCancelDialog(false);
        setInitialValues(null);
    };

    const handleCancelDialog = () => {
        setShowCancelDialog(false);
    };


    const onSubmit = async (data) => {
        setSaving(true);
        const payload = {};
        Object.keys(dirtyFields).forEach((fieldName) => {
            const fieldValue = data[fieldName];
            if (fieldName === 'entryDate' || fieldName === 'loadDate') {
                payload[fieldName] = fieldValue instanceof Date
                    ? format(fieldValue, 'yyyy-MM-dd')
                    : fieldValue;
            } else {
                payload[fieldName] = fieldValue;
            }
        });

        if (Object.keys(payload).length === 0) {
            notify.info({ title: 'No hay cambios para guardar' });
            setSaving(false);
            return;
        }

        try {
            await notify.promise(updateOrderData(payload), {
                loading: 'Actualizando pedido...',
                success: 'Pedido actualizado correctamente',
                error: (error) =>
                    error?.userMessage || error?.data?.userMessage || error?.response?.data?.userMessage || error?.message || error?.response?.data?.message || 'Error al actualizar el pedido',
            });
            await new Promise(resolve => setTimeout(resolve, 600));
            setSaving(false);
            setOpen(false);
            reset(defaultValues);
            setInitialValues(null);
        } catch (error) {
            if (error?.status === 422 && error?.data?.errors) {
                setErrorsFrom422(setError, error.data.errors);
            }
            setSaving(false);
        }
    };

    // Memoizar renderField para evitar re-renders innecesarios
    const renderField = useCallback((field) => {
        const commonProps = {
            id: field.name,
            placeholder: field.props?.placeholder || '',
            ...register(field.name),
            className: isMobile ? 'h-12 text-base' : '',
        };

        switch (field.component) {
            case 'DatePicker':
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        render={({ field: { onChange, value, onBlur } }) => {
                            return (
                                <DatePicker
                                    date={value}
                                    onChange={(newValue) => {
                                        onChange(newValue);
                                    }}
                                    onBlur={onBlur}
                                    formatStyle="short"
                                    {...field.props}
                                />
                            )
                        }}
                    />
                );
            case 'Select':
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        render={({ field: { onChange, value, onBlur } }) => {
                            return (
                                <Select value={value} onValueChange={onChange} onBlur={onBlur}>
                                    <SelectTrigger className="w-full overflow-hidden" loading={loading}>
                                        <div className="w-full overflow-hidden truncate text-start">
                                            <SelectValue 
                                                placeholder={field.props?.placeholder} 
                                                loading={loading}
                                                value={value}
                                                options={field.options}
                                            />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent loading={loading}>
                                        {field.options.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )
                        }}
                    />
                );
            case 'Combobox':
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        render={({ field: { onChange, value, onBlur } }) => {
                            return (
                                <Combobox
                                    options={field.options}
                                    placeholder={field.props?.placeholder}
                                    searchPlaceholder={field.props?.searchPlaceholder}
                                    notFoundMessage={field.props?.notFoundMessage}
                                    value={value}
                                    onChange={onChange}
                                    onBlur={onBlur}
                                    className={field.props?.className}
                                    loading={loading}
                                />
                            )
                        }}
                    />
                );
            case 'Textarea':
                return <Textarea {...commonProps} className={field.props?.className} rows={field.props?.rows} />;
            case 'emailList':
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        defaultValue={[]}
                        render={({ field: { value, onChange } }) => (
                            <EmailListInput
                                value={Array.isArray(value) ? value : []}
                                onChange={onChange}
                                placeholder={field.props?.placeholder}
                            />
                        )}
                    />
                );

            case 'Input':
            default:
                return <Input {...commonProps} />;
        }
    }, [register, control, loading, isMobile]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <SheetTrigger asChild>
                    <Button variant={isMobile ? "default" : "outline"} className={isMobile ? 'flex-1 min-h-[44px]' : ''}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                    </Button>
                </SheetTrigger>
            )}
            <SheetContent 
                side={isMobile ? "bottom" : "right"}
                className={isMobile 
                    ? "max-h-[90vh] h-[90vh] px-4 py-4 pb-[env(safe-area-inset-bottom)] rounded-t-3xl flex flex-col overflow-hidden"
                    : "w-[400px] sm:w-[900px] sm:min-w-[600px] px-7 py-7 pb-14 rounded-lg"
                }
            >
                <SheetHeader className={isMobile ? "pb-3 flex-shrink-0" : ""}>
                    <SheetTitle className={isMobile ? "text-lg" : ""}>Editar Pedido #{order?.id || 'N/A'}</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleFormSubmit} className={`flex flex-col w-full ${isMobile ? 'flex-1 min-h-0' : 'h-full'}`} noValidate>
                    {isMobile ? (
                        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                            <div className="grid gap-6 py-2 pb-4">
                                {formGroups.map((group) => (
                                    <div key={group.group} className="w-full">
                                        <h3 className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>{group.group}</h3>
                                        <Separator className="my-2" />
                                        <div className={`grid py-4 w-full ${isMobile ? 'grid-cols-1 gap-4' : group.grid || 'grid-cols-1 gap-4'}`}>
                                            {group.fields.map((field) => {
                                                const hasError = errors[field.name];
                                                return (
                                                    <div key={field.name} className={`grid gap-2 w-full ${isMobile ? '' : field.colSpan}`}>
                                                        <Label htmlFor={field.name} className={isMobile ? 'text-sm' : ''}>{field.label}</Label>
                                                        <div className={hasError ? 'border-red-300 rounded-md' : ''}>
                                                            {renderField(field)}
                                                        </div>
                                                        {hasError && (
                                                            <p className="text-red-500 text-sm flex items-center gap-1">
                                                                <AlertTriangle className="h-3 w-3" />
                                                                {errors[field.name].message}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <ScrollArea className="grow">
                            <div className="grid gap-6 py-4 px-5">
                        {formGroups.map((group) => (
                                <div key={group.group} className="w-full">
                                    <h3 className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>{group.group}</h3>
                                <Separator className="my-2" />
                                    <div className={`grid py-4 w-full ${isMobile ? 'grid-cols-1 gap-4' : group.grid || 'grid-cols-1 gap-4'}`}>
                                    {group.fields.map((field) => {
                                        const hasError = errors[field.name];
                                        return (
                                                <div key={field.name} className={`grid gap-2 w-full ${isMobile ? '' : field.colSpan}`}>
                                                    <Label htmlFor={field.name} className={isMobile ? 'text-sm' : ''}>{field.label}</Label>
                                                <div className={hasError ? 'border-red-300 rounded-md' : ''}>
                                                    {renderField(field)}
                                                </div>
                                                {hasError && (
                                                    <p className="text-red-500 text-sm flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        {errors[field.name].message}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                        </ScrollArea>
                    )}
                    <div className={`flex flex-shrink-0 ${isMobile ? 'pt-4 pb-2 border-t bg-background' : 'justify-end gap-4 pt-4'}`}>
                        <Button 
                            type="submit"
                            disabled={saving || !isDirty}
                            className={isMobile ? 'w-full min-h-[44px]' : ''}
>
                            {saving ? (
                                <>
                                    <Loader2 className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2 animate-spin`} />
                                    <span>{isMobile ? 'Guardando...' : 'Guardando...'}</span>
                                </>
                            ) : (
                                <>
                                    <Check className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
                                    <span>Guardar</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                {/* Diálogo de confirmación al cancelar con cambios */}
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                                Descartar cambios
                            </DialogTitle>
                            <DialogDescription>
                                Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar el formulario? Se perderán todos los cambios no guardados.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex gap-2">
                            <Button variant="outline" onClick={handleCancelDialog}>
                                Continuar editando
                            </Button>
                            <Button variant="destructive" onClick={handleConfirmClose}>
                                Descartar cambios
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </SheetContent>
        </Sheet>
    );
};

export default OrderEditSheet;
