// components/CreateOrderForm.jsx
'use client'

// Importaciones existentes (mantenerlas o refactorizar si es necesario)
import React, { useEffect, useCallback, useRef } from 'react'; // Añadido useCallback y useRef
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { PlusCircle, Trash2, ArrowLeft, Plus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useOrderCreateFormConfig } from '@/hooks/useOrderCreateFormConfig'; // Hook personalizado
import { useSession } from 'next-auth/react';
import { getCustomer } from '@/services/customerService'; // Ya externalizado
import { useProductOptions } from '@/hooks/useProductOptions'; // Hook personalizado
import { useTaxOptions } from '@/hooks/useTaxOptions'; // Hook personalizado
import Loader from '@/components/Utilities/Loader';
import { getToastTheme } from '@/customs/reactHotToast';
import toast from 'react-hot-toast';

import EmailListInput from '@/components/ui/emailListInput';

// Importa el nuevo servicio para la creación de pedidos
import { createOrder } from '@/services/orderService';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/datePicker';
import { format } from "date-fns"
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import CreateOrderFormMobile from './CreateOrderFormMobile';

const CreateOrderForm = ({ onCreate, onClose }) => {
    const { productOptions, loading: productsLoading } = useProductOptions();
    const { taxOptions, loading: taxLoading } = useTaxOptions();
    const isMobile = useIsMobile();
    const router = useRouter();
    const { data: session } = useSession();
    // Ya no necesitamos 'token' directamente aquí para 'createOrder',
    // porque el servicio lo obtiene con getSession().
    // const token = session?.user?.accessToken;

    const { defaultValues, formGroups, loading: formConfigLoading, handleGetCustomer } = useOrderCreateFormConfig(); // Asumiendo que handleGetCustomer no hace llamadas directas a fetchWithTenant aquí
    const loading = formConfigLoading || productsLoading;

    // Ref para rastrear si el formulario ya fue inicializado
    const isInitializedRef = useRef(false);
    // Ref para rastrear el último customer seleccionado y evitar llamadas duplicadas
    const lastCustomerIdRef = useRef(null);

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting, isValid }, // Añadido isSubmitting e isValid para controlar el estado del botón
        watch,
        setValue
    } = useForm({
        defaultValues: {
            ...defaultValues,
            plannedProducts: [],
        },
        mode: 'onChange',
    });

    // Watch del customer para el efecto de carga de datos
    const selectedCustomerId = watch('customer');

    // Efecto para cargar datos del cliente cuando cambia el cliente seleccionado
    useEffect(() => {
        if (!selectedCustomerId || selectedCustomerId === lastCustomerIdRef.current) return;
        
        lastCustomerIdRef.current = selectedCustomerId;

        // Asegúrate de que 'getCustomer' en services/customerService.js obtenga el token internamente
        // o que tu hook useOrderCreateFormConfig ya lo maneje si 'handleGetCustomer' lo llama.
        // Si 'getCustomer' necesita el token explícitamente, pásalo como argumento.
        // Por la forma en que lo tienes ahora, parece que 'getCustomer' no necesita el token directamente.
        getCustomer(selectedCustomerId, session?.user?.accessToken) // Pasa el token si getCustomer lo espera
            .then((customer) => {
                setValue('salesperson', customer.salesperson?.id?.toString() || '');
                setValue('payment', customer.paymentTerm?.id?.toString() || '');
                setValue('incoterm', customer.incoterm?.id?.toString() || '');
                setValue('billingAddress', customer.billingAddress || '');
                setValue('shippingAddress', customer.shippingAddress || '');
                setValue('transportationNotes', customer.transportationNotes || '');
                setValue('productionNotes', customer.productionNotes || '');
                setValue('accountingNotes', customer.accountingNotes || '');
                setValue('transport', customer.transport?.id?.toString() || '');
                setValue('emails', customer.emails || []);
                setValue('ccEmails', customer.ccEmails || []);
            })
            .catch((err) => {
                console.error('Error al cargar datos del cliente:', err);
                toast.error('Error al cargar la información del cliente. Intente de nuevo.', getToastTheme());
            });
    }, [selectedCustomerId, setValue, session]); // Usar selectedCustomerId directamente en lugar de watch('customer')

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'plannedProducts',
    });

    // Efecto para inicializar el formulario solo cuando loading cambia de true a false por primera vez
    useEffect(() => {
        // Solo resetear cuando loading termine por primera vez y el formulario no haya sido inicializado
        if (!loading && !isInitializedRef.current && defaultValues) {
            reset({
                ...defaultValues,
                plannedProducts: [],
            });
            isInitializedRef.current = true;
        }
    }, [loading, defaultValues, reset]); // Solo resetear cuando loading cambia

    // Función de manejo de creación de pedido, ahora usando el servicio
    const handleCreate = async (formData) => {
        const toastId = toast.loading('Creando pedido...', getToastTheme());

        try {
            // Prepara el payload tal como lo hacías
            const payload = {
                customer: parseInt(formData.customer),
                entryDate: formData.entryDate ? format(formData.entryDate, 'yyyy-MM-dd') : null,
                loadDate: formData.loadDate ? format(formData.loadDate, 'yyyy-MM-dd') : null,
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

            // Llama al servicio `createOrder`
            const newOrderData = await createOrder(payload);

            toast.success('Pedido creado correctamente', { id: toastId });
            // Resetea el formulario después de una creación exitosa
            reset({
                ...defaultValues,
                plannedProducts: [],
            });
            // Resetear referencias para permitir que se carguen los datos del cliente de nuevo si se selecciona
            lastCustomerIdRef.current = null;
            onCreate(newOrderData.id, newOrderData); // Pasa también el objeto completo del pedido creado

        } catch (error) {
            console.error('Error al crear el pedido:', error);
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error desconocido al crear el pedido';
            toast.error(errorMessage, { id: toastId });
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
                                date={value}
                                onChange={onChange}
                                onBlur={onBlur}
                                formatStyle="short"
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
                                loading={loading}
                            />
                        )}
                    />
                );
            case 'Textarea':
                return <Textarea {...commonProps} className={`${isMobile ? 'text-base min-h-[100px]' : ''} ${field.props?.className || ''}`} rows={field.props?.rows} />;
            case 'emailList':
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        defaultValue={[]}
                        rules={field.rules}
                        render={({ field: { value, onChange } }) => (
                            <EmailListInput
                                value={Array.isArray(value) ? value : []} // Asegura que 'value' es un array
                                onChange={onChange}
                                placeholder={field.props?.placeholder}
                            />
                        )}
                    />
                );
            case 'Input':
            default:
                return <Input {...commonProps} className={isMobile ? `h-12 text-base ${commonProps.className || ''}` : commonProps.className} />;
        }
    };

    // Si es mobile, usar el componente con stepper
    if (isMobile) {
        return (
            <CreateOrderFormMobile
                formGroups={formGroups}
                fields={fields}
                register={register}
                control={control}
                errors={errors}
                handleSubmit={handleSubmit}
                handleCreate={handleCreate}
                isSubmitting={isSubmitting}
                isValid={isValid}
                renderField={renderField}
                productOptions={productOptions}
                productsLoading={productsLoading}
                taxOptions={taxOptions}
                taxLoading={taxLoading}
                append={append}
                remove={remove}
                onClose={onClose}
                loading={loading}
            />
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className={`bg-background flex-shrink-0 ${isMobile ? 'px-0 pt-8 pb-3' : 'pt-4 sm:pt-5 px-4 sm:px-7 pb-3'}`}>
                <div className="w-full flex flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg sm:text-xl font-semibold dark:text-white">
                            Crear nuevo pedido
                        </h2>
                    </div>
                </div>
            </div>
            {/* Form content */}
            <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-4 pt-6 pb-0' : 'px-4 sm:px-7 pt-4'}`}>
            {loading ? (
                <div className='w-full h-full flex items-center justify-center'>
                    <Loader />
                </div>
            ) : (
                <form onSubmit={handleSubmit(
                    handleCreate,
                    (formErrors) => {
                        // Mostrar toast cuando hay errores de validación
                        const errorCount = Object.keys(formErrors).length;
                        toast.error(
                            errorCount > 1 
                                ? `Por favor, corrige los ${errorCount} errores en el formulario` 
                                : 'Por favor, corrige el error en el formulario',
                            getToastTheme()
                        );
                    }
                )} className={`flex flex-col ${isMobile ? 'gap-6' : 'gap-8'}`}>
                    {formGroups.map((group) => (
                        <div key={group.group} className="w-full">
                            <h3 className={`font-medium text-muted-foreground ${isMobile ? 'text-base mb-3' : 'text-sm my-2'}`}>{group.group}</h3>
                            <Separator className={isMobile ? 'mb-4' : 'my-2'} />
                            <div className={`grid w-full ${isMobile ? 'grid-cols-1 gap-4' : group.grid || 'grid-cols-1 gap-4'}`}>
                                {group.fields.map((field) => (
                                    <div key={field.name} className={`grid gap-2 w-full ${field.colSpan || ''}`}>
                                        <Label htmlFor={field.name} className={isMobile ? 'text-sm' : ''}>{field.label}</Label>
                                        {renderField(field)}
                                        {errors[field.name] && (
                                            <p className={`text-red-500 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                                                {errors[field.name].message}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="w-full">
                        <h3 className={`font-medium text-muted-foreground ${isMobile ? 'text-base mb-3' : 'text-sm my-2'}`}>Productos previstos</h3>
                        <Separator className={isMobile ? 'mb-4' : 'my-2'} />
                        <div className={`flex flex-col ${isMobile ? 'gap-4' : 'gap-4'}`}>
                            {fields.map((item, index) => (
                                <div key={item.id} className={`${isMobile ? 'flex flex-col gap-3' : 'flex items-center justify-center gap-2'}`}>
                                    <Controller
                                        control={control}
                                        name={`plannedProducts.${index}.product`}
                                        rules={{ required: 'Producto es requerido' }}
                                        render={({ field: { onChange, value } }) => (
                                            <Combobox
                                                options={productOptions}
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Selecciona un producto"
                                                loading={productsLoading}
                                            />
                                        )}
                                    />
                                    <Input
                                        type="number"
                                        step="any"
                                        {...register(`plannedProducts.${index}.quantity`, {
                                            required: 'Cantidad es requerida',
                                            valueAsNumber: true,
                                            min: { value: 0.01, message: 'Cantidad debe ser mayor que 0' }
                                        })}
                                        placeholder="Cantidad"
                                        className={isMobile ? 'h-12 text-base' : ''}
                                    />
                                    <Input
                                        type="number"
                                        step="any"
                                        {...register(`plannedProducts.${index}.boxes`, {
                                            required: 'Cajas son requeridas',
                                            valueAsNumber: true,
                                            min: { value: 1, message: 'Cajas debe ser al menos 1' }
                                        })}
                                        placeholder="Cajas"
                                        className={isMobile ? 'h-12 text-base' : ''}
                                    />
                                    <Input
                                        type="number"
                                        step="any"
                                        {...register(`plannedProducts.${index}.unitPrice`, {
                                            required: 'Precio unitario es requerido',
                                            valueAsNumber: true,
                                            min: { value: 0.01, message: 'Precio debe ser mayor que 0' }
                                        })}
                                        placeholder="Precio"
                                        className={isMobile ? 'h-12 text-base' : ''}
                                    />
                                    <Controller
                                        control={control}
                                        name={`plannedProducts.${index}.tax`}
                                        rules={{ required: 'IVA es requerido' }}
                                        render={({ field: { onChange, value } }) => (
                                            <Select value={value} onValueChange={onChange}>
                                                <SelectTrigger loading={taxLoading} className={isMobile ? 'h-12 text-base' : ''}>
                                                    <SelectValue placeholder="IVA" loading={taxLoading} />
                                                </SelectTrigger>
                                                <SelectContent loading={taxLoading}>
                                                    {taxOptions.map((tax) => (
                                                        <SelectItem key={tax.value} value={tax.value}>
                                                            {tax.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => remove(index)}
                                        className={isMobile ? 'h-12 w-full' : ''}
                                    >
                                        <Trash2 className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                                        {isMobile && <span className="ml-2">Eliminar</span>}
                                    </Button>
                                    {/* Muestra errores para campos de productos planificados */}
                                    {errors.plannedProducts?.[index]?.product && <p className="text-red-500 text-sm col-span-full">{errors.plannedProducts[index].product.message}</p>}
                                    {errors.plannedProducts?.[index]?.quantity && <p className="text-red-500 text-sm col-span-full">{errors.plannedProducts[index].quantity.message}</p>}
                                    {errors.plannedProducts?.[index]?.boxes && <p className="text-red-500 text-sm col-span-full">{errors.plannedProducts[index].boxes.message}</p>}
                                    {errors.plannedProducts?.[index]?.unitPrice && <p className="text-red-500 text-sm col-span-full">{errors.plannedProducts[index].unitPrice.message}</p>}
                                    {errors.plannedProducts?.[index]?.tax && <p className="text-red-500 text-sm col-span-full">{errors.plannedProducts[index].tax.message}</p>}
                                </div>
                            ))}
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => append({ product: '', quantity: '', boxes: '', unitPrice: '', tax: '' })}
                                className={isMobile ? 'h-12 text-base w-full' : ''}
                            >
                                <PlusCircle className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} /> Añadir producto
                            </Button>
                        </div>
                    </div>

                    {/* Botón de guardar - sticky en mobile */}
                    <div className={`flex justify-end gap-4 ${isMobile ? 'sticky bottom-0 bg-background pt-4 pb-4 border-t mt-6 -mx-4 px-4' : 'pt-4'}`}>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting || !isValid || fields.length === 0}
                            className={isMobile ? 'h-12 text-base w-full' : ''}
                        >
                            <Plus className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
                            {isSubmitting ? 'Creando...' : 'Crear Pedido'}
                        </Button>
                    </div>
                </form>
            )}
            </div>
        </div>
    );
};

export default CreateOrderForm;