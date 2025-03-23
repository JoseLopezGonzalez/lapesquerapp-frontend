'use client'

import React, { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Save, PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import DatePicker from '@/components/Shadcn/Dates/DatePicker';
import { useOrderCreateFormConfig } from '@/hooks/useOrderCreateFormConfig';

const CreateOrderForm = () => {
    const { defaultValues, formGroups, loading } = useOrderCreateFormConfig();

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            ...defaultValues,
            plannedProducts: [],
        },
        mode: 'onChange',
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'plannedProducts',
    });

    useEffect(() => {
        reset({
            ...defaultValues,
            plannedProducts: [],
        });
    }, [defaultValues]);

    const handleCreate = async (data) => {
        console.log('Pedido a crear:', data);
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
                        control={control}
                        rules={field.rules}
                        render={({ field: { onChange, value, onBlur } }) => (
                            <DatePicker
                                value={value}
                                onChange={onChange}
                                onBlur={onBlur}
                                {...field.props}
                            />
                        )}
                    />
                );
            case 'Select':
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        rules={field.rules}
                        render={({ field: { onChange, value, onBlur } }) => (
                            <Select value={value} onValueChange={onChange} onBlur={onBlur}>
                                <SelectTrigger className="w-full overflow-hidden">
                                    <div className="w-full overflow-hidden truncate text-start">
                                        <SelectValue placeholder={field.props?.placeholder} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {field.options?.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                );
            case 'Combobox':
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        rules={field.rules}
                        render={({ field: { onChange, value, onBlur } }) => (
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
                        )}
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
        <div className="max-w-6xl mx-auto py-6">
            <h1 className="text-2xl font-semibold mb-4">Crear nuevo pedido</h1>
            {loading ? (
                <div>Cargando formulario...</div>
            ) : (
                <form onSubmit={handleSubmit(handleCreate)} className="flex flex-col gap-8">
                    {formGroups.map((group) => (
                        <div key={group.group} className="w-full">
                            <h3 className="text-sm font-medium text-muted-foreground">{group.group}</h3>
                            <Separator className="my-2" />
                            <div className={`grid w-full ${group.grid || 'grid-cols-1 gap-4'}`}>
                                {group.fields.map((field) => (
                                    <div key={field.name} className={`grid gap-2 w-full ${field.colSpan || ''}`}>
                                        <Label htmlFor={field.name}>{field.label}</Label>
                                        {renderField(field)}
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

                    <div className="w-full">
                        <h3 className="text-sm font-medium text-muted-foreground">Productos previstos</h3>
                        <Separator className="my-2" />
                        <div className="flex flex-col gap-4">
                            {fields.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-6 gap-4 items-end">
                                    <Input {...register(`plannedProducts.${index}.product`)} placeholder="Producto" />
                                    <Input type="number" step="any" {...register(`plannedProducts.${index}.quantity`)} placeholder="Kg" />
                                    <Input type="number" step="any" {...register(`plannedProducts.${index}.boxes`)} placeholder="Cajas" />
                                    <Input type="number" step="any" {...register(`plannedProducts.${index}.unitPrice`)} placeholder="€/kg" />
                                    <Input {...register(`plannedProducts.${index}.tax`)} placeholder="IVA" />
                                    <Button type="button" variant="ghost" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={() => append({ product: '', quantity: '', boxes: '', unitPrice: '', tax: '' })}>
                                <PlusCircle className="h-4 w-4 mr-2" /> Añadir producto
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="submit">
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Pedido
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CreateOrderForm;
