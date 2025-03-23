import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getSalespeopleOptions } from '@/services/salespersonService';
import { getIncotermsOptions } from '@/services/incotermService';
import { getPaymentTermsOptions } from '@/services/paymentTernService';
import { getTransportsOptions } from '@/services/transportService';
import { getCustomersOptions } from '@/services/customerService';

const initialDefaultValues = {
    customer: '',
    salesperson: '',
    paymentTerm: '',
    billingAddress: '',
    shippingAddress: '',
    buyerReference: '',
    entryDate: new Date(),
    loadDate: new Date(),
    incoterm: '',
    truckPlate: '',
    trailerPlate: '',
    temperature: '',
    transportationNotes: '',
    productionNotes: '',
    accountingNotes: '',
    emails: '',
};

const initialFormGroups = [
    {
        group: 'Datos del cliente',
        grid: 'grid-cols-2 gap-4',
        fields: [
            {
                name: 'customer',
                label: 'Cliente',
                component: 'Combobox',
                rules: { required: 'El cliente es obligatorio' },
                options: [],
                props: { placeholder: 'Selecciona cliente' }
            },
            {
                name: 'salesperson',
                label: 'Comercial',
                component: 'Select',
                rules: { required: 'El comercial es obligatorio' },
                options: [],
                props: { placeholder: 'Selecciona comercial' }
            },
            {
                name: 'paymentTerm',
                label: 'Forma de pago',
                component: 'Select',
                rules: {},
                options: [],
                props: { placeholder: 'Selecciona forma de pago' }
            },
        ]
    },
    {
        group: 'Direcciones',
        grid: 'grid-cols-2 gap-4',
        fields: [
            {
                name: 'billingAddress',
                label: 'Dirección de facturación',
                component: 'Textarea',
                rules: {},
                props: { rows: 4 }
            },
            {
                name: 'shippingAddress',
                label: 'Dirección de envío',
                component: 'Textarea',
                rules: {},
                props: { rows: 4 }
            },
        ]
    },
    {
        group: 'Detalles del pedido',
        grid: 'grid-cols-2 gap-4',
        fields: [
            {
                name: 'buyerReference',
                label: 'Referencia comprador',
                component: 'Input',
                rules: {},
            },
            {
                name: 'entryDate',
                label: 'Fecha de entrada',
                component: 'DatePicker',
                rules: {},
            },
            {
                name: 'loadDate',
                label: 'Fecha de carga',
                component: 'DatePicker',
                rules: {},
            },
            {
                name: 'incoterm',
                label: 'Incoterm',
                component: 'Select',
                rules: {},
                options: [],
                props: { placeholder: 'Selecciona incoterm' }
            },
            {
                name: 'truckPlate',
                label: 'Matrícula camión',
                component: 'Input',
                rules: {},
            },
            {
                name: 'trailerPlate',
                label: 'Matrícula remolque',
                component: 'Input',
                rules: {},
            },
            {
                name: 'temperature',
                label: 'Temperatura',
                component: 'Input',
                rules: {},
                props: { placeholder: '-23 °C' },
            },
        ]
    },
    {
        group: 'Notas',
        grid: 'grid-cols-2 gap-4',
        fields: [
            {
                name: 'transportationNotes',
                label: 'Notas transporte',
                component: 'Textarea',
                rules: {},
                props: { rows: 3 }
            },
            {
                name: 'productionNotes',
                label: 'Notas producción',
                component: 'Textarea',
                rules: {},
                props: { rows: 3 }
            },
            {
                name: 'accountingNotes',
                label: 'Notas contabilidad',
                component: 'Textarea',
                rules: {},
                props: { rows: 3 }
            },
            {
                name: 'emails',
                label: 'Emails',
                component: 'Textarea',
                rules: {},
                props: { rows: 4, placeholder: 'Uno por línea' }
            },
        ]
    },
];

export function useOrderCreateFormConfig() {
    const { data: session } = useSession();
    const [defaultValues, setDefaultValues] = useState(initialDefaultValues);
    const [formGroups, setFormGroups] = useState(initialFormGroups);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = session?.user?.accessToken;

        Promise.all([
            getCustomersOptions(token),
            getSalespeopleOptions(token),
            getPaymentTermsOptions(token),
            getIncotermsOptions(token),
        ]).then(([customers, salespeople, paymentTerms, incoterms]) => {
            setFormGroups((prev) =>
                prev.map((group) => {
                    const updatedFields = group.fields.map((field) => {
                        switch (field.name) {
                            case 'customer':
                                return {
                                    ...field,
                                    options: customers.map((c) => ({ value: `${c.id}`, label: c.name })),
                                };
                            case 'salesperson':
                                return {
                                    ...field,
                                    options: salespeople.map((s) => ({ value: `${s.id}`, label: s.name })),
                                };
                            case 'paymentTerm':
                                return {
                                    ...field,
                                    options: paymentTerms.map((p) => ({ value: `${p.id}`, label: p.name })),
                                };
                            case 'incoterm':
                                return {
                                    ...field,
                                    options: incoterms.map((i) => ({ value: `${i.id}`, label: i.name })),
                                };
                            default:
                                return field;
                        }
                    });
                    return { ...group, fields: updatedFields };
                })
            );
            setLoading(false);
        }).catch((err) => {
            console.error('Error cargando opciones del formulario:', err);
            setLoading(false);
        });
    }, [session]);

    return { defaultValues, formGroups, loading };
}