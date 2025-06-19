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
import { useSession } from 'next-auth/react';
import { getCustomer } from '@/services/customerService';
import { useProductOptions } from '@/hooks/useProductOptions';
import { useTaxOptions } from '@/hooks/useTaxOptions';
import Loader from '@/components/Utilities/Loader';
import { getToastTheme } from '@/customs/reactHotToast';
import toast from 'react-hot-toast';
import { API_URL_V2 } from '@/configs/config';
import EmailListInput from '@/components/ui/emailListInput';

const CreateOrderForm = ({ onCreate }) => {
    const { productOptions } = useProductOptions();
    const { taxOptions } = useTaxOptions();

    const { data: session } = useSession();
    const token = session?.user?.accessToken;

    const { defaultValues, formGroups, loading, handleGetCustomer } = useOrderCreateFormConfig();

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
        watch,
        setValue
    } = useForm({
        defaultValues: {
            ...defaultValues,
            plannedProducts: [],
        },
        mode: 'onChange',
    });

    useEffect(() => {
        const selectedCustomerId = watch('customer');
        if (!selectedCustomerId) return;

        getCustomer(selectedCustomerId, token).then((customer) => {
            setValue('salesperson', customer.salesperson?.id?.toString() || '');
            setValue('payment', customer.paymentTerm?.id?.toString() || '');
            setValue('incoterm', customer.incoterm?.id?.toString() || '');
            setValue('billingAddress', customer.billingAddress || '');
            setValue('shippingAddress', customer.shippingAddress || '');
            setValue('transportationNotes', customer.transportationNotes || '');
            setValue('productionNotes', customer.productionNotes || '');
            setValue('accountingNotes', customer.accountingNotes || '');
            setValue('transport', customer.transport?.id?.toString() || '');

            // ✅ Corrección aquí
            setValue('emails', customer.emails || []);
            setValue('ccEmails', customer.ccEmails || []);
        }).catch((err) => {
            console.error('Error al cargar datos del cliente:', err);
        });
    }, [watch('customer')]);




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


    const handleCreate = async (formData) => {
        const toastId = toast.loading('Creando pedido...', getToastTheme());

        try {
            const payload = {
                customer: parseInt(formData.customer),
                entryDate: formData.entryDate,
                loadDate: formData.loadDate,
                salesperson: formData.salesperson ? parseInt(formData.salesperson) : null,
                payment: formData.payment ? parseInt(formData.payment) : null,
                incoterm: formData.incoterm ? parseInt(formData.incoterm) : null,
                buyerReference: formData.buyerReference || null,
                transport: formData.transport ? parseInt(formData.transport) : null,
                truckPlate: formData.truckPlate || null,
                trailerPlate: formData.trailerPlate || null,
                temperature: formData.temperature || null,
                billingAddress: formData.billingAddress || null,
                shippingAddress: formData.shippingAddress || null,
                transportationNotes: formData.transportationNotes || null,
                productionNotes: formData.productionNotes || null,
                accountingNotes: formData.accountingNotes || null,
                emails: formData.emails || [],
                ccEmails: formData.ccEmails || [],
                plannedProducts: formData.plannedProducts.map((line) => ({
                    product: parseInt(line.product),
                    quantity: parseFloat(line.quantity),
                    boxes: parseInt(line.boxes),
                    unitPrice: parseFloat(line.unitPrice),
                    tax: parseInt(line.tax),
                })),
            };

            const res = await fetch(`${API_URL_V2}orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Error al crear el pedido');
            }

            const data = await res.json();

            toast.success('Pedido creado correctamente', { id: toastId });

            // Aquí podrías redirigir o limpiar el formulario
            // reset(); // si quieres resetear
            onCreate(data.data.id);

        } catch (error) {
            console.error('Error al crear el pedido:', error);
            toast.error(error.message || 'Error desconocido', { id: toastId });
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
            case 'emailList':
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        defaultValue={[]}
                        rules={field.rules}
                        render={({ field: { value, onChange } }) => (
                            <EmailListInput
                                /* value={value} */
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
        <div className="w-full h-full p-6">
            <h1 className="text-2xl font-semibold mb-4">Crear nuevo pedido</h1>
            {loading ? (
                <div className='w-full h-full flex items-center justify-center'>
                    <Loader />
                </div>
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
                                <div key={item.id} className="flex items-center justify-center gap-2 ">
                                    <Controller
                                        control={control}
                                        name={`plannedProducts.${index}.product`}
                                        render={({ field: { onChange, value } }) => (
                                            <Combobox
                                                options={productOptions}
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Selecciona un producto"
                                            />
                                        )}
                                    />
                                    {/* <Input {...register(`plannedProducts.${index}.product`)} placeholder="Producto" /> */}
                                    <Input type="number" step="any" {...register(`plannedProducts.${index}.quantity`)} placeholder="Cantidad" />
                                    <Input type="number" step="any" {...register(`plannedProducts.${index}.boxes`)} placeholder="Cajas" />
                                    <Input type="number" step="any" {...register(`plannedProducts.${index}.unitPrice`)} placeholder="Precio" />

                                    <Controller
                                        control={control}
                                        name={`plannedProducts.${index}.tax`}
                                        render={({ field: { onChange, value } }) => (
                                            <Select value={value} onValueChange={onChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="iva" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {taxOptions.map((tax) => (
                                                        <SelectItem key={tax.value} value={tax.value}>
                                                            {tax.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {/* <Input {...register(`plannedProducts.${index}.tax`)} placeholder="IVA" /> */}
                                    <Button type="button" variant="outline" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 " />
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
