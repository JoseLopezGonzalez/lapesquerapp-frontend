'use client';

import { getIncotermsOptions } from '@/services/incotermService';
import { getPaymentTermsOptions } from '@/services/paymentTernService';
import { getSalespeopleOptions } from '@/services/salespersonService';
import { getTransportsOptions } from '@/services/transportService';
import { getCustomersOptions } from '@/services/customerService';
import { getFieldOperatorsOptions } from '@/services/fieldOperatorService';
import { externalProcessorService } from '@/services/domain/external-processors/externalProcessorService';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

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
        component: 'Select',
        options: [],
        props: { placeholder: 'Sin maquilador' },
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
  const { data: session } = useSession();
  const [defaultValues] = useState<DefaultValues>(initialDefaultValues);
  const [formGroups, setFormGroups] = useState<FormGroup[]>(initialFormGroups);
  const [loading, setLoading] = useState(true);
  const token = (session?.user as { accessToken?: string })?.accessToken;

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }
        const [salespeople, paymentTerms, incoterms, transports, customers, fieldOperators, externalProcessors] =
          await Promise.all([
            getSalespeopleOptions(token),
            getPaymentTermsOptions(token),
            getIncotermsOptions(token),
            getTransportsOptions(token),
            getCustomersOptions(token),
            getFieldOperatorsOptions(token),
            externalProcessorService.getOptions().catch(() => []),
          ]);

        setFormGroups((prev) =>
          prev.map((group) => {
            switch (group.group) {
              case 'Cliente':
                return {
                  ...group,
                  fields: group.fields.map((field) =>
                    field.name === 'customer'
                      ? {
                          ...field,
                          options: (customers as Array<{ id: number | string; name: string }>).map(
                            (c) => ({ value: `${c.id}`, label: `${c.name}` })
                          ),
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
                        options: (salespeople as Array<{ id: number | string; name: string }>).map(
                          (sp) => ({ value: `${sp.id}`, label: sp.name })
                        ),
                      };
                    }
                    if (field.name === 'fieldOperator') {
                      return {
                        ...field,
                        options: (fieldOperators as Array<{ id: number | string; name: string }>).map(
                          (op) => ({ value: `${op.id}`, label: op.name })
                        ),
                      };
                    }
                    if (field.name === 'payment') {
                      return {
                        ...field,
                        options: (paymentTerms as Array<{ id: number | string; name: string }>).map(
                          (pt) => ({ value: `${pt.id}`, label: pt.name })
                        ),
                      };
                    }
                    if (field.name === 'incoterm') {
                      return {
                        ...field,
                        options: (incoterms as Array<{ id: number | string; name: string }>).map(
                          (inc) => ({ value: `${inc.id}`, label: inc.name })
                        ),
                      };
                    }
                    if (field.name === 'externalProcessor') {
                      return {
                        ...field,
                        options: (externalProcessors as Array<{ value: number | string; label: string }>).map(
                          (ep) => ({ value: `${ep.value}`, label: ep.label })
                        ),
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
                          options: (transports as Array<{ id: number | string; name: string }>).map(
                            (tr) => ({ value: `${tr.id}`, label: tr.name })
                          ),
                        }
                      : field
                  ),
                };
              default:
                return group;
            }
          })
        );

        setLoading(false);
      } catch (err) {
        console.error('Error cargando opciones de formulario:', err);
      }
    };

    fetchOptions();
  }, [token]);

  return { defaultValues, formGroups, loading };
}
