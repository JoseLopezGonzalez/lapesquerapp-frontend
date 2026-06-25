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
import { PlusCircle, Trash2, Plus } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import CreateOrderFormMobile from './CreateOrderFormMobile';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';
import { zodResolver } from '@hookform/resolvers/zod';
import { notify } from '@/lib/notifications';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { orderCreateSchema, type OrderCreateFormData } from './schemas/orderCreateSchema';

interface FormFieldOption {
  value: string;
  label: string;
}

interface FormFieldProps {
  placeholder?: string;
  searchPlaceholder?: string;
  notFoundMessage?: string;
  className?: string;
  rows?: number;
}

interface FormField {
  name: string;
  label: string;
  component: string;
  rules?: Record<string, unknown>;
  options?: FormFieldOption[];
  colSpan?: string;
  props?: FormFieldProps;
}

interface FormGroup {
  group: string;
  grid?: string;
  fields: FormField[];
}

interface PrefillLine {
  product?: string | number | null;
  quantity?: string | number | null;
  boxes?: string | number | null;
  unitPrice?: string | number | null;
  tax?: string | number | null;
}

interface InitialPrefill {
  plannedProducts?: PrefillLine[];
}

interface CreateOrderFormProps {
  onCreate: (orderId: number | string, orderData: unknown) => void;
  onClose?: () => void;
  initialPrefill?: InitialPrefill | null;
}

interface CustomerData {
  salesperson?: { id?: number | string } | null;
  salespersonId?: number | string | null;
  salesperson_id?: number | string | null;
  fieldOperator?: { id?: number | string } | null;
  fieldOperatorId?: number | string | null;
  field_operator_id?: number | string | null;
  paymentTerm?: { id?: number | string } | null;
  paymentTermId?: number | string | null;
  payment_term_id?: number | string | null;
  incoterm?: { id?: number | string } | null;
  incotermId?: number | string | null;
  incoterm_id?: number | string | null;
  transport?: { id?: number | string } | null;
  transportId?: number | string | null;
  transport_id?: number | string | null;
  billingAddress?: string | null;
  billing_address?: string | null;
  shippingAddress?: string | null;
  shipping_address?: string | null;
  transportationNotes?: string | null;
  transportation_notes?: string | null;
  productionNotes?: string | null;
  production_notes?: string | null;
  accountingNotes?: string | null;
  accounting_notes?: string | null;
  emails?: string[];
  ccEmails?: string[];
  cc_emails?: string[];
  [key: string]: unknown;
}

function getRelatedId(_source: unknown, ...candidates: unknown[]): string {
  for (const candidate of candidates) {
    if (candidate == null) continue;

    if (typeof candidate === 'object' && candidate !== null && 'id' in candidate) {
      const id = (candidate as { id?: number | string | null }).id;
      if (id != null) return String(id);
    }

    if ((typeof candidate === 'string' || typeof candidate === 'number') && candidate !== '') {
      return String(candidate);
    }
  }

  return '';
}

function getTextValue(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }
  }

  return '';
}

const CreateOrderForm = ({ onCreate, onClose, initialPrefill = null }: CreateOrderFormProps) => {
  const { productOptions, loading: productsLoading } = useProductOptions();
  const { taxOptions, loading: taxLoading } = useTaxOptions();
  const isMobile = useIsMobile();
  const { data: session } = useSession();

  const { defaultValues, formGroups, loading: formConfigLoading } = useOrderCreateFormConfig();
  const loading = formConfigLoading || productsLoading || taxLoading;

  const isInitializedRef = useRef(false);
  const appliedPrefillSignatureRef = useRef<string | null>(null);
  const lastCustomerIdRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting, isValid },
    watch,
    setValue,
  } = useForm<OrderCreateFormData>({
    resolver: zodResolver(orderCreateSchema),
    defaultValues: {
      ...defaultValues,
      plannedProducts: [],
    } as OrderCreateFormData,
    mode: 'onChange',
  });
  const submitDisabled = isSubmitting || loading || !isValid;

  const selectedCustomerId = watch('customer') ?? '';

  useEffect(() => {
    if (!selectedCustomerId) return;
    if (selectedCustomerId === lastCustomerIdRef.current) return;

    lastCustomerIdRef.current = selectedCustomerId;

    getCustomer(selectedCustomerId, (session?.user as { accessToken?: string })?.accessToken)
      .then((customer: CustomerData) => {
        setValue('salesperson', getRelatedId(customer, customer.salesperson, customer.salespersonId, customer.salesperson_id));
        setValue('fieldOperator', getRelatedId(customer, customer.fieldOperator, customer.fieldOperatorId, customer.field_operator_id));
        setValue('payment', getRelatedId(customer, customer.paymentTerm, customer.paymentTermId, customer.payment_term_id));
        setValue('incoterm', getRelatedId(customer, customer.incoterm, customer.incotermId, customer.incoterm_id));
        setValue('billingAddress', getTextValue(customer.billingAddress, customer.billing_address));
        setValue('shippingAddress', getTextValue(customer.shippingAddress, customer.shipping_address));
        setValue('transportationNotes', getTextValue(customer.transportationNotes, customer.transportation_notes));
        setValue('productionNotes', getTextValue(customer.productionNotes, customer.production_notes));
        setValue('accountingNotes', getTextValue(customer.accountingNotes, customer.accounting_notes));
        setValue('transport', getRelatedId(customer, customer.transport, customer.transportId, customer.transport_id));
        setValue('emails', customer.emails || []);
        setValue('ccEmails', customer.ccEmails || customer.cc_emails || []);
      })
      .catch((err: unknown) => {
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
      } as OrderCreateFormData);
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
    } as OrderCreateFormData);
    appliedPrefillSignatureRef.current = prefillSignature;
    lastCustomerIdRef.current = null;
  }, [loading, prefillSignature, defaultValues, prefilledPlannedProducts, reset]);

  const handleCreate = async (formData: OrderCreateFormData) => {
    const payload = {
      customer: parseInt(formData.customer),
      entryDate: formData.entryDate ? format(formData.entryDate, 'yyyy-MM-dd') : null,
      loadDate: formData.loadDate ? format(formData.loadDate, 'yyyy-MM-dd') : null,
      salesperson: formData.salesperson ? parseInt(formData.salesperson) : null,
      fieldOperator: formData.fieldOperator ? parseInt(formData.fieldOperator) : null,
      externalProcessor: formData.externalProcessor ? parseInt(formData.externalProcessor) : null,
      payment: formData.payment ? parseInt(formData.payment) : null,
      incoterm: formData.incoterm ? parseInt(formData.incoterm) : null,
      buyerReference: formData.buyerReference || null,
      transport: formData.transport ? parseInt(formData.transport) : null,
      truckPlate: formData.truckPlate || null,
      trailerPlate: formData.trailerPlate || null,
      billingAddress: formData.billingAddress || null,
      shippingAddress: formData.shippingAddress || null,
      transportationNotes: formData.transportationNotes || null,
      productionNotes: formData.productionNotes || null,
      accountingNotes: formData.accountingNotes || null,
      emails: formData.emails || [],
      ccEmails: formData.ccEmails || [],
      plannedProducts: formData.plannedProducts.map((line) => ({
        product: parseInt(String(line.product)),
        quantity: parseFloat(String(line.quantity)),
        boxes: parseInt(String(line.boxes)),
        unitPrice: parseFloat(String(line.unitPrice)),
        tax: parseInt(String(line.tax)),
      })),
    };

    try {
      const newOrderData = await notify.promise(createOrder(payload), {
        loading: { title: 'Creando pedido...' },
        success: {
          title: 'Pedido creado',
          description: 'El pedido se ha creado correctamente.',
        },
        error: (error: unknown) => {
          const err = error as { message?: string; data?: unknown };
          const description =
            err?.message ||
            (err?.data && getErrorMessage(err.data)) ||
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
      } as OrderCreateFormData);
      lastCustomerIdRef.current = null;
      onCreate(newOrderData.id, newOrderData);
    } catch (error) {
      console.error('Error al crear el pedido:', error);
      const err = error as { status?: number; data?: { errors?: Record<string, string[]> } };
      if (err?.status === 422 && err?.data?.errors) {
        setErrorsFrom422(setError, err.data.errors);
      }
    }
  };

  const renderField = useCallback(
    (field: FormField) => {
      const commonProps = {
        id: field.name,
        placeholder: field.props?.placeholder || '',
        ...register(field.name as keyof OrderCreateFormData),
      };

      switch (field.component) {
        case 'DatePicker':
          return (
            <Controller
              name={field.name as keyof OrderCreateFormData}
              control={control}
              render={({ field: { onChange, value, onBlur } }) => (
                <DatePicker
                  date={value as Date | undefined}
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
              name={field.name as keyof OrderCreateFormData}
              control={control}
              render={({ field: { onChange, value, onBlur } }) => (
                <Select value={value as string} onValueChange={onChange} onBlur={onBlur}>
                  <SelectTrigger className="w-full overflow-hidden" loading={loading}>
                    <div className="w-full truncate overflow-hidden text-start">
                      <SelectValue
                        placeholder={field.props?.placeholder}
                        loading={loading}
                        value={value as string}
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
              name={field.name as keyof OrderCreateFormData}
              control={control}
              render={({ field: { onChange, value, onBlur } }) => (
                <Combobox
                  options={field.options}
                  placeholder={field.props?.placeholder}
                  searchPlaceholder={field.props?.searchPlaceholder}
                  notFoundMessage={field.props?.notFoundMessage}
                  value={value as string}
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
              name={field.name as keyof OrderCreateFormData}
              control={control}
              defaultValue={[] as string[]}
              render={({ field: { value, onChange } }) => (
                <EmailListInput
                  value={Array.isArray(value) ? (value as string[]) : []}
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
    },
    [control, isMobile, loading, register]
  );

  if (isMobile) {
    return (
      <CreateOrderFormMobile
        formGroups={formGroups as FormGroup[]}
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
      <div className="bg-background flex-shrink-0 px-4 pt-4 pb-3 sm:px-7 sm:pt-5">
        <div className="flex w-full flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold sm:text-xl dark:text-white">Crear nuevo pedido</h2>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-4 sm:px-7">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(handleCreate, (formErrors) => {
              const errorCount = Object.keys(formErrors).length;
              notify.error({
                title: 'Errores en el formulario',
                description:
                  errorCount > 1
                    ? `Por favor, corrige los ${errorCount} errores en el formulario.`
                    : 'Por favor, corrige el error en el formulario.',
              });
            })}
            className="flex flex-col gap-8"
          >
            {(formGroups as FormGroup[]).map((group) => (
              <div key={group.group} className="w-full">
                <h3 className="text-muted-foreground my-2 text-sm font-medium">{group.group}</h3>
                <Separator className="my-2" />
                <div className={`grid w-full ${group.grid || 'grid-cols-1 gap-4'}`}>
                  {group.fields.map((field) => (
                    <div key={field.name} className={`grid w-full gap-2 ${field.colSpan || ''}`}>
                      <Label htmlFor={field.name}>{field.label}</Label>
                      {renderField(field)}
                      {errors[field.name as keyof typeof errors] && (
                        <p className="text-sm text-red-500">
                          {(errors[field.name as keyof typeof errors] as { message?: string })?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="w-full">
              <h3 className="text-muted-foreground my-2 text-sm font-medium">Productos previstos</h3>
              <Separator className="my-2" />
              <div className="flex flex-col gap-4">
                {fields.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-center gap-2">
                    <div className="min-w-[500px] flex-1 shrink-0">
                      <Controller
                        control={control}
                        name={`plannedProducts.${index}.product`}
                        render={({ field: { onChange, value } }) => (
                          <Combobox
                            options={productOptions}
                            value={String(value || '')}
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
                    />
                    <Input
                      type="number"
                      step="any"
                      {...register(`plannedProducts.${index}.boxes`, { valueAsNumber: true })}
                      placeholder="Cajas"
                    />
                    <Input
                      type="number"
                      step="any"
                      {...register(`plannedProducts.${index}.unitPrice`, { valueAsNumber: true })}
                      placeholder="Precio"
                    />
                    <Controller
                      control={control}
                      name={`plannedProducts.${index}.tax`}
                      render={({ field }) => {
                        const currentValue = field.value ? String(field.value) : '';
                        const handleValueChange = (newValue: string) => {
                          const taxOption = (taxOptions as Array<{ value: unknown }>).find(
                            (t) => String(t.value) === String(newValue)
                          );
                          const finalValue = taxOption ? taxOption.value : newValue;
                          field.onChange(finalValue);
                        };
                        return (
                          <Select value={currentValue} onValueChange={handleValueChange}>
                            <SelectTrigger loading={taxLoading}>
                              <SelectValue placeholder="IVA" loading={taxLoading} />
                            </SelectTrigger>
                            <SelectContent loading={taxLoading}>
                              {(taxOptions as Array<{ value: unknown; label: string }>).map((tax) => (
                                <SelectItem key={String(tax.value)} value={String(tax.value)}>
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
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {errors.plannedProducts?.[index]?.product && (
                      <p className="col-span-full text-sm text-red-500">
                        {errors.plannedProducts[index]?.product?.message}
                      </p>
                    )}
                    {errors.plannedProducts?.[index]?.quantity && (
                      <p className="col-span-full text-sm text-red-500">
                        {errors.plannedProducts[index]?.quantity?.message}
                      </p>
                    )}
                    {errors.plannedProducts?.[index]?.boxes && (
                      <p className="col-span-full text-sm text-red-500">
                        {errors.plannedProducts[index]?.boxes?.message}
                      </p>
                    )}
                    {errors.plannedProducts?.[index]?.unitPrice && (
                      <p className="col-span-full text-sm text-red-500">
                        {errors.plannedProducts[index]?.unitPrice?.message}
                      </p>
                    )}
                    {errors.plannedProducts?.[index]?.tax && (
                      <p className="col-span-full text-sm text-red-500">
                        {errors.plannedProducts[index]?.tax?.message}
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
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir producto
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="submit"
                disabled={submitDisabled}
                title={
                  submitDisabled && !isSubmitting
                    ? 'Completa el formulario y espera a que carguen las opciones antes de guardar.'
                    : undefined
                }
              >
                <Plus className="mr-2 h-4 w-4" />
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
