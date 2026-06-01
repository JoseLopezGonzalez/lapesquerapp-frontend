'use client';

import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { PlusCircle, Trash2, ArrowLeft, Plus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useOrderCreateFormConfig } from '@/hooks/useOrderCreateFormConfig';
import { useSession } from 'next-auth/react';
import { getCustomer } from '@/services/customerService';
import { useProductOptions } from '@/hooks/useProductOptions';
import { useTaxOptions } from '@/hooks/useTaxOptions';
import Loader from '@/components/Utilities/Loader';
import EmailListInput from '@/components/ui/emailListInput';
import { createOrder } from '@/services/orderService';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/datePicker';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import CreateOrderFormMobile from './CreateOrderFormMobile';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';
import { zodResolver } from '@hookform/resolvers/zod';
import { notify } from '@/lib/notifications';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { orderCreateSchema } from './schemas/orderCreateSchema';

function getRelatedId(source, ...candidates) {
  for (const candidate of candidates) {
    if (candidate == null) continue;

    if (typeof candidate === 'object' && 'id' in candidate && candidate.id != null) {
      return String(candidate.id);
    }

    if ((typeof candidate === 'string' || typeof candidate === 'number') && candidate !== '') {
      return String(candidate);
    }
  }

  return '';
}

function getTextValue(...candidates) {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }
  }

  return '';
}

const CreateOrderForm = ({ onCreate, onClose, initialPrefill = null }) => {
  const { productOptions, loading: productsLoading } = useProductOptions();
  const { taxOptions, loading: taxLoading } = useTaxOptions();
  const isMobile = useIsMobile();
  const router = useRouter();
  const { data: session } = useSession();

  const { defaultValues, formGroups, loading: formConfigLoading } = useOrderCreateFormConfig();
  const loading = formConfigLoading || productsLoading || taxLoading;

  const isInitializedRef = useRef(false);
  const appliedPrefillSignatureRef = useRef(null);
  const lastCustomerIdRef = useRef(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting, isValid },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(orderCreateSchema),
    defaultValues: {
      ...defaultValues,
      plannedProducts: [],
    },
    mode: 'onChange',
  });
  const submitDisabled = isSubmitting || loading || !isValid;

  const selectedCustomerId = watch('customer');

  useEffect(() => {
    if (!selectedCustomerId || selectedCustomerId === lastCustomerIdRef.current) return;

    lastCustomerIdRef.current = selectedCustomerId;

    getCustomer(selectedCustomerId, session?.user?.accessToken)
      .then((customer) => {
        setValue(
          'salesperson',
          getRelatedId(
            customer,
            customer.salesperson,
            customer.salespersonId,
            customer.salesperson_id
          )
        );
        setValue(
          'fieldOperator',
          getRelatedId(
            customer,
            customer.fieldOperator,
            customer.fieldOperatorId,
            customer.field_operator_id
          )
        );
        setValue(
          'payment',
          getRelatedId(
            customer,
            customer.paymentTerm,
            customer.paymentTermId,
            customer.payment_term_id
          )
        );
        setValue(
          'incoterm',
          getRelatedId(customer, customer.incoterm, customer.incotermId, customer.incoterm_id)
        );
        setValue('billingAddress', getTextValue(customer.billingAddress, customer.billing_address));
        setValue(
          'shippingAddress',
          getTextValue(customer.shippingAddress, customer.shipping_address)
        );
        setValue(
          'transportationNotes',
          getTextValue(customer.transportationNotes, customer.transportation_notes)
        );
        setValue(
          'productionNotes',
          getTextValue(customer.productionNotes, customer.production_notes)
        );
        setValue(
          'accountingNotes',
          getTextValue(customer.accountingNotes, customer.accounting_notes)
        );
        setValue(
          'transport',
          getRelatedId(customer, customer.transport, customer.transportId, customer.transport_id)
        );
        setValue('emails', customer.emails || []);
        setValue('ccEmails', customer.ccEmails || customer.cc_emails || []);
      })
      .catch((err) => {
        console.error('Error al cargar datos del cliente:', err);
        notify.error({
          title: 'Error al cargar datos del cliente',
          description: 'No se pudieron cargar los datos. Intente de nuevo.',
        });
      });
  }, [selectedCustomerId, setValue, session]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'plannedProducts',
  });

  const prefilledPlannedProducts = useMemo(() => {
    if (!initialPrefill || !Array.isArray(initialPrefill.plannedProducts)) {
      return [];
    }

    return initialPrefill.plannedProducts
      .filter((line) => line?.product != null && line?.product !== '')
      .map((line) => ({
        product: String(line.product),
        quantity: line.quantity != null ? String(line.quantity) : '',
        boxes: line.boxes != null ? String(line.boxes) : '',
        unitPrice: line.unitPrice != null ? String(line.unitPrice) : '',
        tax: line.tax != null ? String(line.tax) : '',
      }));
  }, [initialPrefill]);

  const prefillSignature = useMemo(() => {
    if (!initialPrefill) return null;
    if (prefilledPlannedProducts.length === 0) return null;
    return JSON.stringify(prefilledPlannedProducts);
  }, [initialPrefill, prefilledPlannedProducts]);

  useEffect(() => {
    if (!loading && !isInitializedRef.current && defaultValues) {
      reset({
        ...defaultValues,
        plannedProducts: prefilledPlannedProducts,
      });
      appliedPrefillSignatureRef.current = prefillSignature;
      isInitializedRef.current = true;
    }
  }, [loading, defaultValues, reset, prefilledPlannedProducts, prefillSignature]);

  useEffect(() => {
    if (loading || !isInitializedRef.current || !prefillSignature) return;
    if (appliedPrefillSignatureRef.current === prefillSignature) return;

    reset({
      ...defaultValues,
      plannedProducts: prefilledPlannedProducts,
    });
    appliedPrefillSignatureRef.current = prefillSignature;
    lastCustomerIdRef.current = null;
  }, [loading, prefillSignature, defaultValues, prefilledPlannedProducts, reset]);

  const handleCreate = async (formData) => {
    const payload = {
      customer: parseInt(formData.customer),
      entryDate: formData.entryDate ? format(formData.entryDate, 'yyyy-MM-dd') : null,
      loadDate: formData.loadDate ? format(formData.loadDate, 'yyyy-MM-dd') : null,
      salesperson: formData.salesperson ? parseInt(formData.salesperson) : null,
      fieldOperator: formData.fieldOperator ? parseInt(formData.fieldOperator) : null,
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

    try {
      const newOrderData = await notify.promise(createOrder(payload), {
        loading: { title: 'Creando pedido...' },
        success: {
          title: 'Pedido creado',
          description: 'El pedido se ha creado correctamente.',
        },
        error: (error) => {
          const description =
            error?.message ||
            (error?.data && getErrorMessage(error.data)) ||
            'Error desconocido al crear el pedido';
          return {
            title: 'Error al crear el pedido',
            description,
          };
        },
      });
      reset({
        ...defaultValues,
        plannedProducts: [],
      });
      lastCustomerIdRef.current = null;
      onCreate(newOrderData.id, newOrderData);
    } catch (error) {
      console.error('Error al crear el pedido:', error);
      if (error?.status === 422 && error?.data?.errors) {
        setErrorsFrom422(setError, error.data.errors);
      }
    }
  };

  const renderField = (field) => {
    const commonProps = {
      id: field.name,
      placeholder: field.props?.placeholder || '',
      ...register(field.name),
    };

    switch (field.component) {
      case 'DatePicker':
        return (
          <Controller
            name={field.name}
            control={control}
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
            render={({ field: { onChange, value, onBlur } }) => (
              <Select value={value} onValueChange={onChange} onBlur={onBlur}>
                <SelectTrigger className="w-full overflow-hidden" loading={loading}>
                  <div className="w-full truncate overflow-hidden text-start">
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
        return (
          <Textarea
            {...commonProps}
            className={`${isMobile ? 'min-h-[100px] text-base' : ''} ${field.props?.className || ''}`}
            rows={field.props?.rows}
          />
        );
      case 'emailList':
        return (
          <Controller
            name={field.name}
            control={control}
            defaultValue={[]}
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
        return (
          <Input
            {...commonProps}
            className={
              isMobile ? `h-12 text-base ${commonProps.className || ''}` : commonProps.className
            }
          />
        );
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
        submitDisabled={submitDisabled}
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
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div
        className={`bg-background flex-shrink-0 ${isMobile ? 'px-0 pt-8 pb-3' : 'px-4 pt-4 pb-3 sm:px-7 sm:pt-5'}`}
      >
        <div className="flex w-full flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold sm:text-xl dark:text-white">Crear nuevo pedido</h2>
          </div>
        </div>
      </div>
      {/* Form content */}
      <div
        className={`flex-1 overflow-y-auto ${isMobile ? 'px-4 pt-6 pb-0' : 'px-4 pt-4 sm:px-7'}`}
      >
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(handleCreate, (formErrors) => {
              // Mostrar toast cuando hay errores de validación
              const errorCount = Object.keys(formErrors).length;
              notify.error({
                title: 'Errores en el formulario',
                description:
                  errorCount > 1
                    ? `Por favor, corrige los ${errorCount} errores en el formulario.`
                    : 'Por favor, corrige el error en el formulario.',
              });
            })}
            className={`flex flex-col ${isMobile ? 'gap-6' : 'gap-8'}`}
          >
            {formGroups.map((group) => (
              <div key={group.group} className="w-full">
                <h3
                  className={`text-muted-foreground font-medium ${isMobile ? 'mb-3 text-base' : 'my-2 text-sm'}`}
                >
                  {group.group}
                </h3>
                <Separator className={isMobile ? 'mb-4' : 'my-2'} />
                <div
                  className={`grid w-full ${isMobile ? 'grid-cols-1 gap-4' : group.grid || 'grid-cols-1 gap-4'}`}
                >
                  {group.fields.map((field) => (
                    <div key={field.name} className={`grid w-full gap-2 ${field.colSpan || ''}`}>
                      <Label htmlFor={field.name} className={isMobile ? 'text-sm' : ''}>
                        {field.label}
                      </Label>
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
              <h3
                className={`text-muted-foreground font-medium ${isMobile ? 'mb-3 text-base' : 'my-2 text-sm'}`}
              >
                Productos previstos
              </h3>
              <Separator className={isMobile ? 'mb-4' : 'my-2'} />
              <div className={`flex flex-col ${isMobile ? 'gap-4' : 'gap-4'}`}>
                {fields.map((item, index) => (
                  <div
                    key={item.id}
                    className={`${isMobile ? 'flex flex-col gap-3' : 'flex items-center justify-center gap-2'}`}
                  >
                    <div className={!isMobile ? 'min-w-[500px] flex-1 shrink-0' : undefined}>
                      <Controller
                        control={control}
                        name={`plannedProducts.${index}.product`}
                        render={({ field: { onChange, value } }) => (
                          <Combobox
                            options={productOptions}
                            value={value}
                            onChange={onChange}
                            placeholder="Selecciona un producto"
                            searchPlaceholder="Buscar producto..."
                            notFoundMessage="No se encontraron productos"
                            loading={productsLoading}
                          />
                        )}
                      />
                    </div>
                    <Input
                      type="number"
                      step="any"
                      {...register(`plannedProducts.${index}.quantity`, { valueAsNumber: true })}
                      placeholder="Cantidad"
                      className={isMobile ? 'h-12 text-base' : ''}
                    />
                    <Input
                      type="number"
                      step="any"
                      {...register(`plannedProducts.${index}.boxes`, { valueAsNumber: true })}
                      placeholder="Cajas"
                      className={isMobile ? 'h-12 text-base' : ''}
                    />
                    <Input
                      type="number"
                      step="any"
                      {...register(`plannedProducts.${index}.unitPrice`, { valueAsNumber: true })}
                      placeholder="Precio"
                      className={isMobile ? 'h-12 text-base' : ''}
                    />
                    <Controller
                      control={control}
                      name={`plannedProducts.${index}.tax`}
                      render={({ field }) => {
                        const currentValue = field.value ? String(field.value) : '';

                        const handleValueChange = (newValue) => {
                          // Convertir a número si las opciones usan números
                          const taxOption = taxOptions.find(
                            (t) => String(t.value) === String(newValue)
                          );
                          const finalValue = taxOption ? taxOption.value : newValue;
                          field.onChange(finalValue);
                        };

                        return (
                          <Select value={currentValue} onValueChange={handleValueChange}>
                            <SelectTrigger
                              loading={taxLoading}
                              className={isMobile ? 'h-12 text-base' : ''}
                            >
                              <SelectValue placeholder="IVA" loading={taxLoading} />
                            </SelectTrigger>
                            <SelectContent loading={taxLoading}>
                              {taxOptions.map((tax) => (
                                <SelectItem key={tax.value} value={String(tax.value)}>
                                  {tax.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      }}
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
                    {errors.plannedProducts?.[index]?.product && (
                      <p className="col-span-full text-sm text-red-500">
                        {errors.plannedProducts[index].product.message}
                      </p>
                    )}
                    {errors.plannedProducts?.[index]?.quantity && (
                      <p className="col-span-full text-sm text-red-500">
                        {errors.plannedProducts[index].quantity.message}
                      </p>
                    )}
                    {errors.plannedProducts?.[index]?.boxes && (
                      <p className="col-span-full text-sm text-red-500">
                        {errors.plannedProducts[index].boxes.message}
                      </p>
                    )}
                    {errors.plannedProducts?.[index]?.unitPrice && (
                      <p className="col-span-full text-sm text-red-500">
                        {errors.plannedProducts[index].unitPrice.message}
                      </p>
                    )}
                    {errors.plannedProducts?.[index]?.tax && (
                      <p className="col-span-full text-sm text-red-500">
                        {errors.plannedProducts[index].tax.message}
                      </p>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({ product: '', quantity: '', boxes: '', unitPrice: '', tax: '' })
                  }
                  className={isMobile ? 'h-12 w-full text-base' : ''}
                >
                  <PlusCircle className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} /> Añadir
                  producto
                </Button>
              </div>
            </div>

            {/* Botón de guardar - sticky en mobile */}
            <div
              className={`flex justify-end gap-4 ${isMobile ? 'bg-background sticky bottom-0 -mx-4 mt-6 border-t px-4 pt-4 pb-4' : 'pt-4'}`}
            >
              <Button
                type="submit"
                disabled={submitDisabled}
                className={isMobile ? 'h-12 w-full text-base' : ''}
                title={
                  submitDisabled && !isSubmitting
                    ? 'Completa el formulario y espera a que carguen las opciones antes de guardar.'
                    : undefined
                }
                aria-label={
                  submitDisabled && !isSubmitting
                    ? 'Crear pedido no disponible hasta completar el formulario y cargar las opciones'
                    : undefined
                }
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
