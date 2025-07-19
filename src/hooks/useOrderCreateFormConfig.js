import { fetchWithTenant } from "@lib/fetchWithTenant";
import { getIncotermsOptions } from '@/services/incotermService';
import { getPaymentTermsOptions } from '@/services/paymentTernService';
import { getSalespeopleOptions } from '@/services/salespersonService';
import { getTransportsOptions } from '@/services/transportService';
import { getCustomer, getCustomersOptions } from '@/services/customerService';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

const today = new Date();

const initialDefaultValues = {
    customer: '',
    entryDate: today.toISOString().split('T')[0],
    loadDate: '',
    salesperson: '',
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

const initialFormGroups = [
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
            /* buyerReference */
            {
                name: 'buyerReference',
                label: 'Referencia del comprador',
                component: 'Input',
                props: { placeholder: 'Referencia del comprador' },

            }
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
                    validate: (emails) =>
                        Array.isArray(emails) && emails.length > 0
                            ? true
                            : 'Debe ingresar al menos un correo',
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
                    validate: (emails) =>
                        Array.isArray(emails)
                            ? true
                            : 'Formato inválido en CC',
                },
                props: {
                    placeholder: 'Introduce correos en copia (opcional)',
                },
            },
        ],
    }

];


export function useOrderCreateFormConfig() {
    const { data: session } = useSession();
    const [defaultValues, setDefaultValues] = useState(initialDefaultValues);
    const [formGroups, setFormGroups] = useState(initialFormGroups);
    const [loading, setLoading] = useState(true);
    const token = session?.user?.accessToken;



    useEffect(() => {
        const fetchWithTenantOptions = async () => {
            try {

                if (!token) {
                    setLoading(false);
                    return;
                }
                const [salespeople, paymentTerms, incoterms, transports, customers] = await Promise.all([
                    getSalespeopleOptions(token),
                    getPaymentTermsOptions(token),
                    getIncotermsOptions(token),
                    getTransportsOptions(token),
                    getCustomersOptions(token),
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
                                                options: customers.map((c) => ({ value: `${c.id}`, label: `${c.name}` })),
                                            }
                                            : field
                                    ),
                                };
                            case 'Información Comercial':
                                return {
                                    ...group,
                                    fields: group.fields.map((field) => {
                                        if (field.name === 'salesperson') {
                                            return { ...field, options: salespeople.map((sp) => ({ value: `${sp.id}`, label: sp.name })) };
                                        }
                                        if (field.name === 'payment') {
                                            return { ...field, options: paymentTerms.map((pt) => ({ value: `${pt.id}`, label: pt.name })) };
                                        }
                                        if (field.name === 'incoterm') {
                                            return { ...field, options: incoterms.map((inc) => ({ value: `${inc.id}`, label: inc.name })) };
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
                                                options: transports.map((tr) => ({ value: `${tr.id}`, label: tr.name })),
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

        fetchWithTenantOptions();
    }, [token]);

    return { defaultValues, formGroups, loading };
}