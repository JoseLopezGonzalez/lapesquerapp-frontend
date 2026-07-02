'use client';

import { useMemo, useState } from 'react';
import { useOrderFormOptions } from '@/hooks/useOrderFormOptions';

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
        colSpan: 'col-span-2',
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
        colSpan: 'col-span-2',
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
                      options: options.customers.map((customer) => ({
                        value: `${customer.id}`,
                        label: `${customer.name}`,
                      })),
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
                    options: options.salespeople.map((salesperson) => ({
                      value: `${salesperson.id}`,
                      label: salesperson.name,
                    })),
                  };
                }
                if (field.name === 'fieldOperator') {
                  return {
                    ...field,
                    options: options.fieldOperators.map((fieldOperator) => ({
                      value: `${fieldOperator.id}`,
                      label: fieldOperator.name,
                    })),
                  };
                }
                if (field.name === 'payment') {
                  return {
                    ...field,
                    options: options.paymentTerms.map((paymentTerm) => ({
                      value: `${paymentTerm.id}`,
                      label: paymentTerm.name,
                    })),
                  };
                }
                if (field.name === 'incoterm') {
                  return {
                    ...field,
                    options: options.incoterms.map((incoterm) => ({
                      value: `${incoterm.id}`,
                      label: incoterm.name,
                    })),
                  };
                }
                if (field.name === 'externalProcessor') {
                  return {
                    ...field,
                    options: options.externalProcessors.map((externalProcessor) => ({
                      value: `${externalProcessor.value}`,
                      label: externalProcessor.label,
                    })),
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
                      options: options.transports.map((transport) => ({
                        value: `${transport.id}`,
                        label: transport.name,
                      })),
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
