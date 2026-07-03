'use client';

import { useOrderFormOptions } from './useOrderFormOptions';
import { useMemo } from 'react';

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldProps {
  placeholder?: string;
  searchPlaceholder?: string;
  notFoundMessage?: string;
  className?: string;
  rows?: number;
}

export interface FormField {
  name: string;
  label: string;
  component: string;
  rules?: Record<string, unknown>;
  options?: FormFieldOption[];
  colSpan?: string;
  props?: FormFieldProps;
  description?: string;
}

export interface FormGroup {
  group: string;
  description?: string;
  grid: string;
  fields: FormField[];
}

interface OrderData {
  orderType?: string;
  order_type?: string;
  entryDate?: string | Date | null;
  loadDate?: string | Date | null;
  salesperson?: { id?: number | string } | null;
  fieldOperator?: { id?: number | string } | null;
  fieldOperatorId?: number | string | null;
  externalProcessor?: { id?: number | string; name?: string; isActive?: boolean } | null;
  externalProcessorId?: number | string | null;
  maquiladorDestination?: string | null;
  loadingAddress?: string | null;
  paymentTerm?: { id?: number | string } | null;
  incoterm?: { id?: number | string } | null;
  buyerReference?: string | null;
  transport?: { id?: number | string } | null;
  truckPlate?: string | null;
  trailerPlate?: string | null;
  transportationNotes?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  productionNotes?: string | null;
  accountingNotes?: string | null;
  transportNotes?: string | null;
  emails?: string[];
  ccEmails?: string[];
}

type RawOption = {
  value?: number | string | null;
  label?: string | null;
  id?: number | string | null;
  name?: string | null;
};

interface DefaultValues {
  orderType: string;
  entryDate: Date | null;
  loadDate: Date | null;
  salesperson: string;
  fieldOperator: string;
  externalProcessor: string;
  maquiladorDestination: string;
  loadingAddress: string;
  payment: string;
  incoterm: string;
  buyerReference: string;
  transport: string;
  truckPlate: string;
  trailerPlate: string;
  transportationNotes: string;
  billingAddress: string;
  shippingAddress: string;
  productionNotes: string;
  accountingNotes: string;
  transportNotes: string;
  emails: string[];
  ccEmails: string[];
}

const ORDER_TYPE_OPTIONS: FormFieldOption[] = [
  { value: 'standard', label: 'Pedido estándar' },
  { value: 'autoventa', label: 'Autoventa' },
];

const initialDefaultValues: DefaultValues = {
  orderType: 'standard',
  entryDate: null,
  loadDate: null,
  salesperson: '',
  fieldOperator: '',
  externalProcessor: '',
  maquiladorDestination: '',
  loadingAddress: '',
  payment: '',
  incoterm: '',
  buyerReference: '',
  transport: '',
  truckPlate: '',
  trailerPlate: '',
  transportationNotes: '',
  billingAddress: '',
  shippingAddress: '',
  productionNotes: '',
  accountingNotes: '',
  transportNotes: '',
  emails: [],
  ccEmails: [],
};

const initialFormGroups: FormGroup[] = [
  {
    group: 'Tipo de pedido',
    description: 'Estándar o autoventa según el tipo de operación.',
    grid: 'grid-cols-1 gap-4',
    fields: [
      {
        name: 'orderType',
        label: 'Tipo de pedido',
        component: 'Select',
        options: ORDER_TYPE_OPTIONS,
        props: { placeholder: 'Seleccionar tipo' },
      },
    ],
  },
  {
    group: 'Fechas',
    description: 'Fecha de entrada en sistema y fecha prevista de carga.',
    grid: 'grid-cols-2 gap-4',
    fields: [
      {
        name: 'entryDate',
        label: 'Fecha de entrada',
        component: 'DatePicker',
        rules: { required: 'La fecha de entrada es obligatoria' },
        props: {},
      },
      {
        name: 'loadDate',
        label: 'Fecha de carga',
        component: 'DatePicker',
        rules: { required: 'La fecha de carga es obligatoria' },
        props: {},
      },
    ],
  },
  {
    group: 'Información Comercial',
    description: 'Comercial, forma de pago, incoterm y referencia del comprador.',
    grid: 'grid-cols-2 gap-4',
    fields: [
      {
        name: 'salesperson',
        label: 'Comercial',
        component: 'Select',
        rules: { required: 'Seleccione un comercial' },
        options: [],
        props: { placeholder: 'Seleccionar comercial' },
      },
      {
        name: 'fieldOperator',
        label: 'Repartidor',
        component: 'Select',
        options: [],
        props: { placeholder: 'Seleccionar repartidor' },
      },
      {
        name: 'payment',
        label: 'Forma de pago',
        component: 'Select',
        rules: { required: 'Seleccione la forma de pago' },
        options: [],
        props: { placeholder: 'Seleccionar forma de pago' },
      },
      {
        name: 'incoterm',
        label: 'Incoterm',
        component: 'Select',
        rules: { required: 'Seleccione un incoterm' },
        options: [],
        props: { placeholder: 'Seleccionar Incoterm' },
      },
      {
        name: 'buyerReference',
        label: 'Referencia del comprador',
        component: 'Input',
        rules: { required: 'La referencia del comprador es obligatoria' },
        props: { placeholder: 'Referencia del comprador' },
      },
      {
        name: 'externalProcessor',
        label: 'Maquilador / Transformador externo',
        component: 'Combobox',
        options: [],
        props: {
          placeholder: 'Sin maquilador',
          searchPlaceholder: 'Buscar maquilador...',
          notFoundMessage: 'No se encontraron maquiladores',
        },
      },
    ],
  },
  {
    group: 'Transporte',
    description: 'Empresa de transporte, matrículas y observaciones de envío.',
    grid: 'grid-cols-2 gap-4',
    fields: [
      {
        name: 'transport',
        label: 'Empresa de transporte',
        component: 'Combobox',
        rules: { required: 'Seleccione una empresa de transporte' },
        colSpan: 'col-span-2',
        options: [],
        props: {
          placeholder: 'Seleccionar transporte',
          searchPlaceholder: 'Buscar transporte...',
          notFoundMessage: 'No se encontraron resultados',
        },
      },
      {
        name: 'truckPlate',
        label: 'Matrícula camión',
        component: 'Input',
        props: { placeholder: '0000 AAA' },
      },
      {
        name: 'trailerPlate',
        label: 'Matrícula remolque',
        component: 'Input',
        props: { placeholder: 'R-0000 AAA' },
      },
      {
        name: 'transportationNotes',
        label: 'Observaciones',
        component: 'Textarea',
        rules: { maxLength: { value: 300, message: 'Máximo 300 caracteres' } },
        colSpan: 'col-span-2',
        props: {
          placeholder: 'Instrucciones especiales para el transporte...',
          className: 'min-h-[50px]',
          rows: 4,
        },
      },
    ],
  },
  {
    group: 'Direcciones',
    description: 'Dirección de facturación, dirección de entrega y datos de carga del maquilador.',
    grid: 'grid-cols-2 gap-4',
    fields: [
      {
        name: 'billingAddress',
        label: 'Dirección de Facturación',
        component: 'Textarea',
        rules: { required: 'La dirección de facturación es obligatoria' },
        props: {
          placeholder: 'Nombre / Empresa, Calle, Ciudad, etc.',
          className: 'min-h-[100px]',
          rows: 5,
        },
      },
      {
        name: 'shippingAddress',
        label: 'Dirección de Entrega',
        component: 'Textarea',
        rules: { required: 'La dirección de entrega es obligatoria' },
        props: {
          placeholder: 'Nombre / Empresa, Calle, Ciudad, etc.',
          className: 'min-h-[100px]',
          rows: 5,
        },
      },
      {
        name: 'maquiladorDestination',
        label: 'Destino para docs del maquilador',
        component: 'Textarea',
        colSpan: 'col-span-1',
        props: {
          placeholder:
            'ej. Cliente Nº1, Olano Italia — aparecerá como destinatario en CMR y letreros del maquilador',
          className: 'min-h-[60px]',
          rows: 2,
        },
      },
      {
        name: 'loadingAddress',
        label: 'Lugar de carga (maquilador)',
        component: 'Textarea',
        colSpan: 'col-span-1',
        props: {
          placeholder: 'ej. Polígono Industrial, nave 4. Vigo (Pontevedra)',
          className: 'min-h-[60px]',
          rows: 2,
        },
      },
    ],
  },
  {
    group: 'Observaciones',
    description: 'Notas para producción y contabilidad.',
    grid: 'grid-cols-1 gap-4',
    fields: [
      {
        name: 'productionNotes',
        label: 'Observaciones de producción',
        component: 'Textarea',
        rules: { maxLength: { value: 500, message: 'Máximo 500 caracteres' } },
        props: {
          placeholder: 'Instrucciones especiales para producción...',
          className: 'min-h-[100px]',
          rows: 4,
        },
      },
      {
        name: 'accountingNotes',
        label: 'Observaciones de contabilidad',
        component: 'Textarea',
        rules: { maxLength: { value: 500, message: 'Máximo 500 caracteres' } },
        props: {
          placeholder: 'Notas para contabilidad...',
          className: 'min-h-[200px]',
          rows: 4,
        },
      },
    ],
  },
  {
    group: 'Emails',
    description: 'Destinatarios y copia para envío de documentación.',
    grid: 'grid-cols-1  gap-4',
    fields: [
      {
        name: 'emails',
        label: 'Para',
        component: 'emailList',
        rules: {
          validate: (emails: unknown) =>
            Array.isArray(emails) && emails.length > 0 ? true : 'Debe ingresar al menos un correo',
        },
        props: {
          placeholder: 'Introduce correos y pulsa Enter',
        },
      },
      {
        name: 'ccEmails',
        label: 'CC',
        component: 'emailList',
        rules: {
          validate: (emails: unknown) => (Array.isArray(emails) ? true : 'Formato inválido en CC'),
        },
        props: {
          placeholder: 'Introduce correos en copia (opcional)',
        },
      },
    ],
  },
];

function parseDate(dateValue: string | Date | null | undefined): Date | null {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function toFormFieldOption(option: RawOption): FormFieldOption | null {
  const value = option.value ?? option.id;
  const label = option.label ?? option.name;

  if (value === undefined || value === null || label === undefined || label === null) {
    return null;
  }

  return {
    value: `${value}`,
    label: `${label}`,
  };
}

function normalizeOptions(options: RawOption[] = []): FormFieldOption[] {
  const seen = new Set<string>();

  return options.reduce<FormFieldOption[]>((acc, option) => {
    const normalized = toFormFieldOption(option);
    if (!normalized || seen.has(normalized.value)) return acc;

    seen.add(normalized.value);
    acc.push(normalized);
    return acc;
  }, []);
}

export function useOrderFormConfig({ orderData }: { orderData?: OrderData | null }) {
  const { options, loading: optionsLoading } = useOrderFormOptions();

  const defaultValues = useMemo<DefaultValues>(() => {
    if (!orderData) return initialDefaultValues;
    return {
      orderType:
        (orderData.orderType ?? orderData.order_type) === 'autoventa' ? 'autoventa' : 'standard',
      entryDate: parseDate(orderData.entryDate),
      loadDate: parseDate(orderData.loadDate),
      salesperson: `${orderData.salesperson?.id || ''}`,
      fieldOperator: `${orderData.fieldOperator?.id || orderData.fieldOperatorId || ''}`,
      externalProcessor: `${orderData.externalProcessorId || orderData.externalProcessor?.id || ''}`,
      maquiladorDestination: orderData.maquiladorDestination || '',
      loadingAddress: orderData.loadingAddress || '',
      payment: `${orderData.paymentTerm?.id || ''}`,
      incoterm: `${orderData.incoterm?.id || ''}`,
      buyerReference: orderData.buyerReference || '',
      transport: `${orderData.transport?.id || ''}`,
      truckPlate: orderData.truckPlate || '',
      trailerPlate: orderData.trailerPlate || '',
      transportationNotes: orderData.transportationNotes || '',
      billingAddress: orderData.billingAddress || '',
      shippingAddress: orderData.shippingAddress || '',
      productionNotes: orderData.productionNotes || '',
      accountingNotes: orderData.accountingNotes || '',
      transportNotes: orderData.transportNotes || '',
      emails: orderData.emails || [],
      ccEmails: orderData.ccEmails || [],
    };
  }, [orderData]);

  const formGroupsWithOptions = useMemo(() => {
    if (optionsLoading || !orderData) {
      return initialFormGroups;
    }

    return initialFormGroups.map((group) => {
      if (group.group === 'Información Comercial') {
        return {
          ...group,
          fields: group.fields.map((field) => {
            if (field.name === 'salesperson') {
              return {
                ...field,
                options: normalizeOptions(options.salespeople),
              };
            }
            if (field.name === 'fieldOperator') {
              return {
                ...field,
                options: normalizeOptions(options.fieldOperators),
              };
            }
            if (field.name === 'payment') {
              return {
                ...field,
                options: normalizeOptions(options.paymentTerms),
              };
            }
            if (field.name === 'incoterm') {
              return {
                ...field,
                options: normalizeOptions(options.incoterms),
              };
            }
            if (field.name === 'externalProcessor') {
              const baseOptions = normalizeOptions(options.externalProcessors);
              // Inject current processor if not in list (e.g. inactive but already assigned)
              const currentEp = orderData?.externalProcessor;
              if (currentEp?.id) {
                const currentId = `${currentEp.id}`;
                if (!baseOptions.some((opt) => opt.value === currentId)) {
                  baseOptions.unshift({
                    value: currentId,
                    label: `${currentEp.name}${currentEp.isActive === false ? ' (inactivo)' : ''}`,
                  });
                }
              }
              return { ...field, options: baseOptions };
            }
            return field;
          }),
        };
      }
      if (group.group === 'Transporte') {
        return {
          ...group,
          fields: group.fields.map((field) => {
            if (field.name === 'transport') {
              return {
                ...field,
                options: normalizeOptions(options.transports),
              };
            }
            return field;
          }),
        };
      }
      return group;
    });
  }, [
    options.salespeople,
    options.fieldOperators,
    options.paymentTerms,
    options.incoterms,
    options.transports,
    options.externalProcessors,
    optionsLoading,
    orderData,
  ]);

  const actualLoading = !orderData || optionsLoading;

  const loadingProgress = { current: actualLoading ? 0 : 4, total: 4 };

  return {
    defaultValues,
    formGroups: formGroupsWithOptions,
    loading: actualLoading,
    loadingProgress,
  };
}
