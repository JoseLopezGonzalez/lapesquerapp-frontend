'use client'
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useOrderFormConfig } from '@/hooks/useOrderFormConfig';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import DatePicker from '@/components/Shadcn/Dates/DatePicker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Edit, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useOrderContext } from '@/context/OrderContext';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';

const OrderEditSheet = () => {
    const { order, updateOrderData } = useOrderContext()
    const { formGroups, defaultValues, loading } = useOrderFormConfig({ orderData: order });

    const { register, handleSubmit, watch, reset, control, formState: { errors } } = useForm({
        defaultValues,
        mode: 'onChange',
    });

    useEffect(() => {
        reset(defaultValues);
    }, [defaultValues]);

    const onCloseSheet = () => {
        reset(defaultValues);
    };


    const onSubmit = async (data) => {
        /* toast fetch */
        const toastId = toast.loading('Actualizando pedido...', getToastTheme());

        updateOrderData(data)
            .then((updatedData) => {
                console.log('Pedido actualizado:', updatedData);
                toast.success('Pedido actualizado correctamente', { id: toastId });
            })
            .catch((error) => {
                console.error('Error al actualizar el pedido:', error);
                toast.error('Error al actualizar el pedido', { id: toastId });
            });


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
                                <DatePicker
                                    value={value}
                                    onChange={onChange}
                                    onBlur={onBlur}
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
            case 'Input':
            default:
                return <Input {...commonProps} />;
        }
    };

    return (
        <Sheet >
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
                    <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col w-full">
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
                            <SheetTrigger asChild>
                                <Button
                                    onClick={onCloseSheet}
                                    variant="outline" type="button">
                                    Cancelar
                                </Button>
                            </SheetTrigger>
                            <SheetTrigger asChild>
                                <Button type="submit">
                                    <Save className="h-4 w-4 mr-2" />
                                    Guardar cambios
                                </Button>
                            </SheetTrigger>
                        </div>
                    </form>
                }
            </SheetContent>
        </Sheet>
    );
};

export default OrderEditSheet;
