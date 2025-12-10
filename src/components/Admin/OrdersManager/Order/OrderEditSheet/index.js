'use client'
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useOrderFormConfig } from '@/hooks/useOrderFormConfig';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
/* import DatePicker from '@/components/Shadcn/Dates/DatePicker'; */
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Edit, Save, Loader2 } from 'lucide-react';
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
    const { formGroups, defaultValues, loading } = useOrderFormConfig({ orderData: order });
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
        defaultValues,
        mode: 'onChange',
    });

    const handleFormSubmit = handleSubmit(
        (data) => {
            onSubmit(data);
        },
        (formErrors) => {
            toast.error('Por favor, corrige los errores en el formulario', getToastTheme());
        }
    );

    useEffect(() => {
        if (defaultValues && !loading) {
            reset(defaultValues);
        }
    }, [defaultValues, loading, reset]);

    const onCloseSheet = () => {
        reset(defaultValues);
        setOpen(false);
    };


    const onSubmit = async (data) => {
        setSaving(true);
        const toastId = toast.loading('Actualizando pedido...', getToastTheme());

        // Convertir fechas a string YYYY-MM-DD si son Date
        const payload = {
            ...data,
            entryDate: data.entryDate instanceof Date ? format(data.entryDate, 'yyyy-MM-dd') : data.entryDate,
            loadDate: data.loadDate instanceof Date ? format(data.loadDate, 'yyyy-MM-dd') : data.loadDate,
        };

        try {
            await updateOrderData(payload);
            toast.success('Pedido actualizado correctamente', { id: toastId });
            // Cerrar el Sheet solo después de que se complete exitosamente el guardado
            setOpen(false);
            reset(defaultValues);
        } catch (error) {
            toast.error('Error al actualizar el pedido', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const renderField = (field) => {
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
                        control={control} // proviene de useForm o useFormContext
                        rules={field.rules}
                        render={({ field: { onChange, value, onBlur } }) => {
                            // Aquí renderizas el componente, por ejemplo un Select
                            // y usas onChange / value / onBlur para la sincronización
                            return (
                              /*   <DatePicker
                                    value={value}
                                    onChange={onChange}
                                    onBlur={onBlur}
                                    {...field.props}
                                /> */
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
                        control={control} // proviene de useForm o useFormContext
                        rules={field.rules}
                        render={({ field: { onChange, value, onBlur } }) => {
                            // Aquí renderizas el componente, por ejemplo un Select
                            // y usas onChange / value / onBlur para la sincronización
                            return (
                                <Select value={value} onValueChange={onChange} onBlur={onBlur}>
                                    <SelectTrigger className="w-full overflow-hidden">
                                        <div className="w-full overflow-hidden truncate text-start">
                                            <SelectValue placeholder={field.props?.placeholder} />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* empty item */}
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
                        control={control} // proviene de useForm o useFormContext
                        rules={field.rules}
                        render={({ field: { onChange, value, onBlur } }) => {
                            // Aquí renderizas el componente, por ejemplo un Select
                            // y usas onChange / value / onBlur para la sincronización
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
    };

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
                {loading ? <div>Cargando...</div> :
                    <form onSubmit={handleFormSubmit} className="h-full flex flex-col w-full" noValidate>
                        <div className="grow grid gap-6 py-4 px-5 h-full overflow-y-auto w-full">
                            {formGroups.map((group) => (
                                <div key={group.group} className=" w-full">
                                    <h3 className="text-sm font-medium">{group.group}</h3>
                                    <Separator className="my-2" />
                                    <div className={`grid py-4 w-full ${group.grid || 'grid-cols-1 gap-4'}`}>
                                        {group.fields.map((field) => (
                                            <div key={field.name} className={`grid gap-2 w-full ${field.colSpan}`}>
                                                <Label htmlFor={field.name}>{field.label}</Label>
                                                {renderField(field)}
                                                {/* Aquí podrías renderizar errores si lo deseas */}
                                                {/* Mensaje de error */}
                                                {errors[field.name] && (
                                                    <p className="text-red-500 text-sm">
                                                        {errors[field.name].message}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
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
                                disabled={saving}>
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
                }
            </SheetContent>
        </Sheet>
    );
};

export default OrderEditSheet;
