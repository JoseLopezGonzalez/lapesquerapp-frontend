// /src/hooks/useOrderFormConfig.js
import { getIncotermsOptions } from '@/services/incotermService';
import { getPaymentTermsOptions } from '@/services/paymentTernService';
import { getSalespeopleOptions } from '@/services/salespersonService';
import { getTransportsOptions } from '@/services/transportService';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';

const initialDefaultValues = {
    entryDate: null, // Cambiado de '' a objeto Date
    loadDate: null, // Cambiado de '' a null
    salesperson: '',
    payment: '',
    incoterm: '',
    transport: '',
    billingAddress: '',
    shippingAddress: '',
    productionNotes: '',
    accountingNotes: '',
    transportNotes: '',
    emails: [],
    ccEmails: [],

};

const initialFormGroups = [
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
                rules: { required: 'La referencia del comprador es obligatoria' },
                props: { placeholder: 'Referencia del comprador' },
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
            /* truckPlate y trailerPlate */
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
            /* transportationNotes */
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
        grid: 'grid-cols-1  gap-4',
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
        ]
    }

]

export function useOrderFormConfig({ orderData }) {
    const { data: session, status } = useSession();
    const [defaultValues, setDefaultValues] = useState(initialDefaultValues);
    const [formGroups, setFormGroups] = useState(initialFormGroups);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orderData) {
            setDefaultValues({
                entryDate: orderData.entryDate ? (typeof orderData.entryDate === 'string' ? new Date(orderData.entryDate) : orderData.entryDate) : null,
                loadDate: orderData.loadDate ? (typeof orderData.loadDate === 'string' ? new Date(orderData.loadDate) : orderData.loadDate) : null,
                salesperson: `${orderData.salesperson.id}` || '',
                payment: `${orderData.paymentTerm.id}` || '',
                incoterm: `${orderData.incoterm.id}` || '',
                buyerReference: orderData.buyerReference || '',
                transport: `${orderData.transport?.id}` || '',
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
            });
        }

        const token = session?.user?.accessToken;
        getSalespeopleOptions(token)
            .then((data) => setFormGroups((prev) =>
                prev.map((group) => {
                    if (group.group === 'Información Comercial') {
                        return {
                            ...group,
                            fields: group.fields.map((field) => {
                                if (field.name === 'salesperson') {
                                    return {
                                        ...field,
                                        options: data.map((sp) => ({
                                            value: `${sp.id}`,
                                            label: `${sp.name}`,
                                        })),
                                    };
                                }
                                return field;
                            }),
                        };
                    }
                    return group;
                }
                )))
            .catch((err) => console.error(err))
        getIncotermsOptions(token)
            .then((data) => setFormGroups((prev) =>
                prev.map((group) => {
                    if (group.group === 'Información Comercial') {
                        return {
                            ...group,
                            fields: group.fields.map((field) => {
                                if (field.name === 'incoterm') {
                                    return {
                                        ...field,
                                        options: data.map((inc) => ({
                                            value: `${inc.id}`,
                                            label: `${inc.name}`,
                                        })),
                                    };
                                }
                                return field;
                            }),
                        };
                    }
                    return group;
                }
                )))
            .catch((err) => console.error(err))

        getPaymentTermsOptions(token)
            .then((data) => setFormGroups((prev) =>
                prev.map((group) => {
                    if (group.group === 'Información Comercial') {
                        return {
                            ...group,
                            fields: group.fields.map((field) => {
                                if (field.name === 'payment') {
                                    return {
                                        ...field,
                                        options: data.map((pt) => ({
                                            value: `${pt.id}`,
                                            label: `${pt.name}`,
                                        })),
                                    };
                                }
                                return field;
                            }),
                        };
                    }
                    return group;
                }
                )))
            .catch((err) => console.error(err))

        getTransportsOptions(token)
            .then((data) => setFormGroups((prev) =>
                prev.map((group) => {
                    if (group.group === 'Transporte') {
                        return {
                            ...group,
                            fields: group.fields.map((field) => {
                                if (field.name === 'transport') {
                                    return {
                                        ...field,
                                        options: data.map((tr) => ({
                                            value: `${tr.id}`,
                                            label: `${tr.name}`,
                                        })),
                                    };
                                }
                                return field;
                            }),
                        };
                    }
                    return group;
                }
                )))
            .catch((err) => console.error(err))

        setLoading(false);
    }, [orderData]);




    return { defaultValues, formGroups, loading };
}


