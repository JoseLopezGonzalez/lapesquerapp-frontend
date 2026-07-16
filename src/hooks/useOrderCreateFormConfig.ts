'use client';

import { useMemo, useState } from 'react';
import { useOrderFormOptions } from '@/hooks/useOrderFormOptions';

interface FormFieldOption {
  value: string;
  label: string;
}

interface RawOption {
  id?: number | string | null;
  name?: string | null;
  value?: number | string | null;
  label?: string | null;
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
  grid: string;
  fields: FormField[];
}

interface DefaultValues {
  customer: string;
  entryDate: Date;
  loadDate: Date;
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
  emails: string[];
  ccEmails: string[];
  plannedProducts: unknown[];
}

const today = new Date();

const initialDefaultValues: DefaultValues = {
  customer: '',
  entryDate: today,
  loadDate: today,
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
  emails: [],
  ccEmails: [],
  plannedProducts: [],
};

const initialFormGroups: FormGroup[] = [
  {
    group: 'Cliente',
    grid: 'grid-cols-1 gap-4',
    fields: [
      {
        name: 'customer',
        label: 'Cliente',
        component: 'Combobox',
        rules: { required: 'El cliente es obligatorio' },
        colSpan: 'col-span-1',
        options: [],
        props: {
          placeholder: 'Seleccionar cliente',
          searchPlaceholder: 'Buscar cliente...',
          notFoundMessage: 'No se encontraron clientes',
        },
      },
    ],
  },
  {
    group: 'Fechas',
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
      {
        name: 'maquiladorDestination',
        label: 'Destino para docs del maquilador',
        component: 'Textarea',
        props: {
          placeholder: 'ej. Cliente Nº1, Olano Italia — aparecerá en CMR y letreros del maquilador',
          rows: 2,
          className: 'min-h-[60px]',
        },
      },
      {
        name: 'loadingAddress',
        label: 'Lugar de carga',
        component: 'Textarea',
        props: {
          placeholder:
            'ej. Polígono Industrial, nave 4. Vigo (Pontevedra) — se auto-rellena con la dirección del maquilador',
          rows: 2,
          className: 'min-h-[60px]',
        },
      },
    ],
  },
  {
    group: 'Transporte',
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
    ],
  },
  {
    group: 'Observaciones',
    grid: 'grid-cols-2 gap-4',
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
          className: 'min-h-[100px]',
          rows: 4,
        },
      },
    ],
  },
  {
    group: 'Emails',
    grid: 'grid-cols-1 md:grid-cols-2 gap-4',
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

export function useOrderCreateFormConfig() {
  const [defaultValues] = useState<DefaultValues>(initialDefaultValues);
  const { options, loading } = useOrderFormOptions({ includeCustomers: true });

  const formGroups = useMemo<FormGroup[]>(
    () =>
      initialFormGroups.map((group) => {
        switch (group.group) {
          case 'Cliente':
            return {
              ...group,
              fields: group.fields.map((field) =>
                field.name === 'customer'
                  ? {
                      ...field,
                      options: normalizeOptions(options.customers),
                    }
                  : field
              ),
            };
          case 'Información Comercial':
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
                  return {
                    ...field,
                    options: normalizeOptions(options.externalProcessors),
                  };
                }
                return field;
              }),
            };
          case 'Transporte':
            return {
              ...group,
              fields: group.fields.map((field) =>
                field.name === 'transport'
                  ? {
                      ...field,
                      options: normalizeOptions(options.transports),
                    }
                  : field
              ),
            };
          default:
            return group;
        }
      }),
    [options]
  );

  return { defaultValues, formGroups, loading };
}
