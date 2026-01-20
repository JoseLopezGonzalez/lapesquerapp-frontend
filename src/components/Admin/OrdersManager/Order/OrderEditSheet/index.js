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
import { Edit, Save, Loader2, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useOrderContext } from '@/context/OrderContext';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import EmailListInput from '@/components/ui/emailListInput';
import { DatePicker } from '@/components/ui/datePicker';
import { format } from "date-fns"

const OrderEditSheet = () => {
    const { order, updateOrderData } = useOrderContext()
    const { formGroups, defaultValues, loading, loadingProgress } = useOrderFormConfig({ orderData: order });
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [initialValues, setInitialValues] = useState(null);

    const { register, handleSubmit, reset, control, formState: { errors, isDirty, dirtyFields } } = useForm({
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
            toast.error(
                `Por favor, corrige los errores en el formulario${errorCount > 0 ? ` (${errorCount} error${errorCount > 1 ? 'es' : ''})` : ''}`,
                getToastTheme()
            );
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
        const toastId = toast.loading('Actualizando pedido...', getToastTheme());

        // Construir payload solo con campos modificados (dirtyFields)
        // Esto reduce el tamaño del payload y mejora el rendimiento
        const payload = {};
        
        // Iterar solo sobre los campos que han sido modificados
        Object.keys(dirtyFields).forEach((fieldName) => {
            const fieldValue = data[fieldName];
            
            // Convertir fechas a string YYYY-MM-DD si son Date
            if (fieldName === 'entryDate' || fieldName === 'loadDate') {
                payload[fieldName] = fieldValue instanceof Date 
                    ? format(fieldValue, 'yyyy-MM-dd') 
                    : fieldValue;
            } else {
                payload[fieldName] = fieldValue;
            }
        });

        // Si no hay campos modificados, no hacer nada
        if (Object.keys(payload).length === 0) {
            toast.info('No hay cambios para guardar', { id: toastId });
            setSaving(false);
            return;
        }

        try {
            await updateOrderData(payload);
            toast.success('Pedido actualizado correctamente', { id: toastId });
            // Cerrar el Sheet solo después de que se complete exitosamente el guardado
            setOpen(false);
            reset(defaultValues);
            setInitialValues(null);
        } catch (error) {
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = error?.userMessage || error?.data?.userMessage || error?.response?.data?.userMessage || error?.message || error?.response?.data?.message || 'Error al actualizar el pedido';
            toast.error(errorMessage, { id: toastId });
            
            // Si hay errores de validación por campo, mostrarlos
            if (error?.response?.data?.errors) {
                const fieldErrors = error.response.data.errors;
                Object.keys(fieldErrors).forEach((field) => {
                    const fieldError = fieldErrors[field];
                    if (Array.isArray(fieldError) && fieldError.length > 0) {
                        toast.error(`${field}: ${fieldError[0]}`, getToastTheme());
                    }
                });
            }
        } finally {
            setSaving(false);
        }
    };

    // Memoizar renderField para evitar re-renders innecesarios
    const renderField = useCallback((field) => {
        const commonProps = {
            id: field.name,
            placeholder: field.props?.placeholder || '',
            ...register(field.name, field.rules),
        };

        switch (field.component) {
            case 'DatePicker':
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        rules={field.rules}
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
                        rules={field.rules}
                        render={({ field: { onChange, value, onBlur } }) => {
                            return (
                                <Select value={value} onValueChange={onChange} onBlur={onBlur}>
                                    <SelectTrigger className="w-full overflow-hidden" loading={loading}>
                                        <div className="w-full overflow-hidden truncate text-start">
                                            <SelectValue placeholder={field.props?.placeholder} loading={loading} />
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
                        rules={field.rules}
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
                        rules={field.rules}
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
    }, [register, control]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className=''>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Pedido
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[900px] sm:min-w-[600px] px-7 py-7 pb-14 rounded-lg" >
                <SheetHeader>
                    <SheetTitle>Editar Pedido #{order?.id || 'N/A'}</SheetTitle>
                </SheetHeader>
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-8">
                        <Loader2 className="h-6 w-6 animate-spin mb-2" />
                        <p className="text-sm text-muted-foreground">
                            Cargando opciones... ({loadingProgress.current}/{loadingProgress.total})
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleFormSubmit} className="h-full flex flex-col w-full" noValidate>
                        <div className="grow grid gap-6 py-4 px-5 h-full overflow-y-auto w-full">
                            {formGroups.map((group) => (
                                <div key={group.group} className=" w-full">
                                    <h3 className="text-sm font-medium">{group.group}</h3>
                                    <Separator className="my-2" />
                                    <div className={`grid py-4 w-full ${group.grid || 'grid-cols-1 gap-4'}`}>
                                        {group.fields.map((field) => {
                                            const hasError = errors[field.name];
                                            return (
                                                <div key={field.name} className={`grid gap-2 w-full ${field.colSpan}`}>
                                                    <Label htmlFor={field.name}>{field.label}</Label>
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
                        <div className="flex justify-end gap-4 pt-4">
                            <SheetClose asChild>
                                <Button
                                    onClick={onCloseSheet}
                                    variant="outline" 
                                    type="button"
                                    disabled={saving}>
                                    Cancelar
                                </Button>
                            </SheetClose>
                            <Button 
                                type="submit"
                                disabled={saving || Object.keys(errors).length > 0}>
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Guardar cambios
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                )}

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
